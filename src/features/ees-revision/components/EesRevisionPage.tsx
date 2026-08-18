"use client";

import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSmoothNavigation } from "@/components/orbit/SmoothNavigationProvider";
import { EESTemplatePreview } from "@/features/ees-generator/components/EESTemplatePreview";
import {
  getApprovalCandidates,
  resubmitEesForApproval,
  type ApprovalCandidate,
} from "@/features/ees-generator/services/approval-service";
import { createValidatedEesPayload } from "@/features/ees-generator/services/ees-payload";
import {
  getEesApprovalState,
  getServiceBulletin,
  getServiceBulletinEes,
  getServiceBulletinPdfUrl,
  updateServiceBulletinEes,
  type EesApprovalState,
  type ServiceBulletinEesDocument,
  type ServiceBulletinEesEvaluation,
  type ServiceBulletinViewModel,
} from "@/features/service-bulletins";
import { formatDateTime } from "@/lib/date-time";

type RevisionEvaluation = ServiceBulletinEesEvaluation & {
  references: string[];
  adRelated: string | null;
  affectedAcEngine: string | null;
};

type RevisionForm = {
  eesNumber: string;
  complianceCategory: string;
  manufacturer: string;
  aircraftType: string;
  effectedType: string;
  affectedModels: string[];
  affectedPartNumbers: string[];
  affectedESNs: string[];
  componentType: string;
  complianceTimeType: string;
  repetitive: "" | "true" | "false";
  taskType: string;
  references: string[];
  note: string;
  evaluationResult: string;
  evaluations: RevisionEvaluation[];
};

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none transition-colors focus:border-blue-600";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

function toList(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\r\n]+/)
      : [];
  return values.map(item => String(item).trim()).filter(Boolean);
}

function blankEvaluation(index: number): RevisionEvaluation {
  return {
    id: `revision-evaluation-${Date.now()}-${index}`,
    eesDocumentId: "",
    itemNo: String(index + 1),
    paragraph: null,
    requirementDesc: "",
    remarks: null,
    taskType: null,
    references: [],
    adRelated: null,
    affectedAcEngine: null,
    warranty: null,
    rep: null,
    dueAt: null,
    isApplicable: true,
  };
}

function createForm(
  document: ServiceBulletinEesDocument,
  bulletin: ServiceBulletinViewModel,
): RevisionForm {
  const evaluations = document.evaluations?.length
    ? document.evaluations.map((item, index) => ({
        ...item,
        itemNo: item.itemNo || String(index + 1),
        references: toList(item.references),
        adRelated: item.adRelated ?? null,
        affectedAcEngine: item.affectedAcEngine ?? null,
      }))
    : [blankEvaluation(0)];

  return {
    eesNumber: document.eesNumber || "",
    complianceCategory: String(bulletin.complianceCategory ?? ""),
    manufacturer: bulletin.manufacturer || "",
    aircraftType: document.aircraftType || bulletin.aircraftType || "",
    effectedType: document.effectedType || bulletin.effectivityType || "",
    affectedModels: toList(document.effectedModel || bulletin.effectivityRange),
    affectedPartNumbers: toList(document.partNumber || bulletin.affectedPartNumbers),
    affectedESNs: toList(document.esn || bulletin.affectedESNs),
    componentType: document.componentType || "",
    complianceTimeType: document.complianceTimeType || "",
    repetitive: typeof document.isRepetitive === "boolean"
      ? document.isRepetitive ? "true" : "false"
      : "",
    taskType: document.taskType || bulletin.taskType || "",
    references: toList(document.references || bulletin.references),
    note: document.note || "",
    evaluationResult: evaluations
      .map(item => item.remarks)
      .filter((value): value is string => Boolean(value?.trim()))
      .join("\n\n"),
    evaluations,
  };
}

function apiMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const payload = error.response?.data as {
    message?: string;
    error?: string;
    details?: string;
  } | undefined;
  return payload?.details || payload?.message || payload?.error || fallback;
}

