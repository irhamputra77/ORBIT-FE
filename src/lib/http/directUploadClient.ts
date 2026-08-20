import axios from "axios";

const directUploadBaseUrl = (
  process.env.NEXT_PUBLIC_UPLOAD_API_BASE_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
)?.trim().replace(/\/$/, "");

const TRANSIENT_GATEWAY_STATUSES = new Set([
  502,
  503,
  504,
  520,
  522,
  524,
]);

export class DirectUploadRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly isTransientGatewayError: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      isTransientGatewayError?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "DirectUploadRequestError";
    this.status = options.status;
    this.code = options.code;
    this.isTransientGatewayError = Boolean(options.isTransientGatewayError);
  }
}

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
        "NEXT_PUBLIC_UPLOAD_API_BASE_URL atau NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi untuk direct upload.",
      ),
    );
  }

  return config;
});

export function directUploadError(error: unknown, fallback: string) {
  if (axios.isCancel(error)) return error;

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

  const status = error.response?.status;
  const code = error.code;
  const isNetworkTimeout = [
    "ECONNABORTED",
    "ETIMEDOUT",
    "ERR_NETWORK",
  ].includes(code || "");

  return new DirectUploadRequestError(message, {
    status,
    code,
    isTransientGatewayError:
      (status !== undefined && TRANSIENT_GATEWAY_STATUSES.has(status))
      || (status === undefined && isNetworkTimeout),
  });
}

export function isTransientDirectUploadError(error: unknown) {
  return error instanceof DirectUploadRequestError
    && error.isTransientGatewayError;
}
