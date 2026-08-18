"use client";

import {
  BarChart3,
  CheckCircle2,
  ClipboardPlus,
  FileSpreadsheet,
  FileText,
  Plus,
  Upload,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SecondEngineerReviewPage } from "@/features/second-engineer-review";

type OperatorScope = "ALL" | "GARUDA" | "CITILINK";
type ManagerTab = "approval" | "assignments" | "excel" | "matrix";

type ReviewAssignment = {
  id: string;
  operator: Exclude<OperatorScope, "ALL">;
  sbNumber: string;
  title: string;
  engineer: string;
  dueDate: string;
  source: "Manual" | "Excel";
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
};

type ExcelAssignmentRow = Omit<ReviewAssignment, "id" | "source" | "status"> & {
  selected: boolean;
};

const initialAssignments: ReviewAssignment[] = [
  {
    id: "MGR-ASG-001",
    operator: "GARUDA",
    sbNumber: "GE90 SB 72-0686 R01",
    title: "Fan Hub Frame Assembly — Routine Inspection",
    engineer: "Rizky Pratama",
    dueDate: "2026-08-14",
    source: "Manual",
    status: "IN_PROGRESS",
  },
  {
    id: "MGR-ASG-002",
    operator: "CITILINK",
    sbNumber: "LEAP-1B-72-00-0217-01A-930A-D",
    title: "Simplification of Engine Core Compartment Cooling System",
    engineer: "Nadia Putri",
    dueDate: "2026-08-13",
    source: "Excel",
    status: "ASSIGNED",
  },
  {
    id: "MGR-ASG-003",
    operator: "GARUDA",
    sbNumber: "SB 72-0846 R02",
    title: "HPC Stator Stage 5 Vane Sector Pin Condition",
    engineer: "Fajar Maulana",
    dueDate: "2026-08-11",
    source: "Excel",
    status: "COMPLETED",
  },
];

const excelRows: ExcelAssignmentRow[] = [
  {
    operator: "GARUDA",
    sbNumber: "GE90 SB 72-0685 R06",
    title: "TGB Roller Bearing Inner Race Material Change",
    engineer: "Rizky Pratama",
    dueDate: "2026-08-16",
    selected: true,
  },
  {
    operator: "CITILINK",
    sbNumber: "LEAP-1A-72-00-0449",
    title: "Introduction of New LPTACC Cooling Manifold",
    engineer: "Nadia Putri",
    dueDate: "2026-08-15",
    selected: true,
  },
  {
    operator: "GARUDA",
    sbNumber: "GE90 SB 72-0680",
    title: "Fan Hub Frame Assembly",
    engineer: "Fajar Maulana",
    dueDate: "2026-08-18",
    selected: false,
  },
];

const matrixRows = [
  { engineer: "Rizky Pratama", operator: "GARUDA", assigned: 8, inReview: 3, completed: 5, onTime: 92 },
  { engineer: "Nadia Putri", operator: "CITILINK", assigned: 7, inReview: 2, completed: 4, onTime: 96 },
  { engineer: "Fajar Maulana", operator: "GARUDA", assigned: 6, inReview: 1, completed: 5, onTime: 100 },
  { engineer: "Dimas Saputra", operator: "CITILINK", assigned: 5, inReview: 3, completed: 2, onTime: 80 },
];

function operatorLabel(operator: OperatorScope) {
  if (operator === "GARUDA") return "Garuda Indonesia";
  if (operator === "CITILINK") return "Citilink Indonesia";
  return "All operators";
}

