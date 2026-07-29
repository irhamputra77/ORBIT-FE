export type EESCategoryDefinition = {
  level: `Category ${number}`;
  description: string;
  rule: string;
  manualOnly: boolean;
};

export const EES_CATEGORIES: readonly EESCategoryDefinition[] = [
  { level: "Category 1", description: "Document / Records Review", rule: "Manual EES input at Manual Review.", manualOnly: true },
  { level: "Category 2", description: "Condition Monitoring", rule: "Manual EES input at Manual Review.", manualOnly: true },
  { level: "Category 3", description: "On-Condition Maintenance", rule: "Manual EES input at Manual Review.", manualOnly: true },
  { level: "Category 4", description: "Onwing Inspection / Functional Check", rule: "AI-assisted EES generation is available.", manualOnly: false },
  { level: "Category 5", description: "Shop Visit Action — Non-Mandatory", rule: "AI-assisted EES generation is available.", manualOnly: false },
  { level: "Category 6", description: "Life-Limited Part (LLP) Action", rule: "AI-assisted EES generation is available.", manualOnly: false },
  { level: "Category 7", description: "Mandatory Airworthiness Action", rule: "AI-assisted EES generation is available.", manualOnly: false },
];

export function isCategoryManual(category: string): boolean {
  const match = category.match(/Category (\d+)/);
  return match ? Number.parseInt(match[1], 10) <= 3 : false;
}

export function getAICategory(serviceBulletinId: string): `Category ${number}` {
  if (
    serviceBulletinId.includes("72-1093") ||
    serviceBulletinId.includes("79-0031") ||
    serviceBulletinId.includes("73-0049")
  ) {
    return "Category 7";
  }

  if (serviceBulletinId.includes("72-0399") || serviceBulletinId.includes("73-3600")) {
    return "Category 6";
  }

  if (serviceBulletinId.includes("72-0632")) {
    return "Category 3";
  }

  return "Category 5";
}
