import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  Loader2,
  FileCode,
  Save,
  Eye,
  Zap,
  Trash2,
  Clock,
  Settings,
  Code,
  Monitor,
  Smartphone,
  Search,
  Globe,
} from "lucide-react";
import {
  fetchTemplate,
  updateTemplate,
  deleteTemplate,
  activateTemplate,
} from "../../api/templates";
import type { Template } from "../../api/templates";
import {
  AdminPageHeader,
  ActionButton,
  Badge,
  TabBar,
} from "../../components/ui/DesignSystem";

/**
 * Template Detail Page
 * Editor + Settings tabs for managing a single template
 */
export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");

  // Editor state
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Preview state
  const [previewContent, setPreviewContent] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "seo">("desktop");
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Settings state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const loadTemplate = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetchTemplate(id);
      setTemplate(response.data);
      setEditorContent(response.data.html_template || "");
      setPreviewContent(response.data.html_template || "");
      setNameValue(response.data.name);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to fetch template:", err);
      setError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Cmd/Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges, saving, editorContent]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || "";
    setEditorContent(newContent);
    setHasUnsavedChanges(true);

    // Debounce preview update
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
    }
    previewDebounceRef.current = setTimeout(() => {
      setPreviewContent(newContent);
    }, 500);
  };

  // Wrap preview HTML with custom alloro-orange scrollbar styles
  const previewWithScrollbar = (html: string) => {
    const scrollbarStyle = `<style>::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#f3f4f6;border-radius:4px}::-webkit-scrollbar-thumb{background:#d66853;border-radius:4px}::-webkit-scrollbar-thumb:hover{background:#c05a47}</style>`;
    // Inject before </head> if present, otherwise prepend
    if (html.includes("</head>")) {
      return html.replace("</head>", `${scrollbarStyle}</head>`);
    }
    return scrollbarStyle + html;
  };

  // Extract page title from HTML <title> tag
  const extractTitle = (html: string): string => {
    const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
    return match ? match[1].trim() : "";
  };

  // Extract meta description from HTML
  const extractMetaDescription = (html: string): string => {
    const match = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["'][^>]*>/is)
      || html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["'][^>]*>/is);
    return match ? match[1].trim() : "";
  };

  // Extract OG/canonical URL from HTML
  const extractUrl = (html: string): string => {
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["'][^>]*>/is);
    if (canonical) return canonical[1].trim();
    const ogUrl = html.match(/<meta\s+property=["']og:url["']\s+content=["'](.*?)["'][^>]*>/is);
    if (ogUrl) return ogUrl[1].trim();
    return "https://example.com";
  };

  // Extract favicon URL from HTML
  const extractFavicon = (html: string): string => {
    const match = html.match(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["'](.*?)["'][^>]*>/is)
      || html.match(/<link\s+[^>]*href=["'](.*?)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/is);
    return match ? match[1].trim() : "";
  };

  const pageTitle = extractTitle(previewContent);
  const pageDescription = extractMetaDescription(previewContent);
  const pageUrl = extractUrl(previewContent);
  const pageFavicon = extractFavicon(previewContent);

  const handleSave = async () => {
    if (!id || saving) return;

    try {
      setSaving(true);
      setSaveMessage(null);
      const response = await updateTemplate(id, {
        html_template: editorContent,
      });
      setTemplate(response.data);
      setHasUnsavedChanges(false);
      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Failed to save"
      );
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(editorContent);
      win.document.close();
    }
  };

  const handlePublishToggle = async () => {
    if (!id || !template || publishing) return;

    const newStatus = template.status === "published" ? "draft" : "published";
    try {
      setPublishing(true);
      const response = await updateTemplate(id, { status: newStatus });
      setTemplate(response.data);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update template status"
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleActivate = async () => {
    if (!id || activating) return;

    try {
      setActivating(true);
      const response = await activateTemplate(id);
      setTemplate(response.data);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to activate template"
      );
    } finally {
      setActivating(false);
    }
  };

  const handleSaveName = async () => {
    if (!id || savingName || !nameValue.trim()) return;

    try {
      setSavingName(true);
      const response = await updateTemplate(id, { name: nameValue.trim() });
      setTemplate(response.data);
      setEditingName(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename template");
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !template || deleting) return;
    if (deleteConfirmName !== template.name) return;

    try {
      setDeleting(true);
      await deleteTemplate(id);
      navigate("/admin/templates");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center py-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading template...
        </div>
      </motion.div>
    );
  }

  if (error || !template) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-gray-700">
          {error || "Template not found"}
        </p>
        <ActionButton
          label="Back to Templates"
          onClick={() => navigate("/admin/templates")}
          variant="secondary"
        />
      </motion.div>
    );
  }

  const tabs = [
    { id: "editor", label: "Editor", icon: <Code className="w-4 h-4" /> },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        icon={<FileCode className="w-6 h-6" />}
        title={template.name}
        description="Edit template HTML and manage settings"
        backButton={{
          label: "Back to Templates",
          onClick: () => navigate("/admin/templates"),
        }}
        actionButtons={
          <div className="flex items-center gap-2">
            {template.is_active && (
              <Badge label="Active" color="orange" />
            )}
            <Badge
              label={template.status === "published" ? "Published" : "Draft"}
              color={template.status === "published" ? "green" : "gray"}
            />

            {activeTab === "editor" && (
              <>
                {/* Save message */}
                <AnimatePresence>
                  {saveMessage && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`text-sm font-medium ${
                        saveMessage === "Saved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {saveMessage}
                    </motion.span>
                  )}
                </AnimatePresence>

                <ActionButton
                  label={saving ? "Saving..." : "Save"}
                  icon={
                    saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="relative">
                        <Save className="w-4 h-4" />
                        {hasUnsavedChanges && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-alloro-orange rounded-full" />
                        )}
                      </div>
                    )
                  }
                  onClick={handleSave}
                  variant="primary"
                  disabled={saving || !hasUnsavedChanges}
                />
                <ActionButton
                  label="Preview"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={handlePreview}
                  variant="secondary"
                />
              </>
            )}
          </div>
        }
      />

      {/* Tab Bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Editor Tab */}
      {activeTab === "editor" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4"
          style={{ height: "calc(100vh - 320px)" }}
        >
          {/* Monaco Editor */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col" style={{ minHeight: 650 }}>
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                HTML Editor
              </span>
              <span className="text-xs text-gray-400">
                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={editorContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  padding: { top: 12 },
                }}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col" style={{ minHeight: 650 }}>
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live Preview
              </span>
              <div className="flex items-center gap-2">
                {/* Desktop / Mobile / SEO toggle */}
                <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                      previewMode === "desktop"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="Desktop view"
                  >
                    <Monitor className="h-3 w-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                      previewMode === "mobile"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="Mobile view"
                  >
                    <Smartphone className="h-3 w-3" />
                    <span>Mobile</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode("seo")}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                      previewMode === "seo"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="SEO preview"
                  >
                    <Search className="h-3 w-3" />
                    <span>SEO</span>
                  </button>
                </div>
                <button
                  onClick={handlePreview}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300"
                >
                  <Eye className="h-3 w-3" />
                  Full Preview
                </button>
              </div>
            </div>
            <div
              className={`flex-1 overflow-hidden relative ${
                previewMode !== "desktop" ? "flex justify-center bg-gray-100" : ""
              }`}
              style={previewMode === "seo" ? { overflowY: "auto" } : undefined}
            >
              {previewMode === "desktop" ? (
                /* Desktop: Monitor frame with browser chrome */
                <div className="absolute inset-0 flex items-start justify-center p-4 overflow-hidden">
                  <div className="w-full h-full flex flex-col">
                    {/* Monitor bezel top */}
                    <div className="bg-gray-700 rounded-t-xl px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                      {/* Window controls */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      {/* Tab */}
                      <div className="flex items-center gap-1.5 bg-gray-600 rounded-md px-2.5 py-1 max-w-[200px]">
                        {pageFavicon && (
                          <img src={pageFavicon} alt="" className="w-3 h-3 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <span className="text-[10px] text-gray-200 truncate">
                          {pageTitle || "Untitled"}
                        </span>
                      </div>
                    </div>
                    {/* Address bar */}
                    <div className="bg-gray-600 px-3 py-1 flex items-center gap-2 flex-shrink-0">
                      <div className="flex-1 bg-gray-500 rounded-md px-2 py-0.5 flex items-center gap-1.5">
                        <Globe className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                        <span className="text-[10px] text-gray-300 truncate">
                          {pageUrl}
                        </span>
                      </div>
                    </div>
                    {/* Viewport */}
                    <div className="flex-1 relative overflow-hidden bg-white border-x-2 border-gray-700">
                      <iframe
                        srcDoc={previewWithScrollbar(previewContent)}
                        className="border-0 absolute top-0 left-0"
                        style={{
                          width: `${100 / 0.45}%`,
                          height: `${100 / 0.45}%`,
                          transform: "scale(0.45)",
                          transformOrigin: "top left",
                        }}
                        sandbox="allow-scripts allow-same-origin"
                        title="Template Preview"
                      />
                    </div>
                    {/* Monitor stand */}
                    <div className="bg-gray-700 rounded-b-xl h-2 flex-shrink-0" />
                  </div>
                </div>
              ) : previewMode === "mobile" ? (
                /* Mobile: Phone frame with browser chrome */
                <div className="flex items-start justify-center py-4">
                  <div className="flex flex-col" style={{ width: 380 }}>
                    {/* Phone notch / status bar */}
                    <div className="bg-gray-800 rounded-t-[2rem] pt-2 px-6 flex-shrink-0">
                      <div className="flex items-center justify-between text-[9px] text-gray-400 px-1 pb-1">
                        <span>9:41</span>
                        <div className="w-20 h-5 bg-gray-900 rounded-full mx-auto" />
                        <div className="flex items-center gap-1">
                          <span>5G</span>
                          <div className="w-4 h-2 border border-gray-400 rounded-sm">
                            <div className="w-2.5 h-full bg-gray-400 rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Browser chrome */}
                    <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                      <div className="flex-1 bg-gray-700 rounded-full px-3 py-1 flex items-center gap-1.5">
                        <Globe className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] text-gray-300 truncate">
                          {pageTitle || pageUrl}
                        </span>
                      </div>
                    </div>
                    {/* Viewport */}
                    <div className="bg-white border-x-4 border-gray-800 h-full overflow-hidden" style={{ height: 560 }}>
                      <iframe
                        srcDoc={previewWithScrollbar(previewContent)}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        title="Template Preview (Mobile)"
                      />
                    </div>
                    {/* Phone bottom bar */}
                    <div className="bg-gray-800 rounded-b-[2rem] px-6 py-2 flex items-center justify-center flex-shrink-0">
                      <div className="w-28 h-1 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                /* SEO: Google Search Result Preview */
                <div className="flex flex-col items-center py-6 px-4 w-full">
                  <div className="w-full max-w-2xl space-y-6">
                    {/* Google-style header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                      <Search className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        Google Search Preview
                      </span>
                    </div>

                    {/* Desktop search result */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Desktop Result
                      </p>
                      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1.5">
                        {/* URL breadcrumb */}
                        <div className="flex items-center gap-2">
                          {pageFavicon ? (
                            <img src={pageFavicon} alt="" className="w-7 h-7 rounded-full border border-gray-100 p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <Globe className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-800">
                              {(() => {
                                try { return new URL(pageUrl).hostname; } catch { return "example.com"; }
                              })()}
                            </span>
                            <span className="text-xs text-gray-500 truncate max-w-md">
                              {pageUrl}
                            </span>
                          </div>
                        </div>
                        {/* Title */}
                        <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                          {pageTitle || (
                            <span className="text-gray-300 italic">No &lt;title&gt; tag found</span>
                          )}
                        </h3>
                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {pageDescription || (
                            <span className="text-gray-300 italic">
                              No meta description found. Add a &lt;meta name="description" content="..."&gt; tag to your template.
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Character counts */}
                      <div className="flex gap-4 px-1">
                        <span className={`text-[10px] font-medium ${
                          pageTitle.length === 0 ? "text-red-400" :
                          pageTitle.length > 60 ? "text-amber-500" : "text-green-500"
                        }`}>
                          Title: {pageTitle.length}/60 chars
                          {pageTitle.length === 0 && " — Missing!"}
                          {pageTitle.length > 60 && " — May be truncated"}
                        </span>
                        <span className={`text-[10px] font-medium ${
                          pageDescription.length === 0 ? "text-red-400" :
                          pageDescription.length > 160 ? "text-amber-500" : "text-green-500"
                        }`}>
                          Description: {pageDescription.length}/160 chars
                          {pageDescription.length === 0 && " — Missing!"}
                          {pageDescription.length > 160 && " — May be truncated"}
                        </span>
                      </div>
                    </div>

                    {/* Mobile search result */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Mobile Result
                      </p>
                      <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-sm space-y-1.5">
                        <div className="flex items-center gap-2">
                          {pageFavicon ? (
                            <img src={pageFavicon} alt="" className="w-6 h-6 rounded-full border border-gray-100 p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <Globe className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-800 truncate">
                              {(() => {
                                try { return new URL(pageUrl).hostname; } catch { return "example.com"; }
                              })()}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate">
                              {pageUrl}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-base text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
                          {pageTitle || (
                            <span className="text-gray-300 italic text-sm">No title</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {pageDescription || (
                            <span className="text-gray-300 italic">No description</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* SEO Tips */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        SEO Checklist
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            ok: pageTitle.length > 0 && pageTitle.length <= 60,
                            warn: pageTitle.length > 60,
                            label: "Page title",
                            detail: pageTitle.length === 0
                              ? "Missing — add a <title> tag"
                              : pageTitle.length > 60
                              ? `${pageTitle.length} chars — recommended max is 60`
                              : `${pageTitle.length} chars — good length`,
                          },
                          {
                            ok: pageDescription.length > 0 && pageDescription.length <= 160,
                            warn: pageDescription.length > 160,
                            label: "Meta description",
                            detail: pageDescription.length === 0
                              ? 'Missing — add <meta name="description" content="...">'
                              : pageDescription.length > 160
                              ? `${pageDescription.length} chars — recommended max is 160`
                              : `${pageDescription.length} chars — good length`,
                          },
                          {
                            ok: pageUrl !== "https://example.com",
                            warn: false,
                            label: "Canonical URL",
                            detail: pageUrl === "https://example.com"
                              ? 'Not set — add <link rel="canonical" href="...">'
                              : pageUrl,
                          },
                          {
                            ok: pageFavicon.length > 0,
                            warn: false,
                            label: "Favicon",
                            detail: pageFavicon.length === 0
                              ? 'Missing — add <link rel="icon" href="...">'
                              : "Found",
                          },
                        ].map((item) => (
                          <div key={item.label} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              item.ok ? "bg-green-100" : item.warn ? "bg-amber-100" : "bg-red-100"
                            }`}>
                              <span className={`text-[10px] font-bold ${
                                item.ok ? "text-green-600" : item.warn ? "text-amber-600" : "text-red-500"
                              }`}>
                                {item.ok ? "✓" : item.warn ? "!" : "✕"}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                              <p className="text-[11px] text-gray-500">{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-2xl"
        >
          {/* Template Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Template Information
            </h3>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Name
              </label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameValue(template.name);
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-alloro-orange focus:outline-none focus:ring-2 focus:ring-alloro-orange/20"
                    autoFocus
                  />
                  <ActionButton
                    label={savingName ? "Saving..." : "Save"}
                    onClick={handleSaveName}
                    variant="primary"
                    size="sm"
                    disabled={savingName || !nameValue.trim()}
                  />
                  <ActionButton
                    label="Cancel"
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(template.name);
                    }}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-medium">
                    {template.name}
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-alloro-orange hover:text-alloro-orange/80 font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    template.status === "published"
                      ? "border-green-200 bg-green-100 text-green-700"
                      : "border-gray-200 bg-gray-100 text-gray-700"
                  }`}
                >
                  {template.status === "published" ? "Published" : "Draft"}
                </span>
                {template.is_active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-alloro-orange">
                    <Zap className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Created
                </label>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(template.created_at)}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Last Updated
                </label>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(template.updated_at)}
                </div>
              </div>
            </div>

            {/* Template ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Template ID
              </label>
              <p className="text-xs text-gray-400 font-mono">{template.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Actions
            </h3>

            <div className="flex flex-wrap gap-3">
              {/* Publish/Unpublish */}
              <ActionButton
                label={
                  publishing
                    ? "Updating..."
                    : template.status === "published"
                    ? "Unpublish"
                    : "Publish"
                }
                onClick={handlePublishToggle}
                variant={
                  template.status === "published" ? "secondary" : "primary"
                }
                disabled={publishing}
                loading={publishing}
              />

              {/* Activate */}
              {!template.is_active && (
                <ActionButton
                  label={activating ? "Activating..." : "Set as Active"}
                  icon={<Zap className="w-4 h-4" />}
                  onClick={handleActivate}
                  variant="secondary"
                  disabled={activating}
                  loading={activating}
                />
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 space-y-4">
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide">
              Danger Zone
            </h3>
            <p className="text-sm text-red-600">
              Permanently delete this template. This action cannot be undone.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                  Type "{template.name}" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={template.name}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>

              <motion.button
                onClick={handleDelete}
                disabled={
                  deleting || deleteConfirmName !== template.name
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{
                  scale:
                    deleteConfirmName === template.name && !deleting
                      ? 1.02
                      : 1,
                }}
                whileTap={{
                  scale:
                    deleteConfirmName === template.name && !deleting
                      ? 0.98
                      : 1,
                }}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Template
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
