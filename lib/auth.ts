import { cookies } from "next/headers";

export async function isAdminFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const v = cookieStore.get("admin")?.value;
    return v === "1";
  } catch {
    return false;
  }
}


