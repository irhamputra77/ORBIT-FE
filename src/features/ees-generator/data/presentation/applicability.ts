import type { ServiceBulletinApplicability } from "@/features/service-bulletins";
import type { EESPresentationServiceBulletin } from "./service-bulletins";

const REGISTRATIONS_BY_FLEET: Record<string, string[]> = {
  A320neo: ["PK-GTA", "PK-GTB", "PK-GTC"],
  B777: ["PK-GIA", "PK-GIE", "PK-GIF"],
  "B737 NG": ["PK-GFM", "PK-GFN", "PK-GFO", "PK-GFP"],
  A330neo: ["PK-GHE", "PK-GHF"],
  ATR72: ["PK-GJR", "PK-GJS"],
  "B737 MAX": ["PK-GDA", "PK-GDB"],
};

export function createPresentationApplicability(
  sb: EESPresentationServiceBulletin,
): ServiceBulletinApplicability {
  const registrations = REGISTRATIONS_BY_FLEET[sb.fleet] ?? [];
  const engines = sb.affectedESNs.map((esn, index) => {
    const isApplicable = sb.status !== "TERMINATED" && index !== sb.affectedESNs.length - 1;
    return {
      esn,
      msn: String(33000 + index * 417),
      model: sb.engineType,
      position: String((index % 2) + 1),
      aircraft: {
        registration: registrations[index] ?? `PK-DE${index + 1}`,
        msn: String(33000 + index * 417),
        aircraftType: sb.fleet,
      },
      isApplicable,
      reason: isApplicable
        ? "ESN, engine type, and fleet configuration match the SB effectivity."
        : sb.status === "TERMINATED"
          ? "SB instruction is terminated; engineering confirmation is required."
          : "Part-number configuration is outside the affected range.",
    };
  });

  const applicable = engines.filter(engine => engine.isApplicable).length;
  return {
    sb: {
      id: `DEMO-${sb.id}`,
      sbNumber: sb.id,
      title: sb.title,
      effectivityType: sb.engineType,
      effectivityRange: sb.affectedESNs.join(", "),
      compliancePeriod: sb.compliance || null,
    },
    summary: {
      totalEngines: engines.length,
      applicable,
      notApplicable: engines.length - applicable,
    },
    engines,
  };
}
