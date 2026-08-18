import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const OPERATORS = new Set(["GARUDA", "CITILINK"]);
const ROLES = new Set(["ENGINEER", "MANAGER"]);

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const operator = searchParams.get("operator")?.trim().toUpperCase() || "";
  const role = searchParams.get("role")?.trim().toUpperCase() || "";

  if (!OPERATORS.has(operator) || !ROLES.has(role)) {
    return apiJson(
      { message: "Operator atau role kandidat approval tidak valid." },
      { status: 400 },
    );
  }

  try {
    const response = await backendApi.get("/api/users/approval-candidates", {
      params: { operator, role },
      headers: { Authorization: authorization },
    });

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
