"use client";

import { Edit3 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateTime } from "@/lib/date-time";
import {
  CITILINK_ACCOMPLISHMENT_METHODS,
  CITILINK_COMPONENT_TYPES,
  CITILINK_CONSEQUENCES,
  CITILINK_DEFAULT_REASON_OF_EVALUATION,
  CITILINK_ENGINEERING_ACTIONS,
  CITILINK_FURTHER_IMPLEMENTATION,
  CITILINK_INSPECTION_TYPES,
  CITILINK_MAINTENANCE_OPTIONS,
  CITILINK_MANAGEMENT_APPROVAL,
  CITILINK_REASON_OPTIONS,
  CITILINK_UNIT_CONCERNS,
  citilinkSources,
  consequenceFromEngineeringAction,
  getCitilinkField,
  normalizeAccomplishmentMethod,
  normalizeComponentType,
  normalizeEngineeringAction,
  normalizeFurtherImplementation,
  normalizeInspectionType,
  normalizeMaintenanceLevel,
  normalizeManagementApproval,
  normalizeReasonOfEvaluation,
  normalizeUnitConcern,
  type CitilinkEditableValue,
} from "../services/citilink-fields";
import { MultiValueFieldEditor } from "./MultiValueFieldEditor";
import DOMPurify from "isomorphic-dompurify";

type CitilinkPreviewData = Record<string, unknown>;

type CitilinkEESTemplatePreviewProps = {
  ees: CitilinkPreviewData;
  editableFields?: boolean;
  onFieldChange?: (
    field: string,
    value: CitilinkEditableValue,
  ) => void;
  engineeringActionEditable?: boolean;
  furtherImplementationEditable?: boolean;
  docViewerOpen?: boolean;
  compactFields?: boolean;
  invalidFields?: readonly string[];
};

function toText(
  value: unknown,
  fallback = "",
): string {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return fallback;
}

function toTextBlock(
  value: unknown,
  fallback = "",
): string {
  if (Array.isArray(value)) {
    const lines = value
      .map(item => String(item).trim())
      .filter(Boolean);

    return lines.length
      ? lines.join("\n")
      : fallback;
  }

  return toText(value, fallback);
}

function toList(
  value: unknown,
  fallback: string[] = [],
): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function getManufacturer(engine: string): string {
  if (/LEAP|CFM/i.test(engine)) {
    return "CFM International";
  }

  if (/PW/i.test(engine)) {
    return "Pratt & Whitney";
  }

  return "";
}

function getAtaValues(
  bulletinNumber: string,
): {
  ata: string;
  subAta: string;
} {
  const match =
    bulletinNumber.match(/\b(\d{2})[-–](\d{2})/);

  return {
    ata: match?.[1] ?? "",
    subAta: match?.[2] ?? "",
  };
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return typeof value === "string" ||
    typeof value === "number"
    ? String(value).trim().length > 0
    : value != null;
}

/**
 * Validation Citilink.
 *
 * IMPORTANT:
 * Saat strictManualInput aktif, nilai kosong pada object `ees`
 * dianggap intentional empty value.
 *
 * Kita TIDAK boleh mencari fallback dari:
 * - selectedSB
 * - generated EES
 * - AI summary
 * - backend/default value
 */