function statusClass(status: ReviewAssignment["status"]) {
  if (status === "COMPLETED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
  if (status === "IN_PROGRESS") return "border-blue-500/30 bg-blue-500/10 text-blue-700";
  return "border-amber-500/30 bg-amber-500/10 text-amber-700";
}

function operatorClass(operator: OperatorScope) {
  return operator === "GARUDA"
    ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
}

export function ManagerWorkspacePage({ initialEesId }: { initialEesId?: string }) {
  const [tab, setTab] = useState<ManagerTab>("approval");
  const [scope, setScope] = useState<OperatorScope>("ALL");
  const [assignments, setAssignments] = useState(initialAssignments);
  const [rows, setRows] = useState(excelRows);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [excelRead, setExcelRead] = useState(false);
  const [manualOperator, setManualOperator] = useState<Exclude<OperatorScope, "ALL">>("GARUDA");
  const [manualEngineer, setManualEngineer] = useState("Rizky Pratama");
  const [manualSb, setManualSb] = useState("GE90 SB 72-0686 R01");
  const [manualDueDate, setManualDueDate] = useState("2026-08-18");
  const [rangeStart, setRangeStart] = useState("2026-08-01");
  const [rangeEnd, setRangeEnd] = useState("2026-08-31");

  const scopedAssignments = useMemo(
    () => assignments.filter((item) => scope === "ALL" || item.operator === scope),
    [assignments, scope],
  );
  const scopedMatrix = useMemo(
    () => matrixRows.filter((item) => scope === "ALL" || item.operator === scope),
    [scope],
  );
  const selectedExcelRows = rows.filter((row) => row.selected);

  const addManualAssignment = () => {
    if (!manualSb.trim() || !manualEngineer.trim() || !manualDueDate) {
      toast.error("Lengkapi SB, engineer, dan due date sebelum membuat penugasan.");
      return;
    }

    setAssignments((current) => [
      {
        id: `MGR-ASG-${String(current.length + 1).padStart(3, "0")}`,
        operator: manualOperator,
        sbNumber: manualSb.trim(),
        title: "Manual manager review assignment",
        engineer: manualEngineer,
        dueDate: manualDueDate,
        source: "Manual",
        status: "ASSIGNED",
      },
      ...current,
    ]);
    toast.success(`Dummy assignment created for ${manualEngineer}.`);
  };

  const readExcelFile = (file: File | undefined) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setExcelRead(true);
    toast.success("Excel assignment preview prepared (dummy mode).");
  };

  const assignExcelRows = () => {
    if (!selectedExcelRows.length) {
      toast.error("Select at least one spreadsheet row.");
      return;
    }
    const existingKeys = new Set(assignments.map((item) => `${item.operator}:${item.sbNumber}:${item.engineer}`));
    const newAssignments = selectedExcelRows
      .filter((row) => !existingKeys.has(`${row.operator}:${row.sbNumber}:${row.engineer}`))
      .map((row, index): ReviewAssignment => ({
        id: `MGR-XLS-${Date.now()}-${index}`,
        operator: row.operator,
        sbNumber: row.sbNumber,
        title: row.title,
        engineer: row.engineer,
        dueDate: row.dueDate,
        source: "Excel",
        status: "ASSIGNED",
      }));
    setAssignments((current) => [...newAssignments, ...current]);
    toast.success(`${newAssignments.length} dummy assignment(s) created from Excel.`);
  };

  const tabs: Array<{ id: ManagerTab; label: string; icon: typeof CheckCircle2 }> = [
    { id: "approval", label: "EES Approval", icon: CheckCircle2 },
    { id: "assignments", label: "SB Assignments", icon: ClipboardPlus },
    { id: "excel", label: "Excel Assignment", icon: FileSpreadsheet },
    { id: "matrix", label: "Review Matrix", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-[1560px] p-6">
      <header className="mb-5 rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound size={22} className="text-blue-700" />
              <h1 className="text-xl font-bold text-foreground">Manager Workspace</h1>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-700">Dual operator</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              One manager portfolio across Garuda Indonesia and Citilink Indonesia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "GARUDA", "CITILINK"] as const).map((operator) => (
              <button
                key={operator}
                type="button"
                onClick={() => setScope(operator)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${scope === operator
                  ? operator === "CITILINK" ? "border-emerald-600 bg-emerald-600 text-white" : "border-blue-700 bg-blue-700 text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
              >
                {operatorLabel(operator)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Garuda portfolio</p>
            <p className="mt-1 text-lg font-bold text-foreground">{assignments.filter((item) => item.operator === "GARUDA").length} SB reviews</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Citilink portfolio</p>
            <p className="mt-1 text-lg font-bold text-foreground">{assignments.filter((item) => item.operator === "CITILINK").length} SB reviews</p>
          </div>
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">Demo modules</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Assignment, Excel, and matrix use local dummy data.</p>
          </div>
        </div>
      </header>

      <nav className="mb-5 flex overflow-x-auto rounded-xl border border-border bg-card p-1.5">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${active
                ? "bg-blue-700 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon size={14} /> {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "approval" && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Approval queue</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Real approval data and decisions remain connected to the existing approval workflow.</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Live approval workflow</span>
          </div>
          <SecondEngineerReviewPage reviewerTarget="MANAGER" initialEesId={initialEesId} />
        </div>
      )}

      {tab === "assignments" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">SB review assignments</h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Dummy manager assignments for {operatorLabel(scope)}.</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{scopedAssignments.length} assignments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-muted/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Service bulletin</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Engineer</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scopedAssignments.map((item) => (
                    <tr key={item.id} className="text-xs">
                      <td className="px-5 py-3.5"><p className="font-semibold text-foreground">{item.sbNumber}</p><p className="mt-1 max-w-md text-[10px] text-muted-foreground">{item.title}</p></td>
                      <td className="px-4 py-3.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${operatorClass(item.operator)}`}>{item.operator === "GARUDA" ? "Garuda" : "Citilink"}</span></td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">{item.engineer}<p className="mt-1 text-[9px] font-normal text-muted-foreground">{item.source} assignment</p></td>
                      <td className="px-4 py-3.5 text-muted-foreground">{item.dueDate}</td>
                      <td className="px-5 py-3.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${statusClass(item.status)}`}>{item.status.replace("_", " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Plus size={15} className="text-blue-700" /><h2 className="text-sm font-bold text-foreground">Assign engineer</h2></div>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Dummy assignment only. No backend record is created.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-[10px] font-semibold text-muted-foreground">Operator
                <select value={manualOperator} onChange={(event) => setManualOperator(event.target.value as Exclude<OperatorScope, "ALL">)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-blue-500"><option value="GARUDA">Garuda Indonesia</option><option value="CITILINK">Citilink Indonesia</option></select>
              </label>
              <label className="block text-[10px] font-semibold text-muted-foreground">Service Bulletin<input value={manualSb} onChange={(event) => setManualSb(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-blue-500" /></label>
              <label className="block text-[10px] font-semibold text-muted-foreground">Engineer<select value={manualEngineer} onChange={(event) => setManualEngineer(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-blue-500"><option>Rizky Pratama</option><option>Nadia Putri</option><option>Fajar Maulana</option><option>Dimas Saputra</option></select></label>
              <label className="block text-[10px] font-semibold text-muted-foreground">Due date<input type="date" value={manualDueDate} onChange={(event) => setManualDueDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-blue-500" /></label>
              <button type="button" onClick={addManualAssignment} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"><ClipboardPlus size={13} /> Create dummy assignment</button>
            </div>
          </aside>
        </div>
      )}

      {tab === "excel" && (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><FileSpreadsheet size={17} className="text-emerald-700" /><h2 className="text-sm font-bold text-foreground">Read assignment Excel</h2></div>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Dummy reader. It previews a representative assignment sheet and does not upload a file to backend.</p>
            <label className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] px-4 py-7 text-center hover:bg-emerald-500/[0.08]">
              <Upload size={20} className="text-emerald-700" />
              <span className="mt-2 text-xs font-semibold text-foreground">Choose .xlsx file</span>
              <span className="mt-1 text-[10px] text-muted-foreground">The selected filename is retained locally.</span>
              <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="sr-only" onChange={(event) => readExcelFile(event.target.files?.[0])} />
            </label>
            {uploadedFileName && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[10px] text-foreground"><span className="font-semibold">Selected:</span> {uploadedFileName}</p>}
            <button type="button" onClick={() => { setExcelRead(true); toast.success("Dummy Excel rows loaded."); }} className="mt-3 w-full rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted">Load dummy workbook</button>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-sm font-bold text-foreground">Spreadsheet assignment preview</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Select rows, validate operator ownership, then create dummy assignments.</p></div><button type="button" disabled={!excelRead} onClick={assignExcelRows} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Assign selected ({selectedExcelRows.length})</button></div>
            {excelRead ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-muted/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-5 py-3">Use</th><th className="px-4 py-3">SB</th><th className="px-4 py-3">Operator</th><th className="px-4 py-3">Engineer</th><th className="px-5 py-3">Due</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row, index) => <tr key={`${row.sbNumber}-${row.engineer}`} className="text-xs"><td className="px-5 py-3"><input type="checkbox" checked={row.selected} onChange={() => setRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: !item.selected } : item))} className="h-4 w-4 accent-emerald-600" /></td><td className="px-4 py-3"><p className="font-semibold text-foreground">{row.sbNumber}</p><p className="mt-1 max-w-sm text-[10px] text-muted-foreground">{row.title}</p></td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${operatorClass(row.operator)}`}>{row.operator === "GARUDA" ? "Garuda" : "Citilink"}</span></td><td className="px-4 py-3 font-semibold text-foreground">{row.engineer}</td><td className="px-5 py-3 text-muted-foreground">{row.dueDate}</td></tr>)}</tbody></table></div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><FileText size={26} className="text-muted-foreground" /><p className="mt-3 text-sm font-semibold text-foreground">No workbook selected</p><p className="mt-1 text-xs text-muted-foreground">Select an Excel file or load the dummy workbook to review its rows.</p></div>}
          </section>
        </div>
      )}

      {tab === "matrix" && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-4"><div><div className="flex items-center gap-2"><BarChart3 size={16} className="text-violet-700" /><h2 className="text-sm font-bold text-foreground">SB review employee matrix</h2></div><p className="mt-1 text-[10px] text-muted-foreground">Dummy performance matrix for {operatorLabel(scope)}. The date range is ready for backend integration.</p></div><div className="flex flex-wrap gap-2"><label className="text-[10px] font-semibold text-muted-foreground">From<input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" /></label><label className="text-[10px] font-semibold text-muted-foreground">To<input type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" /></label></div></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Assigned" value={scopedMatrix.reduce((sum, item) => sum + item.assigned, 0)} color="blue" /><Metric label="In review" value={scopedMatrix.reduce((sum, item) => sum + item.inReview, 0)} color="amber" /><Metric label="Completed" value={scopedMatrix.reduce((sum, item) => sum + item.completed, 0)} color="emerald" /><Metric label="Avg. on-time" value={`${Math.round(scopedMatrix.reduce((sum, item) => sum + item.onTime, 0) / Math.max(scopedMatrix.length, 1))}%`} color="violet" /></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-muted/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-5 py-3">Engineer</th><th className="px-4 py-3">Operator</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">In review</th><th className="px-4 py-3">Completed</th><th className="px-5 py-3">On-time</th></tr></thead><tbody className="divide-y divide-border">{scopedMatrix.map((item) => <tr key={item.engineer} className="text-xs"><td className="px-5 py-3.5 font-semibold text-foreground">{item.engineer}</td><td className="px-4 py-3.5"><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${operatorClass(item.operator as OperatorScope)}`}>{item.operator === "GARUDA" ? "Garuda" : "Citilink"}</span></td><td className="px-4 py-3.5 text-foreground">{item.assigned}</td><td className="px-4 py-3.5 text-blue-700">{item.inReview}</td><td className="px-4 py-3.5 text-emerald-700">{item.completed}</td><td className="px-5 py-3.5"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-600" style={{ width: `${item.onTime}%` }} /></div><span className="font-semibold text-foreground">{item.onTime}%</span></div></td></tr>)}</tbody></table></div>
          <p className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground">Selected range: {rangeStart} to {rangeEnd}. Metrics are dummy data until the manager-review reporting endpoint is available.</p>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string | number; color: "blue" | "amber" | "emerald" | "violet" }) {
  const classes = {
    blue: "border-blue-500/20 bg-blue-500/[0.05] text-blue-700",
    amber: "border-amber-500/20 bg-amber-500/[0.05] text-amber-700",
    emerald: "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-700",
    violet: "border-violet-500/20 bg-violet-500/[0.05] text-violet-700",
  };
  return <div className={`rounded-xl border p-3 ${classes[color]}`}><p className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</p><p className="mt-1 text-xl font-bold text-foreground">{value}</p></div>;
}
