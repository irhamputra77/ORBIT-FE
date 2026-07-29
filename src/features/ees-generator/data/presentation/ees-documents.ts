import type { ServiceBulletinEesDocument } from "@/features/service-bulletins";
import type { EESPresentationServiceBulletin } from "./service-bulletins";

export function createPresentationEesDocument(
  sb: EESPresentationServiceBulletin,
): ServiceBulletinEesDocument {
  return {
    id: `EES-DEMO-${sb.id.replace(/[^A-Z0-9]/gi, "-")}`,
    eesNumber: sb.syncStatus === "Synced" ? sb.tdrRef : `EES-DRAFT-${Date.now()}`,
    sourceSbId: `DEMO-${sb.id}`,
    taskType: sb.taskType || null,
    references: sb.references.join(", ") || null,
    effectedType: sb.engineType || null,
    effectedModel: sb.engineType || null,
    aircraftType: sb.fleet || null,
    esn: sb.affectedESNs.join(", ") || null,
    reviewStatus: sb.syncStatus === "Synced" ? "PENDING" : "UNSYNCED",
    createdAt: new Date().toISOString(),
    evaluations: sb.evaluations,
  };
}
