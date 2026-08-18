import axios from "axios";

const directUploadBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(
  /\/$/,
  "",
);

export const directUploadClient = axios.create({
  baseURL: directUploadBaseUrl,
  withCredentials: true,
  timeout: 0,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

directUploadClient.interceptors.request.use((config) => {
  if (!directUploadBaseUrl) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi untuk direct upload.",
      ),
    );
  }

  return config;
});

export function directUploadError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(fallback);
  }

  const payload = error.response?.data as
    | { message?: unknown; details?: unknown; error?: unknown }
    | undefined;
  const message =
    typeof payload?.details === "string"
      ? payload.details
      : typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : error.message || fallback;

  return new Error(message);
}
