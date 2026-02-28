import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./index";

// ─── Types ───────────────────────────────────────────────────────

export interface Mind {
  id: string;
  name: string;
  slug: string;
  personality_prompt: string;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MindWithVersion extends Mind {
  published_version?: MindVersion;
}

export interface MindVersion {
  id: string;
  mind_id: string;
  version_number: number;
  brain_markdown: string;
  created_by_admin_id: string | null;
  created_at: string;
}

export interface MindSource {
  id: string;
  mind_id: string;
  name: string | null;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryBatch {
  id: string;
  mind_id: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
}

export interface DiscoveredPost {
  id: string;
  mind_id: string;
  source_id: string;
  batch_id: string;
  url: string;
  title: string | null;
  published_at: string | null;
  status: "pending" | "approved" | "ignored" | "processed";
  discovered_at: string;
  processed_at: string | null;
  last_error: string | null;
  sync_run_id: string | null;
}

export interface SyncRun {
  id: string;
  mind_id: string;
  batch_id: string | null;
  type: "scrape_compare" | "compile_publish";
  status: "queued" | "running" | "failed" | "completed";
  created_by_admin_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

export interface SyncStep {
  id: string;
  sync_run_id: string;
  step_order: number;
  step_name: string;
  status: "pending" | "running" | "completed" | "failed";
  log_output: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

export interface SyncProposal {
  id: string;
  sync_run_id: string;
  mind_id: string;
  type: "NEW" | "UPDATE" | "CONFLICT";
  summary: string;
  target_excerpt: string | null;
  proposed_text: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "finalized";
  created_at: string;
  updated_at: string;
}

export interface MindMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface MindConversation {
  id: string;
  mind_id: string;
  title: string | null;
  message_count: number;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompactionMessage {
  type: "compaction";
  summary: string;
  message_count: number;
  compacted_at: string;
}

export interface MindStatus {
  canStartScrape: boolean;
  canCompile: boolean;
  scrapeBlockingReasons: string[];
  compileBlockingReasons: string[];
  openBatchId: string | null;
  activeSyncRunId: string | null;
  activeSyncRunType: "scrape_compare" | "compile_publish" | null;
  latestScrapeRunId: string | null;
}

export interface SyncRunDetails {
  run: SyncRun;
  steps: SyncStep[];
  proposalCounts: Record<string, number>;
}

// ─── Mind CRUD ───────────────────────────────────────────────────

export async function listMinds(): Promise<Mind[]> {
  const res = await apiGet({ path: "/admin/minds" });
  return res.success ? res.data : [];
}

export async function getMind(mindId: string): Promise<MindWithVersion | null> {
  const res = await apiGet({ path: `/admin/minds/${mindId}` });
  return res.success ? res.data : null;
}

export async function createMind(name: string, personalityPrompt: string): Promise<Mind | null> {
  const res = await apiPost({
    path: "/admin/minds",
    passedData: { name, personality_prompt: personalityPrompt },
  });
  return res.success ? res.data : null;
}

export async function updateMind(
  mindId: string,
  updates: { name?: string; personality_prompt?: string }
): Promise<Mind | null> {
  const res = await apiPut({
    path: `/admin/minds/${mindId}`,
    passedData: updates,
  });
  return res.success ? res.data : null;
}

export async function updateBrain(
  mindId: string,
  brainMarkdown: string
): Promise<{ version: MindVersion; warning?: string } | null> {
  const res = await apiPut({
    path: `/admin/minds/${mindId}/brain`,
    passedData: { brain_markdown: brainMarkdown },
  });
  return res.success ? res.data : null;
}

export async function listVersions(mindId: string): Promise<MindVersion[]> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/versions` });
  return res.success ? res.data : [];
}

export async function publishVersion(mindId: string, versionId: string): Promise<boolean> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/versions/${versionId}/publish`,
  });
  return !!res.success;
}

export async function deleteMind(mindId: string): Promise<boolean> {
  const res = await apiDelete({ path: `/admin/minds/${mindId}` });
  return !!res.success;
}

// ─── Chat ────────────────────────────────────────────────────────

export async function sendChatMessage(
  mindId: string,
  message: string,
  conversationId?: string
): Promise<{ conversationId: string; reply: string } | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/chat`,
    passedData: { message, conversationId },
  });
  return res.success ? res.data : null;
}

export async function sendChatMessageStream(
  mindId: string,
  message: string,
  conversationId?: string
): Promise<Response> {
  const api = (import.meta as any)?.env?.VITE_API_URL ?? "/api";

  // Replicate auth header logic from getCommonHeaders
  const isPilot =
    typeof window !== "undefined" &&
    (window.sessionStorage?.getItem("pilot_mode") === "true" ||
      !!window.sessionStorage?.getItem("token"));

  let jwt: string | null = null;
  if (isPilot) {
    jwt = window.sessionStorage.getItem("token");
  } else {
    jwt = localStorage.getItem("auth_token") || localStorage.getItem("token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  return fetch(`${api}/admin/minds/${mindId}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, conversationId }),
  });
}

