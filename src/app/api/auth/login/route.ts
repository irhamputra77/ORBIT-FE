import axios from "axios";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { LoginApiResponse, LoginResult } from "@/features/authentication";
import { validateLoginRequest } from "@/lib/security/loginValidation";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rateLimiter";

const backendBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;

function getClientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  ).slice(0, 64);
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function tooManyRequests(retryAfterSeconds: number) {
  const coarseRetryAfter = Math.max(60, Math.ceil(retryAfterSeconds / 60) * 60);
  const response = noStoreJson(
    { message: "Terlalu banyak percobaan login. Silakan coba lagi nanti." },
    { status: 429 },
  );
  response.headers.set("Retry-After", String(coarseRetryAfter));
  return response;
}

export async function POST(request: Request) {
  const hostname = new URL(request.url).hostname;
  const useSharedDomain =
    hostname === "orbit-gmf.online" || hostname.endsWith(".orbit-gmf.online");
  const addressKey = `login:address:${hashIdentifier(getClientAddress(request))}`;
  const addressLimit = consumeRateLimit({
    key: addressKey,
    limit: 20,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!addressLimit.allowed) {
    return tooManyRequests(addressLimit.retryAfterSeconds);
  }

  const validation = await validateLoginRequest(request);

  if (!validation.success) {
    return noStoreJson({ message: validation.message }, { status: validation.status });
  }

  const { email, password, rememberMe } = validation.data;
  const identityKey = `login:identity:${hashIdentifier(email)}`;
  const identityLimit = consumeRateLimit({
    key: identityKey,
    limit: 5,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!identityLimit.allowed) {
    return tooManyRequests(identityLimit.retryAfterSeconds);
  }

  try {
    const backendResponse = await axios.post<LoginApiResponse>(
      `${backendBaseUrl}/api/auth/login`,
      { email, password },
      {
        timeout: 15_000,
        maxRedirects: 0,
        maxBodyLength: 4_096,
        maxContentLength: 65_536,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    const result: LoginResult = { user: backendResponse.data.data.user };
    const response = noStoreJson(result);

    resetRateLimit(identityKey);

    response.cookies.set({
      name: "orbit_access_token",
      value: backendResponse.data.data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(useSharedDomain ? { domain: ".orbit-gmf.online" } : {}),
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });

    return response;
  } catch (caughtError) {
    if (axios.isAxiosError(caughtError)) {
      const backendStatus = caughtError.response?.status;

      if (backendStatus && [400, 401, 403].includes(backendStatus)) {
        return noStoreJson(
          { message: "Email atau password salah." },
          { status: 401 },
        );
      }

      if (backendStatus === 429) {
        return tooManyRequests(60);
      }

      return noStoreJson(
        { message: "Server autentikasi tidak dapat dihubungi." },
        { status: 502 },
      );
    }

    return noStoreJson(
      { message: "Terjadi kesalahan pada proses autentikasi." },
      { status: 500 },
    );
  }
}
