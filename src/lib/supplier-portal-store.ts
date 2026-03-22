import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type {
  SupplierEnquiry,
  SupplierEnquiryResponse,
  SupplierInvite,
  SupplierPortalPayload,
} from "@/lib/supplier-portal-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "supplier-portal.json");

const DEFAULT_DATA: SupplierPortalPayload = {
  enquiries: [],
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
  }
}

async function readStore(): Promise<SupplierPortalPayload> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as SupplierPortalPayload;
    if (!parsed.enquiries || !Array.isArray(parsed.enquiries)) {
      return DEFAULT_DATA;
    }
    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

async function writeStore(payload: SupplierPortalPayload): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function listSupplierEnquiries(): Promise<SupplierEnquiry[]> {
  const payload = await readStore();
  return [...payload.enquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getSupplierEnquiryById(id: string): Promise<SupplierEnquiry | null> {
  const payload = await readStore();
  return payload.enquiries.find((enquiry) => enquiry.id === id) || null;
}

export async function createSupplierEnquiry(
  enquiry: Omit<SupplierEnquiry, "id" | "reference" | "createdAt" | "status" | "responses" | "invites">
): Promise<SupplierEnquiry> {
  const payload = await readStore();
  const now = new Date().toISOString();
  const sequence = payload.enquiries.length + 1;
  const created: SupplierEnquiry = {
    ...enquiry,
    id: crypto.randomUUID(),
    reference: `SEQ-${String(sequence).padStart(4, "0")}`,
    createdAt: now,
    status: "draft",
    responses: [],
    invites: [],
  };

  payload.enquiries.unshift(created);
  await writeStore(payload);
  return created;
}

export async function sendSupplierEnquiry(
  id: string,
  recipients: Array<{ supplierId?: string; supplierName: string; supplierEmail: string }>
): Promise<SupplierEnquiry | null> {
  const payload = await readStore();
  const enquiryIndex = payload.enquiries.findIndex((enquiry) => enquiry.id === id);
  if (enquiryIndex < 0) return null;

  const now = new Date().toISOString();
  const enquiry = payload.enquiries[enquiryIndex];

  const invitesByEmail = new Map(
    enquiry.invites.map((invite) => [invite.supplierEmail.toLowerCase(), invite] as const)
  );

  recipients.forEach((recipient) => {
    const key = recipient.supplierEmail.toLowerCase();
    const existing = invitesByEmail.get(key);

    if (existing) {
      invitesByEmail.set(key, {
        ...existing,
        supplierName: recipient.supplierName,
        supplierId: recipient.supplierId,
        sentAt: now,
      });
      return;
    }

    invitesByEmail.set(key, {
      id: crypto.randomUUID(),
      supplierId: recipient.supplierId,
      supplierName: recipient.supplierName,
      supplierEmail: recipient.supplierEmail,
      inviteToken: crypto.randomBytes(20).toString("hex"),
      status: "pending",
      sentAt: now,
    });
  });

  const invites = Array.from(invitesByEmail.values());

  payload.enquiries[enquiryIndex] = {
    ...enquiry,
    status: "sent",
    sentAt: now,
    invites,
  };

  await writeStore(payload);
  return payload.enquiries[enquiryIndex];
}

export async function updateSupplierEnquiryStatus(
  id: string,
  status: SupplierEnquiry["status"]
): Promise<SupplierEnquiry | null> {
  const payload = await readStore();
  const enquiryIndex = payload.enquiries.findIndex((enquiry) => enquiry.id === id);
  if (enquiryIndex < 0) return null;

  payload.enquiries[enquiryIndex] = {
    ...payload.enquiries[enquiryIndex],
    status,
  };

  await writeStore(payload);
  return payload.enquiries[enquiryIndex];
}

export async function getInviteByToken(token: string): Promise<{ enquiry: SupplierEnquiry; invite: SupplierInvite } | null> {
  const payload = await readStore();

  for (const enquiry of payload.enquiries) {
    const invite = enquiry.invites.find((entry) => entry.inviteToken === token);
    if (invite) {
      return { enquiry, invite };
    }
  }

  return null;
}

export async function markInviteViewed(token: string): Promise<void> {
  const payload = await readStore();
  let changed = false;

  payload.enquiries = payload.enquiries.map((enquiry) => {
    const invites: SupplierInvite[] = enquiry.invites.map((invite) => {
      if (invite.inviteToken !== token) return invite;
      if (invite.status === "responded") return invite;
      changed = true;
      return {
        ...invite,
        status: "viewed" as const,
        viewedAt: invite.viewedAt || new Date().toISOString(),
      };
    });

    return { ...enquiry, invites };
  });

  if (changed) {
    await writeStore(payload);
  }
}

export async function submitSupplierResponse(
  token: string,
  responseInput: Omit<SupplierEnquiryResponse, "id" | "enquiryId" | "inviteToken" | "submittedAt">
): Promise<SupplierEnquiryResponse | null> {
  const payload = await readStore();
  const now = new Date().toISOString();

  for (let enquiryIndex = 0; enquiryIndex < payload.enquiries.length; enquiryIndex += 1) {
    const enquiry = payload.enquiries[enquiryIndex];
    const inviteIndex = enquiry.invites.findIndex((invite) => invite.inviteToken === token);
    if (inviteIndex < 0) continue;

    const invite = enquiry.invites[inviteIndex];

    const response: SupplierEnquiryResponse = {
      ...responseInput,
      id: crypto.randomUUID(),
      enquiryId: enquiry.id,
      inviteToken: token,
      submittedAt: now,
    };

    const filteredResponses = enquiry.responses.filter((entry) => entry.inviteToken !== token);

    const updatedInvites = [...enquiry.invites];
    updatedInvites[inviteIndex] = {
      ...invite,
      status: "responded",
      respondedAt: now,
      viewedAt: invite.viewedAt || now,
    };

    payload.enquiries[enquiryIndex] = {
      ...enquiry,
      invites: updatedInvites,
      responses: [...filteredResponses, response],
    };

    await writeStore(payload);
    return response;
  }

  return null;
}