export function getMissingCitilinkRequiredFields(
  ees: CitilinkPreviewData,
  options: {
    allowEmptyEesNumber?: boolean;
  } = {},
) {
  const strictManualInput =
    ees.strictManualInput === true;

  const sources = citilinkSources(ees);

  const fieldValue = (
    key: string,
    ...fallbackKeys: string[]
  ) => {
    /**
     * Sangat penting:
     *
     * Jika property ada walaupun value "",
     * gunakan value tersebut.
     *
     * Jangan anggap string kosong sebagai alasan
     * untuk mencari fallback dari backend.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        ees,
        key,
      )
    ) {
      return ees[key];
    }

    /**
     * Category 1-3:
     * tidak boleh mencari fallback.
     */
    if (strictManualInput) {
      return undefined;
    }

    return getCitilinkField(
      sources,
      key,
      ...fallbackKeys,
    );
  };

  const evaluationResult = fieldValue(
    "evaluationResult",
    "evaluation_result",
  );

  const hasEvaluationResult =
    hasValue(evaluationResult) ||
    (
      !strictManualInput &&
      hasValue(
        getCitilinkField(
          sources,
          "remarks",
        ),
      )
    );

  return [
    !options.allowEmptyEesNumber &&
    !hasValue(fieldValue("eesNumber"))
      ? "EES No."
      : null,

    !hasValue(
      fieldValue(
        "eesIssuedDate",
        "issueDate",
        "evaluationDate",
      ),
    )
      ? "EES Issued Date"
      : null,

    !hasValue(
      fieldValue("unitConcern") ??
        (
          strictManualInput
            ? undefined
            : ["TEA-2"]
        ),
    )
      ? "Unit Concern"
      : null,

    !hasValue(
      fieldValue("bulletinNumber"),
    )
      ? "Bulletin No."
      : null,

    !hasValue(
      fieldValue("bulletinType") ??
        (
          strictManualInput
            ? undefined
            : "Service Bulletin"
        ),
    )
      ? "Bull Type"
      : null,

    !hasValue(
      fieldValue(
        "subject",
        "title",
        "description",
      ),
    )
      ? "Subject"
      : null,

    !hasValue(
      fieldValue(
        "aircraftType",
        "fleet",
      ),
    )
      ? "Aircraft Type"
      : null,

    !hasValue(
      normalizeReasonOfEvaluation(
        fieldValue(
          "reasonOfEvaluation",
        ) ??
          (
            strictManualInput
              ? undefined
              : CITILINK_DEFAULT_REASON_OF_EVALUATION
          ),
      ),
    )
      ? "Reason of Evaluation"
      : null,

    !hasEvaluationResult
      ? "Evaluation Result"
      : null,

    !hasValue(
      fieldValue(
        "engineeringAction",
        "recommendedAction",
        "recommended_action",
      ),
    )
      ? "Engineering Action"
      : null,

    !hasValue(
      fieldValue(
        "furtherImplementation",
        "furtherImpl",
      ),
    )
      ? "Further Implementation"
      : null,

    !hasValue(
      fieldValue("managementApproval") ??
        (
          strictManualInput
            ? undefined
            : ["TEA"]
        ),
    )
      ? "Management Approval"
      : null,
  ].filter(
    (field): field is string =>
      field !== null,
  );
}

function TextField({
  label,
  field,
  value,
  editable,
  multiline,
  date,
  renderHtml,
  invalid = false,
  onChange,
}: {
  label: string;
  field: string;
  value: string;
  editable?: boolean;
  multiline?: boolean;
  date?: boolean;
  renderHtml?: boolean;
  invalid?: boolean;
  onChange?: (
    field: string,
    value: string,
  ) => void;
}) {
  const className = `
    w-full rounded-md border
    bg-emerald-500/[0.035]
    px-2 py-1.5
    text-xs text-foreground
    outline-none
    ${
      invalid
        ? "border-red-500 ring-1 ring-red-500/20 focus:border-red-600"
        : "border-emerald-800/20 focus:border-emerald-600"
    }
  `;

  return (
    <div
      id={`ees-field-${field}`}
      className={`min-w-0 rounded-lg ${
        invalid
          ? "bg-red-500/[0.045] p-2 ring-1 ring-red-500/35"
          : ""
      }`}
    >
      <div
        className={`mb-1 text-[10px] font-semibold ${
          invalid
            ? "text-red-600"
            : "text-muted-foreground"
        }`}
      >
        {label}

        {invalid && (
          <span className="ml-1 font-bold">
            Required
          </span>
        )}
      </div>

      {editable ? (
        date ? (
          <DatePicker
            value={value}
            onChange={nextValue =>
              onChange?.(
                field,
                nextValue,
              )
            }
            placeholder={`Select ${label.toLowerCase()}`}
            aria-label={label}
          />
        ) : multiline ? (
          <textarea
            value={value}
            onChange={event =>
              onChange?.(
                field,
                event.target.value,
              )
            }
            className={`${className} min-h-16 resize-y`}
          />
        ) : (
          <input
            value={value}
            onChange={event =>
              onChange?.(
                field,
                event.target.value,
              )
            }
            className={className}
          />
        )
      ) : (
        <div className="min-h-5 whitespace-pre-wrap text-xs font-medium text-foreground">
          {date
            ? formatDateTime(value)
            : renderHtml
              ? (
                <HtmlContent
                  html={value}
                />
              )
              : value || "—"}
        </div>
      )}
    </div>
  );
}

