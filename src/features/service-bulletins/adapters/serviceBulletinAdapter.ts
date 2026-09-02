import type {
  ServiceBulletinListResult,
  ServiceBulletinExtractedItem,
  ServiceBulletinRelationshipStatus,
  ServiceBulletinRelationship,
  ServiceBulletinRelations,
  ServiceBulletinReviewAction,
  ServiceBulletinEesEvaluation,
  ServiceBulletinViewModel,
  WarrantyValue,
  EesTemplateOperator,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function firstStringList(...values: unknown[]) {
  for (const value of values) {
    const list = stringList(value);
    if (list.length) return list;
  }
  return [];
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function confidencePercentage(value: unknown) {
  const score = numberValue(value);
  if (score === null || score < 0) return null;

  const percentage = score <= 1 ? score * 100 : score;
  if (percentage > 100) return null;

  return Math.round(percentage * 10) / 10;
}

function warrantyValue(value: unknown): WarrantyValue {
  if (value === true) return "Y";
  if (value === false) return "N";
  if (typeof value !== "string") return "";

  const normalized = value.trim().toUpperCase();
  if (["TRUE", "YES", "Y", "1"].includes(normalized)) return "Y";
  if (["FALSE", "NO", "N", "0"].includes(normalized)) return "N";
  return "";
}

function eesTemplateValue(...values: unknown[]): EesTemplateOperator | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (normalized === "garuda" || normalized === "citilink") return normalized;
  }
  return null;
}

function inferRevision(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const match = value.match(/(?:^|[\s_-])(R\d{1,3})(?=$|[\s_.-])/i);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

function extractedItem(
  value: unknown,
  fallbackParagraph: string,
  fallbackItemNo: number,
): ServiceBulletinExtractedItem | null {
  if (!isRecord(value)) return null;
  return {
    itemNo: String(value.itemNo ?? value.item_no ?? fallbackItemNo),
    paragraph: String(value.paragraph ?? fallbackParagraph),
    requirementDesc: String(value.requirementDesc ?? value.requirement_desc ?? ""),
    remarks: String(value.remarks ?? value.remark ?? ""),
    taskType: nullableString(value.taskType ?? value.task_type),
    references: firstStringList(value.reference, value.references),
  };
}

function extractItems(rawPayload: Record<string, unknown>) {
  const result: ServiceBulletinExtractedItem[] = [];
  const items = rawPayload.items;

  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      const mapped = extractedItem(item, "", index + 1);
      if (mapped) result.push(mapped);
    });
  } else if (isRecord(items)) {
    Object.entries(items).forEach(([paragraph, values]) => {
      if (!Array.isArray(values)) return;
      values.forEach((item, index) => {
        const mapped = extractedItem(item, paragraph, result.length + index + 1);
        if (mapped) result.push(mapped);
      });
    });
  }

  ([
    ["problem_evidence", "Problem Evidence"],
    ["description", "Description"],
  ] as const).forEach(([key, paragraph]) => {
    const values = rawPayload[key];
    if (!Array.isArray(values)) return;
    values.forEach((item, index) => {
      const mapped = extractedItem(item, paragraph, result.length + index + 1);
      if (mapped) result.push(mapped);
    });
  });

  return result;
}

function mapRelationshipStatus(value: unknown): ServiceBulletinRelationshipStatus | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  if (["SUPERSEDED_RECURRENT", "SUPERSEDED_AND_RECURRENT"].includes(normalized)) {
    return "BOTH";
  }
  if (normalized === "SUPERSEEDED") {
    return "SUPERSEDED";
  }
  if (["SUPERSEDED", "RECURRENT", "TERMINATED", "BOTH", "NONE"].includes(normalized)) {
    return normalized as ServiceBulletinRelationshipStatus;
  }
  return null;
}

function mapEvaluation(value: unknown): ServiceBulletinEesEvaluation | null {
  if (!isRecord(value)) return null;
  return {
    id: String(value.id ?? ""),
    eesDocumentId: String(value.eesDocumentId ?? ""),
    itemNo: String(value.itemNo ?? ""),
    paragraph: nullableString(value.paragraph),
    requirementDesc: String(value.requirementDesc ?? ""),
    remarks: nullableString(value.remarks),
    taskType: nullableString(value.taskType),
    warranty: typeof value.warranty === "boolean" ? value.warranty : null,
    rep: nullableString(value.rep),
    dueAt: nullableString(value.dueAt),
    isApplicable: value.isApplicable !== false,
  };
}