export async function getConversation(
  mindId: string,
  conversationId: string
): Promise<MindMessage[]> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/conversations/${conversationId}`,
  });
  return res.success ? res.data : [];
}

export async function listConversations(mindId: string): Promise<MindConversation[]> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/conversations` });
  return res.success ? res.data : [];
}

export async function renameConversation(mindId: string, conversationId: string, title: string): Promise<boolean> {
  const res = await apiPatch({
    path: `/admin/minds/${mindId}/conversations/${conversationId}`,
    passedData: { title },
  });
  return !!res.success;
}

export async function deleteConversation(mindId: string, conversationId: string): Promise<boolean> {
  const res = await apiDelete({
    path: `/admin/minds/${mindId}/conversations/${conversationId}`,
  });
  return !!res.success;
}

// ─── Sources ─────────────────────────────────────────────────────

export async function listSources(mindId: string): Promise<MindSource[]> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/sources` });
  return res.success ? res.data : [];
}

export async function createSource(
  mindId: string,
  url: string,
  name?: string
): Promise<MindSource | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/sources`,
    passedData: { url, name },
  });
  return res.success ? res.data : null;
}

export async function deleteSource(mindId: string, sourceId: string): Promise<boolean> {
  const res = await apiDelete({
    path: `/admin/minds/${mindId}/sources/${sourceId}`,
  });
  return !!res.success;
}

export async function toggleSource(
  mindId: string,
  sourceId: string,
  isActive: boolean
): Promise<boolean> {
  const res = await apiPatch({
    path: `/admin/minds/${mindId}/sources/${sourceId}`,
    passedData: { is_active: isActive },
  });
  return !!res.success;
}

// ─── Discovery ───────────────────────────────────────────────────

export async function getDiscoveryBatch(
  mindId: string
): Promise<{ batch: DiscoveryBatch | null; posts: DiscoveredPost[] }> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/discovery-batch` });
  return res.success ? res.data : { batch: null, posts: [] };
}

export async function updatePostStatus(
  mindId: string,
  postId: string,
  status: "pending" | "approved" | "ignored"
): Promise<boolean> {
  const res = await apiPatch({
    path: `/admin/minds/${mindId}/discovered-posts/${postId}`,
    passedData: { status },
  });
  return !!res.success;
}

export async function triggerDiscovery(mindId: string): Promise<boolean> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/discovery/run`,
  });
  return !!res.success;
}

export async function deleteDiscoveryBatch(
  mindId: string,
  batchId: string
): Promise<boolean> {
  const res = await apiDelete({
    path: `/admin/minds/${mindId}/discovery-batch/${batchId}`,
  });
  return !!res.success;
}

// ─── Sync Runs ───────────────────────────────────────────────────