function HtmlContent({
  html,
}: {
  html?: string | null;
}) {
  if (!html) {
    return <span>—</span>;
  }

  const safeHtml =
    DOMPurify.sanitize(
      html,
      {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "b",
          "em",
          "i",
          "u",
          "ul",
          "ol",
          "li",
          "span",
        ],
        ALLOWED_ATTR: [],
      },
    );

  return (
    <div
      className="
        text-xs font-medium leading-relaxed
        text-foreground
        [&_ol]:my-2
        [&_ol]:list-decimal
        [&_ol]:pl-5
        [&_p]:mb-2
        [&_p:last-child]:mb-0
        [&_ul]:my-2
        [&_ul]:list-disc
        [&_ul]:pl-5
      "
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}

function CheckGroup({
  label,
  field,
  options,
  selected,
  editable,
  onChange,
  single = false,
  lockedOptions = [],
  invalid = false,
}: {
  label: string;
  field: string;
  options: string[];
  selected: string[];
  editable?: boolean;
  onChange?: (
    field: string,
    value: string[],
  ) => void;
  single?: boolean;
  lockedOptions?: string[];
  invalid?: boolean;
}) {
  const toggle = (
    option: string,
  ) => {
    if (
      lockedOptions.includes(option)
    ) {
      return;
    }

    const next =
      selected.includes(option)
        ? selected.filter(
            item => item !== option,
          )
        : single
          ? [option]
          : [
              ...selected,
              option,
            ];

    onChange?.(
      field,
      next,
    );
  };

  return (
    <div
      id={`ees-field-${field}`}
      className={`rounded-lg ${
        invalid
          ? "bg-red-500/[0.045] p-2 ring-1 ring-red-500/35"
          : ""
      }`}
    >
      <div
        className={`mb-1.5 text-[10px] font-semibold ${
          invalid
            ? "text-red-600"
            : "text-muted-foreground"
        }`}
      >
        {label}

        {invalid && (
          <span className="ml-1 font-bold">
            Required
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(option => (
          <label
            key={option}
            className={`flex items-start gap-1.5 text-[10px] leading-tight ${
              editable
                ? "cursor-pointer"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(
                option,
              )}
              disabled={
                !editable ||
                lockedOptions.includes(
                  option,
                )
              }
              onChange={() =>
                toggle(option)
              }
              className="mt-px h-3.5 w-3.5 accent-emerald-700"
            />

            <span
              className={
                selected.includes(
                  option,
                )
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CitilinkEESTemplatePreview({
  ees,
  editableFields,
  onFieldChange,
  engineeringActionEditable = false,
  furtherImplementationEditable = false,
  docViewerOpen = false,
  compactFields = false,
  invalidFields = [],
}: CitilinkEESTemplatePreviewProps) {
  const strictManualInput =
    ees.strictManualInput === true;

  const invalidFieldSet =
    new Set(invalidFields);

  const isInvalid = (
    ...fields: string[]
  ) =>
    fields.some(field =>
      invalidFieldSet.has(field),
    );

  const options = (
    ees.citilinkOptions ?? {}
  ) as CitilinkPreviewData;

  const generatedEesDocument = (
    ees.generatedEesDocument &&
    typeof ees.generatedEesDocument ===
      "object"
      ? ees.generatedEesDocument
      : {}
  ) as CitilinkPreviewData;

  const sources =
    citilinkSources(ees);

  /**
   * CRITICAL:
   *
   * Category 1-3 tidak boleh membaca fallback
   * dari AI/backend.
   */
  const field = (
    ...keys: string[]
  ) => {
    if (strictManualInput) {
      for (
        const key of keys
      ) {
        if (
          Object.prototype.hasOwnProperty.call(
            ees,
            key,
          )
        ) {
          return ees[key];
        }
      }

      return undefined;
    }

    return getCitilinkField(
      sources,
      ...keys,
    );
  };

  /**
   * Nilai yang user input selalu menang,
   * termasuk empty string.
   */
  const editableField = (
    key: string,
    ...fallbackKeys: string[]
  ) => {
    if (
      Object.prototype.hasOwnProperty.call(
        ees,
        key,
      )
    ) {
      return ees[key];
    }

    if (strictManualInput) {
      return undefined;
    }

    return field(
      key,
      ...fallbackKeys,
    );
  };

  const value = (
    key: string,
    fallback = "",
  ) =>
    toText(
      field(key),
      fallback,
    );

  const bulletinNumber =
    value("bulletinNumber");

  const engine =
    value(
      "engineType",
      value("engine"),
    );

  /**
   * Category 1-3:
   * ATA dan Sub ATA juga harus manual.
   */
  const ataValues =
    strictManualInput
      ? {
          ata: "",
          subAta: "",
        }
      : getAtaValues(
          bulletinNumber,
        );

  const unitConcern =
    normalizeUnitConcern(
      editableField(
        "unitConcern",
      ),
    );

  const componentType =
    normalizeComponentType(
      editableField(
        "partClassification",
        "componentType",
        "component_type",
      ),
    );

  const reasons =
    normalizeReasonOfEvaluation(
      editableField(
        "reasonOfEvaluation",
      ) ??
        (
          strictManualInput
            ? undefined
            : CITILINK_DEFAULT_REASON_OF_EVALUATION
        ),
    );

  const maintenanceLevel =
    normalizeMaintenanceLevel(
      editableField(
        "maintenanceLevel",
        "complianceTimeType",
        "compliance_time_type",
      ),
    );

  const recommendedAction =
    strictManualInput
      ? undefined
      : field(
          "recommendedAction",
          "recommended_action",
        );

  const engineeringAction =
    normalizeEngineeringAction(
      editableField(
        "engineeringAction",
      ) ??
        recommendedAction,
    );

  const consequence =
    consequenceFromEngineeringAction(
      engineeringAction,
    );

  const accomplishmentMethodValue =
    editableField(
      "accomplishmentMethod",
      "taskType",
      "task_type",
    );

  const accomplishmentMethod =
    strictManualInput &&
    !hasValue(
      accomplishmentMethodValue,
    )
      ? []
      : normalizeAccomplishmentMethod(
          accomplishmentMethodValue,
        );

  /**
   * Category 1-3:
   * inspection type tidak boleh disimpulkan
   * dari generated/backend compliance.
   */
  const inspectionType =
    strictManualInput
      ? normalizeInspectionType(
          editableField(
            "isRepetitive",
            "repetitive",
          ),
          undefined,
          editableField(
            "inspectionType",
          ),
        )
      : normalizeInspectionType(
          editableField(
            "isRepetitive",
            "repetitive",
          ),
          field(
            "compliancePeriod",
            "compliance_period",
            "dueCompliance",
          ),
          field(
            "inspectionType",
          ),
        );

  const furtherImplementation =
    normalizeFurtherImplementation(
      editableField(
        "furtherImplementation",
        "furtherImpl",
      ),
    );

  const managementApproval =
    normalizeManagementApproval(
      editableField(
        "managementApproval",
      ),
    );

  const warrantyValue =
    field("warranty");

  const warranty =
    typeof warrantyValue ===
      "boolean"
      ? warrantyValue
        ? "Y"
        : "N"
      : toText(
          warrantyValue,
        );

  const evaluationResult =
    strictManualInput
      ? toTextBlock(
          editableField(
            "evaluationResult",
            "evaluation_result",
          ),
        )
      : toTextBlock(
          field(
            "evaluationResult",
            "evaluation_result",
          ),
          value(
            "remarks",
          ),
        );

  const evaluations =
    !strictManualInput &&
    Array.isArray(
      ees.evaluations,
    )
      ? ees.evaluations.filter(
          (
            evaluation,
          ): evaluation is CitilinkPreviewData =>
            typeof evaluation ===
              "object" &&
            evaluation !== null,
        )
      : [];

  const evaluationRep =
    evaluations.find(
      evaluation =>
        hasValue(
          evaluation.rep,
        ),
    )?.rep;

  const applicable =
    strictManualInput
      ? value("applicable")
      : value(
          "applicable",
          evaluations.length
            ? evaluations.every(
                evaluation =>
                  evaluation.isApplicable !==
                  false,
              )
              ? "Yes"
              : "No"
            : "",
        );

  const rep =
    strictManualInput
      ? value("rep")
      : value(
          "rep",
          toText(
            evaluationRep,
            typeof generatedEesDocument.isRepetitive ===
              "boolean"
              ? generatedEesDocument.isRepetitive
                ? "Y"
                : "N/A"
              : "",
          ),
        );

  const note =
    strictManualInput
      ? toText(
          ees.note,
        )
      : toText(
          ees.note ??
            generatedEesDocument.note ??
            options.note,
        );

  const references =
    strictManualInput
      ? toList(
          ees.otherReferences ??
            ees.references ??
            ees.referencesRaw,
        )
      : toList(
          ees.otherReferences ??
            options.otherReferences ??
            ees.references ??
            ees.referencesRaw,
        );

  return (
    <div className="overflow-hidden rounded-xl border-2 border-emerald-700/25 bg-card">
      {/* HEADER */}
      <div
        className={`flex justify-between gap-3 bg-gradient-to-br from-[#00843D] to-[#006830] ${
          docViewerOpen
            ? "items-start px-3 py-3"
            : "items-center px-5 py-4"
        }`}
      >
        <div>
          <div className="text-sm font-bold tracking-wider text-white">
            CITILINK INDONESIA
          </div>

          <div className="text-[10px] uppercase tracking-[0.18em] text-white/65">
            Engineering Evaluation Sheet
            {" · "}
            CT-3-18.1
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-white/75">
            EES No.
          </div>

          <div className="font-mono text-xs font-bold text-white">
            {value(
              "eesNumber",
              "—",
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-emerald-900/15 text-xs">
        {editableFields && (
          <div className="flex items-start gap-2 bg-amber-500/[0.06] px-5 py-3">
            <Edit3
              size={12}
              className="mt-0.5 shrink-0 text-amber-500"
            />

            <p className="text-[11px] text-muted-foreground">
              Manual editing is active.
              Changes to this Citilink
              EES are recorded in the
              audit log.
            </p>
          </div>
        )}

        {/* GENERAL */}
        <section
          className={`grid gap-4 px-4 py-4 ${
            docViewerOpen
              ? "grid-cols-2"
              : "grid-cols-1 md:grid-cols-4"
          }`}
        >
          <TextField
            label="EES No."
            field="eesNumber"
            value={value(
              "eesNumber",
            )}
            editable={
              editableFields
            }
            invalid={isInvalid(
              "EES No.",
            )}
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Issued Date"
            field="eesIssuedDate"
            value={value(
              "eesIssuedDate",
              strictManualInput
                ? ""
                : value(
                    "issueDate",
                    value(
                      "evaluationDate",
                    ),
                  ),
            )}
            editable={
              editableFields
            }
            date
            invalid={isInvalid(
              "EES Issued Date",
            )}
            onChange={
              onFieldChange
            }
          />

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-2"
            }
          >
            <CheckGroup
              label="Unit Concern"
              field="unitConcern"
              options={[
                ...CITILINK_UNIT_CONCERNS,
              ]}
              selected={
                unitConcern.length
                  ? unitConcern
                  : strictManualInput
                    ? []
                    : ["TEA-2"]
              }
              editable={
                editableFields
              }
              invalid={isInvalid(
                "Unit Concern",
              )}
              onChange={
                onFieldChange
              }
            />
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-4"
            }
          >
            <TextField
              label="Transfer To"
              field="transferTo"
              value={value(
                "transferTo",
              )}
              editable={
                editableFields
              }
              onChange={
                onFieldChange
              }
            />
          </div>
        </section>

        {/* BULLETIN */}
        <section
          className={`grid gap-4 px-4 py-4 ${
            docViewerOpen
              ? "grid-cols-2"
              : "grid-cols-1 md:grid-cols-4"
          }`}
        >
          <TextField
            label="Bulletin No."
            field="bulletinNumber"
            value={
              bulletinNumber
            }
            editable={
              editableFields
            }
            invalid={isInvalid(
              "Bulletin No.",
            )}
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Bull Type"
            field="bulletinType"
            value={value(
              "bulletinType",
              strictManualInput
                ? ""
                : "Service Bulletin",
            )}
            editable={
              editableFields
            }
            invalid={isInvalid(
              "Bull Type",
            )}
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="ATA"
            field="ata"
            value={value(
              "ata",
              ataValues.ata,
            )}
            editable={
              editableFields
            }
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Sub ATA"
            field="subAta"
            value={value(
              "subAta",
              ataValues.subAta,
            )}
            editable={
              editableFields
            }
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Manufacturer"
            field="manufacturer"
            value={value(
              "manufacturer",
              strictManualInput
                ? ""
                : getManufacturer(
                    engine,
                  ),
            )}
            editable={
              editableFields
            }
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Issued Date"
            field="bulletinIssuedDate"
            value={value(
              "bulletinIssuedDate",
              strictManualInput
                ? ""
                : value(
                    "issueDate",
                    value(
                      "evaluationDate",
                    ),
                  ),
            )}
            editable={
              editableFields
            }
            date
            onChange={
              onFieldChange
            }
          />

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-2"
            }
          >
            <TextField
              label="Subject"
              field="subject"
              value={
                strictManualInput
                  ? toText(
                      editableField(
                        "subject",
                      ),
                    )
                  : toText(
                      field(
                        "subject",
                        "title",
                      ),
                    )
              }
              editable={
                editableFields
              }
              invalid={isInvalid(
                "Subject",
              )}
              onChange={
                onFieldChange
              }
            />
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-4"
            }
          >
            <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
              Other Ref.
            </div>

            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix="citilink-other-reference"
                value={
                  references
                }
                itemLabel="Other Reference"
                addLabel="Add Reference"
                placeholder="Enter other reference"
                helpText="Enter one reference per field."
                onChange={entries =>
                  onFieldChange?.(
                    "otherReferences",
                    entries,
                  )
                }
                accent="emerald"
                compact={
                  compactFields
                }
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {references.map(
                  (
                    reference,
                    index,
                  ) => (
                    <span
                      key={`${reference}-${index}`}
                      className="rounded border border-emerald-800/20 bg-emerald-500/[0.035] px-2 py-1 text-[10px] font-mono text-foreground"
                    >
                      {reference}
                    </span>
                  ),
                )}

                {!references.length && (
                  <span className="text-[10px] text-muted-foreground">
                    —
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* AIRCRAFT / ENGINE */}
        <section
          className={`grid gap-4 px-4 py-4 ${
            docViewerOpen
              ? "grid-cols-2"
              : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          <TextField
            label="Aircraft Type"
            field="aircraftType"
            value={value(
              "aircraftType",
              strictManualInput
                ? ""
                : value(
                    "fleet",
                  ),
            )}
            editable={
              editableFields
            }
            invalid={isInvalid(
              "Aircraft Type",
            )}
            onChange={
              onFieldChange
            }
          />

          <TextField
            label="Engine/APU"
            field="engineApu"
            value={value(
              "engineApu",
              strictManualInput
                ? ""
                : engine,
            )}
            editable={
              editableFields
            }
            onChange={
              onFieldChange
            }
          />

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : ""
            }
          >
            <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
              Affected Model
            </div>

            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix="citilink-affected-model"
                value={
                  ees.affectedModels
                }
                fallbackValue={
                  strictManualInput
                    ? undefined
                    : ees.effectedModel ??
                      ees.effectivitySB ??
                      engine
                }
                itemLabel="Affected Model"
                addLabel="Add Model"
                placeholder="Enter affected model"
                helpText="One model per field; submitted to the backend as one string."
                onChange={entries =>
                  onFieldChange?.(
                    "affectedModels",
                    entries,
                  )
                }
                accent="emerald"
                compact={
                  compactFields
                }
              />
            ) : (
              <div className="min-h-5 text-xs font-medium text-foreground">
                {toList(
                  strictManualInput
                    ? ees.affectedModels
                    : ees.affectedModels ??
                      ees.effectedModel ??
                      ees.effectivitySB ??
                      engine,
                ).join(", ") ||
                  "—"}
              </div>
            )}
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : ""
            }
          >
            <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
              Part Number
            </div>

            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix="citilink-part-number"
                value={
                  ees.affectedPartNumbers
                }
                fallbackValue={
                  strictManualInput
                    ? undefined
                    : ees.partNumber
                }
                itemLabel="Part Number"
                addLabel="Add Part Number"
                placeholder="Enter part number"
                helpText="One part number per field; submitted to the backend as one string."
                onChange={entries =>
                  onFieldChange?.(
                    "affectedPartNumbers",
                    entries,
                  )
                }
                accent="emerald"
                compact={
                  compactFields
                }
              />
            ) : (
              <div className="min-h-5 text-xs font-medium text-foreground">
                {toList(
                  strictManualInput
                    ? ees.affectedPartNumbers
                    : ees.affectedPartNumbers ??
                      ees.partNumber,
                ).join(", ") ||
                  "—"}
              </div>
            )}
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : ""
            }
          >
            <div className="mb-1 text-[10px] font-semibold text-muted-foreground">
              Engine Serial Number
              (ESN)
            </div>

            {editableFields ? (
              <MultiValueFieldEditor
                idPrefix="citilink-esn"
                value={
                  ees.affectedESNs
                }
                fallbackValue={
                  strictManualInput
                    ? undefined
                    : ees.esn ??
                      ees.affectedEngines
                }
                itemLabel="Engine (ESN)"
                addLabel="Add Engine"
                placeholder="Enter ESN for engine"
                helpText="One ESN per field; submitted to the backend as one string."
                onChange={entries =>
                  onFieldChange?.(
                    "affectedESNs",
                    entries,
                  )
                }
                accent="emerald"
                compact={
                  compactFields
                }
              />
            ) : (
              <div className="min-h-5 text-xs font-medium text-foreground">
                {toList(
                  strictManualInput
                    ? ees.affectedESNs
                    : ees.affectedESNs ??
                      ees.esn ??
                      ees.affectedEngines,
                ).join(", ") ||
                  "—"}
              </div>
            )}
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-3"
            }
          >
            <CheckGroup
              label="Component Type"
              field="partClassification"
              options={[
                ...CITILINK_COMPONENT_TYPES,
              ]}
              selected={
                componentType
              }
              editable={
                editableFields
              }
              onChange={
                onFieldChange
              }
              single
            />
          </div>

          <div
            className={
              docViewerOpen
                ? "col-span-2"
                : "md:col-span-3"
            }
          >
            <TextField
              label="Note"
              field="note"
              value={note}
              editable={
                editableFields
              }
              multiline
              onChange={
                onFieldChange
              }
            />
          </div>
        </section>

        {/* REASON */}
        <section className="px-5 py-4">
          <CheckGroup
            label="Reason of Evaluation"
            field="reasonOfEvaluation"
            options={[
              ...CITILINK_REASON_OPTIONS,
            ]}
            selected={
              reasons
            }
            editable={
              editableFields
            }
            invalid={isInvalid(
              "Reason of Evaluation",
            )}
            onChange={
              onFieldChange
            }
          />
        </section>

        {/* MAINTENANCE + WARRANTY */}
        <section
          className={`grid grid-cols-1 gap-5 px-4 py-4 ${
            docViewerOpen
              ? ""
              : "lg:grid-cols-2"
          }`}
        >
          <div className="space-y-4">
            <CheckGroup
              label="Maintenance Level"
              field="maintenanceLevel"
              options={[
                ...CITILINK_MAINTENANCE_OPTIONS,
              ]}
              selected={
                maintenanceLevel
              }
              editable={
                editableFields
              }
              onChange={
                onFieldChange
              }
              single
            />

            <TextField
              label="Date"
              field="maintenanceDate"
              value={value(
                "maintenanceDate",
              )}
              editable={
                editableFields
              }
              date
              onChange={
                onFieldChange
              }
            />
          </div>

          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-x-10 gap-y-3 text-center">
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-center">
              <TextField
                label="Warranty"
                field="warranty"
                value={
                  warranty
                }
                editable={
                  editableFields
                }
                onChange={
                  onFieldChange
                }
              />

              <TextField
                label="Applicable"
                field="applicable"
                value={
                  applicable
                }
                editable={
                  editableFields
                }
                onChange={
                  onFieldChange
                }
              />

              <TextField
                label="Rep"
                field="rep"
                value={rep}
                editable={
                  editableFields
                }
                onChange={
                  onFieldChange
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-center">
              <TextField
                label="Type"
                field="warrantyType"
                value={value(
                  "warrantyType",
                )}
                editable={
                  editableFields
                }
                onChange={
                  onFieldChange
                }
              />

              <TextField
                label="Due"
                field="warrantyDue"
                value={value(
                  "warrantyDue",
                  strictManualInput
                    ? ""
                    : value(
                        "warrantyDueDate",
                        value(
                          "warranty_due_date",
                        ),
                      ),
                )}
                editable={
                  editableFields
                }
                onChange={
                  onFieldChange
                }
              />

              <TextField
                label="Note"
                field="warrantyNote"
                value={value(
                  "warrantyNote",
                  strictManualInput
                    ? ""
                    : value(
                        "warranty_note",
                      ),
                )}
                editable={
                  editableFields
                }
                multiline
                onChange={
                  onFieldChange
                }
              />
            </div>
          </div>
        </section>

        {/* CONSEQUENCE / METHOD */}
        <section
          className={`grid grid-cols-1 gap-5 px-4 py-4 ${
            docViewerOpen
              ? ""
              : "lg:grid-cols-3"
          }`}
        >
          <CheckGroup
            label="Consequence"
            field="consequence"
            options={[
              ...CITILINK_CONSEQUENCES,
            ]}
            selected={
              consequence
            }
            editable={false}
            single
          />

          <CheckGroup
            label="Accomplishment Method"
            field="accomplishmentMethod"
            options={[
              ...CITILINK_ACCOMPLISHMENT_METHODS,
            ]}
            selected={
              accomplishmentMethod
            }
            editable={
              editableFields
            }
            onChange={
              onFieldChange
            }
            single
          />

          <CheckGroup
            label="Inspection Type"
            field="inspectionType"
            options={[
              ...CITILINK_INSPECTION_TYPES,
            ]}
            selected={
              inspectionType
            }
            editable={
              editableFields
            }
            single
            onChange={(
              _,
              next,
            ) =>
              onFieldChange?.(
                "isRepetitive",
                next[0] ===
                  "Recurring",
              )
            }
          />
        </section>

        {/* EVALUATION RESULT */}
        <section className="px-5 py-4">
          <TextField
            label="Evaluation Result"
            field="evaluationResult"
            value={
              evaluationResult
            }
            editable={
              editableFields
            }
            multiline
            renderHtml
            invalid={isInvalid(
              "Evaluation Result",
            )}
            onChange={
              onFieldChange
            }
          />
        </section>

        {/* ENGINEERING */}
        <section
          className={`grid grid-cols-1 gap-5 px-4 py-4 ${
            docViewerOpen
              ? ""
              : "lg:grid-cols-2"
          }`}
        >
          <CheckGroup
            label="Engineering Action"
            field="engineeringAction"
            options={[
              ...CITILINK_ENGINEERING_ACTIONS,
            ]}
            selected={
              engineeringAction
            }
            editable={Boolean(
              editableFields ||
                engineeringActionEditable,
            )}
            invalid={isInvalid(
              "Engineering Action",
            )}
            onChange={
              onFieldChange
            }
            single
          />

          <CheckGroup
            label="Further Implementation"
            field="furtherImplementation"
            options={[
              ...CITILINK_FURTHER_IMPLEMENTATION,
            ]}
            selected={
              furtherImplementation
            }
            editable={Boolean(
              editableFields ||
                furtherImplementationEditable,
            )}
            invalid={isInvalid(
              "Further Implementation",
            )}
            onChange={
              onFieldChange
            }
          />
        </section>

        {/* APPROVAL */}
        <section className="px-5 py-4">
          <CheckGroup
            label="Management Approval"
            field="managementApproval"
            options={[
              ...CITILINK_MANAGEMENT_APPROVAL,
            ]}
            selected={
              managementApproval.length
                ? managementApproval
                : strictManualInput
                  ? []
                  : ["TEA"]
            }
            editable={
              editableFields
            }
            invalid={isInvalid(
              "Management Approval",
            )}
            onChange={
              onFieldChange
            }
          />
        </section>
      </div>
    </div>
  );
}