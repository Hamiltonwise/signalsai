import { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Trophy,
  Zap,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

// US Cities - Comprehensive list for dental practice ranking
const US_CITIES = [
  // Major metros
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Indianapolis, IN",
  "Charlotte, NC",
  "San Francisco, CA",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC",
  "Boston, MA",
  "El Paso, TX",
  "Nashville, TN",
  "Detroit, MI",
  "Oklahoma City, OK",
  "Portland, OR",
  "Las Vegas, NV",
  "Memphis, TN",
  "Louisville, KY",
  "Baltimore, MD",
  "Milwaukee, WI",
  "Albuquerque, NM",
  "Tucson, AZ",
  "Fresno, CA",
  "Mesa, AZ",
  "Sacramento, CA",
  "Atlanta, GA",
  "Kansas City, MO",
  "Colorado Springs, CO",
  "Omaha, NE",
  "Raleigh, NC",
  "Miami, FL",
  "Long Beach, CA",
  "Virginia Beach, VA",
  "Oakland, CA",
  "Minneapolis, MN",
  "Tulsa, OK",
  "Tampa, FL",
  "Arlington, TX",
  "New Orleans, LA",
  // Florida cities (expanded)
  "Orlando, FL",
  "Winter Garden, FL",
  "Winter Park, FL",
  "Winter Haven, FL",
  "Winter Springs, FL",
  "Kissimmee, FL",
  "Sanford, FL",
  "Deltona, FL",
  "Daytona Beach, FL",
  "Palm Coast, FL",
  "Ocala, FL",
  "Melbourne, FL",
  "Titusville, FL",
  "Cocoa, FL",
  "Rockledge, FL",
  "Oviedo, FL",
  "Altamonte Springs, FL",
  "Casselberry, FL",
  "Lake Mary, FL",
  "Longwood, FL",
  "Apopka, FL",
  "Clermont, FL",
  "Leesburg, FL",
  "Tavares, FL",
  "Eustis, FL",
  "Mount Dora, FL",
  "Fort Lauderdale, FL",
  "Hollywood, FL",
  "Pembroke Pines, FL",
  "Miramar, FL",
  "Coral Springs, FL",
  "Pompano Beach, FL",
  "West Palm Beach, FL",
  "Boca Raton, FL",
  "Delray Beach, FL",
  "Boynton Beach, FL",
  "Jupiter, FL",
  "Palm Beach Gardens, FL",
  "Port St. Lucie, FL",
  "Fort Pierce, FL",
  "Stuart, FL",
  "Vero Beach, FL",
  "Naples, FL",
  "Fort Myers, FL",
  "Cape Coral, FL",
  "Bonita Springs, FL",
  "Sarasota, FL",
  "Bradenton, FL",
  "St. Petersburg, FL",
  "Clearwater, FL",
  "Lakeland, FL",
  "Gainesville, FL",
  "Tallahassee, FL",
  "Pensacola, FL",
  // Texas cities (expanded)
  "The Woodlands, TX",
  "Conroe, TX",
  "Spring, TX",
  "Katy, TX",
  "Cypress, TX",
  "Sugar Land, TX",
  "Pearland, TX",
  "League City, TX",
  "Friendswood, TX",
  "Missouri City, TX",
  "Pasadena, TX",
  "Baytown, TX",
  "Galveston, TX",
  "Texas City, TX",
  "Beaumont, TX",
  "Port Arthur, TX",
  "Corpus Christi, TX",
  "McAllen, TX",
  "Brownsville, TX",
  "Laredo, TX",
  "Harlingen, TX",
  "Weslaco, TX",
  "Mission, TX",
  "Edinburg, TX",
  "Plano, TX",
  "Frisco, TX",
  "McKinney, TX",
  "Allen, TX",
  "Denton, TX",
  "Carrollton, TX",
  "Lewisville, TX",
  "Flower Mound, TX",
  "Irving, TX",
  "Grand Prairie, TX",
  "Garland, TX",
  "Mesquite, TX",
  "Richardson, TX",
  "Round Rock, TX",
  "Cedar Park, TX",
  "Georgetown, TX",
  "Pflugerville, TX",
  "San Marcos, TX",
  "New Braunfels, TX",
  "Killeen, TX",
  "Temple, TX",
  "Waco, TX",
  "Abilene, TX",
  "Midland, TX",
  "Odessa, TX",
  "Lubbock, TX",
  "Amarillo, TX",
  // California cities (expanded)
  "Irvine, CA",
  "Anaheim, CA",
  "Santa Ana, CA",
  "Huntington Beach, CA",
  "Costa Mesa, CA",
  "Newport Beach, CA",
  "Orange, CA",
  "Fullerton, CA",
  "Garden Grove, CA",
  "Westminster, CA",
  "Fountain Valley, CA",
  "Mission Viejo, CA",
  "Lake Forest, CA",
  "Laguna Niguel, CA",
  "Rancho Santa Margarita, CA",
  "San Clemente, CA",
  "Dana Point, CA",
  "Riverside, CA",
  "San Bernardino, CA",
  "Ontario, CA",
  "Rancho Cucamonga, CA",
  "Fontana, CA",
  "Corona, CA",
  "Moreno Valley, CA",
  "Temecula, CA",
  "Murrieta, CA",
  "Menifee, CA",
  "Hemet, CA",
  "Palm Springs, CA",
  "Palm Desert, CA",
  "Indio, CA",
  "Bakersfield, CA",
  "Fresno, CA",
  "Stockton, CA",
  "Modesto, CA",
  "Visalia, CA",
  "Clovis, CA",
  "Santa Clarita, CA",
  "Lancaster, CA",
  "Palmdale, CA",
  "Glendale, CA",
  "Pasadena, CA",
  "Burbank, CA",
  "Torrance, CA",
  "Downey, CA",
  "Pomona, CA",
  "El Monte, CA",
  "West Covina, CA",
  "Norwalk, CA",
  "Santa Monica, CA",
  "Thousand Oaks, CA",
  "Simi Valley, CA",
  "Ventura, CA",
  "Oxnard, CA",
  "Camarillo, CA",
  "Santa Barbara, CA",
  "San Luis Obispo, CA",
  "Santa Maria, CA",
  "Salinas, CA",
  "Monterey, CA",
  "Santa Cruz, CA",
  "Fremont, CA",
  "Hayward, CA",
  "Sunnyvale, CA",
  "Santa Clara, CA",
  "Mountain View, CA",
  "Palo Alto, CA",
  "Redwood City, CA",
  "San Mateo, CA",
  "Daly City, CA",
  "Concord, CA",
  "Walnut Creek, CA",
  "Richmond, CA",
  "Berkeley, CA",
  "Vallejo, CA",
  "Fairfield, CA",
  "Vacaville, CA",
  "Napa, CA",
  "Santa Rosa, CA",
  "Roseville, CA",
  "Elk Grove, CA",
  "Folsom, CA",
  "Rocklin, CA",
  // Arizona cities
  "Scottsdale, AZ",
  "Tempe, AZ",
  "Chandler, AZ",
  "Gilbert, AZ",
  "Glendale, AZ",
  "Peoria, AZ",
  "Surprise, AZ",
  "Goodyear, AZ",
  "Avondale, AZ",
  "Buckeye, AZ",
  "Queen Creek, AZ",
  "Maricopa, AZ",
  "Casa Grande, AZ",
  "Oro Valley, AZ",
  "Marana, AZ",
  "Flagstaff, AZ",
  "Prescott, AZ",
  "Sedona, AZ",
  "Lake Havasu City, AZ",
  "Yuma, AZ",
  // Georgia cities
  "Marietta, GA",
  "Roswell, GA",
  "Johns Creek, GA",
  "Alpharetta, GA",
  "Sandy Springs, GA",
  "Smyrna, GA",
  "Dunwoody, GA",
  "Brookhaven, GA",
  "Peachtree City, GA",
  "Kennesaw, GA",
  "Lawrenceville, GA",
  "Duluth, GA",
  "Suwanee, GA",
  "Savannah, GA",
  "Augusta, GA",
  "Columbus, GA",
  "Macon, GA",
  "Athens, GA",
  // North Carolina cities
  "Durham, NC",
  "Cary, NC",
  "Apex, NC",
  "Chapel Hill, NC",
  "Greensboro, NC",
  "Winston-Salem, NC",
  "High Point, NC",
  "Wilmington, NC",
  "Fayetteville, NC",
  "Asheville, NC",
  "Concord, NC",
  "Gastonia, NC",
  "Huntersville, NC",
  "Mooresville, NC",
  "Hickory, NC",
  // Other states
  "Cincinnati, OH",
  "Cleveland, OH",
  "Columbus, OH",
  "Dayton, OH",
  "Akron, OH",
  "Toledo, OH",
  "Pittsburgh, PA",
  "Allentown, PA",
  "Reading, PA",
  "Newark, NJ",
  "Jersey City, NJ",
  "Paterson, NJ",
  "Elizabeth, NJ",
  "Edison, NJ",
  "Woodbridge, NJ",
  "Trenton, NJ",
  "Hartford, CT",
  "New Haven, CT",
  "Stamford, CT",
  "Bridgeport, CT",
  "Providence, RI",
  "Worcester, MA",
  "Springfield, MA",
  "Cambridge, MA",
  "Lowell, MA",
  "Buffalo, NY",
  "Rochester, NY",
  "Syracuse, NY",
  "Albany, NY",
  "Yonkers, NY",
  "White Plains, NY",
  "Salt Lake City, UT",
  "Provo, UT",
  "Ogden, UT",
  "St. George, UT",
  "Boise, ID",
  "Nampa, ID",
  "Meridian, ID",
  "Spokane, WA",
  "Tacoma, WA",
  "Vancouver, WA",
  "Bellevue, WA",
  "Kent, WA",
  "Everett, WA",
  "Reno, NV",
  "Henderson, NV",
  "North Las Vegas, NV",
  "Sparks, NV",
  "Albuquerque, NM",
  "Santa Fe, NM",
  "Las Cruces, NM",
  "Rio Rancho, NM",
  "Oklahoma City, OK",
  "Tulsa, OK",
  "Norman, OK",
  "Broken Arrow, OK",
  "Edmond, OK",
  "Wichita, KS",
  "Overland Park, KS",
  "Kansas City, KS",
  "Olathe, KS",
  "Topeka, KS",
  "Omaha, NE",
  "Lincoln, NE",
  "Des Moines, IA",
  "Cedar Rapids, IA",
  "Davenport, IA",
  "St. Louis, MO",
  "Kansas City, MO",
  "Springfield, MO",
  "Columbia, MO",
  "Independence, MO",
  "Minneapolis, MN",
  "St. Paul, MN",
  "Rochester, MN",
  "Bloomington, MN",
  "Plymouth, MN",
  "Madison, WI",
  "Milwaukee, WI",
  "Green Bay, WI",
  "Kenosha, WI",
  "Racine, WI",
  "Grand Rapids, MI",
  "Ann Arbor, MI",
  "Lansing, MI",
  "Flint, MI",
  "Warren, MI",
  "Sterling Heights, MI",
  "Indianapolis, IN",
  "Fort Wayne, IN",
  "Evansville, IN",
  "South Bend, IN",
  "Carmel, IN",
  "Fishers, IN",
  "Little Rock, AR",
  "Fayetteville, AR",
  "Fort Smith, AR",
  "Springdale, AR",
  "Jonesboro, AR",
  "Baton Rouge, LA",
  "Shreveport, LA",
  "Lafayette, LA",
  "Lake Charles, LA",
  "Kenner, LA",
  "Jackson, MS",
  "Gulfport, MS",
  "Southaven, MS",
  "Hattiesburg, MS",
  "Birmingham, AL",
  "Montgomery, AL",
  "Huntsville, AL",
  "Mobile, AL",
  "Tuscaloosa, AL",
  "Hoover, AL",
  "Columbia, SC",
  "Charleston, SC",
  "North Charleston, SC",
  "Greenville, SC",
  "Mount Pleasant, SC",
  "Knoxville, TN",
  "Chattanooga, TN",
  "Clarksville, TN",
  "Murfreesboro, TN",
  "Franklin, TN",
  "Lexington, KY",
  "Bowling Green, KY",
  "Owensboro, KY",
  "Covington, KY",
  "Richmond, VA",
  "Virginia Beach, VA",
  "Norfolk, VA",
  "Chesapeake, VA",
  "Newport News, VA",
  "Hampton, VA",
  "Alexandria, VA",
  "Arlington, VA",
  "Roanoke, VA",
  "Lynchburg, VA",
  "Charleston, WV",
  "Huntington, WV",
  "Parkersburg, WV",
  "Morgantown, WV",
  "Wilmington, DE",
  "Dover, DE",
  "Newark, DE",
  "Anchorage, AK",
  "Fairbanks, AK",
  "Juneau, AK",
  "Honolulu, HI",
  "Pearl City, HI",
  "Hilo, HI",
  "Kailua, HI",
  "Fargo, ND",
  "Bismarck, ND",
  "Grand Forks, ND",
  "Sioux Falls, SD",
  "Rapid City, SD",
  "Aberdeen, SD",
  "Billings, MT",
  "Missoula, MT",
  "Great Falls, MT",
  "Bozeman, MT",
  "Cheyenne, WY",
  "Casper, WY",
  "Laramie, WY",
  "Burlington, VT",
  "South Burlington, VT",
  "Rutland, VT",
  "Portland, ME",
  "Lewiston, ME",
  "Bangor, ME",
  "Manchester, NH",
  "Nashua, NH",
  "Concord, NH",
].sort();

interface GoogleAccount {
  id: number;
  domain: string;
  practiceName: string;
  hasGbp: boolean;
  hasGsc: boolean;
}

interface StatusDetail {
  currentStep: string;
  message: string;
  progress: number;
  stepsCompleted: string[];
  timestamps: Record<string, string>;
}

interface RankingJob {
  id: number;
  googleAccountId?: number;
  google_account_id?: number;
  domain: string;
  specialty: string;
  location: string | null;
  status: string;
  rankScore?: number | null;
  rank_score?: number | null;
  rankPosition?: number | null;
  rank_position?: number | null;
  totalCompetitors?: number | null;
  total_competitors?: number | null;
  observedAt?: string;
  observed_at?: string;
  createdAt?: string;
  created_at?: string;
  statusDetail?: StatusDetail | null;
  status_detail?: StatusDetail | null;
}

// Helper to normalize job data (handle both camelCase and snake_case)
const normalizeJob = (job: RankingJob): RankingJob => ({
  ...job,
  google_account_id: job.googleAccountId || job.google_account_id,
  rank_score: job.rankScore ?? job.rank_score,
  rank_position: job.rankPosition ?? job.rank_position,
  total_competitors: job.totalCompetitors ?? job.total_competitors,
  observed_at: job.observedAt || job.observed_at,
  created_at: job.createdAt || job.created_at,
  status_detail: job.statusDetail || job.status_detail,
});

interface RankingResult {
  id: number;
  domain: string;
  specialty: string;
  location: string | null;
  observedAt: string;
  rankScore: number | string;
  rankPosition: number;
  totalCompetitors: number;
  rankingFactors: {
    category_match: {
      score: number;
      weighted: number;
      weight: number;
      details?: string;
    };
    review_count: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
      details?: string;
    };
    star_rating: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
      details?: string;
    };
    keyword_name: {
      score: number;
      weighted: number;
      weight: number;
      details?: string;
    };
    review_velocity: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
      details?: string;
    };
    nap_consistency: {
      score: number;
      weighted: number;
      weight: number;
      details?: string;
    };
    gbp_activity: {
      score: number;
      weighted: number;
      weight: number;
      value?: number;
      details?: string;
    };
    sentiment: {
      score: number;
      weighted: number;
      weight: number;
      details?: string;
    };
  } | null;
  rawData: {
    client_gbp: {
      totalReviewCount?: number;
      averageRating?: number;
      primaryCategory?: string;
      reviewsLast30d?: number;
      postsLast90d?: number;
      photosCount?: number;
      hasWebsite?: boolean;
      hasPhone?: boolean;
      hasHours?: boolean;
      performance?: {
        calls?: number;
        directions?: number;
        clicks?: number;
      };
      _raw?: unknown;
    } | null;
    client_gsc: {
      rows?: unknown[];
      topQueries?: unknown[];
      totals?: {
        impressions?: number;
        clicks?: number;
        avgPosition?: number;
      };
      [key: string]: unknown;
    } | null;
    competitors: Record<string, unknown>[];
    competitors_discovered?: number;
    competitors_from_cache?: boolean;
    website_audit: Record<string, unknown> | null;
  } | null;
  llmAnalysis: {
    gaps: Array<{
      type: string;
      query_class?: string;
      area?: string;
      impact: string;
      reason: string;
    }>;
    drivers: Array<{
      factor: string;
      weight: string | number;
      direction: string;
    }>;
    render_text: string;
    client_summary?: string | null;
    top_recommendations?: Array<{
      priority: number;
      title: string;
    }>;
    verdict: string;
    confidence: number;
  } | null;
}

