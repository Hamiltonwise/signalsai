import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Clock,
  CheckCircle,
  Check,
  Building2,
  FileText,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Star,
  Search,
  X,
  Sparkles,
  ImageIcon,
  Code,
  Trash2,
  Pencil,
  ChevronDown,
  Hash,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  fetchWebsiteDetail,
  updateWebsite,
  deleteWebsite,
  startPipeline,
  deletePageByPath,
  linkWebsiteToOrganization,
} from "../../api/websites";
import type { WebsiteProjectWithPages, WebsitePage } from "../../api/websites";
import { toast } from "react-hot-toast";
import { searchPlaces, getPlaceDetails } from "../../api/places";
import type { PlaceSuggestion, PlaceDetails } from "../../api/places";
import { fetchTemplates, fetchTemplatePages } from "../../api/templates";
import type { Template, TemplatePage } from "../../api/templates";
import {
  AdminPageHeader,
  ActionButton,
} from "../../components/ui/DesignSystem";
import CreatePageModal from "../../components/Admin/CreatePageModal";
import MediaTab from "../../components/Admin/MediaTab";
import CodeManagerTab from "../../components/Admin/CodeManagerTab";
import ColorPicker from "../../components/Admin/ColorPicker";
import { fetchProjectCodeSnippets } from "../../api/codeSnippets";
import type { CodeSnippet } from "../../api/codeSnippets";

// Status step type with icon
interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

// Status steps for the progress tracker
const STATUS_STEPS: StatusStep[] = [
  {
    key: "CREATED",
    label: "Project Created",
    description: "Waiting for business selection",
    icon: FileText,
  },
  {
    key: "GBP_SELECTED",
    label: "Business Selected",
    description: "Fetching business profile data",
    icon: Building2,
  },
  {
    key: "GBP_SCRAPED",
    label: "Profile Scraped",
    description: "Analyzing business information",
    icon: Search,
  },
  {
    key: "WEBSITE_SCRAPED",
    label: "Website Scraped",
    description: "Extracting content from website",
    icon: Globe,
  },
  {
    key: "IMAGES_ANALYZED",
    label: "Images Analyzed",
    description: "Processing and optimizing images",
    icon: ImageIcon,
  },
  {
    key: "HTML_GENERATED",
    label: "HTML Generated",
    description: "Building your website pages",
    icon: Code,
  },
  {
    key: "READY",
    label: "Ready",
    description: "Your website is live!",
    icon: Sparkles,
  },
];

const getStatusIndex = (status: string): number => {
  const index = STATUS_STEPS.findIndex((s) => s.key === status);
  return index >= 0 ? index : 0;
};

/**
 * Group pages by path for the expandable list.
 * Returns { path: string, pages: WebsitePage[] }[] sorted by path,
 * with each group's pages sorted by version desc.
 */
function groupPagesByPath(pages: WebsitePage[]) {
  const map = new Map<string, WebsitePage[]>();
  for (const page of pages) {
    const group = map.get(page.path) || [];
    group.push(page);
    map.set(page.path, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, pages]) => ({
      path,
      pages: pages.sort((a, b) => b.version - a.version),
    }));
}

