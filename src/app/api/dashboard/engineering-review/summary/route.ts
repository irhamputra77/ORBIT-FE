import {
  apiJson,
  backendApi,
  backendErrorResponse,
  getAuthorizationHeader,
} from "@/lib/http/backendRoute";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const OPERATOR_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function GET(request: Request) {
  const authorization = await getAuthorizationHeader();
  if (!authorization) {
    return apiJson({ message: "Authentication diperlukan." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const month = searchParams.get("month")?.trim();
  const operatorId = searchParams.get("operatorId")?.trim();

  if (month && !MONTH_PATTERN.test(month)) {
    return apiJson(
      { message: "Parameter month harus menggunakan format YYYY-MM." },
      { status: 400 },
    );
  }

  if (operatorId && !OPERATOR_ID_PATTERN.test(operatorId)) {
    return apiJson(
      { message: "Parameter operatorId tidak valid." },
      { status: 400 },
    );
  }

  try {
    const response = await backendApi.get(
      "/api/dashboard/engineering-review/summary",
      {
        params: {
          ...(month ? { month } : {}),
          ...(operatorId ? { operatorId } : {}),
        },
        headers: { Authorization: authorization },
      },
    );

    return apiJson(response.data, { status: response.status });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
