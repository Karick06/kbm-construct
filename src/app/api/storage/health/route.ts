import { NextResponse } from "next/server";
import { getGlobalStorageHealth } from "@/lib/global-storage";

export async function GET() {
  try {
    const health = await getGlobalStorageHealth();
    return NextResponse.json({
      success: true,
      storage: health,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        storage: {
          mode: "fallback-local",
          driveIdConfigured: Boolean(process.env.SHAREPOINT_DRIVE_ID),
          remoteBaseFolder: process.env.GLOBAL_STORAGE_FOLDER || "kbm-construct-data",
          reason: error instanceof Error ? error.message : "Unexpected storage health error",
        },
      },
      { status: 500 }
    );
  }
}
