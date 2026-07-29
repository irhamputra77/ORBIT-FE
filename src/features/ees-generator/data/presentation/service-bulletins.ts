import type {
  ServiceBulletinEesEvaluation,
  ServiceBulletinExtractedItem,
  ServiceBulletinRelationshipStatus,
} from "@/features/service-bulletins";

export type EESPresentationServiceBulletin = {
  backendId?: string;
  isPresentationDummy: true;
  relationshipStatus?: ServiceBulletinRelationshipStatus;
  id: string;
  title: string;
  engine: string;
  fleet: string;
  operator?: string;
  category: string;
  sbCategory: number;
  aiConfidence: number;
  priority: string;
  status: string;
  compliance: string;
  issuedDate: string;
  revision: string;
  affectedESNs: string[];
  affectedPartNumbers: string[];
  references: string[];
  taskType: string;
  extractedItems: ServiceBulletinExtractedItem[];
  manufacturer: string;
  impactType: string;
  createdBy: string;
  ocrStatus: string;
  draftStatus: string;
  eesReviewStatus: string;
  recommendedAction: string;
  priorityLevel: string;
  engineeringNotes: string;
  isDeferable: boolean | null;
  egtMarginCheck: boolean | null;
  tdr: string;
  engineType: string;
  affectedEngine: string;
  source: string;
  lastSync: string;
  syncStatus: "Synced" | "Unsynced";
  tdrRef: string;
  warranty: "Y" | "N" | "";
  rep: string;
  evaluations: ServiceBulletinEesEvaluation[];
  citilinkOptions?: {
    eesIssuedDate: string;
    unitConcern: string[];
    transferTo: string;
    bulletinType: string;
    bulletinIssuedDate: string;
    manufacturer: string;
    subject: string;
    aircraftType: string;
    engineApu: string;
    partNumber: string;
    partClassification: string[];
    note: string;
    reasonOfEvaluation: string[];
    maintenanceLevel: string[];
    maintenanceDate: string;
    warranty: string;
    warrantyType: string;
    warrantyDue: string;
    warrantyNote: string;
    consequence: string[];
    accomplishmentMethod: string[];
    inspectionType: string[];
    evaluationResult: string;
    engineeringAction: string[];
    furtherImplementation: string[];
    managementApproval: string[];
  };
};

function item(
  itemNo: string,
  paragraph: string,
  requirementDesc: string,
  remarks: string,
  taskType: string,
  references: string[],
): ServiceBulletinExtractedItem {
  return { itemNo, paragraph, requirementDesc, remarks, taskType, references };
}

function evaluation(
  id: string,
  itemNo: string,
  requirementDesc: string,
  remarks: string,
  taskType: string,
  warranty: boolean,
  rep: string,
  dueAt: string,
  isApplicable = true,
): ServiceBulletinEesEvaluation {
  return {
    id,
    eesDocumentId: `EES-DEMO-${id}`,
    itemNo,
    paragraph: "Planning Information",
    requirementDesc,
    remarks,
    taskType,
    warranty,
    rep,
    dueAt,
    isApplicable,
  };
}

