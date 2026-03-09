"use client";

import { useState } from "react";

export interface SharePointFile {
	id: string;
	name: string;
	webUrl: string;
	downloadUrl: string;
	size: number;
	createdDateTime: string;
}

export interface UseSharePointUploadResult {
	uploadFile: (
		fileData: string,
		fileName: string,
		folderPath: string
	) => Promise<SharePointFile | null>;
	isUploading: boolean;
	error: string | null;
}

/**
 * Hook for uploading files to SharePoint
 * Falls back to base64 storage if SharePoint is not configured
 */
export function useSharePointUpload(): UseSharePointUploadResult {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const uploadFile = async (
		fileData: string,
		fileName: string,
		folderPath: string
	): Promise<SharePointFile | null> => {
		setIsUploading(true);
		setError(null);

		// Check if Microsoft auth is enabled
		const authMode = process.env.NEXT_PUBLIC_AUTH_MODE;
		if (authMode !== "microsoft") {
			// Fall back to storing base64 locally (current behavior)
			setIsUploading(false);
			return {
				id: `local-${Date.now()}`,
				name: fileName,
				webUrl: fileData, // Store base64 directly
				downloadUrl: fileData,
				size: fileData.length,
				createdDateTime: new Date().toISOString(),
			};
		}

		try {
			const response = await fetch("/api/sharepoint/upload", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fileData,
					fileName,
					folderPath,
				}),
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			const data = await response.json();
			setIsUploading(false);
			return data.file;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Upload failed";
			setError(errorMessage);
			setIsUploading(false);

			// Fall back to local storage on error
			return {
				id: `local-${Date.now()}`,
				name: fileName,
				webUrl: fileData,
				downloadUrl: fileData,
				size: fileData.length,
				createdDateTime: new Date().toISOString(),
			};
		}
	};

	return { uploadFile, isUploading, error };
}
