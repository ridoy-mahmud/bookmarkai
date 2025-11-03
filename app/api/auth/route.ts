import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminFromCookies } from "../../../lib/auth";

export async function GET() {
  const isAdmin = await isAdminFromCookies();
  return NextResponse.json({ isAdmin });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };
    if (email === "ridoy@gmail.com" && password === "ridoy007") {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
  return res;
}