export const PRESENTATION_SERVICE_BULLETINS: EESPresentationServiceBulletin[] = [
  {
    isPresentationDummy: true,
    relationshipStatus: "RECURRENT",
    id: "LEAP-1A-72-00-0449",
    title: "ENGINE — Introduction of New LPTACC Cooling Manifold Assembly and Bracket",
    engine: "LEAP-1A26",
    fleet: "A320neo",
    operator: "Citilink Indonesia",
    category: "Modification",
    sbCategory: 5,
    aiConfidence: 96,
    priority: "Medium",
    status: "ACTIVE",
    compliance: "At next scheduled shop visit",
    issuedDate: "2026-02-02",
    revision: "01A",
    affectedESNs: ["804474", "804502", "804731"],
    affectedPartNumbers: ["2628M91G01", "2628M91G02"],
    references: ["AMM 75-31-01", "IPC 75-30-00", "EO 10000127027"],
    taskType: "MOD",
    extractedItems: [
      item("1", "Effectivity", "LEAP-1A26 engines installed on Citilink A320neo aircraft.", "Three fleet engines match the SB effectivity.", "MOD", ["SB 72-00-0449"]),
      item("2", "Description", "Install the new LPTACC cooling manifold assembly and supporting bracket.", "Plan incorporation during the next scheduled shop visit.", "MOD", ["AMM 75-31-01", "IPC 75-30-00"]),
    ],
    manufacturer: "CFM International",
    impactType: "D",
    createdBy: "Main Database",
    ocrStatus: "EXTRACTED",
    draftStatus: "GENERATED",
    eesReviewStatus: "PENDING",
    recommendedAction: "COMPLY",
    priorityLevel: "MEDIUM",
    engineeringNotes: "No immediate operational restriction. Incorporate at the next shop visit.",
    isDeferable: true,
    egtMarginCheck: false,
    tdr: "1000028902/000/00",
    engineType: "LEAP-1A26",
    affectedEngine: "804474, 804502, 804731",
    source: "Presentation Demo",
    lastSync: "2026-07-23T09:30:00.000Z",
    syncStatus: "Synced",
    tdrRef: "1000028902/000/00",
    warranty: "Y",
    rep: "N",
    evaluations: [
      evaluation("CT-0449-01", "1", "Install the new LPTACC cooling manifold assembly and bracket.", "Applicable to three Citilink LEAP-1A26 engines.", "MOD", true, "N", "Next scheduled shop visit"),
    ],
    citilinkOptions: {
      eesIssuedDate: "2026-02-02",
      unitConcern: ["TEA-2"],
      transferTo: "Manager Engineering Citilink",
      bulletinType: "Service Bulletin",
      bulletinIssuedDate: "2026-02-02",
      manufacturer: "CFM International",
      subject: "Introduction of New LPTACC Cooling Manifold Assembly and Bracket",
      aircraftType: "A320neo",
      engineApu: "LEAP-1A26",
      partNumber: "2628M91G01, 2628M91G02",
      partClassification: ["Component", "Part"],
      note: "Applicable to the identified LEAP-1A26 engine configuration.",
      reasonOfEvaluation: [
        "Improve Maintainability",
        "Improve Reliability",
      ],
      maintenanceLevel: ["To be performed at next maint. Scheduled"],
      maintenanceDate: "2026-09-30",
      warranty: "Y",
      warrantyType: "Material and labor support",
      warrantyDue: "Before next scheduled shop visit",
      warrantyNote: "Warranty claim subject to CFM campaign eligibility.",
      consequence: ["Affected"],
      accomplishmentMethod: ["Modification"],
      inspectionType: ["One Time"],
      evaluationResult: "Applicable to three Citilink LEAP-1A26 engines. Incorporate the modification during the next scheduled shop visit.",
      engineeringAction: ["Yes"],
      furtherImplementation: ["Engineering Order"],
      managementApproval: ["TEA"],
    },
  },
  {
    isPresentationDummy: true,
    relationshipStatus: "SUPERSEDED",
    id: "GE90 SB 72-0685 R06",
    title: "ENGINE — TGB Roller Bearing Inner Race Material Change",
    engine: "GE90-115B",
    fleet: "B777",
    operator: "Garuda Indonesia",
    category: "Replacement",
    sbCategory: 3,
    aiConfidence: 95,
    priority: "High",
    status: "ACTIVE",
    compliance: "Within 24 months or at next shop visit",
    issuedDate: "2025-12-22",
    revision: "R06",
    affectedESNs: ["906101", "906107", "906114"],
    affectedPartNumbers: ["2304M56P01", "2304M56P02"],
    references: ["GE90 AMM 72-23-00", "GE90 ESM 72-23-05", "GE90 SB 72-0685"],
    taskType: "REP",
    extractedItems: [
      item("1", "Problem / Evidence", "Cracking has been found on the TGB radial roller bearing inner race.", "Cracks may be induced by fretting at the bearing interface.", "REP", ["GE90 ESM 72-23-05"]),
      item("2", "Description", "Introduce new and reworked TGB assemblies with an improved inner-race material.", "Manual engineering evaluation is required for Category 3.", "REP", ["GE90 SB 72-0685"]),
    ],
    manufacturer: "GE Aerospace",
    impactType: "E",
    createdBy: "Main Database",
    ocrStatus: "EXTRACTED",
    draftStatus: "REVIEW_REQUIRED",
    eesReviewStatus: "PENDING",
    recommendedAction: "COMPLY",
    priorityLevel: "HIGH",
    engineeringNotes: "Verify TGB configuration and plan replacement at the next qualifying shop visit.",
    isDeferable: false,
    egtMarginCheck: false,
    tdr: "10000289455/000/00",
    engineType: "GE90-115B",
    affectedEngine: "906101, 906107, 906114",
    source: "Presentation Demo",
    lastSync: "2026-07-22T14:10:00.000Z",
    syncStatus: "Synced",
    tdrRef: "10000289455/000/00",
    warranty: "N",
    rep: "Y",
    evaluations: [
      evaluation("GA-0685-01", "1", "Replace the affected TGB radial roller bearing inner race.", "Manual review required due to Category 3 classification.", "REP", false, "Y", "Within 24 months"),
      evaluation("GA-0685-02", "2", "Confirm the installed TGB assembly part number before induction.", "Coordinate configuration verification with Planning and Powerplant Engineering.", "INS", false, "N", "Before next shop visit"),
    ],
  },
  {
    isPresentationDummy: true,
    relationshipStatus: "BOTH",
    id: "CFM56-7B SB 72-1024 R02",
    title: "ENGINE — HPT Shroud Segment Inspection and Replacement",
    engine: "CFM56-7B26E",
    fleet: "B737 NG",
    operator: "Garuda Indonesia",
    category: "Inspection",
    sbCategory: 6,
    aiConfidence: 93,
    priority: "High",
    status: "ACTIVE",
    compliance: "Before 18,000 cycles since new",
    issuedDate: "2026-01-16",
    revision: "R02",
    affectedESNs: ["660235", "660241", "660268", "660301"],
    affectedPartNumbers: ["338-117-903-0", "338-117-904-0"],
    references: ["CFM56-7B AMM 72-52-00", "ESM 72-52-41", "NDTM 70-32-09"],
    taskType: "INS",
    extractedItems: [
      item("1", "Effectivity", "Selected CFM56-7B HPT shroud segments within the published serial range.", "Four active engines require configuration verification.", "INS", ["CFM56-7B SB 72-1024"]),
      item("2", "Accomplishment", "Perform fluorescent penetrant inspection and replace segments outside serviceable limits.", "Record findings in the shop-visit report.", "INS", ["NDTM 70-32-09"]),
    ],
    manufacturer: "CFM International",
    impactType: "C",
    createdBy: "Main Database",
    ocrStatus: "EXTRACTED",
    draftStatus: "GENERATED",
    eesReviewStatus: "APPROVED",
    recommendedAction: "COMPLY",
    priorityLevel: "HIGH",
    engineeringNotes: "Combine with scheduled HPT module exposure.",
    isDeferable: false,
    egtMarginCheck: true,
    tdr: "1000029018/000/00",
    engineType: "CFM56-7B26E",
    affectedEngine: "660235, 660241, 660268, 660301",
    source: "Presentation Demo",
    lastSync: "2026-07-20T07:45:00.000Z",
    syncStatus: "Synced",
    tdrRef: "1000029018/000/00",
    warranty: "N",
    rep: "N",
    evaluations: [
      evaluation("GA-1024-01", "1", "Inspect HPT shroud segments using the specified NDT procedure.", "Applicable to four engines; accomplish when the HPT module is exposed.", "INS", false, "N", "Before 18,000 CSN"),
    ],
  },
  {
    isPresentationDummy: true,
    relationshipStatus: "NONE",
    id: "TRENT 7000 SB 72-K451 R01",
    title: "ENGINE — IP Compressor Rotor Balance Weight Improvement",
    engine: "TRENT 7000-72",
    fleet: "A330neo",
    operator: "Garuda Indonesia",
    category: "Modification",
    sbCategory: 5,
    aiConfidence: 94,
    priority: "Medium",
    status: "ACTIVE",
    compliance: "At next engine shop visit",
    issuedDate: "2026-03-11",
    revision: "R01",
    affectedESNs: ["20041", "20047"],
    affectedPartNumbers: ["KH45121", "KH45122"],
    references: ["TRENT 7000 EMM 72-31-00", "RR SB 72-K451"],
    taskType: "MOD",
    extractedItems: [
      item("1", "Description", "Introduce improved IP compressor rotor balance weights.", "Improves long-term vibration stability.", "MOD", ["RR SB 72-K451"]),
    ],
    manufacturer: "Rolls-Royce",
    impactType: "D",
    createdBy: "Main Database",
    ocrStatus: "EXTRACTED",
    draftStatus: "GENERATED",
    eesReviewStatus: "IN_REVIEW",
    recommendedAction: "COMPLY",
    priorityLevel: "MEDIUM",
    engineeringNotes: "No dedicated engine removal is required.",
    isDeferable: true,
    egtMarginCheck: true,
    tdr: "1000029077/000/00",
    engineType: "TRENT 7000-72",
    affectedEngine: "20041, 20047",
    source: "Presentation Demo",
    lastSync: "2026-07-19T11:20:00.000Z",
    syncStatus: "Synced",
    tdrRef: "1000029077/000/00",
    warranty: "Y",
    rep: "N",
    evaluations: [
      evaluation("GA-K451-01", "1", "Install improved IP compressor rotor balance weights.", "Accomplish during the next engine shop visit.", "MOD", true, "N", "Next engine shop visit"),
    ],
  },
  {
    isPresentationDummy: true,
    relationshipStatus: "TERMINATED",
    id: "PW127M SB 72-0168 R03",
    title: "ENGINE — Fuel Nozzle Inspection and Cleaning Interval",
    engine: "PW127M",
    fleet: "ATR72",
    operator: "Citilink Indonesia",
    category: "Inspection",
    sbCategory: 4,
    aiConfidence: 91,
    priority: "Medium",
    status: "TERMINATED",
    compliance: "Every 4,000 flight hours",
    issuedDate: "2025-10-08",
    revision: "R03",
    affectedESNs: ["ED1248", "ED1281"],
    affectedPartNumbers: ["3055698-01", "3055698-02"],
    references: ["PW127M EMM 73-11-00", "P&WC SB 72-0168"],
    taskType: "INS",
    extractedItems: [
      item("1", "Requirement", "Inspect and clean affected fuel nozzles at the published interval.", "The instruction is terminated by the superseding maintenance program revision.", "INS", ["P&WC SB 72-0168"]),
    ],
    manufacturer: "Pratt & Whitney Canada",
    impactType: "D",
    createdBy: "Main Database",
    ocrStatus: "EXTRACTED",
    draftStatus: "REVIEW_REQUIRED",
    eesReviewStatus: "RETURNED",
    recommendedAction: "REVIEW",
    priorityLevel: "MEDIUM",
    engineeringNotes: "Confirm termination against the current maintenance program.",
    isDeferable: true,
    egtMarginCheck: false,
    tdr: "1000028771/000/00",
    engineType: "PW127M",
    affectedEngine: "ED1248, ED1281",
    source: "Presentation Demo",
    lastSync: "2026-07-18T08:05:00.000Z",
    syncStatus: "Synced",
    tdrRef: "1000028771/000/00",
    warranty: "N",
    rep: "N",
    evaluations: [
      evaluation("CT-0168-01", "1", "Validate the fuel-nozzle interval against the superseding program revision.", "Hold implementation pending program confirmation.", "INS", false, "N", "Before next scheduled inspection", false),
    ],
  },
  {
    isPresentationDummy: true,
    relationshipStatus: "NONE",
    id: "LEAP-1B SB 72-0399 R00",
    title: "ENGINE — Fuel Nozzle Tip Carbon Build-Up Improvement",
    engine: "LEAP-1B28",
    fleet: "B737 MAX",
    operator: "Garuda Indonesia",
    category: "Modification",
    sbCategory: 5,
    aiConfidence: 89,
    priority: "Medium",
    status: "PENDING_AI",
    compliance: "At next scheduled shop visit",
    issuedDate: "2026-07-22",
    revision: "R00",
    affectedESNs: ["602941", "602955"],
    affectedPartNumbers: ["2558M70G01"],
    references: ["LEAP-1B AMM 73-11-01", "IPC 73-11-00"],
    taskType: "MOD",
    extractedItems: [
      item("1", "Description", "Introduce an improved fuel-nozzle tip configuration.", "Uploaded by a user and available for draft review.", "MOD", ["LEAP-1B SB 72-0399"]),
    ],
    manufacturer: "CFM International",
    impactType: "C",
    createdBy: "Ahmad Fikri Ramadhan",
    ocrStatus: "EXTRACTED",
    draftStatus: "GENERATED",
    eesReviewStatus: "PENDING",
    recommendedAction: "COMPLY",
    priorityLevel: "MEDIUM",
    engineeringNotes: "Presentation example for an unsynced AI upload.",
    isDeferable: true,
    egtMarginCheck: false,
    tdr: "",
    engineType: "LEAP-1B28",
    affectedEngine: "602941, 602955",
    source: "Presentation Demo",
    lastSync: "2026-07-23T15:42:00.000Z",
    syncStatus: "Unsynced",
    tdrRef: "",
    warranty: "Y",
    rep: "N",
    evaluations: [
      evaluation("UP-0399-01", "1", "Install improved fuel-nozzle tips on affected engines.", "Draft review is allowed; TDR remains empty until synchronization.", "MOD", true, "N", "Next scheduled shop visit"),
    ],
  },
];
