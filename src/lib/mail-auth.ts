import { cookies } from "next/headers";
import { validateToken } from "@/lib/microsoft-auth";

export async function getMicrosoftAccessTokenFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("ms_access_token")?.value;

  if (!accessToken) {
    return null;
  }

  const user = await validateToken(accessToken);
  if (!user) {
    return null;
  }

  return accessToken;
}