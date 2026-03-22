import { ConfidentialClientApplication, AuthenticationResult } from "@azure/msal-node";

/**
 * Microsoft Authentication Provider
 * Handles Azure AD / Microsoft Entra ID authentication
 */

export interface MicrosoftAuthConfig {
	clientId: string;
	clientSecret: string;
	tenantId: string;
	redirectUri: string;
}

export interface UserInfo {
	id: string;
	email: string;
	name: string;
	accessToken: string;
	refreshToken?: string;
}

const MICROSOFT_SCOPES = [
	"User.Read",
	"Mail.ReadWrite",
	"Mail.Send",
	"Calendars.ReadWrite",
	"Contacts.ReadWrite",
	"offline_access",
	"Sites.ReadWrite.All",
	"Files.ReadWrite.All",
];

let msalInstance: ConfidentialClientApplication | null = null;
let cachedClientId: string | undefined;
let cachedClientSecret: string | undefined;
let cachedTenantId: string | undefined;

/**
 * Initialize MSAL (Microsoft Authentication Library)
 */
export function getMsalInstance(): ConfidentialClientApplication {
	const clientId = process.env.MICROSOFT_CLIENT_ID;
	const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
	const tenantId = process.env.MICROSOFT_TENANT_ID;

	if (!clientId || !clientSecret || !tenantId) {
		throw new Error("Microsoft auth environment variables not configured");
	}

	// Invalidate cached instance if credentials have changed (e.g. after .env.local update)
	if (
		msalInstance &&
		(cachedClientId !== clientId ||
			cachedClientSecret !== clientSecret ||
			cachedTenantId !== tenantId)
	) {
		msalInstance = null;
	}

	if (msalInstance) {
		return msalInstance;
	}

	const msalConfig = {
		auth: {
			clientId,
			authority: `https://login.microsoftonline.com/${tenantId}`,
			clientSecret,
		},
	};

	msalInstance = new ConfidentialClientApplication(msalConfig);
	cachedClientId = clientId;
	cachedClientSecret = clientSecret;
	cachedTenantId = tenantId;
	return msalInstance;
}

/**
 * Get authorization URL for login
 */
export async function getAuthorizationUrl(redirectUri: string): Promise<string> {
	const msal = getMsalInstance();
	
	const authCodeUrlParameters = {
		scopes: MICROSOFT_SCOPES,
		redirectUri,
	};

	return await msal.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokenFromCode(
	code: string,
	redirectUri: string
): Promise<UserInfo> {
	const msal = getMsalInstance();

	const tokenRequest = {
		code,
		scopes: MICROSOFT_SCOPES,
		redirectUri,
	};

	try {
		const response: AuthenticationResult = await msal.acquireTokenByCode(tokenRequest);

		if (!response.account) {
			throw new Error("No account information in response");
		}

		return {
			id: response.account.homeAccountId,
			email: response.account.username,
			name: response.account.name || response.account.username,
			accessToken: response.accessToken,
			// Note: MSAL handles refresh tokens internally, not exposed in response
			refreshToken: undefined,
		};
	} catch (error) {
		console.error("Token exchange failed:", error);
		const errorCode =
			typeof error === "object" && error !== null && "errorCode" in error
				? String((error as Record<string, unknown>).errorCode)
				: undefined;
		const message =
			typeof error === "object" && error !== null && "message" in error
				? String((error as Record<string, unknown>).message)
				: "Failed to authenticate with Microsoft";

		if (errorCode) {
			throw new Error(`${errorCode}: ${message}`);
		}

		throw new Error(message);
	}
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
	refreshToken: string,
	accountId: string
): Promise<string> {
	const msal = getMsalInstance();

	const refreshRequest = {
		refreshToken,
		scopes: MICROSOFT_SCOPES,
		account: {
			homeAccountId: accountId,
		} as any,
	};

	try {
		const response = await msal.acquireTokenByRefreshToken(refreshRequest);
		if (!response) {
			throw new Error("No response from token refresh");
		}
		return response.accessToken;
	} catch (error) {
		console.error("Token refresh failed:", error);
		throw new Error("Failed to refresh access token");
	}
}

/**
 * Validate access token and get user info
 * Uses Microsoft Graph to verify the token
 */
export async function validateToken(accessToken: string): Promise<UserInfo | null> {
	try {
		const response = await fetch("https://graph.microsoft.com/v1.0/me", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			return null;
		}

		const userData = await response.json();

		return {
			id: userData.id,
			email: userData.mail || userData.userPrincipalName,
			name: userData.displayName,
			accessToken,
		};
	} catch (error) {
		console.error("Token validation failed:", error);
		return null;
	}
}
