export interface ValidatedLoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type LoginValidationResult =
  | { success: true; data: ValidatedLoginPayload }
  | { success: false; message: string; status: number };

const MAX_REQUEST_BYTES = 4_096;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62})@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export async function validateLoginRequest(
  request: Request,
): Promise<LoginValidationResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("application/json")) {
    return {
      success: false,
      message: "Content-Type harus application/json.",
      status: 415,
    };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { success: false, message: "Request terlalu besar.", status: 413 };
  }

  let body: unknown;

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return { success: false, message: "Request terlalu besar.", status: 413 };
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return { success: false, message: "Request body tidak valid.", status: 400 };
  }

  if (!isPlainObject(body)) {
    return { success: false, message: "Request body tidak valid.", status: 400 };
  }

  const allowedKeys = new Set(["email", "password", "rememberMe"]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return { success: false, message: "Request body tidak valid.", status: 400 };
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rememberMe = body.rememberMe === true;

  const emailIsValid =
    email.length > 0 && email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
  const passwordIsValid =
    password.length > 0 &&
    password.length <= MAX_PASSWORD_LENGTH &&
    !/[\u0000-\u001F\u007F]/.test(password);

  if (!emailIsValid || !passwordIsValid) {
    return {
      success: false,
      message: "Format email atau password tidak valid.",
      status: 400,
    };
  }

  return { success: true, data: { email, password, rememberMe } };
}