export default function WebsiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<WebsiteProjectWithPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [deletingPagePath, setDeletingPagePath] = useState<string | null>(null);

  // GBP Selector state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [, setIsPolling] = useState(false);

  // Template selector state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedTemplatePages, setSelectedTemplatePages] = useState<
    TemplatePage[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Create page modal state
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);

  // Color picker state
  const [primaryColor, setPrimaryColor] = useState("#1E40AF");
  const [accentColor, setAccentColor] = useState("#F59E0B");

  // Detail tab: pages vs layouts vs media vs code-manager
  const [detailTab, setDetailTab] = useState<
    "pages" | "layouts" | "media" | "code-manager"
  >("pages");

  // Code snippets state
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);

  // Organization linking state
  const [dfyOrganizations, setDfyOrganizations] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageGenPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedPageCountRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const NON_POLLING_STATUSES = ["CREATED", "READY"];
  const POLL_INTERVAL = 3000;

  const loadCodeSnippets = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingSnippets(true);
      const response = await fetchProjectCodeSnippets(id);
      setCodeSnippets(response.data);
    } catch (err) {
      console.error("Failed to fetch code snippets:", err);
    } finally {
      setLoadingSnippets(false);
    }
  }, [id]);

  const loadDFYOrganizations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Filter to DFY orgs without websites (or currently linked org)
      const availableOrgs = data.organizations
        .filter(
          (org: any) =>
            org.subscription_tier === "DFY" &&
            (!org.website || org.id === website?.organization?.id),
        )
        .map((org: any) => ({ id: org.id, name: org.name }));

      setDfyOrganizations(availableOrgs);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      toast.error("Failed to load organizations");
    } finally {
      setLoadingOrgs(false);
    }
  }, [website?.organization?.id]);

  const handleLinkOrganization = async () => {
    if (!id || isLinking) return;

    try {
      setIsLinking(true);
      await linkWebsiteToOrganization(id, selectedOrgId);
      toast.success(
        selectedOrgId ? "Organization linked" : "Organization unlinked",
      );
      await loadWebsite();
      await loadDFYOrganizations();
      setSelectedOrgId(null);
    } catch (err) {
      console.error("Failed to link organization:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to link organization",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Unlink this website from the organization?")) return;
    setSelectedOrgId(null);
    await handleLinkOrganization();
  };

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    // Trigger loading indicator
    window.dispatchEvent(new Event("navigation-start"));
    if (id) {
      loadWebsite();
      loadCodeSnippets();
    }
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (pageGenPollRef.current) clearTimeout(pageGenPollRef.current);
    };
  }, [id, loadCodeSnippets]);

  // Load DFY organizations when website data changes
  useEffect(() => {
    if (website) {
      loadDFYOrganizations();
    }
  }, [website?.organization?.id, loadDFYOrganizations]);

  // Load templates for selector (only when CREATED status)
  useEffect(() => {
    if (!website || website.status !== "CREATED") return;
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await fetchTemplates();
        const published = response.data.filter((t) => t.status === "published");
        setTemplates(published);
        // Pre-select the active template
        const active = published.find((t) => t.is_active);
        if (active) {
          setSelectedTemplateId(active.id);
          // Load its pages
          const pagesResponse = await fetchTemplatePages(active.id);
          setSelectedTemplatePages(pagesResponse.data);
        } else if (published.length > 0) {
          setSelectedTemplateId(published[0].id);
          const pagesResponse = await fetchTemplatePages(published[0].id);
          setSelectedTemplatePages(pagesResponse.data);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [website?.status]);

  // Load template pages when template selection changes
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    try {
      const response = await fetchTemplatePages(templateId);
      setSelectedTemplatePages(response.data);
    } catch (err) {
      console.error("Failed to load template pages:", err);
      setSelectedTemplatePages([]);
    }
  };

  // Status polling
  useEffect(() => {
    if (!website) return;
    if (NON_POLLING_STATUSES.includes(website.status)) {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);

    const pollStatus = async () => {
      if (!id || !isMountedRef.current) return;
      try {
        const response = await fetchWebsiteDetail(id);
        if (!isMountedRef.current) return;
        setWebsite(response.data);
        if (NON_POLLING_STATUSES.includes(response.data.status)) {
          setIsPolling(false);
          return;
        }
        pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Polling error:", err);
        pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      }
    };

    pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [website?.status, id]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      // Also handle org dropdown
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await searchPlaces(value);
        setSuggestions(response.suggestions || []);
        setIsDropdownOpen(response.suggestions?.length > 0);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchError("Network error. Please try again.");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length)
          handleSelectPlace(suggestions[highlightedIndex]);
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    if (!id || isLoadingDetails) return;
    try {
      setIsLoadingDetails(true);
      setSearchError(null);
      setSuggestions([]);
      setIsDropdownOpen(false);
      setSearchQuery(suggestion.mainText);
      const detailsResponse = await getPlaceDetails(suggestion.placeId);
      const place = detailsResponse.place;
      setSelectedPlace(place);
      setWebsiteUrl(place.websiteUri || "");
    } catch (err) {
      console.error("Failed to load place details:", err);
      setSearchError("Failed to load business details. Please try again.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirmSelection = async () => {
    if (!id || !selectedPlace || isConfirming) return;
    if (!selectedTemplateId) {
      setSearchError("Please select a template.");
      return;
    }
    if (selectedTemplatePages.length === 0) {
      setSearchError(
        "Selected template has no pages. Please add pages to the template first.",
      );
      return;
    }
    // Use the first template page as the homepage
    const homepageTemplatePage = selectedTemplatePages[0];

    try {
      setIsConfirming(true);
      setSearchError(null);
      await updateWebsite(id, {
        selected_place_id: selectedPlace.placeId,
        selected_website_url: websiteUrl || null,
        template_id: selectedTemplateId,
        primary_color: primaryColor,
        accent_color: accentColor,
        status: "GBP_SELECTED",
        step_gbp_scrape: {
          name: selectedPlace.name,
          formattedAddress: selectedPlace.formattedAddress,
          phone: selectedPlace.phone,
          rating: selectedPlace.rating,
          reviewCount: selectedPlace.reviewCount,
          websiteUri: websiteUrl || null,
          category: selectedPlace.category,
        },
      } as any);

      try {
        await startPipeline({
          projectId: id,
          placeId: selectedPlace.placeId,
          templateId: selectedTemplateId,
          templatePageId: homepageTemplatePage.id,
          path: "/",
          websiteUrl: websiteUrl || null,
          practiceSearchString: selectedPlace.practiceSearchString,
          businessName: selectedPlace.name,
          formattedAddress: selectedPlace.formattedAddress,
          city: selectedPlace.city,
          state: selectedPlace.state,
          phone: selectedPlace.phone ?? undefined,
          category: selectedPlace.category,
          rating: selectedPlace.rating ?? undefined,
          reviewCount: selectedPlace.reviewCount,
          primaryColor,
          accentColor,
        });
      } catch (webhookErr) {
        console.error("Pipeline webhook error:", webhookErr);
      }

      await loadWebsite();
      setSelectedPlace(null);
      setSearchQuery("");
      setWebsiteUrl("");
    } catch (err) {
      console.error("Failed to confirm selection:", err);
      setSearchError("Failed to save selection. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedPlace(null);
    setSearchQuery("");
    setWebsiteUrl("");
  };

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    if (
      !confirm(
        "Are you sure you want to DELETE this website project? This will also delete all its pages. This action cannot be undone.",
      )
    )
      return;
    try {
      setIsDeleting(true);
      await deleteWebsite(id);
      navigate("/admin/websites");
    } catch (err) {
      console.error("Failed to delete website:", err);
      alert(err instanceof Error ? err.message : "Failed to delete website");
      setIsDeleting(false);
    }
  };

  const handleDeletePageVersion = async (
    pageId: string,
    pageGroup: { path: string; pages: WebsitePage[] },
  ) => {
    const page = pageGroup.pages.find((p) => p.id === pageId);
    if (!page || !id) return;

    if (page.status === "published") {
      alert("Cannot delete a published page version.");
      return;
    }
    if (pageGroup.pages.length <= 1) {
      alert("Cannot delete the only version of a page.");
      return;
    }
    if (!confirm(`Delete version ${page.version} of "${page.path}"?`)) return;

    try {
      setDeletingPageId(pageId);
      const response = await fetch(
        `/api/admin/websites/${id}/pages/${pageId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete page version");
      }
      await loadWebsite();
    } catch (err) {
      console.error("Failed to delete page version:", err);
      alert(
        err instanceof Error ? err.message : "Failed to delete page version",
      );
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDeletePage = async (path: string, versionCount: number) => {
    if (!id) return;
    if (
      !confirm(
        `Delete page "${path}" and all ${versionCount} version${versionCount !== 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;

    try {
      setDeletingPagePath(path);
      await deletePageByPath(id, path);
      await loadWebsite();
    } catch (err) {
      console.error("Failed to delete page:", err);
      alert(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setDeletingPagePath(null);
    }
  };

  const loadWebsite = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWebsiteDetail(id);
      setWebsite(response.data);
    } catch (err) {
      console.error("Failed to fetch website:", err);
      setError(err instanceof Error ? err.message : "Failed to load website");
    } finally {
      setLoading(false);
      // Manually complete loading indicator since location doesn't change
      window.dispatchEvent(new Event("navigation-complete"));
    }
  };

  const startPageGenerationPoll = useCallback(() => {
    if (pageGenPollRef.current) clearTimeout(pageGenPollRef.current);
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3s = 60s

    const poll = async () => {
      if (!id || !isMountedRef.current) return;
      attempts++;
      try {
        const response = await fetchWebsiteDetail(id);
        if (!isMountedRef.current) return;
        setWebsite(response.data);

        if (response.data.pages.length > expectedPageCountRef.current) {
          setIsGeneratingPage(false);
          return;
        }
        if (attempts < maxAttempts) {
          pageGenPollRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          setIsGeneratingPage(false);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Page generation poll error:", err);
        if (attempts < maxAttempts) {
          pageGenPollRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          setIsGeneratingPage(false);
        }
      }
    };

    pageGenPollRef.current = setTimeout(poll, POLL_INTERVAL);
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyles = (status: string): string => {
    switch (status) {
      case "READY":
        return "border-green-200 bg-green-100 text-green-700";
      case "HTML_GENERATED":
        return "border-blue-200 bg-blue-100 text-blue-700";
      case "GENERATING":
        return "border-yellow-200 bg-yellow-100 text-yellow-700";
      case "GBP_SELECTED":
      case "GBP_SCRAPED":
      case "WEBSITE_SCRAPED":
      case "IMAGES_ANALYZED":
        return "border-purple-200 bg-purple-100 text-purple-700";
      case "CREATED":
        return "border-gray-200 bg-gray-100 text-gray-700";
      default:
        return "border-gray-200 bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: string): string =>
    status
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");

  const getPageStatusStyles = (status: string): string => {
    switch (status) {
      case "published":
        return "border-green-200 bg-green-100 text-green-700";
      case "draft":
        return "border-yellow-200 bg-yellow-100 text-yellow-700";
      case "inactive":
        return "border-gray-200 bg-gray-100 text-gray-500";
      default:
        return "border-gray-200 bg-gray-100 text-gray-700";
    }
  };

  const isProcessingStatus = (status: string): boolean =>
    !["READY", "CREATED"].includes(status);

  const getGbpData = () => {
    if (website?.step_gbp_scrape && typeof website.step_gbp_scrape === "object")
      return website.step_gbp_scrape as Record<string, string | number | null>;
    return null;
  };

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (loading) {
    // Show skeleton loading state with grey cards
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>

        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Tab bar skeleton */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Main content card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>

        {/* Additional card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/websites"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Websites
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Error loading website
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <ActionButton
            label="Retry"
            onClick={loadWebsite}
            variant="danger"
            size="sm"
          />
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/websites"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Websites
        </Link>
        <div className="text-center py-16 text-gray-500">Website not found</div>
      </div>
    );
  }

  const gbpData = getGbpData();
  const currentStatusIndex = getStatusIndex(website.status);
  const isCreatedStatus = website.status === "CREATED";
  const isReady = website.status === "READY";
  const pageGroups = groupPagesByPath(website.pages);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/websites"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Websites
      </Link>

      {/* Header with compact meta pills */}
      <AdminPageHeader
        icon={<Globe className="w-6 h-6" />}
        title={
          gbpData?.name ? String(gbpData.name) : website.generated_hostname
        }
        description={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
              <Globe className="h-3 w-3" />
              {website.generated_hostname}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" />
              Created {formatDate(website.created_at)}
            </span>
            {website.updated_at !== website.created_at && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                <Clock className="h-3 w-3" />
                Updated {formatDate(website.updated_at)}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyles(website.status)}`}
            >
              {website.status === "READY" && (
                <CheckCircle className="h-3 w-3" />
              )}
              {isProcessingStatus(website.status) && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {formatStatus(website.status)}
            </span>
          </div>
        }
        actionButtons={
          <div className="flex items-center gap-2">
            {/* Organization Dropdown */}
            <div className="relative" ref={orgDropdownRef}>
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Building2 className="h-4 w-4" />
                {website?.organization
                  ? website.organization.name
                  : "No Organization"}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showOrgDropdown ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {showOrgDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  >
                    {website?.organization ? (
                      <>
                        <Link
                          to="/admin/organization-management"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowOrgDropdown(false)}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Organization
                        </Link>
                        <button
                          onClick={() => {
                            setShowOrgDropdown(false);
                            handleUnlink();
                          }}
                          disabled={isLinking}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          {isLinking ? "Unlinking..." : "Unlink Organization"}
                        </button>
                      </>
                    ) : (
                      <>
                        {loadingOrgs ? (
                          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </div>
                        ) : dfyOrganizations.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No available DFY organizations
                          </div>
                        ) : (
                          <>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                              Link to Organization
                            </div>
                            {dfyOrganizations.map((org) => (
                              <button
                                key={org.id}
                                onClick={async () => {
                                  setSelectedOrgId(org.id);
                                  setShowOrgDropdown(false);
                                  setIsLinking(true);
                                  try {
                                    await linkWebsiteToOrganization(
                                      id!,
                                      org.id,
                                    );
                                    toast.success("Organization linked");
                                    await loadWebsite();
                                    await loadDFYOrganizations();
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to link",
                                    );
                                  } finally {
                                    setIsLinking(false);
                                    setSelectedOrgId(null);
                                  }
                                }}
                                disabled={isLinking}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 w-full text-left disabled:opacity-50"
                              >
                                <Building2 className="h-4 w-4" />
                                {org.name}
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(isReady || website.status === "HTML_GENERATED") && (
              <a
                href={`https://${website.generated_hostname}.sites.getalloro.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <ExternalLink className="h-4 w-4" />
                View Live Site
              </a>
            )}
            <ActionButton
              label={isDeleting ? "Deleting..." : "Delete"}
              icon={
                isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )
              }
              onClick={handleDelete}
              variant="danger"
              disabled={isDeleting}
            />
          </div>
        }
      />

      {/* Status Card — horizontal, hidden when READY */}
      {!isReady && (
        <motion.div
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-5">
            {isCreatedStatus ? (
              // GBP Selector for CREATED status
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {isLoadingDetails && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <Loader2 className="w-8 h-8 text-alloro-orange animate-spin mb-4" />
                      <p className="text-gray-600">
                        Loading business details...
                      </p>
                    </motion.div>
                  )}

                  {selectedPlace && !isLoadingDetails && (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl border-2 border-alloro-orange/30 overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-alloro-orange to-orange-500 p-4 text-white">
                        <h3 className="text-lg font-bold">
                          {selectedPlace.name}
                        </h3>
                        {selectedPlace.category && (
                          <p className="text-orange-100 text-sm">
                            {selectedPlace.category}
                          </p>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            {selectedPlace.formattedAddress}
                          </p>
                        </div>
                        {selectedPlace.rating && (
                          <div className="flex items-center gap-3">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">
                                {selectedPlace.rating}
                              </span>
                              <span className="text-gray-500">
                                {" "}
                                ({selectedPlace.reviewCount} reviews)
                              </span>
                            </p>
                          </div>
                        )}
                        {selectedPlace.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-700">
                              {selectedPlace.phone}
                            </p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Website URL to scrape (leave as-is to use the
                            attached website)
                          </label>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                              type="url"
                              value={websiteUrl}
                              onChange={(e) => setWebsiteUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/20 outline-none"
                            />
                          </div>
                          {!websiteUrl && (
                            <p className="text-xs text-gray-400 mt-1">
                              Leave empty if there's no existing website
                            </p>
                          )}
                        </div>
                        {/* Template selector */}
                        <div className="pt-2 border-t border-gray-100">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Template
                          </label>
                          {loadingTemplates ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          ) : templates.length === 0 ? (
                            <p className="text-sm text-red-500">
                              No published templates available. Please create
                              and publish a template first.
                            </p>
                          ) : (
                            <select
                              value={selectedTemplateId || ""}
                              onChange={(e) =>
                                handleTemplateChange(e.target.value)
                              }
                              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-alloro-orange focus:ring-2 focus:ring-alloro-orange/20 outline-none"
                            >
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                  {t.is_active ? " (Active)" : ""}
                                </option>
                              ))}
                            </select>
                          )}
                          {selectedTemplatePages.length === 0 &&
                            selectedTemplateId &&
                            !loadingTemplates && (
                              <p className="text-xs text-amber-500 mt-1">
                                This template has no pages. Add pages to the
                                template first.
                              </p>
                            )}
                          {selectedTemplatePages.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              {selectedTemplatePages.length} page
                              {selectedTemplatePages.length !== 1 ? "s" : ""} in
                              this template
                            </p>
                          )}
                        </div>
                        {/* Brand colors */}
                        <div className="pt-2 border-t border-gray-100">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Brand Colors
                          </label>
                          <div className="flex items-start gap-4">
                            <ColorPicker
                              label="Primary"
                              value={primaryColor}
                              onChange={setPrimaryColor}
                            />
                            <ColorPicker
                              label="Accent"
                              value={accentColor}
                              onChange={setAccentColor}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <button
                          onClick={handleClearSelection}
                          disabled={isConfirming}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
                        >
                          Search Again
                        </button>
                        <button
                          onClick={handleConfirmSelection}
                          disabled={
                            isConfirming ||
                            !selectedTemplateId ||
                            selectedTemplatePages.length === 0
                          }
                          className="inline-flex items-center gap-2 bg-alloro-orange hover:bg-alloro-orange/90 disabled:bg-alloro-orange/50 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed"
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Confirm & Start
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!selectedPlace && !isLoadingDetails && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <div className="flex items-start gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          Search for a Google Business Profile to generate the
                          website.
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                          {searching ? (
                            <Loader2 className="h-5 w-5 text-alloro-orange animate-spin" />
                          ) : (
                            <Search className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <input
                          ref={inputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            handleSearchChange(e.target.value);
                            if (e.target.value.length >= 2)
                              setIsDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (suggestions.length > 0) setIsDropdownOpen(true);
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Search for your business..."
                          autoComplete="off"
                          className="block w-full pl-12 pr-10 py-4 text-base rounded-2xl border-2 border-gray-200 bg-white focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/20 transition-all outline-none font-medium placeholder:text-gray-400"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSuggestions([]);
                              setIsDropdownOpen(false);
                              inputRef.current?.focus();
                            }}
                            className="absolute inset-y-0 right-4 flex items-center"
                          >
                            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {isDropdownOpen && suggestions.length > 0 && (
                          <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                          >
                            <ul className="max-h-64 overflow-y-auto py-2">
                              {suggestions.map((suggestion, index) => (
                                <li key={suggestion.placeId}>
                                  <button
                                    onClick={() =>
                                      handleSelectPlace(suggestion)
                                    }
                                    onMouseEnter={() =>
                                      setHighlightedIndex(index)
                                    }
                                    className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${highlightedIndex === index ? "bg-orange-50" : "hover:bg-gray-50"}`}
                                    disabled={isLoadingDetails}
                                  >
                                    <div
                                      className={`p-2 rounded-lg flex-shrink-0 ${highlightedIndex === index ? "bg-orange-100" : "bg-gray-100"}`}
                                    >
                                      <MapPin
                                        className={`w-4 h-4 ${highlightedIndex === index ? "text-alloro-orange" : "text-gray-500"}`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`font-semibold truncate ${highlightedIndex === index ? "text-alloro-orange" : "text-gray-900"}`}
                                      >
                                        {suggestion.mainText}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        {suggestion.secondaryText}
                                      </p>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {searchError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 text-sm text-red-500 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          {searchError}
                        </motion.p>
                      )}
                      {!isDropdownOpen &&
                        searchQuery.length > 0 &&
                        searchQuery.length < 2 && (
                          <p className="mt-3 text-sm text-gray-400">
                            Type at least 2 characters to search...
                          </p>
                        )}
                      {searchQuery.length >= 2 &&
                        !searching &&
                        !isDropdownOpen &&
                        suggestions.length === 0 &&
                        !searchError && (
                          <p className="mt-3 text-sm text-gray-500">
                            No businesses found. Try a different search.
                          </p>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Horizontal progress tracker
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 overflow-x-auto">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const Icon = step.icon;
                    const isProcessing =
                      isCurrent && isProcessingStatus(website.status);

                    return (
                      <div
                        key={step.key}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? "bg-alloro-orange border-alloro-orange"
                                : isCurrent
                                  ? "bg-white border-alloro-orange shadow-md shadow-alloro-orange/20"
                                  : "bg-white border-gray-200"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            ) : isProcessing ? (
                              <Loader2 className="w-4 h-4 text-alloro-orange animate-spin" />
                            ) : (
                              <Icon
                                className={`w-4 h-4 ${isCurrent ? "text-alloro-orange" : "text-gray-400"}`}
                              />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium text-center leading-tight max-w-[70px] ${isCompleted ? "text-alloro-orange" : isCurrent ? "text-gray-900" : "text-gray-400"}`}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 rounded-full mb-4 ${isCompleted ? "bg-alloro-orange" : "bg-gray-200"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* GBP info if available */}
                {gbpData && gbpData.name && (
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                    <div className="p-1.5 bg-alloro-orange/10 rounded-lg">
                      <Building2 className="h-3.5 w-3.5 text-alloro-orange" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {String(gbpData.name)}
                    </p>
                    {gbpData.rating && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {String(gbpData.rating)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab bar: Pages | Layouts | Code Manager | Media */}
      <div className="flex items-center gap-1 mb-4">
        {(["pages", "layouts", "code-manager", "media"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              detailTab === tab
                ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pages Section — grouped by path, expandable versions */}
      {detailTab === "pages" && (
        <motion.div
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                {pageGroups.length} {pageGroups.length === 1 ? "page" : "pages"}
              </span>
              {isGeneratingPage && (
                <span className="flex items-center gap-1.5 text-xs text-alloro-orange">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </span>
              )}
            </div>
            {(isReady || website.status === "HTML_GENERATED") &&
              website.template_id && (
                <ActionButton
                  label={isGeneratingPage ? "Generating..." : "Create Page"}
                  icon={
                    isGeneratingPage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )
                  }
                  onClick={() => setShowCreatePageModal(true)}
                  variant="primary"
                  size="sm"
                  disabled={isGeneratingPage}
                />
              )}
          </div>
          <div className="divide-y divide-gray-100">
            {pageGroups.length > 0 ? (
              pageGroups.map((group) => {
                const isExpanded = expandedPaths.has(group.path);
                const latestPage = group.pages[0]; // Already sorted desc
                const publishedPage = group.pages.find(
                  (p) => p.status === "published",
                );
                const displayPage = publishedPage || latestPage;

                return (
                  <div key={group.path}>
                    {/* Page row (click to expand) */}
                    <button
                      onClick={() => togglePath(group.path)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {group.path}
                          </p>
                          <p className="text-xs text-gray-500">
                            {group.pages.length}{" "}
                            {group.pages.length === 1 ? "version" : "versions"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPageStatusStyles(displayPage.status)}`}
                        >
                          {displayPage.status}
                        </span>
                        {(displayPage.status === "published" ||
                          displayPage.status === "draft") && (
                          <Link
                            to={`/admin/websites/${id}/pages/${displayPage.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded version list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-50 border-t border-gray-100">
                            {group.pages.map((page) => {
                              const canDelete =
                                page.status !== "published" &&
                                group.pages.length > 1;
                              return (
                                <div
                                  key={page.id}
                                  className="flex items-center justify-between px-5 py-3 pl-14 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <Hash className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                      v{page.version}
                                    </span>
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPageStatusStyles(page.status)}`}
                                    >
                                      {page.status}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatDateTime(page.updated_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(page.status === "published" ||
                                      page.status === "draft") && (
                                      <Link
                                        to={`/admin/websites/${id}/pages/${page.id}/edit`}
                                        className="text-xs text-gray-500 hover:text-alloro-orange transition-colors"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Link>
                                    )}
                                    {canDelete && (
                                      <button
                                        onClick={() =>
                                          handleDeletePageVersion(
                                            page.id,
                                            group,
                                          )
                                        }
                                        disabled={deletingPageId === page.id}
                                        className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        title="Delete this version"
                                      >
                                        {deletingPageId === page.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {/* Delete entire page */}
                            <div className="px-5 py-2.5 pl-14 border-t border-gray-200 bg-gray-50/80">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePage(
                                    group.path,
                                    group.pages.length,
                                  );
                                }}
                                disabled={deletingPagePath === group.path}
                                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                {deletingPagePath === group.path ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Delete page and all versions
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No pages created yet</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Layouts Section */}
      {detailTab === "layouts" && (
        <motion.div
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Layouts</h3>
            <p className="text-xs text-gray-500 mt-1">
              Global wrapper, header, and footer for all pages
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {(["wrapper", "header", "footer"] as const).map((field) => (
              <Link
                key={field}
                to={`/admin/websites/${id}/layout/${field}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {field}
                    </p>
                    <p className="text-xs text-gray-500">
                      {field === "wrapper"
                        ? "HTML shell with {{slot}} placeholder"
                        : field === "header"
                          ? "Site header rendered on all pages"
                          : "Site footer rendered on all pages"}
                    </p>
                  </div>
                </div>
                <Pencil className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Code Manager Section */}
      {detailTab === "code-manager" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loadingSnippets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <CodeManagerTab
              projectId={id!}
              codeSnippets={codeSnippets}
              onSnippetsChange={loadCodeSnippets}
              isProject={true}
              pages={website.pages}
            />
          )}
        </motion.div>
      )}

      {/* Media Section */}
      {detailTab === "media" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MediaTab projectId={id!} />
        </motion.div>
      )}

      {/* Create Page Modal */}
      {showCreatePageModal && website.template_id && (
        <CreatePageModal
          projectId={website.id}
          templateId={website.template_id}
          gbpData={gbpData}
          defaultPlaceId={website.selected_place_id || ""}
          defaultWebsiteUrl={website.selected_website_url || ""}
          defaultPrimaryColor={website.primary_color || "#1E40AF"}
          defaultAccentColor={website.accent_color || "#F59E0B"}
          onSuccess={() => {
            setShowCreatePageModal(false);
            setIsGeneratingPage(true);
            expectedPageCountRef.current = website.pages.length;
            startPageGenerationPoll();
          }}
          onClose={() => setShowCreatePageModal(false)}
        />
      )}
    </div>
  );
}
