import { axiosClient } from "@/lib/http/axiosClient";
import type { ServiceBulletinReviewAction } from "@/features/service-bulletins";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapReviewAction(value: unknown): ServiceBulletinReviewAction | null {
  if (!isRecord(value)) return null;
  const actor = isRecord(value.actor) ? value.actor : {};
  return {
    id: String(value.id ?? ""),
    action: String(value.action ?? ""),
    actorName: nullableString(actor.username ?? actor.email ?? value.actorName),
    actorRole: nullableString(value.actorRole ?? actor.role),
    comment: nullableString(value.comment),
    createdAt: nullableString(value.createdAt),
  };
}

export async function getServiceBulletinReviewHistory(
  eesId: string,
  signal?: AbortSignal,
) {
  const response = await axiosClient.get(`/approvals/${encodeURIComponent(eesId)}`, { signal });
  const payload = isRecord(response.data) ? response.data : {};
  const data = isRecord(payload.data) ? payload.data : {};
  const history = Array.isArray(data.history) ? data.history : [];
  return history
    .map(mapReviewAction)
    .filter((item): item is ServiceBulletinReviewAction => item !== null);
}
