import "server-only";

import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

export const backendApi = axios.create({
  baseURL: backendBaseUrl,
  timeout: 15_000,
  maxRedirects: 0,
  maxContentLength: 2 * 1024 * 1024,
  headers: { Accept: "application/json" },
});

export async function getAuthorizationHeader() {
  const token = (await cookies()).get("orbit_access_token")?.value;
  return token ? `Bearer ${token}` : null;
}

export function apiJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function backendErrorResponse(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return apiJson({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }

  const status = error.response?.status;

  if (status === 401) {
    return apiJson({ message: "Sesi Anda sudah berakhir." }, { status: 401 });
  }

  if (status === 403) {
    return apiJson({ message: "Anda tidak memiliki akses." }, { status: 403 });
  }

  if (status === 404) {
    return apiJson({ message: "Data tidak ditemukan." }, { status: 404 });
  }

  if (status === 400) {
    const payload = error.response?.data as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    } | undefined;
    const backendMessage =
      typeof payload?.details === "string"
        ? payload.details
        : typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : "File PDF tidak valid.";
    return apiJson(
      { message: backendMessage },
      { status: 400 },
    );
  }

  if (status === 413) {
    return apiJson({ message: "Ukuran file PDF melebihi batas 100 MB." }, { status: 413 });
  }

  if (status === 409) {
    const payload = error.response?.data as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    } | undefined;
    const backendMessage =
      typeof payload?.details === "string"
        ? payload.details
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error === "string"
            ? payload.error
            : "Data sudah berubah. Muat ulang halaman dan coba lagi.";
    return apiJson({ message: backendMessage }, { status: 409 });
  }

  if (error.code === "ECONNABORTED") {
    return apiJson({ message: "Permintaan ke backend melewati batas waktu." }, { status: 504 });
  }

  return apiJson(
    { message: "Backend AeroCompliance tidak dapat dihubungi." },
    { status: 502 },
  );
}

export async function proxyBackendBinary(
  path: string,
  fallbackDisposition: "inline" | "attachment",
) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get<ArrayBuffer>(path, {
      headers: { Authorization: authorization },
      responseType: "arraybuffer",
      maxContentLength: 100 * 1024 * 1024,
    });
    const contentType = response.headers["content-type"] || "application/octet-stream";
    const contentDisposition =
      response.headers["content-disposition"] || fallbackDisposition;

    return new Response(response.data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": String(contentType),
        "Content-Disposition": String(contentDisposition),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
