import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

type RouteContext = { params: Promise<{ id: string }> };

async function requestConfiguration(context: RouteContext) {
  const authorization = await getAuthorizationHeader();
  const { id } = await context.params;

  return {
    authorization,
    path: `/api/users/${encodeURIComponent(id)}`,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { authorization, path } = await requestConfiguration(context);
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.get(path, {
      headers: { Authorization: authorization },
    });
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { authorization, path } = await requestConfiguration(context);
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await backendApi.patch(path, body, {
      headers: { Authorization: authorization },
    });
    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { authorization, path } = await requestConfiguration(context);
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  try {
    const response = await backendApi.delete(path, {
      headers: { Authorization: authorization },
    });
    return apiJson(response.data ?? { message: "User berhasil dihapus." }, {
      status: response.status,
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
