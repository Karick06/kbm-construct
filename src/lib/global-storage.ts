import fs from "fs";
import path from "path";
import { getAppAccessToken } from "@/lib/microsoft-auth";

type JsonReadOptions<T> = {
  localRelativePath: string;
  remoteRelativePath: string;
  fallback: T;
};

type JsonWriteOptions<T> = {
  localRelativePath: string;
  remoteRelativePath: string;
  value: T;
};

export type GlobalStorageMode = "onedrive" | "fallback-local";

export type GlobalStorageHealth = {
  mode: GlobalStorageMode;
  driveIdConfigured: boolean;
  remoteBaseFolder: string;
  reason?: string;
};

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getConfiguredDriveId(): string | null {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  if (!driveId) return null;
  return driveId;
}

function getRemoteBaseFolder(): string {
  return (process.env.GLOBAL_STORAGE_FOLDER || "kbm-construct-data").replace(/^\/+|\/+$/g, "");
}

function buildRemotePath(relativePath: string): string {
  const cleanedRelativePath = relativePath.replace(/^\/+|\/+$/g, "");
  const base = getRemoteBaseFolder();
  return base ? `${base}/${cleanedRelativePath}` : cleanedRelativePath;
}

function encodeDrivePath(filePath: string): string {
  return filePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function localAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

function readJsonFromLocal<T>(relativePath: string, fallback: T): T {
  try {
    const absolutePath = localAbsolutePath(relativePath);
    if (!fs.existsSync(absolutePath)) return fallback;
    const raw = fs.readFileSync(absolutePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToLocal<T>(relativePath: string, value: T): void {
  const absolutePath = localAbsolutePath(relativePath);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(value, null, 2), "utf-8");
}

async function ensureOneDriveFolder(accessToken: string, driveId: string, folderPath: string): Promise<void> {
  const segments = folderPath.split("/").filter(Boolean);
  if (segments.length === 0) return;

  let currentPath = "";
  for (const segment of segments) {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;

    const endpoint = parentPath
      ? `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodeDrivePath(parentPath)}:/children`
      : `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root/children`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: segment,
        folder: {},
        "@microsoft.graph.conflictBehavior": "replace",
      }),
      cache: "no-store",
    });

    if (response.ok || response.status === 409) {
      continue;
    }

    let errorMessage = `Failed to create OneDrive folder (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      errorMessage = payload.error?.message || errorMessage;
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }
}

async function readJsonFromOneDrive<T>(accessToken: string, driveId: string, remotePath: string): Promise<T | null> {
  const endpoint = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodeDrivePath(remotePath)}:/content`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    let errorMessage = `Failed to read OneDrive file (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      errorMessage = payload.error?.message || errorMessage;
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  const raw = await response.text();
  return JSON.parse(raw) as T;
}

async function writeJsonToOneDrive<T>(accessToken: string, driveId: string, remotePath: string, value: T): Promise<void> {
  const lastSlash = remotePath.lastIndexOf("/");
  const folderPath = lastSlash >= 0 ? remotePath.slice(0, lastSlash) : "";
  if (folderPath) {
    await ensureOneDriveFolder(accessToken, driveId, folderPath);
  }

  const endpoint = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}/root:/${encodeDrivePath(remotePath)}:/content`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value, null, 2),
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to write OneDrive file (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      errorMessage = payload.error?.message || errorMessage;
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }
}

async function getOneDriveContext(): Promise<{ accessToken: string; driveId: string } | null> {
  const driveId = getConfiguredDriveId();
  if (!driveId) return null;

  try {
    const accessToken = await getAppAccessToken();
    return { accessToken, driveId };
  } catch (error) {
    console.error("Failed to get app token for global storage:", error);
    return null;
  }
}

export async function getGlobalStorageHealth(): Promise<GlobalStorageHealth> {
  const driveId = getConfiguredDriveId();
  const remoteBaseFolder = getRemoteBaseFolder();

  if (!driveId) {
    return {
      mode: "fallback-local",
      driveIdConfigured: false,
      remoteBaseFolder,
      reason: "SHAREPOINT_DRIVE_ID is not configured",
    };
  }

  try {
    const accessToken = await getAppAccessToken();
    const probeEndpoint = `${GRAPH_BASE}/drives/${encodeURIComponent(driveId)}?$select=id,name`;
    const response = await fetch(probeEndpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `Graph drive probe failed (${response.status})`;
      try {
        const payload = (await response.json()) as { error?: { message?: string } };
        message = payload.error?.message || message;
      } catch {
        // no-op
      }

      return {
        mode: "fallback-local",
        driveIdConfigured: true,
        remoteBaseFolder,
        reason: message,
      };
    }

    return {
      mode: "onedrive",
      driveIdConfigured: true,
      remoteBaseFolder,
    };
  } catch (error) {
    return {
      mode: "fallback-local",
      driveIdConfigured: true,
      remoteBaseFolder,
      reason: error instanceof Error ? error.message : "Failed to acquire Microsoft Graph app token",
    };
  }
}

export async function readGlobalJsonStore<T>(options: JsonReadOptions<T>): Promise<T> {
  const oneDriveContext = await getOneDriveContext();
  const remotePath = buildRemotePath(options.remoteRelativePath);

  if (oneDriveContext) {
    try {
      const remote = await readJsonFromOneDrive<T>(
        oneDriveContext.accessToken,
        oneDriveContext.driveId,
        remotePath
      );

      if (remote !== null) {
        return remote;
      }

      const localValue = readJsonFromLocal(options.localRelativePath, options.fallback);
      if (JSON.stringify(localValue) !== JSON.stringify(options.fallback)) {
        await writeJsonToOneDrive(oneDriveContext.accessToken, oneDriveContext.driveId, remotePath, localValue);
      }
      return localValue;
    } catch (error) {
      console.error("Falling back to local JSON store read:", error);
    }
  }

  return readJsonFromLocal(options.localRelativePath, options.fallback);
}

export async function writeGlobalJsonStore<T>(options: JsonWriteOptions<T>): Promise<void> {
  const oneDriveContext = await getOneDriveContext();
  const remotePath = buildRemotePath(options.remoteRelativePath);

  if (oneDriveContext) {
    try {
      await writeJsonToOneDrive(
        oneDriveContext.accessToken,
        oneDriveContext.driveId,
        remotePath,
        options.value
      );
      writeJsonToLocal(options.localRelativePath, options.value);
      return;
    } catch (error) {
      console.error("Falling back to local JSON store write:", error);
    }
  }

  writeJsonToLocal(options.localRelativePath, options.value);
}