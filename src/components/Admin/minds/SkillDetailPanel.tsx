import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Eye,
  Code,
  BarChart3,
  FileText,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { ActionButton, StatusPill } from "../../ui/DesignSystem";
import {
  updateSkill,
  generateSkillNeuron,
  getSkill,
  getSkillNeuron,
  getSkillAnalytics,
  suggestSkillDefinition,
  type MindSkill,
  type MindSkillNeuron,
  type SkillAnalytics,
} from "../../../api/minds";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface SkillDetailPanelProps {
  mindId: string;
  mindName: string;
  mindSlug: string;
  skill: MindSkill;
  analytics: SkillAnalytics | null;
  hasPublishedVersion: boolean;
  onBack: () => void;
}

type DetailTab = "definition" | "schema" | "neuron" | "analytics";

const API_BASE =
  import.meta.env.VITE_API_URL || window.location.origin;

const POLL_INTERVAL = 3000;

function AnalyticsSection({
  mindId,
  skillId,
  initial,
}: {
  mindId: string;
  skillId: string;
  initial: SkillAnalytics | null;
}) {
  const [data, setData] = useState<SkillAnalytics | null>(initial);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (!initial) {
      (async () => {
        setLoading(true);
        const a = await getSkillAnalytics(mindId, skillId);
        setData(a);
        setLoading(false);
      })();
    }
  }, [mindId, skillId, initial]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Fill 7-day chart with zeros for missing days
  const chartData = (() => {
    const map = new Map(data.dailyCounts.map((d) => [d.date, d.count]));
    const days: { date: string; count: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ date: key, count: map.get(key) || 0, label: dayLabel });
    }
    return days;
  })();

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div>
      {/* Big numbers */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl bg-alloro-navy p-6 text-center">
          <p className="text-3xl font-bold text-white">{data.totalCalls}</p>
          <p className="text-xs text-gray-300 mt-1 font-medium uppercase tracking-wider">
            Total Work Points
          </p>
        </div>
        <div className="rounded-2xl bg-alloro-orange p-6 text-center">
          <p className="text-3xl font-bold text-white">{data.callsToday}</p>
          <p className="text-xs text-orange-100 mt-1 font-medium uppercase tracking-wider">
            Work Points Today
          </p>
        </div>
      </div>

      {/* 7-day chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          7-Day Trend
        </h4>
        <div className="flex items-end gap-2 h-32">
          {chartData.map((d) => (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] font-medium text-gray-500">
                {d.count > 0 ? d.count : ""}
              </span>
              <div
                className="w-full rounded-t-lg bg-alloro-orange/80 transition-all duration-300"
                style={{
                  height: `${Math.max((d.count / maxCount) * 100, 4)}%`,
                  minHeight: d.count > 0 ? "8px" : "4px",
                  opacity: d.count > 0 ? 1 : 0.2,
                }}
              />
              <span className="text-[10px] text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkillDetailPanel({
  mindId,
  mindName,
  mindSlug,
  skill,
  analytics,
  hasPublishedVersion,
  onBack,
}: SkillDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("definition");
  const [definition, setDefinition] = useState(skill.definition);
  const [schemaText, setSchemaText] = useState(
    skill.output_schema ? JSON.stringify(skill.output_schema, null, 2) : "",
  );
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(
    skill.status === "generating",
  );
  const [neuron, setNeuron] = useState<MindSkillNeuron | null>(null);
  const [neuronLoading, setNeuronLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [skillStatus, setSkillStatus] = useState(skill.status);

  // Magic wand state
  const [hint, setHint] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const endpoint = `${API_BASE}/api/minds/${mindSlug}/${skill.slug}`;

  const definitionEmpty = !definition.trim();

  // --- Polling for generation status ---
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (document.hidden) return;
      const fresh = await getSkill(mindId, skill.id);
      if (!fresh) return;

      if (fresh.status === "ready") {
        stopPolling();
        setGenerating(false);
        setSkillStatus("ready");
        // Fetch the neuron automatically
        const n = await getSkillNeuron(mindId, skill.id);
        setNeuron(n);
        toast.success("Neuron generated");
      } else if (fresh.status === "failed") {
        stopPolling();
        setGenerating(false);
        setSkillStatus("failed");
        toast.error("Neuron generation failed");
      }
      // If still "generating", keep polling
    }, POLL_INTERVAL);
  }, [mindId, skill.id, stopPolling]);

  // On mount: if skill was already generating, resume polling
  useEffect(() => {
    if (skill.status === "generating") {
      setGenerating(true);
      setSkillStatus("generating");
      startPolling();
    }
    return () => stopPolling();
  }, [skill.id]);

  // Fetch neuron when switching to neuron tab
  useEffect(() => {
    if (activeTab === "neuron" && !neuron && !generating) {
      fetchNeuron();
    }
  }, [activeTab]);

  const fetchNeuron = async () => {
    setNeuronLoading(true);
    const n = await getSkillNeuron(mindId, skill.id);
    setNeuron(n);
    setNeuronLoading(false);
  };

  const handleSave = async () => {
    // Validate schema if provided
    let parsedSchema: object | null = null;
    if (schemaText.trim()) {
      try {
        parsedSchema = JSON.parse(schemaText);
        setSchemaError(null);
      } catch {
        setSchemaError("Invalid JSON");
        toast.error("Output schema is not valid JSON");
        return;
      }
    }

    setSaving(true);
    const updated = await updateSkill(mindId, skill.id, {
      definition,
      outputSchema: parsedSchema,
    });
    if (updated) {
      toast.success("Skill saved");
    } else {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!hasPublishedVersion) {
      toast.error("Publish a brain version first");
      return;
    }
    if (definitionEmpty) {
      toast.error("Add a definition before generating a neuron");
      return;
    }

    // Save first so the backend has the latest definition
    let parsedSchema: object | null = null;
    if (schemaText.trim()) {
      try {
        parsedSchema = JSON.parse(schemaText);
      } catch {
        toast.error("Fix the output schema JSON before generating");
        return;
      }
    }
    await updateSkill(mindId, skill.id, {
      definition,
      outputSchema: parsedSchema,
    });

    setGenerating(true);
    setSkillStatus("generating");

    // Fire and forget — we poll for completion
    generateSkillNeuron(mindId, skill.id).then((n) => {
      if (n) {
        // If response came back directly (fast enough), handle it
        stopPolling();
        setNeuron(n);
        setSkillStatus("ready");
        setGenerating(false);
        toast.success("Neuron generated");
      }
    }).catch(() => {
      // Polling will catch the failure status
    });

    // Start polling as backup in case it takes long or page refreshes
    startPolling();
  };

  const handleSuggest = async () => {
    if (!hint.trim()) {
      toast.error("Type a few words about what this skill should do");
      return;
    }
    setSuggesting(true);
    const result = await suggestSkillDefinition(mindId, hint.trim());
    if (result) {
      setDefinition(result.definition);
      if (result.outputSchema) {
        setSchemaText(JSON.stringify(result.outputSchema, null, 2));
        setSchemaError(null);
      }
      setHint("");
      toast.success("Definition generated — review and save");
    } else {
      toast.error("Failed to generate suggestion");
    }
    setSuggesting(false);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ReactNode }> = [
    { id: "definition", label: "Definition", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "schema", label: "Output Schema", icon: <Code className="h-3.5 w-3.5" /> },
    { id: "neuron", label: "Neuron", icon: <Eye className="h-3.5 w-3.5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  const statusColor = (s: string): "orange" | "green" | "gray" | "red" => {
    switch (s) {
      case "ready": return "green";
      case "generating": return "orange";
      case "failed": return "red";
      default: return "gray";
    }
  };

  const canGenerate = hasPublishedVersion && !definitionEmpty && !generating;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alloro-navy text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {skill.name}
                </h3>
                <StatusPill
                  label={skillStatus}
                  color={statusColor(skillStatus)}
                />
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {skill.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ActionButton
              label={skillStatus === "ready" ? "Re-learn Skill" : "Generate Neuron"}
              icon={
                generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )
              }
              onClick={handleGenerate}
              variant="secondary"
              size="sm"
              disabled={!canGenerate}
              loading={generating}
            />
            <ActionButton
              label="Save"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSave}
              variant="primary"
              size="sm"
              loading={saving}
            />
          </div>
        </div>

        {/* Endpoint */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <code className="text-xs text-gray-500 truncate flex-1 font-mono">
            POST {endpoint}
          </code>
          <button
            onClick={handleCopyEndpoint}
            className="shrink-0 text-gray-400 hover:text-alloro-orange transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-5">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-alloro-orange border-alloro-orange"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Definition tab */}
        {activeTab === "definition" && (
          <div>
            {/* Magic wand AI suggestion */}
            <div className="mb-5 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Quick Start
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Describe the skill in a few words and let AI draft the definition
                and output schema for you.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder={`e.g. "validate page templates" or "score lead quality"`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSuggest();
                  }}
                  disabled={suggesting}
                />
                <ActionButton
                  label="Suggest"
                  icon={
                    suggesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )
                  }
                  onClick={handleSuggest}
                  variant="primary"
                  size="sm"
                  disabled={!hint.trim() || suggesting}
                  loading={suggesting}
                />
              </div>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Skill Definition
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Describe how this skill should transform {mindName}'s brain for a
              specific task. Be detailed about what to focus on, what to remove,
              and what guardrails to add.
            </p>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={12}
              placeholder={`e.g. You will be deployed as a quality checker for a website template page builder agent. You will receive pages in HTML and validate if they break, do not follow, or adhere to ${mindName}'s standards...`}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono leading-relaxed focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange resize-none"
            />
            {definitionEmpty && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                A definition is required before generating a neuron.
              </p>
            )}
          </div>
        )}

        {/* Schema tab */}
        {activeTab === "schema" && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Output Schema (JSON)
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Define the JSON schema the skill should conform to when responding.
              Leave empty for free-form responses.
            </p>
            {schemaError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {schemaError}
              </div>
            )}
            <Suspense
              fallback={
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              }
            >
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <MonacoEditor
                  height="350px"
                  language="json"
                  value={schemaText}
                  onChange={(val) => {
                    setSchemaText(val || "");
                    setSchemaError(null);
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    formatOnPaste: true,
                    tabSize: 2,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            </Suspense>
          </div>
        )}

        {/* Neuron tab */}
        {activeTab === "neuron" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Skill Neuron Preview
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  The transmuted brain specialized for this skill. Read-only.
                </p>
              </div>
              {neuron && !generating && (
                <span className="text-[10px] text-gray-400">
                  Generated{" "}
                  {new Date(neuron.generated_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Generating state — realtime monitor */}
            {generating ? (
              <div className="text-center py-12">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute h-16 w-16 rounded-full border-2 border-alloro-orange/20 animate-ping" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-alloro-orange/10">
                    <Loader2 className="h-7 w-7 animate-spin text-alloro-orange" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Transmuting knowledge...
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  {mindName} is distilling its brain into a focused variant for
                  this skill. This may take a minute.
                </p>
              </div>
            ) : neuronLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : !neuron ? (
              <div className="text-center py-12">
                <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">
                  No neuron generated yet
                </p>
                {definitionEmpty ? (
                  <p className="text-xs text-amber-600 mb-4">
                    Add a definition first, then generate.
                  </p>
                ) : !hasPublishedVersion ? (
                  <p className="text-xs text-amber-600 mb-4">
                    Publish a brain version first.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mb-4">
                    Generate a neuron to create a focused variant of the brain.
                  </p>
                )}
                <ActionButton
                  label="Generate Neuron"
                  icon={<Zap className="h-4 w-4" />}
                  onClick={handleGenerate}
                  variant="primary"
                  size="sm"
                  disabled={!canGenerate}
                  loading={generating}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm prose-gray max-w-none">
                  <ReactMarkdown>{neuron.neuron_markdown}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <AnalyticsSection
            mindId={mindId}
            skillId={skill.id}
            initial={analytics}
          />
        )}
      </div>
    </div>
  );
}
