import { NextResponse } from "next/server";
import { backendApi, getAuthorizationHeader } from "@/lib/http/backendRoute";

export async function POST() {
  const authorization = await getAuthorizationHeader();
  let backendConfirmed = false;

  try {
    await backendApi.post(
      "/api/auth/logout",
      {},
      authorization ? { headers: { Authorization: authorization } } : undefined,
    );
    backendConfirmed = true;
  } catch {
    // JWT backend masih stateless. Session lokal tetap wajib dihapus meski backend offline.
  }

  const response = NextResponse.json({
    message: "Logout berhasil.",
    backendConfirmed,
  });
  response.cookies.set({
    name: "orbit_access_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
