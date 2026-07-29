export type CategorySystem = "ORBIT" | "GE";
export type GESeverity = "critical" | "high" | "medium" | "low" | "info";

export type GECategory = {
  level: string;
  title: string;
  summary: string;
  businessImpact: string;
  customerAction: string;
  severity: GESeverity;
};

export type GEImpact = {
  code: string;
  title: string;
  description: string;
  severity: GESeverity;
};

export type GEClassifiableSB = {
  engineType?: string;
  engine?: string;
  fleet?: string;
  title?: string;
  compliance?: string;
  priority?: string;
  category?: string;
};

export type GESuggestion = {
  category: GECategory;
  impact: GEImpact;
  confidence: number;
  explanation: string;
};

export type GEClassificationFields = {
  categorySystem: CategorySystem;
  geCategory?: string;
  geCategoryTitle?: string;
  geCategoryImpact?: string;
  geImpact?: string;
  geImpactTitle?: string;
  geImpactDescription?: string;
  technicalCompliance?: string;
  programSupport?: string;
  interchangeabilityCode?: string;
  aiSuggestedGECategory?: string;
  aiSuggestedGEImpact?: string;
};

export const GE_SB_CATEGORIES: GECategory[] = [
  { level: "Category 1", title: "Immediate / Mandatory Compliance", summary: "Recommended before subsequent flight or before a specified hours, cycles, date, or interval.", businessImpact: "Mandatory compliance; usually related to aviation authority action such as AD, NPRM, or pending AD.", customerAction: "Will cause customer action", severity: "critical" },
  { level: "Category 2", title: "As Soon As Possible", summary: "Recommended as soon as possible without effect on revenue service, but before a specified hours, cycles, date, or interval.", businessImpact: "Driven by GE technical reasons. Aircraft may require suitable time at line station or maintenance base.", customerAction: "Can cause non-routine customer action", severity: "high" },
  { level: "Category 3", title: "Next Shop Visit", summary: "Recommended at the next shop visit of the engine or module.", businessImpact: "Compliance is necessary regardless of the reason for the shop visit. Unplanned disassembly may be required.", customerAction: "Shop visit action", severity: "medium" },
  { level: "Category 4", title: "When Area Is Exposed", summary: "Recommended when the affected area is exposed.", businessImpact: "Compliance is necessary when access is already available.", customerAction: "Opportunistic maintenance action", severity: "medium" },
  { level: "Category 5", title: "When Affected Part Is Removed", summary: "Recommended as soon as the affected part is removed from the engine.", businessImpact: "Perform when the affected piece part is removed.", customerAction: "Part removal-based action", severity: "medium" },
  { level: "Category 6", title: "When Routed for Repair", summary: "Recommended when the affected part is routed for repair.", businessImpact: "Perform when the affected part is exposed and repair is planned.", customerAction: "Repair routing action", severity: "low" },
  { level: "Category 7", title: "Customer Convenience / Option", summary: "Recommended at customer convenience or customer option.", businessImpact: "Performed after old parts are used or optionally if old parts remain supported.", customerAction: "Optional customer action", severity: "low" },
  { level: "Category 8", title: "Spare Parts Release", summary: "Used for spare parts release Service Bulletins.", businessImpact: "Spare parts availability or release information.", customerAction: "Spare parts planning", severity: "info" },
  { level: "Category 9", title: "Information Only", summary: "Information only.", businessImpact: "No maintenance action required unless stated elsewhere.", customerAction: "Informational", severity: "info" },
];

export const GE_SB_IMPACTS: GEImpact[] = [
  { code: "Impact A", title: "Flight Safety", description: "Addresses a condition that may affect flight safety.", severity: "critical" },
  { code: "Impact B", title: "Operational Safety Event Risk", description: "Addresses a condition that may increase IFSD, take-off aborts, air turn backs, or diversions.", severity: "high" },
  { code: "Impact C", title: "Operational Disruption / AOG Risk", description: "Addresses a condition that may result in non-event operational disruption, unscheduled engine removals, out-station removals, or aircraft on ground.", severity: "medium" },
  { code: "Impact D", title: "Delay or Cancellation", description: "Addresses a condition that may result in delay or cancellation.", severity: "medium" },
  { code: "Impact E", title: "Cost / Maintenance Improvement", description: "Improves cost of ownership, reduces maintenance requirements, or provides product improvement.", severity: "low" },
  { code: "Impact F", title: "Per SB Category", description: "Implement as deemed necessary per the Service Bulletin category.", severity: "info" },
];

