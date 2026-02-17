import { useState, useEffect } from "react";
import { Globe, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

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
      const res = await fetch("/api/user/website");
      const data = await res.json();

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

      const res = await fetch(`/api/user/website/pages/${selectedPage.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alloroClass: selectedComponent,
          currentHtml,
          instruction,
          chatHistory,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error(data.message);
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Edit failed");
        return;
      }

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
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar: Pages */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Your Website
          </h2>
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
            disabled={!selectedComponent || editing || (usage && usage.edits_today >= usage.edits_limit)}
          />

          <button
            onClick={handleEdit}
            disabled={!selectedComponent || !instruction.trim() || editing || (usage && usage.edits_today >= usage.edits_limit)}
            className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {editing ? "Editing..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
