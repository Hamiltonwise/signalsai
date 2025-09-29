import { apiDelete, apiGet, apiPatch, apiPost } from "./index";

export interface PmsJob {
  id: number;
  time_elapsed: number | null;
  status: string;
  response_log: unknown;
  timestamp: string;
  is_approved: boolean;
  is_client_approved: boolean;
  domain?: string | null;
}

export interface FetchPmsJobsParams {
  page?: number;
  status?: string[];
  isApproved?: boolean;
  domain?: string;
}

export interface FetchPmsJobsResponse {
  success: boolean;
  data?: {
    jobs: PmsJob[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
    };
    filters?: {
      statuses?: string[];
      isApproved?: boolean;
      domain?: string;
    };
  };
  error?: string;
  message?: string;
}

export interface PMSRecord {
  date: string;
  referral_type: string;
  referral_source?: string;
  production_amount: number;
  appointment_type?: string;
  treatment_category?: string;
  notes?: string;
}

export interface PMSUploadRequest {
  clientId: string;
  file: File;
  pmsType?: string;
}

export interface PMSUploadResponse {
  success: boolean;
  data?: {
    recordsProcessed: number;
    recordsStored: number;
  };
  error?: string;
  message?: string;
}

export interface PmsKeyDataMonth {
  month: string;
  selfReferrals: number;
  doctorReferrals: number;
  totalReferrals: number;
  productionTotal: number;
}

export interface PmsKeyDataSource {
  rank: number;
  name: string;
  referrals: number;
  production: number;
  percentage: number;
}

export interface PmsKeyDataResponse {
  success: boolean;
  data?: {
    domain: string;
    months: PmsKeyDataMonth[];
    sources: PmsKeyDataSource[];
    totals: {
      totalReferrals: number;
      totalProduction: number;
    };
    stats: {
      jobCount: number;
      earliestJobTimestamp: string | null;
      latestJobTimestamp: string | null;
      distinctMonths: number;
      latestJobStatus: string | null;
      latestJobIsApproved: boolean | null;
      latestJobIsClientApproved: boolean | null;
      latestJobId: number | null;
    };
    latestJobRaw: unknown;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch paginated PMS job records
 */
export async function fetchPmsJobs(
  params: FetchPmsJobsParams = {}
): Promise<FetchPmsJobsResponse> {
  const query = new URLSearchParams();

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }

  if (params.status?.length) {
    query.set("status", params.status.join(","));
  }

  if (typeof params.isApproved === "boolean") {
    query.set("isApproved", params.isApproved ? "1" : "0");
  }

  if (params.domain) {
    query.set("domain", params.domain);
  }

  const queryString = query.toString();

  return apiGet({
    path: `/pms/jobs${queryString ? `?${queryString}` : ""}`,
  });
}

/**
 * Upload PMS data via CSV file
 * @param request - Contains clientId and file
 * @returns Promise with upload result
 */
export async function uploadPMSData(
  request: PMSUploadRequest
): Promise<PMSUploadResponse> {
  try {
    // Create FormData to send the file
    const formData = new FormData();
    formData.append("csvFile", request.file);
    formData.append("clientId", request.clientId);
    if (request.pmsType) {
      formData.append("pmsType", request.pmsType);
    }

    // Use apiPost with FormData support
    const result = await apiPost({
      path: "/pms/upload",
      passedData: formData,
      additionalHeaders: {
        Accept: "application/json",
      },
    });

    return result;
  } catch (error) {
    console.error("PMS upload API error:", error);
    return {
      success: false,
      error: "Failed to upload PMS data. Please try again.",
    };
  }
}

/**
 * Get PMS data summary for a client
 * @param clientId - Client identifier
 * @returns Promise with PMS data summary
 */
export async function getPMSDataSummary(clientId: string) {
  try {
    const response = await apiPost({
      path: "/pms/summary",
      passedData: { clientId },
      additionalHeaders: {
        Accept: "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("PMS summary API error:", error);
    return {
      success: false,
      error: "Failed to fetch PMS data summary.",
    };
  }
}

/**
 * Toggle or set the approval state for a PMS job
 */
export async function togglePmsJobApproval(jobId: number, isApproved: boolean) {
  return apiPatch({
    path: `/pms/jobs/${jobId}/approval`,
    passedData: { isApproved },
  });
}

/**
 * Persist updates to a PMS job response log
 */
export async function updatePmsJobResponse(
  jobId: number,
  responseLog: string | null
) {
  return apiPatch({
    path: `/pms/jobs/${jobId}/response`,
    passedData: { responseLog },
  });
}

export async function updatePmsJobClientApproval(
  jobId: number,
  isClientApproved: boolean
) {
  return apiPatch({
    path: `/pms/jobs/${jobId}/client-approval`,
    passedData: { isClientApproved },
  });
}

/**
 * Delete a PMS job entry permanently.
 */
export async function deletePmsJob(jobId: number) {
  return apiDelete({
    path: `/pms/jobs/${jobId}`,
  });
}

/**
 * Fetch PMS key data aggregation for a given domain.
 */
export async function fetchPmsKeyData(
  domain?: string
): Promise<PmsKeyDataResponse> {
  const query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  return apiGet({ path: `/pms/keyData${query}` }) as Promise<PmsKeyDataResponse>;
}