const SPECIALTIES = [
  { value: "orthodontist", label: "Orthodontist" },
  { value: "endodontist", label: "Endodontist" },
  { value: "periodontist", label: "Periodontist" },
  { value: "oral surgeon", label: "Oral Surgeon" },
  { value: "prosthodontist", label: "Prosthodontist" },
  { value: "pediatric dentist", label: "Pediatric Dentist" },
];

export function PracticeRanking() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [jobs, setJobs] = useState<RankingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobResults, setJobResults] = useState<Record<number, RankingResult>>(
    {}
  );
  const [loadingResults, setLoadingResults] = useState<number | null>(null);
  const [pollingJobs, setPollingJobs] = useState<Set<number>>(new Set());
  const [deletingJob, setDeletingJob] = useState<number | null>(null);
  const [refreshingCompetitors, setRefreshingCompetitors] = useState(false);

  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!locationSearch) return US_CITIES.slice(0, 20);
    const search = locationSearch.toLowerCase();
    return US_CITIES.filter((city) =>
      city.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [locationSearch]);

  useEffect(() => {
    fetchAccounts();
    fetchJobs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for job status updates (every 2 seconds for more responsive UI)
  useEffect(() => {
    if (pollingJobs.size === 0) return;

    const interval = setInterval(() => {
      pollingJobs.forEach((jobId) => {
        fetchJobStatus(jobId);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingJobs]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/practice-ranking/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch accounts");

      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/practice-ranking/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      // Normalize all jobs to handle both camelCase and snake_case
      setJobs(data.rankings.map(normalizeJob));

      // Start polling for any in-progress jobs
      const inProgress = data.rankings
        .filter(
          (j: RankingJob) => j.status === "processing" || j.status === "pending"
        )
        .map((j: RankingJob) => j.id);
      setPollingJobs(new Set(inProgress));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobStatus = async (jobId: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/practice-ranking/status/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      // Map the status response to job format (handle camelCase from API)
      const statusUpdate: Partial<RankingJob> = {
        status: data.status,
        status_detail: data.statusDetail,
        rank_score: data.rankScore,
        rank_position: data.rankPosition,
        total_competitors: data.totalCompetitors,
      };

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, ...statusUpdate } : j))
      );

      // Stop polling if job is complete or failed
      if (data.status === "completed" || data.status === "failed") {
        setPollingJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        // Refresh the full job list to get final data
        fetchJobs();
      }
    } catch (error) {
      console.error("Failed to fetch job status:", error);
    }
  };

  const fetchJobResults = async (jobId: number) => {
    if (jobResults[jobId]) return;

    setLoadingResults(jobId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/practice-ranking/results/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch results");

      const data = await response.json();
      // Extract the ranking object from the response
      setJobResults((prev) => ({ ...prev, [jobId]: data.ranking }));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoadingResults(null);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedAccount || !specialty || !location) {
      toast.error("Please select an account, specialty, and location");
      return;
    }

    setTriggering(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/practice-ranking/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          googleAccountId: selectedAccount,
          specialty,
          location,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger analysis");
      }

      const data = await response.json();
      toast.success("Analysis started!");

      // Normalize and add new job to list and start polling
      const normalizedJob = normalizeJob(data.ranking);
      setJobs((prev) => [normalizedJob, ...prev]);
      setPollingJobs((prev) => new Set([...prev, normalizedJob.id]));

      // Reset form
      setSelectedAccount(null);
      setSpecialty("");
      setLocation("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setTriggering(false);
    }
  };

  const toggleExpand = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      const job = jobs.find((j) => j.id === jobId);
      if (job?.status === "completed") {
        fetchJobResults(jobId);
      }
    }
  };

  const deleteJob = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion

    if (
      !confirm(
        "Are you sure you want to delete this analysis? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingJob(jobId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/practice-ranking/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete analysis");
      }

      toast.success("Analysis deleted successfully");

      // Remove from local state
      setJobs((prev) => prev.filter((j) => j.id !== jobId));

      // Clean up related state
      if (expandedJobId === jobId) {
        setExpandedJobId(null);
      }
      if (jobResults[jobId]) {
        setJobResults((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
      }
      setPollingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setDeletingJob(null);
    }
  };

  const refreshCompetitors = async (specialty: string, location: string) => {
    setRefreshingCompetitors(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        "/api/admin/practice-ranking/refresh-competitors",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ specialty, location }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to refresh competitors");
      }

      const data = await response.json();
      toast.success(data.message);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setRefreshingCompetitors(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const selectedAccountData = accounts.find((a) => a.id === selectedAccount);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          Total Analyses: {jobs.length}
        </div>
      </div>

      {/* Trigger New Analysis Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <Zap className="h-5 w-5 text-blue-600" />
          Run New Analysis
        </h3>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Account Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Google Account *
            </label>
            <select
              value={selectedAccount || ""}
              onChange={(e) =>
                setSelectedAccount(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.practiceName} ({account.domain})
                </option>
              ))}
            </select>
            {selectedAccountData && (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                {selectedAccountData.hasGbp && (
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                    GBP
                  </span>
                )}
                {selectedAccountData.hasGsc && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                    GSC
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Specialty Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Specialty *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select specialty...</option>
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Searchable Select */}
          <div className="relative" ref={locationDropdownRef}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Location *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={location || locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setLocation("");
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Search US cities..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {location && (
                <button
                  onClick={() => {
                    setLocation("");
                    setLocationSearch("");
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {showLocationDropdown && !location && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredCities.length > 0 ? (
                  <>
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city);
                          setLocationSearch("");
                          setShowLocationDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        <MapPin className="inline h-3 w-3 mr-2 text-gray-400" />
                        {city}
                      </button>
                    ))}
                    {locationSearch &&
                      !US_CITIES.some(
                        (c) => c.toLowerCase() === locationSearch.toLowerCase()
                      ) && (
                        <button
                          onClick={() => {
                            setLocation(locationSearch);
                            setLocationSearch("");
                            setShowLocationDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm border-t border-gray-100 bg-gray-50 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                        >
                          <Search className="inline h-3 w-3 mr-2 text-blue-500" />
                          Use "{locationSearch}" as custom location
                        </button>
                      )}
                  </>
                ) : locationSearch ? (
                  <button
                    onClick={() => {
                      setLocation(locationSearch);
                      setLocationSearch("");
                      setShowLocationDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-blue-500" />
                    Use "{locationSearch}" as custom location
                  </button>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Start typing to search cities...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Trigger Button */}
          <div className="flex items-end">
            <button
              onClick={triggerAnalysis}
              disabled={
                triggering || !selectedAccount || !specialty || !location
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {triggering ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Analysis History
          </h3>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              No analyses yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Run your first practice ranking analysis above
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="transition-colors hover:bg-gray-50">
                {/* Job Header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-4"
                  onClick={() => toggleExpand(job.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Building className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {job.domain}
                      </h4>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 capitalize">
                        {job.specialty}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {(() => {
                          const dateStr =
                            (job as unknown as { createdAt?: string })
                              .createdAt || job.created_at;
                          if (!dateStr) return "Unknown date";
                          const date = new Date(dateStr);
                          return isNaN(date.getTime())
                            ? "Unknown date"
                            : `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                        })()}
                      </span>
                    </div>
                    {/* Progress bar and status for pending/processing jobs */}
                    {(job.status === "processing" ||
                      job.status === "pending") && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{
                              width: `${job.status_detail?.progress ?? 0}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600"></span>
                          <span className="text-xs text-blue-600 font-medium">
                            {job.status_detail?.message ||
                              (job.status === "pending"
                                ? "Queued..."
                                : "Processing...")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {job.status_detail?.progress ?? 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {job.status === "completed" && job.rank_score != null && (
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            Number(job.rank_score)
                          )}`}
                        >
                          {Number(job.rank_score).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{job.rank_position ?? "-"} of{" "}
                          {job.total_competitors ?? "-"}
                        </div>
                      </div>
                    )}
                    {getStatusBadge(job.status)}
                    <button
                      onClick={(e) => deleteJob(job.id, e)}
                      disabled={deletingJob === job.id}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete analysis"
                    >
                      {deletingJob === job.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    <button className="text-gray-400">
                      {expandedJobId === job.id ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Results */}
                {expandedJobId === job.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                    {job.status === "completed" ? (
                      loadingResults === job.id ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      ) : jobResults[job.id] ? (
                        <RankingResultsView
                          result={jobResults[job.id]}
                          onRefreshCompetitors={() =>
                            refreshCompetitors(
                              job.specialty,
                              job.location || ""
                            )
                          }
                          refreshingCompetitors={refreshingCompetitors}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          Failed to load results
                        </div>
                      )
                    ) : job.status === "failed" ? (
                      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span>Analysis failed. Please try again.</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-gray-600">
                            {job.status_detail?.message || "Processing..."}
                          </span>
                        </div>
                        {job.status_detail && (
                          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-blue-600 transition-all duration-500"
                              style={{
                                width: `${job.status_detail.progress}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Results View - Technical Details
function RankingResultsView({
  result,
  onRefreshCompetitors,
  refreshingCompetitors,
}: {
  result: RankingResult;
  onRefreshCompetitors?: () => void;
  refreshingCompetitors?: boolean;
}) {
  const factors = result.rankingFactors;
  const competitors =
    (result.rawData?.competitors as Array<{
      name: string;
      rankScore: number;
      rankPosition: number;
      totalReviews: number;
      averageRating: number;
      reviewsLast30d?: number;
      primaryCategory?: string;
    }>) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-gray-500">Rank Score</div>
          <div
            className={`mt-1 text-3xl font-bold ${getScoreColor(
              Number(result.rankScore)
            )}`}
          >
            {Number(result.rankScore).toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-gray-500">Position</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            #{result.rankPosition}{" "}
            <span className="text-sm text-gray-500">
              of {result.totalCompetitors}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-gray-500">Reviews</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {result.rawData?.client_gbp?.totalReviewCount || 0}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-gray-500">Rating</div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {(
                factors?.star_rating?.value ??
                result.rawData?.client_gbp?.averageRating ??
                0
              ).toFixed(1)}
            </span>
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      </div>

      {/* LLM Analysis Summary */}
      {result.llmAnalysis?.client_summary && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Analysis Summary</h4>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">
            {result.llmAnalysis.client_summary}
          </p>
        </div>
      )}

      {/* Ranking Factors Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-4 font-semibold text-gray-900">
          Ranking Factors Breakdown
        </h4>
        <div className="space-y-3">
          {factors &&
            Object.entries(factors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-40 text-sm text-gray-600 capitalize">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${(value?.score ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900">
                  {((value?.score ?? 0) * 100).toFixed(0)}%
                </div>
                <div className="w-16 text-right text-xs text-gray-500">
                  +{value?.weighted?.toFixed(1) ?? "0.0"}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Competitors */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top Competitors
          </h4>
          {onRefreshCompetitors && (
            <button
              onClick={onRefreshCompetitors}
              disabled={refreshingCompetitors}
              className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {refreshingCompetitors ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </>
              )}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-500">
                  Rank
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-500">
                  Name
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">
                  Score
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">
                  Reviews
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-500">
                  Rating
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-500">
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              {competitors.slice(0, 10).map((comp, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-2">
                    <span className="flex items-center gap-1">
                      {idx === 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                      #{comp.rankPosition}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-medium text-gray-900">
                    {comp.name}
                  </td>
                  <td
                    className={`py-2 px-2 text-center font-medium ${getScoreColor(
                      comp.rankScore
                    )}`}
                  >
                    {comp.rankScore?.toFixed(1) || "-"}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-700">
                    {comp.totalReviews}
                  </td>
                  <td className="py-2 px-2 text-center text-gray-700">
                    {comp.averageRating?.toFixed(1) || "-"}
                  </td>
                  <td className="py-2 px-2 text-gray-600 truncate max-w-[150px]">
                    {comp.primaryCategory || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LLM Analysis Details */}
      {result.llmAnalysis && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gaps */}
          {result.llmAnalysis.gaps && result.llmAnalysis.gaps.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="mb-3 font-semibold text-gray-900">
                Identified Gaps
              </h4>
              <div className="space-y-2">
                {result.llmAnalysis.gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                        gap.impact === "high"
                          ? "bg-red-100 text-red-700"
                          : gap.impact === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {gap.impact}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {gap.type}: {gap.area || gap.query_class}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {gap.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drivers */}
          {result.llmAnalysis.drivers &&
            result.llmAnalysis.drivers.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-gray-900">
                  Key Drivers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.llmAnalysis.drivers.map((driver, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          driver.direction === "positive"
                            ? "bg-green-500"
                            : driver.direction === "negative"
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-gray-700">{driver.factor}</span>
                      <span className="text-xs text-gray-400">
                        ({driver.weight})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Data Source Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Data Collection
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Competitors Discovered:</span>
              <span className="font-medium">
                {result.rawData?.competitors_discovered ||
                  result.rawData?.competitors?.length ||
                  0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Data Source:</span>
              <span className="font-medium">
                {result.rawData?.competitors_from_cache ? "Cached" : "Fresh"}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            GBP Profile
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium truncate max-w-[100px]">
                {result.rawData?.client_gbp?.primaryCategory || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Posts (90d):</span>
              <span className="font-medium">
                {result.rawData?.client_gbp?.postsLast90d ?? 0}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">GSC Data</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Queries:</span>
              <span className="font-medium">
                {result.rawData?.client_gsc?.topQueries?.length ||
                  result.rawData?.client_gsc?.rows?.length ||
                  0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Impressions:</span>
              <span className="font-medium">
                {result.rawData?.client_gsc?.totals?.impressions?.toLocaleString() ||
                  0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeRanking;
