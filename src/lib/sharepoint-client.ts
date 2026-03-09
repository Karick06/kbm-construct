import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

/**
 * SharePoint Document Library Client
 * Handles file uploads, downloads, and management via Microsoft Graph API
 */

export interface SharePointConfig {
	siteId: string;
	driveId: string;
	accessToken: string;
}

export interface UploadedFile {
	id: string;
	name: string;
	webUrl: string;
	downloadUrl: string;
	size: number;
	createdDateTime: string;
	lastModifiedDateTime: string;
}

/**
 * Create a Microsoft Graph client with authentication
 */
function getGraphClient(accessToken: string): Client {
	return Client.init({
		authProvider: (done) => {
			done(null, accessToken);
		},
	});
}

/**
 * Upload a file to SharePoint document library
 * @param config SharePoint configuration
 * @param file File object or base64 data
 * @param folderPath Path within the document library (e.g., "Projects/Site123/Photos")
 * @param fileName File name
 * @returns Uploaded file metadata
 */
export async function uploadFileToSharePoint(
	config: SharePointConfig,
	file: File | string,
	folderPath: string,
	fileName: string
): Promise<UploadedFile> {
	const client = getGraphClient(config.accessToken);

	// Convert base64 to buffer if needed
	let fileContent: ArrayBuffer;
	if (typeof file === "string") {
		// Base64 data URL (e.g., "data:image/jpeg;base64,...")
		const base64Data = file.split(",")[1] || file;
		const binaryString = atob(base64Data);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		fileContent = bytes.buffer;
	} else {
		fileContent = await file.arrayBuffer();
	}

	// Construct the upload path
	const uploadPath = `/drives/${config.driveId}/root:/${folderPath}/${fileName}:/content`;

	try {
		// Upload the file
		const response = await client.api(uploadPath).put(fileContent);

		return {
			id: response.id,
			name: response.name,
			webUrl: response.webUrl,
			downloadUrl: response["@microsoft.graph.downloadUrl"],
			size: response.size,
			createdDateTime: response.createdDateTime,
			lastModifiedDateTime: response.lastModifiedDateTime,
		};
	} catch (error) {
		console.error("SharePoint upload failed:", error);
		throw new Error(`Failed to upload file: ${error}`);
	}
}

/**
 * Download a file from SharePoint
 * @param config SharePoint configuration
 * @param fileId File ID or path
 * @returns File content as ArrayBuffer
 */
export async function downloadFileFromSharePoint(
	config: SharePointConfig,
	fileId: string
): Promise<ArrayBuffer> {
	const client = getGraphClient(config.accessToken);

	try {
		const response = await client
			.api(`/drives/${config.driveId}/items/${fileId}/content`)
			.get();
		return response;
	} catch (error) {
		console.error("SharePoint download failed:", error);
		throw new Error(`Failed to download file: ${error}`);
	}
}

/**
 * List files in a SharePoint folder
 * @param config SharePoint configuration
 * @param folderPath Folder path
 * @returns Array of file metadata
 */
export async function listFilesInFolder(
	config: SharePointConfig,
	folderPath: string
): Promise<UploadedFile[]> {
	const client = getGraphClient(config.accessToken);

	try {
		const response = await client
			.api(`/drives/${config.driveId}/root:/${folderPath}:/children`)
			.get();

		return response.value.map((item: any) => ({
			id: item.id,
			name: item.name,
			webUrl: item.webUrl,
			downloadUrl: item["@microsoft.graph.downloadUrl"],
			size: item.size,
			createdDateTime: item.createdDateTime,
			lastModifiedDateTime: item.lastModifiedDateTime,
		}));
	} catch (error) {
		console.error("SharePoint list failed:", error);
		return [];
	}
}

/**
 * Delete a file from SharePoint
 * @param config SharePoint configuration
 * @param fileId File ID
 */
export async function deleteFileFromSharePoint(
	config: SharePointConfig,
	fileId: string
): Promise<void> {
	const client = getGraphClient(config.accessToken);

	try {
		await client.api(`/drives/${config.driveId}/items/${fileId}`).delete();
	} catch (error) {
		console.error("SharePoint delete failed:", error);
		throw new Error(`Failed to delete file: ${error}`);
	}
}

/**
 * Create a folder in SharePoint
 * @param config SharePoint configuration
 * @param parentPath Parent folder path
 * @param folderName New folder name
 */
export async function createFolderInSharePoint(
	config: SharePointConfig,
	parentPath: string,
	folderName: string
): Promise<void> {
	const client = getGraphClient(config.accessToken);

	const folderData = {
		name: folderName,
		folder: {},
		"@microsoft.graph.conflictBehavior": "rename",
	};

	try {
		await client
			.api(`/drives/${config.driveId}/root:/${parentPath}:/children`)
			.post(folderData);
	} catch (error) {
		console.error("SharePoint folder creation failed:", error);
		throw new Error(`Failed to create folder: ${error}`);
	}
}

/**
 * Get SharePoint site and drive information
 * Useful for initial setup and configuration
 */
export async function getSharePointSiteInfo(
	accessToken: string,
	siteName: string
): Promise<{ siteId: string; driveId: string }> {
	const client = getGraphClient(accessToken);

	try {
		// Search for site by name
		const sitesResponse = await client.api(`/sites?search=${siteName}`).get();

		if (!sitesResponse.value || sitesResponse.value.length === 0) {
			throw new Error(`Site "${siteName}" not found`);
		}

		const site = sitesResponse.value[0];
		const siteId = site.id;

		// Get the default document library (drive)
		const drivesResponse = await client.api(`/sites/${siteId}/drives`).get();

		if (!drivesResponse.value || drivesResponse.value.length === 0) {
			throw new Error("No document libraries found in site");
		}

		const drive = drivesResponse.value[0];

		return {
			siteId,
			driveId: drive.id,
		};
	} catch (error) {
		console.error("Failed to get SharePoint info:", error);
		throw error;
	}
}