export function EesRevisionPage({
  eesId,
  sourceSbId,
}: {
  eesId: string;
  sourceSbId: string;
}) {
  const router = useSmoothNavigation();
  const [document, setDocument] = useState<ServiceBulletinEesDocument | null>(null);
  const [bulletin, setBulletin] = useState<ServiceBulletinViewModel | null>(null);
  const [approval, setApproval] = useState<EesApprovalState | null>(null);
  const [form, setForm] = useState<RevisionForm | null>(null);
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, unknown>>({});
  const [candidates, setCandidates] = useState<ApprovalCandidate[]>([]);
  const [assignedToId, setAssignedToId] = useState("");
  const [signature, setSignature] = useState<File | undefined>();
  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!sourceSbId) {
        setError("Source Service Bulletin ID tidak tersedia pada URL revisi.");
        setLoading(false);
        return;
      }
      try {
        const [eesResult, sbResult] = await Promise.all([
          getServiceBulletinEes(sourceSbId, controller.signal),
          getServiceBulletin(sourceSbId, controller.signal),
        ]);
        if (eesResult.status !== "available") {
          setError("Dokumen EES tidak ditemukan.");
          return;
        }
        const approvalResult = await getEesApprovalState(
          eesResult.data.id,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        const status = (approvalResult.status || eesResult.data.reviewStatus || "").toUpperCase();
        const explicitlyDenied = eesResult.data.permissions?.canResubmit === false;
        if (explicitlyDenied || !["REJECTED", "RETURNED"].includes(status)) {
          setError("EES ini tidak berada pada status yang dapat direvisi atau dikirim ulang.");
          return;
        }
        setDocument(eesResult.data);
        setBulletin(sbResult);
        setApproval(approvalResult);
        setForm(createForm(eesResult.data, sbResult));
        const rawDocument = eesResult.data as ServiceBulletinEesDocument & {
          citilinkOptions?: unknown;
        };
        setTemplateOverrides(
          rawDocument.citilinkOptions
            ? { citilinkOptions: rawDocument.citilinkOptions }
            : {},
        );
      } catch (caught) {
        if (!axios.isCancel(caught)) {
          setError(apiMessage(caught, "Data revisi EES tidak dapat dimuat."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [eesId, sourceSbId]);

  const template = useMemo(() => {
    const operatorCode = document?.serviceBulletin?.operator?.code?.toUpperCase();
    if (operatorCode === "QG" || operatorCode === "CITILINK") return "citilink" as const;
    if (operatorCode === "GA" || operatorCode === "GARUDA") return "garuda" as const;
    if (String(document?.eesTemplate || bulletin?.eesTemplate).toLowerCase() === "citilink") {
      return "citilink" as const;
    }
    return /A320|ATR/i.test(form?.aircraftType || "") ? "citilink" as const : "garuda" as const;
  }, [bulletin?.eesTemplate, document, form?.aircraftType]);
  const reviewerRole = template === "citilink"
    ? "MANAGER" as const
    : Number(form?.complianceCategory || 0) <= 3
      ? "MANAGER" as const
      : "ENGINEER" as const;
  const candidateScope = form
    ? `${template}:${reviewerRole}:${form.complianceCategory}`
    : "";

  useEffect(() => {
    if (!candidateScope) return;
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return [];
        setCandidateLoading(true);
        setAssignedToId("");
        return getApprovalCandidates(
          template === "citilink" ? "CITILINK" : "GARUDA",
          reviewerRole,
          controller.signal,
        );
      })
      .then(result => {
        if (!controller.signal.aborted) setCandidates(result);
      })
      .catch(caught => {
        if (!axios.isCancel(caught)) {
          toast.error(apiMessage(caught, "Daftar reviewer tidak dapat dimuat."));
          setCandidates([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCandidateLoading(false);
      });
    return () => controller.abort();
  }, [candidateScope, reviewerRole, template]);

  const revisionInstructions = useMemo(
    () => (approval?.history || [])
      .filter(action => ["REJECTED", "RETURNED"].includes(action.action.toUpperCase()))
      .slice()
      .reverse(),
    [approval?.history],
  );

  const previewEes = useMemo<Record<string, unknown>>(() => {
    if (!form || !document || !bulletin) return {};
    const firstEvaluation = form.evaluations[0];
    return {
      airline: template === "citilink" ? "Citilink Indonesia" : "Garuda Indonesia",
      eesTemplate: template,
      eesNumber: form.eesNumber,
      bulletinNumber: bulletin.bulletinNumber,
      bulletinRevision: bulletin.revision || "",
      subject: bulletin.title,
      description: bulletin.title,
      manufacturer: form.manufacturer,
      issueDate: bulletin.publicationDate || "",
      evaluationDate: document.createdAt,
      fleet: form.aircraftType,
      aircraftType: form.aircraftType,
      engineType: form.effectedType,
      engine: form.effectedType,
      effectivitySB: form.effectedType,
      affectedModels: form.affectedModels,
      affectedPartNumbers: form.affectedPartNumbers,
      affectedESNs: form.affectedESNs,
      componentType: form.componentType,
      complianceTimeType: form.complianceTimeType,
      repetitive: form.repetitive === "" ? undefined : form.repetitive === "true",
      taskType: form.taskType,
      references: form.references,
      referencesRaw: form.references.join(", "),
      otherReferences: form.references,
      note: form.note,
      remarks: firstEvaluation?.remarks || "",
      evaluationResult: form.evaluationResult || firstEvaluation?.remarks || "",
      evaluations: form.evaluations,
      warranty: templateOverrides.warranty
        ?? (firstEvaluation?.warranty === null
          ? "N/A"
          : firstEvaluation?.warranty ? "Y" : "N"),
      applicable: templateOverrides.applicable
        ?? (form.evaluations.every(item => item.isApplicable) ? "Yes" : "No"),
      rep: templateOverrides.rep ?? firstEvaluation?.rep ?? "",
      dueAt: templateOverrides.dueAt ?? firstEvaluation?.dueAt ?? "",
      eesCategory: `Category ${form.complianceCategory}`,
      geCategory: `Category ${form.complianceCategory}`,
      selectedSB: {
        backendId: sourceSbId,
        id: bulletin.bulletinNumber,
        title: bulletin.title,
        manufacturer: form.manufacturer,
        complianceCategory: Number(form.complianceCategory),
        fleet: form.aircraftType,
        compliance: bulletin.compliancePeriod,
      },
      generatedEesDocument: document,
      ...templateOverrides,
    };
  }, [bulletin, document, form, sourceSbId, template, templateOverrides]);

  function setFormValue<K extends keyof RevisionForm>(key: K, value: RevisionForm[K]) {
    setForm(previous => previous ? { ...previous, [key]: value } : previous);
  }

  function setEvaluation<K extends keyof RevisionEvaluation>(
    index: number,
    key: K,
    value: RevisionEvaluation[K],
  ) {
    setForm(previous => {
      if (!previous) return previous;
      const evaluations = previous.evaluations.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [key]: value } : item
      ));
      return { ...previous, evaluations };
    });
  }

  function handleTemplateFieldChange(field: string, value: string | string[] | boolean) {
    if (field === "isRepetitive" && typeof value === "boolean") {
      setFormValue("repetitive", value ? "true" : "false");
      setTemplateOverrides(previous => ({
        ...previous,
        isRepetitive: value,
        repetitive: value,
      }));
      return;
    }
    if (field === "affectedModels" && Array.isArray(value)) {
      setFormValue("affectedModels", value);
      return;
    }
    if (field === "affectedPartNumbers" && Array.isArray(value)) {
      setFormValue("affectedPartNumbers", value);
      return;
    }
    if (field === "affectedESNs" && Array.isArray(value)) {
      setFormValue("affectedESNs", value);
      return;
    }
    if (field === "otherReferences" && Array.isArray(value)) {
      setFormValue("references", value);
      return;
    }
    if (field === "evaluations.add") {
      setForm(previous => previous
        ? { ...previous, evaluations: [...previous.evaluations, blankEvaluation(previous.evaluations.length)] }
        : previous);
      return;
    }

    const removeMatch = /^evaluations\.(\d+)\.remove$/.exec(field);
    if (removeMatch) {
      const index = Number(removeMatch[1]);
      setForm(previous => {
        if (!previous || previous.evaluations.length <= 1) return previous;
        return {
          ...previous,
          evaluations: previous.evaluations
            .filter((_, itemIndex) => itemIndex !== index)
            .map((item, itemIndex) => ({ ...item, itemNo: String(itemIndex + 1) })),
        };
      });
      return;
    }

    const evaluationMatch = /^evaluations\.(\d+)\.(paragraph|requirementDesc|remarks)$/.exec(field);
    if (evaluationMatch && typeof value === "string") {
      const key = evaluationMatch[2] as "paragraph" | "requirementDesc" | "remarks";
      setEvaluation(
        Number(evaluationMatch[1]),
        key,
        key === "requirementDesc" ? value : value || null,
      );
      return;
    }

    if (typeof value !== "string") return;
    if (field === "eesNumber") setFormValue("eesNumber", value);
    if (field === "references") setFormValue("references", toList(value));
    if (field === "aircraftType" || field === "fleet") setFormValue("aircraftType", value);
    if (["engineApu", "engineType", "effectivitySB"].includes(field)) setFormValue("effectedType", value);
    if (field === "componentType") setFormValue("componentType", value);
    if (field === "complianceTimeType") setFormValue("complianceTimeType", value);
    if (field === "taskType") setFormValue("taskType", value);
    if (field === "note") setFormValue("note", value);
    if (field === "evaluationResult") setFormValue("evaluationResult", value);
    setTemplateOverrides(previous => ({ ...previous, [field]: value }));
  }

  function payload() {
    if (!form || !bulletin) throw new Error("Form revisi belum siap.");
    return createValidatedEesPayload(previewEes);
  }

  async function saveRevision(showToast = true) {
    if (!sourceSbId || !form) return null;
    if (!form.complianceCategory || !form.eesNumber.trim()) {
      toast.error("EES Number dan Compliance Category wajib diisi.");
      return null;
    }
    setSaving(true);
    try {
      await updateServiceBulletinEes(sourceSbId, payload());
      const latest = await getServiceBulletinEes(sourceSbId);
      if (latest.status === "available") setDocument(latest.data);
      if (showToast) toast.success("Perubahan EES berhasil disimpan ke backend.");
      return latest.status === "available" ? latest.data : document;
    } catch (caught) {
      toast.error(apiMessage(caught, "Revisi EES gagal disimpan."));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function resubmit() {
    if (submitting || !form) return;
    if (!assignedToId) {
      toast.error(`Pilih ${reviewerRole === "MANAGER" ? "Manager" : "Second Engineer"} tujuan.`);
      return;
    }
    if (template === "garuda" && !signature) {
      toast.error("Signature maker wajib diunggah untuk EES Garuda.");
      return;
    }
    setSubmitting(true);
    try {
      const latest = await saveRevision(false);
      if (!latest) return;
      await resubmitEesForApproval({
        eesId: latest.id,
        assignedToId,
        signature,
      });
      toast.success("Revisi berhasil dikirim ulang untuk approval.");
      router.push(`/ees/${encodeURIComponent(latest.id)}?sourceSbId=${encodeURIComponent(sourceSbId)}`);
    } catch (caught) {
      toast.error(apiMessage(caught, "Revisi gagal dikirim ulang untuk approval."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-blue-700" size={30} /></div>;
  }

  if (error || !form || !document || !bulletin) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto text-red-700" />
          <h1 className="mt-3 text-base font-bold text-red-950">Revision page tidak dapat dibuka</h1>
          <p className="mt-2 text-sm text-red-800">{error || "Data revisi tidak lengkap."}</p>
          <button type="button" onClick={() => router.back()} className="mt-5 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white">Kembali</button>
        </div>
      </div>
    );
  }

  const busy = saving || submitting;
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/25 p-3 sm:p-4">
      <header className="shrink-0 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex min-w-0 flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <button type="button" onClick={() => router.back()} className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Kembali ke detail EES">
              <ArrowLeft size={15} />
            </button>
            <FileText className="mt-1 shrink-0 text-blue-700" size={19} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-foreground">Revise EES</h1>
                <span className="rounded-full bg-red-700 px-2 py-0.5 text-[9px] font-bold text-white">
                  {(approval?.status || document.reviewStatus || "RETURNED").replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-900">
                  Template {template === "citilink" ? "Citilink" : "Garuda"}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground">{document.eesNumber}</p>
              <p className="truncate text-[10px] text-muted-foreground" title={`${bulletin.bulletinNumber} · ${bulletin.title}`}>{bulletin.bulletinNumber} · {bulletin.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPdfViewerOpen(current => !current)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
          >
            {pdfViewerOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            {pdfViewerOpen ? "Minimize SB PDF" : "Show SB PDF"}
          </button>
        </div>

        <div className="mt-2 flex min-w-0 items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-800" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 text-[9px] font-semibold text-amber-800">
              <span>Revision instruction</span>
              {revisionInstructions[0] && (
                <>
                  <span>· {revisionInstructions[0].actorName || "Reviewer"}{revisionInstructions[0].actorRole ? ` (${revisionInstructions[0].actorRole})` : ""}</span>
                  <time>· {formatDateTime(revisionInstructions[0].createdAt)}</time>
                </>
              )}
              {revisionInstructions.length > 1 && <span>· {revisionInstructions.length} comments</span>}
            </div>
            <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-[10px] leading-4 text-amber-950" title={revisionInstructions[0]?.comment || ""}>
              {revisionInstructions[0]?.comment || "Catatan reviewer tidak tersedia. Periksa seluruh data sebelum mengirim ulang."}
            </p>
          </div>
        </div>
      </header>

      <div className={`mt-3 grid min-h-0 flex-1 gap-3 ${pdfViewerOpen ? "xl:grid-cols-[minmax(0,1.12fr)_minmax(390px,0.88fr)]" : "grid-cols-1"}`}>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <h2 className="text-xs font-bold text-foreground">EES revision form</h2>
              <p className="text-[9px] text-muted-foreground">Only this form area scrolls. Field structure follows the selected EES template.</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <EESTemplatePreview
              ees={previewEes}
              editableFields
              remarksEditable
              remarksValue={form.note}
              onRemarksChange={value => setFormValue("note", value)}
              onFieldChange={handleTemplateFieldChange}
              docViewerOpen={pdfViewerOpen}
              allowRelationEditing={false}
              esnEditable
              compactFields
            />
          </div>
        </section>

        {pdfViewerOpen && (
          <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground"><BookOpen size={14} className="text-blue-700" /> Source SB PDF</div>
              <div className="flex items-center gap-1">
                <a href={getServiceBulletinPdfUrl(sourceSbId, "view")} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-blue-700 hover:bg-blue-50"><ExternalLink size={11} /> New tab</a>
                <button type="button" onClick={() => setPdfViewerOpen(false)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><PanelRightClose size={11} /> Minimize</button>
              </div>
            </div>
            <iframe src={getServiceBulletinPdfUrl(sourceSbId, "view")} title={`Service Bulletin ${bulletin.bulletinNumber}`} className="min-h-0 w-full flex-1 bg-white" />
          </aside>
        )}
      </div>

      <footer className="mt-3 shrink-0 rounded-xl border border-blue-300 bg-card px-4 py-3 shadow-lg">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <label className={`${labelClass} min-w-0 flex-1`}>Forward EES To
            <select value={assignedToId} disabled={candidateLoading} onChange={event => setAssignedToId(event.target.value)} className={`${inputClass} mt-1 py-2 font-normal normal-case tracking-normal`}>
              <option value="">{candidateLoading ? "Loading reviewers..." : `Select ${reviewerRole === "MANAGER" ? "Manager" : "Second Engineer"}`}</option>
              {candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.unit} · {candidate.employeeNumber}</option>)}
            </select>
          </label>
          <div className="min-w-0 flex-1">
            <div className={labelClass}>Maker Signature {template === "garuda" && <span className="text-red-700">*</span>}</div>
            <label className="mt-1 flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-400 bg-blue-50 px-3 text-[10px] font-semibold text-blue-800 hover:bg-blue-100">
              <Upload size={13} className="shrink-0" /> <span className="truncate">{signature?.name || "Upload PNG or JPG signature (max. 5 MB)"}</span>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={event => setSignature(event.target.files?.[0])} />
            </label>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <button type="button" onClick={() => void saveRevision()} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 text-[10px] font-bold text-blue-800 disabled:opacity-50">{saving && !submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Revision</button>
            <button type="button" onClick={() => void resubmit()} disabled={busy || candidateLoading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-4 text-[10px] font-bold text-white disabled:opacity-50">{submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {submitting ? "Submitting..." : "Save & Resubmit"}</button>
          </div>
        </div>
        {!busy && <p className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-muted-foreground"><CheckCircle2 size={10} /> Revision uses PATCH, then resubmits through the approval workflow.</p>}
      </footer>
    </div>
  );
}
