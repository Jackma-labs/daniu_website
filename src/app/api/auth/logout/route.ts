import { cookies } from "next/headers";
import { DANIU_SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(DANIU_SESSION_COOKIE, "", { path: "/", maxAge: 0 });

  return Response.json({ ok: true });
}