export function isGEEngine(engineType: string, fleet?: string): boolean {
  const engine = engineType.toLowerCase();
  const normalizedFleet = fleet?.toLowerCase() ?? "";

  return (
    engine.includes("ge") ||
    engine.includes("ge90") ||
    engine.includes("genx") ||
    engine.includes("cf6") ||
    (normalizedFleet.includes("b777") && engine.includes("ge90"))
  );
}

export function getCategorySystem(sb?: GEClassifiableSB | null): CategorySystem {
  if (!sb) return "ORBIT";
  return isGEEngine(sb.engineType ?? sb.engine ?? "", sb.fleet) ? "GE" : "ORBIT";
}

export function getGESeverityColor(severity: GESeverity) {
  const colors: Record<GESeverity, { color: string; background: string; border: string }> = {
    critical: { color: "#EF4444", background: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.32)" },
    high: { color: "#F97316", background: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.30)" },
    medium: { color: "#F59E0B", background: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.28)" },
    low: { color: "#10B981", background: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.28)" },
    info: { color: "#64748B", background: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.25)" },
  };

  return colors[severity];
}

export function getGECategory(level?: string): GECategory | undefined {
  return GE_SB_CATEGORIES.find(category => category.level === level);
}

export function getGEImpact(code?: string): GEImpact | undefined {
  return GE_SB_IMPACTS.find(impact => impact.code === code);
}

export function getSuggestedGECategory(sb: GEClassifiableSB): GESuggestion {
  const content = [sb.title, sb.compliance, sb.priority, sb.category].filter(Boolean).join(" ").toLowerCase();
  let categoryLevel = "Category 3";
  let impactCode = "Impact F";
  let confidence = 91;
  let reason = "Default GE shop-visit classification based on the available Service Bulletin metadata.";

  if (content.includes("flight safety")) {
    categoryLevel = "Category 1"; impactCode = "Impact A"; confidence = 98; reason = "Flight-safety language requires immediate mandatory compliance assessment.";
  } else if (["ifsd", "toa", "atb", "div"].some(term => content.includes(term))) {
    categoryLevel = "Category 2"; impactCode = "Impact B"; confidence = 96; reason = "The SB references an operational safety event risk such as IFSD, take-off abort, air turn back, or diversion.";
  } else if (["aog", "unscheduled removal", "out-station removal"].some(term => content.includes(term))) {
    categoryLevel = "Category 3"; impactCode = "Impact C"; confidence = 95; reason = "The SB may drive operational disruption or an unscheduled engine removal.";
  } else if (["delay", "cancellation"].some(term => content.includes(term))) {
    categoryLevel = "Category 4"; impactCode = "Impact D"; confidence = 93; reason = "The SB metadata indicates possible delay or cancellation exposure.";
  } else if (["cost", "maintenance improvement", "product improvement"].some(term => content.includes(term))) {
    categoryLevel = "Category 7"; impactCode = "Impact E"; confidence = 92; reason = "The SB is primarily a cost, maintenance, or product improvement action.";
  } else if (content.includes("spare parts release")) {
    categoryLevel = "Category 8"; impactCode = "Impact F"; confidence = 97; reason = "The SB is identified as a spare-parts release bulletin.";
  } else if (content.includes("information only")) {
    categoryLevel = "Category 9"; impactCode = "Impact F"; confidence = 97; reason = "The SB is explicitly classified as information only.";
  }

  return {
    category: getGECategory(categoryLevel) ?? GE_SB_CATEGORIES[2],
    impact: getGEImpact(impactCode) ?? GE_SB_IMPACTS[5],
    confidence,
    explanation: reason,
  };
}
