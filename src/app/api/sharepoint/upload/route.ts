import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadFileToSharePoint, createFolderInSharePoint } from "@/lib/sharepoint-client";

/**
 * POST /api/sharepoint/upload
 * Upload file to SharePoint document library
 */
export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get("ms_access_token")?.value;

		if (!accessToken) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { fileData, fileName, folderPath } = body as {
			fileData: string;
			fileName: string;
			folderPath: string;
		};

		if (!fileData || !fileName) {
			return NextResponse.json(
				{ error: "Missing file data or file name" },
				{ status: 400 }
			);
		}

		const siteId = process.env.SHAREPOINT_SITE_ID;
		const driveId = process.env.SHAREPOINT_DRIVE_ID;

		if (!siteId || !driveId) {
			return NextResponse.json(
				{ error: "SharePoint not configured" },
				{ status: 500 }
			);
		}

		const config = {
			siteId,
			driveId,
			accessToken,
		};

		// Create folder if it doesn't exist
		if (folderPath) {
			try {
				await createFolderInSharePoint(config, "", folderPath);
			} catch (error) {
				// Folder might already exist, continue
				console.log("Folder creation skipped:", error);
			}
		}

		// Upload file
		const uploadedFile = await uploadFileToSharePoint(
			config,
			fileData,
			folderPath || "",
			fileName
		);

		return NextResponse.json({
			success: true,
			file: uploadedFile,
		});
	} catch (error) {
		console.error("SharePoint upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file to SharePoint" },
			{ status: 500 }
		);
	}
}
