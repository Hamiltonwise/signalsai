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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchWebsiteDetail, updateWebsite, deleteWebsite } from "../../api/websites";
import type { WebsiteProjectWithPages } from "../../api/websites";
import { searchPlaces, getPlaceDetails } from "../../api/places";
import type { PlaceSuggestion, PlaceDetails } from "../../api/places";
import {
  AdminPageHeader,
  Badge,
  ActionButton,
} from "../../components/ui/DesignSystem";

// Status step type with icon
interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

// Status steps for the progress tracker
const STATUS_STEPS: StatusStep[] = [
  { key: "CREATED", label: "Project Created", description: "Waiting for business selection", icon: FileText },
  { key: "GBP_SELECTED", label: "Business Selected", description: "Fetching business profile data", icon: Building2 },
  { key: "GBP_SCRAPED", label: "Profile Scraped", description: "Analyzing business information", icon: Search },
  { key: "WEBSITE_SCRAPED", label: "Website Scraped", description: "Extracting content from website", icon: Globe },
  { key: "IMAGES_ANALYZED", label: "Images Analyzed", description: "Processing and optimizing images", icon: ImageIcon },
  { key: "HTML_GENERATED", label: "HTML Generated", description: "Building your website pages", icon: Code },
  { key: "READY", label: "Ready", description: "Your website is live!", icon: Sparkles },
];

// Get the index of the current status in the steps
const getStatusIndex = (status: string): number => {
  const index = STATUS_STEPS.findIndex((s) => s.key === status);
  return index >= 0 ? index : 0;
};

/**
 * Website Detail Page
 * Shows detailed view of a single website project
 */