function relationshipType(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "CONCURRENT") return "RECURRENT" as const;
  if (normalized === "SUPERSEDES") return "SUPERSEDED" as const;
  if (normalized === "TERMINATES") return "TERMINATED" as const;
  if (normalized.includes("TERMINAT")) return "TERMINATED" as const;
  if (normalized.includes("RECURRENT")) return "RECURRENT" as const;
  if (normalized.includes("SUPERSED")) return "SUPERSEDED" as const;
  return null;
}

function mapRelationship(value: unknown): ServiceBulletinRelationship | null {
  if (!isRecord(value)) return null;
  const rawDirection = String(value.direction ?? value.relationshipDirection ?? "").trim().toUpperCase();
  const direction = rawDirection === "INCOMING" ? "INCOMING" as const : "OUTGOING" as const;
  const directionalTargets = direction === "INCOMING"
    ? [
        value.sourceSb,
        value.fromServiceBulletin,
        value.sourceServiceBulletin,
        value.source,
      ]
    : [
        value.targetSb,
        value.toServiceBulletin,
        value.targetServiceBulletin,
        value.target,
      ];
  const target = [
    ...directionalTargets,
    value.serviceBulletin,
    value.relatedSb,
    value.relatedServiceBulletin,
    value.sb,
  ].find(isRecord) ?? (
    value.directRelationEndpoint === true ? {} : value
  );
  const rawType = nullableString(
    value.type
    ?? value.relationshipType
    ?? value.relationType
    ?? value.status,
  );
  const type = relationshipType(rawType);
  if (!type) return null;
  const id = nullableString(
    target.id
    ?? value.relatedSbId
    ?? (direction === "INCOMING" ? value.sourceSbId : value.targetSbId)
    ?? value.sbId,
  );
  const bulletinNumber = String(
    target.sbNumber
    ?? target.bulletinNumber
    ?? (direction === "INCOMING" ? value.sourceSbNumber : value.targetSbNumber)
    ?? value.relatedSbNumber
    ?? "",
  );
  if (!id && !bulletinNumber) return null;
  const rawExecutionMode = String(value.executionMode ?? value.execution_mode ?? "").trim().toUpperCase();
  const executionMode = ["OPTIONAL", "ALTERNATIVE", "OPTIONAL_ALTERNATIVE"].includes(rawExecutionMode)
    ? "OPTIONAL_ALTERNATIVE" as const
    : "REQUIRED" as const;
  const rawConditionType = String(
    value.conditionType ?? value.condition_type ?? "",
  ).trim().toUpperCase();
  const conditionType = ["PRE", "POST", "NONE"].includes(rawConditionType)
    ? rawConditionType as "PRE" | "POST" | "NONE"
    : null;
  return {
    id,
    bulletinNumber: bulletinNumber || id || "—",
    title: nullableString(target.title),
    type,
    rawType: rawType?.toUpperCase() ?? null,
    status: nullableString(target.status ?? value.documentStatus),
    syncStatus: nullableString(value.syncStatus)?.toUpperCase() ?? null,
    direction,
    executionMode,
    alternativeGroup: nullableString(value.alternativeGroup ?? value.alternative_group),
    conditionType,
    remarks: nullableString(value.remarks),
  };
}

export function mapServiceBulletinRelations(
  value: unknown,
): ServiceBulletinRelations {
  const root = isRecord(value) ? value : {};
  const data = isRecord(root.data) ? root.data : root;
  const rawServiceBulletin = isRecord(data.serviceBulletin)
    ? data.serviceBulletin
    : {};

  const mapByDirection = (
    items: unknown,
    direction: "INCOMING" | "OUTGOING",
  ) => (Array.isArray(items) ? items : [])
    .map((item) => mapRelationship(
      isRecord(item)
        ? { ...item, direction, directRelationEndpoint: true }
        : item,
    ))
    .filter((item): item is ServiceBulletinRelationship => item !== null);

  const outgoingRelations = mapByDirection(
    data.outgoingRelations,
    "OUTGOING",
  );
  const incomingRelations = mapByDirection(
    data.incomingRelations,
    "INCOMING",
  );

  return {
    serviceBulletin: {
      id: String(rawServiceBulletin.id ?? ""),
      sbNumber: String(
        rawServiceBulletin.sbNumber
        ?? rawServiceBulletin.bulletinNumber
        ?? "",
      ),
      revision: nullableString(rawServiceBulletin.revision),
      title: String(rawServiceBulletin.title ?? ""),
      status: nullableString(rawServiceBulletin.status),
    },
    outgoingRelations,
    incomingRelations,
    relationships: [...outgoingRelations, ...incomingRelations],
  };
}