export async function startScrapeCompare(mindId: string): Promise<string | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/sync-runs/scrape-compare`,
  });
  return res.success ? res.data.runId : null;
}

export async function startCompilePublish(mindId: string): Promise<string | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/sync-runs/compile`,
  });
  return res.success ? res.data.runId : null;
}

export async function listSyncRuns(mindId: string): Promise<SyncRun[]> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/sync-runs` });
  return res.success ? res.data : [];
}

export async function getSyncRun(mindId: string, runId: string): Promise<SyncRunDetails | null> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/sync-runs/${runId}`,
  });
  return res.success ? res.data : null;
}

export async function getRunProposals(mindId: string, runId: string): Promise<SyncProposal[]> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/sync-runs/${runId}/proposals`,
  });
  return res.success ? res.data : [];
}

// ─── Proposals ───────────────────────────────────────────────────

export async function updateProposalStatus(
  mindId: string,
  proposalId: string,
  status: "approved" | "rejected" | "pending"
): Promise<boolean> {
  const res = await apiPatch({
    path: `/admin/minds/${mindId}/proposals/${proposalId}`,
    passedData: { status },
  });
  return !!res.success;
}

// ─── Status ──────────────────────────────────────────────────────

export async function listSyncRunsByBatch(
  mindId: string,
  batchId: string
): Promise<SyncRun[]> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/batches/${batchId}/sync-runs`,
  });
  return res.success ? res.data : [];
}

export async function getMindStatus(mindId: string): Promise<MindStatus> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/status` });
  return res.success
    ? res.data
    : {
        canStartScrape: false,
        canCompile: false,
        scrapeBlockingReasons: [],
        compileBlockingReasons: [],
        openBatchId: null,
        activeSyncRunId: null,
        activeSyncRunType: null,
        latestScrapeRunId: null,
      };
}

// ─── Skills ─────────────────────────────────────────────────────

export interface MindSkill {
  id: string;
  mind_id: string;
  name: string;
  slug: string;
  definition: string;
  output_schema: object | null;
  status: "draft" | "ready" | "generating" | "failed";
  created_at: string;
  updated_at: string;
}

export interface MindSkillNeuron {
  id: string;
  skill_id: string;
  mind_version_id: string;
  neuron_markdown: string;
  generated_at: string;
}

export interface SkillAnalytics {
  totalCalls: number;
  callsToday: number;
  dailyCounts: { date: string; count: number }[];
}

export async function listSkills(mindId: string): Promise<MindSkill[]> {
  const res = await apiGet({ path: `/admin/minds/${mindId}/skills` });
  return res.success ? res.data : [];
}

export async function getSkill(
  mindId: string,
  skillId: string,
): Promise<MindSkill | null> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/skills/${skillId}`,
  });
  return res.success ? res.data : null;
}

export async function createSkill(
  mindId: string,
  name: string,
  definition: string,
  outputSchema: object | null,
): Promise<MindSkill | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/skills`,
    passedData: { name, definition, outputSchema },
  });
  return res.success ? res.data : null;
}

export async function updateSkill(
  mindId: string,
  skillId: string,
  fields: { name?: string; definition?: string; outputSchema?: object | null },
): Promise<MindSkill | null> {
  const res = await apiPut({
    path: `/admin/minds/${mindId}/skills/${skillId}`,
    passedData: fields,
  });
  return res.success ? res.data : null;
}

export async function deleteSkill(
  mindId: string,
  skillId: string,
): Promise<boolean> {
  const res = await apiDelete({
    path: `/admin/minds/${mindId}/skills/${skillId}`,
  });
  return !!res.success;
}

export async function generateSkillNeuron(
  mindId: string,
  skillId: string,
): Promise<MindSkillNeuron | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/skills/${skillId}/generate`,
  });
  return res.success ? res.data : null;
}

