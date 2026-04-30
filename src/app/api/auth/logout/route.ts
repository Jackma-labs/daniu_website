import { cookies } from "next/headers";
import { DANIU_SESSION_COOKIE, getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  cookieStore.set(DANIU_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  await writeAuditLog({ event: "auth.logout", actor: user });

  return Response.json({ ok: true });
}