function mapReviewAction(value: unknown): ServiceBulletinReviewAction | null {
  if (!isRecord(value)) return null;
  const actor = isRecord(value.actor) ? value.actor : {};
  return {
    id: String(value.id ?? ""),
    action: String(value.action ?? ""),
    actorId: nullableString(actor.id ?? value.actorId),
    actorName: nullableString(actor.username ?? actor.email ?? value.actorName),
    actorRole: nullableString(value.actorRole ?? actor.role),
    comment: nullableString(value.comment),
    createdAt: nullableString(value.createdAt),
  };
}

export function mapServiceBulletin(value: unknown): ServiceBulletinViewModel {
  const sb = isRecord(value) ? value : {};
  const ocrResult = isRecord(sb.ocrResult) ? sb.ocrResult : {};
  const confidenceScore = parseRecord(ocrResult.confidenceScore);
  const rawPayload = parseRecord(sb.rawPayload ?? ocrResult.rawPayload);
  const createdBy = isRecord(sb.createdBy) ? sb.createdBy : {};
  const operator = isRecord(sb.operator) ? sb.operator : {};
  const generatedEes = isRecord(sb.generatedEes) ? sb.generatedEes : {};
  const generatedApproval = isRecord(generatedEes.approval)
    ? generatedEes.approval
    : {};
  const evaluations = Array.isArray(generatedEes.evaluations)
    ? generatedEes.evaluations.map(mapEvaluation).filter((item): item is ServiceBulletinEesEvaluation => item !== null)
    : [];
  const firstEvaluation = evaluations[0];
  const rawRelationships = [sb.relationships, sb.relatedServiceBulletins, sb.relatedSbs, rawPayload.relationships]
    .find(Array.isArray) ?? [];
  const relationships = rawRelationships
    .map(mapRelationship)
    .filter((item): item is ServiceBulletinRelationship => item !== null);
  const reviewActions = Array.isArray(generatedEes.reviewActions)
    ? generatedEes.reviewActions.map(mapReviewAction).filter((item): item is ServiceBulletinReviewAction => item !== null)
    : [];
  const engineeringRec = isRecord(sb.engineeringRec) ? sb.engineeringRec : {};
  const extractedItems = extractItems(rawPayload);
  const nestedReferences = extractedItems.flatMap(item => item.references);
  const complianceCategory = numberValue(sb.complianceCategory)
    ?? numberValue(rawPayload.compliance_category);

  return {
    evaluations,
    id: String(sb.id ?? ""),
    bulletinNumber: String(sb.sbNumber ?? ""),
    revision: nullableString(sb.revision) ?? inferRevision(sb.sbNumber, rawPayload.sb_code, sb.originalFileName),
    title: String(sb.title ?? rawPayload.title ?? rawPayload.tittle ?? ""),
    manufacturer: String(rawPayload.manufacturer ?? sb.issuer ?? ""),
    publicationDate: nullableString(sb.issueDate),
    receivedAt: nullableString(sb.receivedAt),
    complianceCategory,
    category: complianceCategory,
    impactType: nullableString(sb.impactType ?? rawPayload.impact_type ?? rawPayload.impactType),
    aircraftType: nullableString(sb.aircraftType ?? generatedEes.aircraftType),
    effectivityType: nullableString(sb.effectivityType ?? generatedEes.effectedType ?? rawPayload.effected_type ?? rawPayload.effectivityType),
    effectivityRange: nullableString(sb.effectivityRange)
      ?? (firstStringList(generatedEes.effectedModel, rawPayload.effected_model, rawPayload.effectivityRange).join(", ") || null),
    compliancePeriod: nullableString(sb.compliancePeriod ?? rawPayload.compliance_period ?? rawPayload.due_at),
    sbType: nullableString(sb.sbType),
    operatorId: nullableString(sb.operatorId),
    operatorCode: nullableString(operator.code),
    operatorName: nullableString(operator.name),
    ocrStatus: nullableString(ocrResult.ocrStatus),
    draftStatus: nullableString(ocrResult.draftStatus),
    aiConfidence: confidencePercentage(confidenceScore.score),
    references: firstStringList(generatedEes.references, rawPayload.references, rawPayload.reference, nestedReferences),
    affectedESNs: firstStringList(
      rawPayload.affectedESNs,
      rawPayload.affected_esns,
      rawPayload.esn,
      rawPayload.engine_serial_number,
      generatedEes.esn,
    ),
    affectedPartNumbers: firstStringList(
      rawPayload.affectedPartNumbers,
      rawPayload.affected_part_numbers,
      rawPayload.part_number,
      rawPayload.partNumber,
    ),
    taskType: nullableString(generatedEes.taskType ?? rawPayload.task_type ?? rawPayload.taskType),
    extractedItems,
    warranty: warrantyValue(firstEvaluation?.warranty ?? rawPayload.warranty),
    rep: nullableString(firstEvaluation?.rep ?? rawPayload.rep),
    createdBy: nullableString(createdBy.username ?? createdBy.email),
    createdById: nullableString(sb.createdById ?? createdBy.id),
    createdByRole: nullableString(createdBy.role),
    inputSource: (sb.createdById || createdBy.id || String(sb.id ?? "").startsWith("SB-DOC-"))
      ? "USER_UPLOAD"
      : "MAIN_DATABASE",
    eesTemplate: eesTemplateValue(
      sb.selectedEesTemplate,
      sb.eesTemplate,
      sb.selectedTemplate,
      sb.template,
      sb.outputTemplate,
      generatedEes.eesTemplate,
      generatedEes.selectedEesTemplate,
      generatedEes.selectedTemplate,
      generatedEes.template,
      generatedEes.outputTemplate,
      rawPayload.eesTemplate,
      rawPayload.selectedEesTemplate,
      rawPayload.selectedTemplate,
      rawPayload.template,
      rawPayload.outputTemplate,
    ),
    eesNumber: nullableString(generatedEes.eesNumber),
    generatedEesId: nullableString(generatedEes.id),
    eesReviewStatus: nullableString(generatedEes.reviewStatus),
    eesApprovalStatus: nullableString(generatedApproval.status),
    eesSubmittedAt: nullableString(
      generatedApproval.submittedAt ?? generatedEes.submittedAt,
    ),
    eesHasApprovalAssignment: Boolean(
      generatedApproval.id
      || generatedApproval.assignedToId
      || generatedApproval.assignedTo
      || generatedApproval.currentAssignee,
    ),
    eesCreatedAt: nullableString(generatedEes.createdAt),
    recommendedAction: nullableString(engineeringRec.recommendedAction),
    priorityLevel: nullableString(engineeringRec.priorityLevel),
    engineeringNotes: nullableString(engineeringRec.engineeringNotes),
    isDeferable: typeof engineeringRec.isDeferable === "boolean" ? engineeringRec.isDeferable : null,
    egtMarginCheck: typeof engineeringRec.egtMarginCheck === "boolean" ? engineeringRec.egtMarginCheck : null,
    status: String(sb.status ?? ""),
    originalFilename: nullableString(sb.originalFileName),
    storedFilename: nullableString(sb.storedFileName),
    createdAt: nullableString(sb.createdAt),
    relationshipStatus: mapRelationshipStatus(
      sb.relationshipStatus ?? sb.relationStatus ?? sb.sbRelationshipStatus,
    ),
    relationships,
    reviewActions,
  };
}

export function mapServiceBulletinList(value: unknown): ServiceBulletinListResult {
  const response = isRecord(value) ? value : {};
  const responseData = response.data;
  const nestedData = isRecord(responseData) ? responseData : {};
  const meta = isRecord(response.meta)
    ? response.meta
    : isRecord(nestedData.meta)
      ? nestedData.meta
      : {};
  const data = Array.isArray(value)
    ? value
    : Array.isArray(responseData)
      ? responseData
      : Array.isArray(nestedData.data)
        ? nestedData.data
        : [];

  const total = numberValue(response.total)
    ?? numberValue(nestedData.total)
    ?? numberValue(meta.total)
    ?? data.length;
  const page = numberValue(response.page)
    ?? numberValue(nestedData.page)
    ?? numberValue(meta.page)
    ?? 1;
  const limit = numberValue(response.limit)
    ?? numberValue(nestedData.limit)
    ?? numberValue(meta.limit)
    ?? data.length;

  return {
    items: data.map(mapServiceBulletin),
    total,
    page,
    limit,
  };
}

export function normalizeAiSummary(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