export default function WebsiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [website, setWebsite] = useState<WebsiteProjectWithPages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Statuses that don't need polling (terminal or waiting for user input)
  const NON_POLLING_STATUSES = ["CREATED", "READY"];
  const POLL_INTERVAL = 3000;

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    if (id) {
      loadWebsite();
    }

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [id]);

  // Status polling - only polls when status is processing (not CREATED or READY)
  useEffect(() => {
    // Don't poll if no website data yet
    if (!website) return;

    // Don't poll if status is terminal or waiting for user input
    if (NON_POLLING_STATUSES.includes(website.status)) {
      setIsPolling(false);
      return;
    }

    // Start polling for processing statuses
    setIsPolling(true);

    const pollStatus = async () => {
      if (!id || !isMountedRef.current) return;

      try {
        const response = await fetchWebsiteDetail(id);
        if (!isMountedRef.current) return;

        setWebsite(response.data);

        // Check if we should stop polling
        if (NON_POLLING_STATUSES.includes(response.data.status)) {
          setIsPolling(false);
          return;
        }

        // Schedule next poll AFTER current one completes
        pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Polling error:", err);

        // Continue polling even on error
        pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      }
    };

    // Start first poll after interval (initial data already loaded)
    pollTimeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [website?.status, id]);

  // Handle click outside to close dropdown
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for places
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectPlace(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle selecting a suggestion - shows confirmation step
  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    if (!id || isLoadingDetails) return;

    try {
      setIsLoadingDetails(true);
      setSearchError(null);
      setSuggestions([]);
      setIsDropdownOpen(false);
      setSearchQuery(suggestion.mainText);

      // Get full place details
      const detailsResponse = await getPlaceDetails(suggestion.placeId);
      const place = detailsResponse.place;

      // Show confirmation step with the place details
      setSelectedPlace(place);
      setWebsiteUrl(place.websiteUri || "");
    } catch (err) {
      console.error("Failed to load place details:", err);
      setSearchError("Failed to load business details. Please try again.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle confirmation - saves to DB and triggers N8N webhook
  const handleConfirmSelection = async () => {
    if (!id || !selectedPlace || isConfirming) return;

    try {
      setIsConfirming(true);
      setSearchError(null);

      // 1. Update the website project with the selected place
      await updateWebsite(id, {
        selected_place_id: selectedPlace.placeId,
        selected_website_url: websiteUrl || null,
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

      // 2. Trigger N8N webhook to start the pipeline
      try {
        const webhookResponse = await fetch("/api/admin/websites/start-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            placeId: selectedPlace.placeId,
            websiteUrl: websiteUrl || null,
            practiceSearchString: selectedPlace.practiceSearchString,
            businessName: selectedPlace.name,
            formattedAddress: selectedPlace.formattedAddress,
            city: selectedPlace.city,
            state: selectedPlace.state,
            phone: selectedPlace.phone,
            category: selectedPlace.category,
            rating: selectedPlace.rating,
            reviewCount: selectedPlace.reviewCount,
          }),
        });

        if (!webhookResponse.ok) {
          console.error("Failed to trigger pipeline webhook");
        }
      } catch (webhookErr) {
        console.error("Pipeline webhook error:", webhookErr);
        // Don't throw - GBP selection is saved even if webhook fails
      }

      // 3. Refresh and reset state
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

  // Clear selected place and search again
  const handleClearSelection = () => {
    setSelectedPlace(null);
    setSearchQuery("");
    setWebsiteUrl("");
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id || isDeleting) return;
    if (
      !confirm(
        "Are you sure you want to DELETE this website project? This will also delete all its pages. This action cannot be undone."
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
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const formatStatus = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

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

  // Check if status is a processing state (should show spinner)
  const isProcessingStatus = (status: string): boolean => {
    return !["READY", "CREATED"].includes(status);
  };

  // Extract GBP data
  const getGbpData = () => {
    if (website?.step_gbp_scrape && typeof website.step_gbp_scrape === "object") {
      return website.step_gbp_scrape as Record<string, string | number | null>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading website details...
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

      {/* Page Header */}
      <AdminPageHeader
        icon={<Globe className="w-6 h-6" />}
        title={website.generated_hostname}
        description="Website project details"
        actionButtons={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusStyles(website.status)}`}
            >
              {website.status === "READY" && <CheckCircle className="h-4 w-4" />}
              {isProcessingStatus(website.status) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {formatStatus(website.status)}
            </span>
            {(website.status === "READY" ||
              website.status === "HTML_GENERATED") && (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Info Card */}
        <motion.div
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Information
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Hostname</p>
                <p className="text-base font-semibold text-gray-900">
                  {website.generated_hostname}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-base text-gray-900">
                  {formatDate(website.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-base text-gray-900">
                  {formatDate(website.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status Card with Progress Tracker OR GBP Selector */}
        <motion.div
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>
          </div>
          <div className="p-5">
            {isCreatedStatus ? (
              // Show GBP selector for CREATED status
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {/* Loading Details State */}
                  {isLoadingDetails && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <Loader2 className="w-8 h-8 text-alloro-orange animate-spin mb-4" />
                      <p className="text-gray-600">Loading business details...</p>
                    </motion.div>
                  )}

                  {/* Selected Place Confirmation Card */}
                  {selectedPlace && !isLoadingDetails && (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl border-2 border-alloro-orange/30 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-gradient-to-br from-alloro-orange to-orange-500 p-4 text-white">
                        <h3 className="text-lg font-bold">{selectedPlace.name}</h3>
                        {selectedPlace.category && (
                          <p className="text-orange-100 text-sm">{selectedPlace.category}</p>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-3">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700">{selectedPlace.formattedAddress}</p>
                        </div>

                        {/* Rating */}
                        {selectedPlace.rating && (
                          <div className="flex items-center gap-3">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">{selectedPlace.rating}</span>
                              <span className="text-gray-500"> ({selectedPlace.reviewCount} reviews)</span>
                            </p>
                          </div>
                        )}

                        {/* Phone */}
                        {selectedPlace.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-700">{selectedPlace.phone}</p>
                          </div>
                        )}

                        {/* Website URL - Editable */}
                        <div className="pt-2 border-t border-gray-100">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Website URL (we'll scrape this for content)
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
                      </div>

                      {/* Actions */}
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
                          disabled={isConfirming}
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

                  {/* Search UI - Only show when no place selected and not loading */}
                  {!selectedPlace && !isLoadingDetails && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      {/* Instructions */}
                      <div className="flex items-start gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          Search for a Google Business Profile to generate the website.
                          We'll use the business info to create your site.
                        </p>
                      </div>

                      {/* Search Input */}
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
                            if (e.target.value.length >= 2) {
                              setIsDropdownOpen(true);
                            }
                          }}
                          onFocus={() => {
                            if (suggestions.length > 0) {
                              setIsDropdownOpen(true);
                            }
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Search for your business..."
                          className="block w-full pl-12 pr-10 py-4 text-base rounded-2xl border-2 border-gray-200 bg-white focus:border-alloro-orange focus:ring-4 focus:ring-alloro-orange/20 transition-all outline-none font-medium placeholder:text-gray-400"
                          autoComplete="off"
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

                      {/* Dropdown - positioned below the input */}
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
                                    onClick={() => handleSelectPlace(suggestion)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                                      highlightedIndex === index
                                        ? "bg-orange-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                    disabled={isLoadingDetails}
                                  >
                                    <div
                                      className={`p-2 rounded-lg flex-shrink-0 ${
                                        highlightedIndex === index
                                          ? "bg-orange-100"
                                          : "bg-gray-100"
                                      }`}
                                    >
                                      <MapPin
                                        className={`w-4 h-4 ${
                                          highlightedIndex === index
                                            ? "text-alloro-orange"
                                            : "text-gray-500"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`font-semibold truncate ${
                                          highlightedIndex === index
                                            ? "text-alloro-orange"
                                            : "text-gray-900"
                                        }`}
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

                      {/* Error message */}
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

                      {/* Helper text */}
                      {!isDropdownOpen &&
                        searchQuery.length > 0 &&
                        searchQuery.length < 2 && (
                          <p className="mt-3 text-sm text-gray-400">
                            Type at least 2 characters to search...
                          </p>
                        )}

                      {/* No results message */}
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
              // Show progress tracker for other statuses - Timeline style
              <div className="space-y-4">
                {/* Timeline */}
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isPending = index > currentStatusIndex;
                    const Icon = step.icon;
                    const isProcessing = isCurrent && isProcessingStatus(website.status);

                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex gap-4"
                      >
                        {/* Vertical line connector */}
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute left-[19px] top-10 w-0.5 h-[calc(100%-16px)] ${
                              isCompleted ? "bg-alloro-orange" : "bg-gray-200"
                            }`}
                          />
                        )}

                        {/* Step circle */}
                        <div className="relative z-10 shrink-0">
                          <motion.div
                            animate={{
                              scale: isCurrent ? 1.1 : 1,
                            }}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                              ${isCompleted ? "bg-alloro-orange border-alloro-orange" : ""}
                              ${isCurrent ? "bg-white border-alloro-orange shadow-lg shadow-alloro-orange/20" : ""}
                              ${isPending ? "bg-white border-gray-200" : ""}
                            `}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white stroke-[3]" />
                            ) : isProcessing ? (
                              <Loader2 className="w-5 h-5 text-alloro-orange animate-spin" />
                            ) : (
                              <Icon
                                className={`w-5 h-5 ${
                                  isCurrent ? "text-alloro-orange" : "text-gray-400"
                                }`}
                              />
                            )}
                          </motion.div>
                        </div>

                        {/* Step content */}
                        <div className={`flex-1 pb-6 ${isCurrent ? "pt-1" : "pt-2"}`}>
                          <p
                            className={`font-semibold transition-colors ${
                              isCompleted ? "text-alloro-orange" : ""
                            } ${isCurrent ? "text-gray-900" : ""} ${
                              isPending ? "text-gray-400" : ""
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="text-sm text-alloro-orange/80 mt-1"
                            >
                              {step.description}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-alloro-orange to-orange-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {currentStatusIndex} of {STATUS_STEPS.length - 1} steps completed
                  </p>
                </div>

                {/* Show GBP info if available */}
                {gbpData && gbpData.name && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Selected Business
                      </p>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-alloro-orange/10 rounded-lg">
                          <Building2 className="h-4 w-4 text-alloro-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {String(gbpData.name)}
                          </p>
                          {gbpData.formattedAddress && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {String(gbpData.formattedAddress)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gbpData.rating && (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {String(gbpData.rating)} ({String(gbpData.reviewCount || 0)})
                          </span>
                        )}
                        {gbpData.phone && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            <Phone className="h-3 w-3" />
                            {String(gbpData.phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pages Section */}
      <motion.div
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
          <Badge label={`${website.pages.length} pages`} color="blue" />
        </div>
        <div className="p-5">
          {website.pages.length > 0 ? (
            <div className="space-y-3">
              {website.pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{page.path}</p>
                      <p className="text-sm text-gray-500">
                        Version {page.version}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPageStatusStyles(page.status)}`}
                  >
                    {page.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No pages created yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Link to full manager */}
      <motion.div
        className="rounded-xl border border-blue-200 bg-blue-50 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">
              Need to make changes to this website?
            </p>
            <p className="text-sm text-blue-700">
              Use the full Website Builder manager for editing templates,
              regenerating content, and more.
            </p>
          </div>
          <a
            href={`https://websites.getalloro.com/projects/${website.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Open Manager
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
