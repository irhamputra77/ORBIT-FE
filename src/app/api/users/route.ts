import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

async function authorizationOrResponse() {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return {
      authorization: null,
      response: apiJson({ message: "Authentication diperlukan." }, { status: 401 }),
    };
  }

  return { authorization, response: null };
}

export async function GET(request: Request) {
  const { authorization, response } = await authorizationOrResponse();
  if (!authorization) {
    return response ?? apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();

  for (const key of ["page", "limit", "role", "operatorId", "search"]) {
    const value = incoming.get(key)?.trim();
    if (value) params.set(key, value);
  }

  try {
    const backendResponse = await backendApi.get("/api/users", {
      headers: { Authorization: authorization },
      params,
    });

    return apiJson(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { authorization, response } = await authorizationOrResponse();
  if (!authorization) {
    return response ?? apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const backendResponse = await backendApi.post("/api/users", body, {
      headers: { Authorization: authorization },
    });

    return apiJson(backendResponse.data, { status: backendResponse.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
