import { useState, useEffect } from "react";
import { Globe, ExternalLink, AlertCircle, Sparkles, FileText, ChevronDown, Link as LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiGet, apiPost, apiDelete } from "../api";
import ConnectDomainModal from "../components/Admin/ConnectDomainModal";

interface Page {
  id: string;
  path: string;
  status: string;
  sections: Array<{ name: string; content: string }>;
  updated_at: string;
}

interface Project {
  id: string;
  hostname: string;
  status: string;
  is_read_only: boolean;
  custom_domain: string | null;
  domain_verified_at: string | null;
  wrapper: string;
  header: string;
  footer: string;
}

interface Usage {
  storage_used: number;
  storage_limit: number;
  storage_percentage: number;
  edits_today: number;
  edits_limit: number;
}

export function DFYWebsite() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"PREPARING" | "READY" | "READ_ONLY" | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [editing, setEditing] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  useEffect(() => {
    fetchWebsite();
  }, []);

  useEffect(() => {
    if (selectedPage && project) {
      renderPage();
    }
  }, [selectedPage, project]);

  const fetchWebsite = async () => {
    try {
      const data = await apiGet({ path: "/user/website" });

      if (data.status === "PREPARING") {
        setStatus("PREPARING");
      } else if (data.project) {
        setProject(data.project);
        setPages(data.pages || []);
        setUsage(data.usage);

        if (data.project.is_read_only) {
          setStatus("READ_ONLY");
        } else {
          setStatus("READY");
        }

        if (data.pages?.length > 0) {
          setSelectedPage(data.pages[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to load website");
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    if (!selectedPage || !project) return;

    const sectionsHtml = selectedPage.sections
      .map((s) => s.content)
      .join("\n");

    const pageContent = [project.header, sectionsHtml, project.footer]
      .filter(Boolean)
      .join("\n");

    const html = project.wrapper.replace("{{slot}}", pageContent);
    setPreviewHtml(html);
  };

  const handleComponentClick = (className: string) => {
    setSelectedComponent(className);
    setChatHistory([]);
  };

  const handleEdit = async () => {
    if (!selectedComponent || !instruction.trim() || !selectedPage) return;

    setEditing(true);

    try {
      // Extract component HTML from iframe
      const iframe = document.querySelector("iframe");
      const iframeDoc = iframe?.contentDocument;
      const element = iframeDoc?.querySelector(`.${selectedComponent}`);
      const currentHtml = element?.outerHTML;

      if (!currentHtml) {
        toast.error("Component not found");
        return;
      }

      const data = await apiPost({
        path: `/user/website/pages/${selectedPage.id}/edit`,
        passedData: {
          alloroClass: selectedComponent,
          currentHtml,
          instruction,
          chatHistory,
        },
      });

      // Update chat history
      setChatHistory([
        ...chatHistory,
        { role: "user", content: instruction },
        { role: "assistant", content: data.message },
      ]);

      setInstruction("");
      toast.success("Page updated!");

      // Refresh website data
      await fetchWebsite();
    } catch (error) {
      toast.error("Network error");
    } finally {
      setEditing(false);
    }
  };

  // Setup iframe click handlers
  useEffect(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe || !previewHtml) return;

    const setupClickHandlers = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const allComponents = iframeDoc.querySelectorAll("[class*='alloro-tpl']");
      allComponents.forEach((el) => {
        const classList = Array.from(el.classList);
        const alloroClass = classList.find((c) => c.startsWith("alloro-tpl"));

        if (alloroClass) {
          (el as HTMLElement).style.cursor = "pointer";
          (el as HTMLElement).onclick = (e) => {
            e.preventDefault();
            handleComponentClick(alloroClass);
          };
        }
      });
    };

    iframe.onload = setupClickHandlers;
  }, [previewHtml]);

  if (loading) {
    return (
      <div className="flex h-screen bg-alloro-bg animate-pulse">
        <div className="w-64 bg-white border-r border-black/5 p-4 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-[70vh] bg-slate-100 rounded-2xl" />
        </div>
        <div className="w-96 bg-white border-l border-black/5 p-4 space-y-4">
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="mt-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${80 - i * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "PREPARING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your Website is Being Prepared</h2>
          <p className="text-gray-600">
            We're setting up your website. You'll receive an email when it's ready!
          </p>
        </div>
      </div>
    );
  }

  if (status === "READ_ONLY") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Website in Read-Only Mode</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been downgraded. Your website is still live but you cannot make edits.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to upgrade your plan and regain editing access.
          </p>
        </div>
      </div>
    );
  }

  // Empty state — project exists but no pages yet
  if (status === "READY" && pages.length === 0) {
    return (
      <div className="min-h-screen bg-alloro-bg font-body flex items-center justify-center py-16 px-6">
        <div className="max-w-xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-alloro-orange/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-alloro-orange" />
              <span className="text-xs font-bold text-alloro-orange uppercase tracking-wider">Almost There</span>
            </div>
            <h1 className="text-3xl font-black text-alloro-navy font-heading tracking-tight mb-3">
              Your Website is Being Built
            </h1>
            <p className="text-base text-slate-500 font-medium max-w-md mx-auto">
              Your project has been created and our team is setting up your pages. You'll be able to edit them here once they're ready.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-alloro-orange/20 shadow-xl shadow-alloro-orange/5 p-8">
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-alloro-orange to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-alloro-orange/30">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-black text-alloro-navy tracking-tight mb-2">
                  No Pages Yet
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-4">
                  Pages will appear here once they've been designed and published. You'll receive a notification when your website is ready for editing.
                </p>
                {project && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Globe className="w-4 h-4" />
                    <span>{project.hostname}.sites.getalloro.com</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            This page will update automatically when pages are available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar: Pages */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Your Website
          </h2>
          <button
            onClick={() => setShowDomainModal(true)}
            className={`mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              project?.custom_domain && project?.domain_verified_at
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : project?.custom_domain
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {project?.custom_domain || "Connect Domain"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b transition-colors ${
                selectedPage?.id === page.id ? "bg-purple-50 border-l-4 border-purple-600" : ""
              }`}
            >
              <div className="font-medium text-sm">
                {page.path === "/" ? "Home" : page.path}
              </div>
              <div className="text-xs text-gray-500">
                Updated {new Date(page.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>

        {/* Usage Stats */}
        {usage && (
          <div className="p-4 border-t bg-gray-50">
            <h3 className="text-xs font-semibold mb-3 text-gray-700">Usage</h3>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Storage</span>
                <span>{Math.round(usage.storage_percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usage.storage_percentage > 90 ? "bg-red-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.min(usage.storage_percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Edits today</span>
                <span className={usage.edits_today >= usage.edits_limit ? "text-red-600 font-semibold" : ""}>
                  {usage.edits_today} / {usage.edits_limit}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center: Preview */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            {selectedPage?.path === "/" ? "Home" : selectedPage?.path}
          </h3>
          {project && (
            <a
              href={`https://${project.hostname}.sites.getalloro.com${selectedPage?.path || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </a>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            title="Page Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>

      {/* Right: AI Chat */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Edit with AI</h3>
          {selectedComponent ? (
            <p className="text-xs text-gray-600 mt-1">
              Selected: <code className="bg-gray-100 px-1 rounded text-xs">{selectedComponent}</code>
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">
              Click on an element in the preview to start editing
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-8">
              <p className="mb-2">Select a component and describe your changes.</p>
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="text-left space-y-1 text-xs">
                <li>• "Make this text larger"</li>
                <li>• "Change the button color to blue"</li>
                <li>• "Use a different background color"</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${
                    msg.role === "user" ? "bg-purple-100" : "bg-gray-100"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 text-gray-600">
                    {msg.role === "user" ? "You" : "AI"}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          {usage && usage.edits_today >= usage.edits_limit && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              Daily edit limit reached. Try again tomorrow.
            </div>
          )}

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Describe your changes..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
            rows={3}
            disabled={!selectedComponent || editing || !!(usage && usage.edits_today >= usage.edits_limit)}
          />

          <button
            onClick={handleEdit}
            disabled={!selectedComponent || !instruction.trim() || editing || !!(usage && usage.edits_today >= usage.edits_limit)}
            className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {editing ? "Editing..." : "Send"}
          </button>
        </div>
      </div>

      {/* Custom Domain Modal */}
      {project && (
        <ConnectDomainModal
          isOpen={showDomainModal}
          onClose={() => setShowDomainModal(false)}
          projectId={project.id}
          currentDomain={project.custom_domain}
          domainVerifiedAt={project.domain_verified_at}
          onDomainChange={fetchWebsite}
          onConnect={async (domain) => {
            const res = await apiPost({ path: "/user/website/domain/connect", passedData: { domain } });
            return { server_ip: res.data.server_ip };
          }}
          onVerify={async () => {
            const res = await apiPost({ path: "/user/website/domain/verify" });
            return res.data;
          }}
          onDisconnect={async () => {
            await apiDelete({ path: "/user/website/domain/disconnect" });
          }}
        />
      )}
    </div>
  );
}
