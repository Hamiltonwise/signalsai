import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Crown,
  Globe,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useConfirm } from "../../ui/ConfirmModal";
import { ActionButton } from "../../ui/DesignSystem";
import {
  updateMind,
  updateBrain,
  listSources,
  createSource,
  deleteSource,
  toggleSource,
  listVersions,
  publishVersion,
  deleteMind,
  type MindWithVersion,
  type MindSource,
  type MindVersion,
} from "../../../api/minds";

interface MindSettingsTabProps {
  mind: MindWithVersion;
  onMindUpdated: () => void;
  onMindDeleted?: () => void;
}

export function MindSettingsTab({ mind, onMindUpdated, onMindDeleted }: MindSettingsTabProps) {
  const confirm = useConfirm();

  // Personality
  const [personality, setPersonality] = useState(mind.personality_prompt);
  const [savingPersonality, setSavingPersonality] = useState(false);

  // Brain
  const [brainMarkdown, setBrainMarkdown] = useState(
    mind.published_version?.brain_markdown || ""
  );
  const [savingBrain, setSavingBrain] = useState(false);

  // Sources
  const [sources, setSources] = useState<MindSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);

  // Versions
  const [versions, setVersions] = useState<MindVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Delete mind
  const [deletingMind, setDeletingMind] = useState(false);

  useEffect(() => {
    setPersonality(mind.personality_prompt);
    setBrainMarkdown(mind.published_version?.brain_markdown || "");
  }, [mind]);

  useEffect(() => {
    fetchSources();
    fetchVersions();
  }, [mind.id]);

  const fetchSources = async () => {
    setLoadingSources(true);
    const data = await listSources(mind.id);
    setSources(data);
    setLoadingSources(false);
  };

  const fetchVersions = async () => {
    setLoadingVersions(true);
    const data = await listVersions(mind.id);
    setVersions(data);
    setLoadingVersions(false);
  };

  const handleSavePersonality = async () => {
    setSavingPersonality(true);
    const result = await updateMind(mind.id, { personality_prompt: personality });
    if (result) {
      toast.success("Personality saved");
      onMindUpdated();
    } else {
      toast.error("Failed to save personality");
    }
    setSavingPersonality(false);
  };

  const handleSaveBrain = async () => {
    setSavingBrain(true);
    const result = await updateBrain(mind.id, brainMarkdown);
    if (result) {
      toast.success("Brain saved as new version");
      if (result.warning) {
        toast(result.warning, { icon: "⚠️" });
      }
      onMindUpdated();
      fetchVersions();
    } else {
      toast.error("Failed to save brain");
    }
    setSavingBrain(false);
  };

  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return;
    setAddingSource(true);
    const result = await createSource(
      mind.id,
      newSourceUrl.trim(),
      newSourceName.trim() || undefined
    );
    if (result) {
      toast.success("Source added");
      setNewSourceUrl("");
      setNewSourceName("");
      setShowAddSource(false);
      fetchSources();
    } else {
      toast.error("Failed to add source");
    }
    setAddingSource(false);
  };

  const handleDeleteSource = async (sourceId: string) => {
    const ok = await confirm({ title: "Delete this source?", confirmLabel: "Delete", variant: "danger" });
    if (!ok) return;
    const deleted = await deleteSource(mind.id, sourceId);
    if (deleted) {
      toast.success("Source deleted");
      fetchSources();
    } else {
      toast.error("Failed to delete source");
    }
  };

  const handleToggleSource = async (sourceId: string, currentlyActive: boolean) => {
    const ok = await toggleSource(mind.id, sourceId, !currentlyActive);
    if (ok) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, is_active: !currentlyActive } : s
        )
      );
    } else {
      toast.error("Failed to toggle source");
    }
  };

  const handlePublish = async (versionId: string) => {
    setPublishingId(versionId);
    const ok = await publishVersion(mind.id, versionId);
    if (ok) {
      toast.success("Version published");
      onMindUpdated();
      fetchVersions();
    } else {
      toast.error("Failed to publish version");
    }
    setPublishingId(null);
  };

  const handleDeleteMind = async () => {
    const ok = await confirm({
      title: `Permanently delete ${mind.name}?`,
      message: "All data (brain, conversations, sessions, sources) will be lost. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setDeletingMind(true);
    try {
      const deleted = await deleteMind(mind.id);
      if (deleted) {
        toast.success(`${mind.name} deleted`);
        onMindDeleted?.();
      } else {
        toast.error("Failed to delete mind");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete mind");
    } finally {
      setDeletingMind(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personality Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Personality Prompt
        </h3>
        <textarea
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange resize-none"
        />
        <div className="mt-3 flex justify-end">
          <ActionButton
            label="Save Personality"
            icon={<Save className="h-4 w-4" />}
            onClick={handleSavePersonality}
            variant="primary"
            size="sm"
            loading={savingPersonality}
            disabled={personality === mind.personality_prompt}
          />
        </div>
      </section>

      {/* Brain Editor Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Brain (Markdown Knowledge Base)
          </h3>
          <div className="flex items-center gap-2">
            {mind.published_version && (
              <span className="text-xs text-gray-400">
                v{mind.published_version.version_number}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {brainMarkdown.length.toLocaleString()} chars
            </span>
          </div>
        </div>
        <textarea
          value={brainMarkdown}
          onChange={(e) => setBrainMarkdown(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono leading-relaxed focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange resize-y"
          placeholder="# Mind Knowledge Base&#10;&#10;Write markdown content here..."
        />
        <div className="mt-3 flex justify-end">
          <ActionButton
            label="Save Brain (New Version)"
            icon={<BookOpen className="h-4 w-4" />}
            onClick={handleSaveBrain}
            variant="primary"
            size="sm"
            loading={savingBrain}
          />
        </div>
      </section>

      {/* Sources Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Sources</h3>
          <ActionButton
            label="Add Source"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddSource(true)}
            variant="secondary"
            size="sm"
          />
        </div>

        {showAddSource && (
          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600">New Source</span>
              <button
                onClick={() => setShowAddSource(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://example.com/blog"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange"
              />
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange"
              />
              <div className="flex justify-end">
                <ActionButton
                  label="Add"
                  onClick={handleAddSource}
                  variant="primary"
                  size="sm"
                  disabled={!newSourceUrl.trim()}
                  loading={addingSource}
                />
              </div>
            </div>
          </div>
        )}

        {loadingSources ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : sources.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No sources added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="text-sm text-gray-800 truncate">
                      {source.name || source.url}
                    </span>
                    {!source.is_active && (
                      <span className="text-[10px] font-medium text-gray-400 uppercase">
                        inactive
                      </span>
                    )}
                  </div>
                  {source.name && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 ml-5.5">
                      {source.url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => handleToggleSource(source.id, source.is_active)}
                    className="text-gray-400 hover:text-gray-600"
                    title={source.is_active ? "Deactivate" : "Activate"}
                  >
                    {source.is_active ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Versions Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Versions</h3>

        {loadingVersions ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No versions yet. Save the brain to create the first version.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => {
              const isPublished = version.id === mind.published_version_id;
              return (
                <div
                  key={version.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    isPublished
                      ? "border-alloro-orange/20 bg-alloro-orange/5"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">
                      v{version.version_number}
                    </span>
                    {isPublished && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-alloro-orange">
                        <Crown className="h-3 w-3" />
                        Published
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {version.brain_markdown.length.toLocaleString()} chars
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {!isPublished && (
                    <ActionButton
                      label="Publish"
                      onClick={() => handlePublish(version.id)}
                      variant="secondary"
                      size="sm"
                      loading={publishingId === version.id}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-[#6a6a75] mb-4">
          Permanently delete {mind.name} and all associated data. This action cannot be undone.
        </p>
        <ActionButton
          label={`Delete ${mind.name}`}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={handleDeleteMind}
          variant="danger"
          size="sm"
          loading={deletingMind}
        />
      </section>
    </div>
  );
}
