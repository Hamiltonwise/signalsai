import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  X,
  Bot,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  AdminPageHeader,
  ActionButton,
  EmptyState,
} from "../../components/ui/DesignSystem";
import { listMinds, createMind, type Mind } from "../../api/minds";

export default function MindsList() {
  const navigate = useNavigate();
  const [minds, setMinds] = useState<Mind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPersonality, setCreatePersonality] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchMinds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMinds();
      setMinds(data);
    } catch {
      setError("Failed to load minds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinds();
  }, []);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const mind = await createMind(
        createName.trim(),
        createPersonality.trim(),
      );
      if (mind) {
        toast.success(`Mind "${mind.name}" created`);
        setShowCreate(false);
        setCreateName("");
        setCreatePersonality("");
        navigate(`/admin/minds/${mind.id}`);
      } else {
        toast.error("Failed to create mind");
      }
    } catch {
      toast.error("Failed to create mind");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        icon={<Brain className="h-6 w-6" />}
        title="Minds"
        description="AI chatbot profiles with versioned knowledge bases"
        actionButtons={
          <ActionButton
            label="Create Mind"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
            variant="primary"
          />
        }
      />

      {/* Create modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Create New Mind
            </h3>
            <button
              onClick={() => setShowCreate(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. CROSEO"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Personality Prompt
              </label>
              <textarea
                value={createPersonality}
                onChange={(e) => setCreatePersonality(e.target.value)}
                placeholder="Describe this mind's personality and role..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <ActionButton
                label="Cancel"
                onClick={() => setShowCreate(false)}
                variant="ghost"
              />
              <ActionButton
                label="Create"
                onClick={handleCreate}
                variant="primary"
                disabled={!createName.trim()}
                loading={creating}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchMinds}
            className="mt-3 text-sm text-alloro-orange hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && minds.length === 0 && (
        <EmptyState
          icon={<Brain className="h-8 w-8" />}
          title="No minds yet"
          description="Create your first AI mind to get started."
        />
      )}

      {/* Cards grid */}
      {!loading && !error && minds.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {minds.map((mind, i) => (
            <motion.div
              key={mind.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/admin/minds/${mind.id}`)}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-alloro-orange/30 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-alloro-orange text-white">
                  <Bot className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mind.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {mind.personality_prompt || "No personality set"}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {mind.published_version_id ? "Published" : "Draft"}
                  </span>
                </div>
                <span>
                  Created {new Date(mind.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