export async function getSkillNeuron(
  mindId: string,
  skillId: string,
): Promise<MindSkillNeuron | null> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/skills/${skillId}/neuron`,
  });
  return res.success ? res.data : null;
}

export async function getSkillAnalytics(
  mindId: string,
  skillId: string,
): Promise<SkillAnalytics> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/skills/${skillId}/analytics`,
  });
  return res.success
    ? res.data
    : { totalCalls: 0, callsToday: 0, dailyCounts: [] };
}

export async function suggestSkillDefinition(
  mindId: string,
  hint: string,
): Promise<{ definition: string; outputSchema: object | null } | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/skills/suggest`,
    passedData: { hint },
  });
  return res.success ? res.data : null;
}

// ─── Parenting ──────────────────────────────────────────────────

export interface ParentingSession {
  id: string;
  mind_id: string;
  status: "chatting" | "reading" | "proposals" | "compiling" | "completed" | "abandoned";
  result: "learned" | "no_changes" | "all_rejected" | null;
  knowledge_buffer: string;
  sync_run_id: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParentingMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ParentingSessionDetails {
  session: ParentingSession;
  messages: ParentingMessage[];
  syncRun: SyncRun | null;
  syncSteps: SyncStep[] | null;
  proposals: SyncProposal[] | null;
}

export async function createParentingSession(
  mindId: string
): Promise<{ session: ParentingSession; greeting: string } | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/parenting/sessions`,
  });
  return res.success ? res.data : null;
}

export async function listParentingSessions(
  mindId: string
): Promise<ParentingSession[]> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/parenting/sessions`,
  });
  return res.success ? res.data : [];
}

export async function getParentingSession(
  mindId: string,
  sessionId: string
): Promise<ParentingSessionDetails | null> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}`,
  });
  return res.success ? res.data : null;
}

export async function sendParentingChatStream(
  mindId: string,
  sessionId: string,
  message: string
): Promise<Response> {
  const api = (import.meta as any)?.env?.VITE_API_URL ?? "/api";

  const isPilot =
    typeof window !== "undefined" &&
    (window.sessionStorage?.getItem("pilot_mode") === "true" ||
      !!window.sessionStorage?.getItem("token"));

  let jwt: string | null = null;
  if (isPilot) {
    jwt = window.sessionStorage.getItem("token");
  } else {
    jwt = localStorage.getItem("auth_token") || localStorage.getItem("token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  return fetch(
    `${api}/admin/minds/${mindId}/parenting/sessions/${sessionId}/chat/stream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    }
  );
}

export async function triggerParentingReading(
  mindId: string,
  sessionId: string
): Promise<{ proposalCount: number; runId: string } | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/trigger-reading`,
  });
  return res.success ? res.data : null;
}

export async function getParentingProposals(
  mindId: string,
  sessionId: string
): Promise<SyncProposal[]> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/proposals`,
  });
  return res.success ? res.data : [];
}

export async function updateParentingProposal(
  mindId: string,
  sessionId: string,
  proposalId: string,
  status: "approved" | "rejected" | "pending"
): Promise<boolean> {
  const res = await apiPatch({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/proposals/${proposalId}`,
    passedData: { status },
  });
  return !!res.success;
}

export async function startParentingCompile(
  mindId: string,
  sessionId: string
): Promise<{ runId: string; autoCompleted?: boolean } | null> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/compile`,
  });
  return res.success ? res.data : null;
}

export async function getParentingCompileStatus(
  mindId: string,
  sessionId: string
): Promise<any> {
  const res = await apiGet({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/compile-status`,
  });
  return res.success ? res.data : null;
}

export async function deleteParentingSession(
  mindId: string,
  sessionId: string
): Promise<boolean> {
  const res = await apiDelete({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}`,
  });
  return !!res.success;
}

export async function abandonParentingSession(
  mindId: string,
  sessionId: string
): Promise<boolean> {
  const res = await apiPost({
    path: `/admin/minds/${mindId}/parenting/sessions/${sessionId}/abandon`,
  });
  return !!res.success;
}
