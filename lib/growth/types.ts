// Types for the Growth Command Center's persistence layer (supabase/growth-schema.sql).
// growth_items is deliberately polymorphic — see the schema file's own
// comment for why. These per-type `data` shapes are documentation and a
// compile-time contract for the module pages, not enforced by the DB.

export type GrowthModule =
  | "market_intelligence"
  | "customer_intelligence"
  | "seo"
  | "leads"
  | "social"
  | "creative"
  | "ads"
  | "cro"
  | "studio";

export type GrowthConfidence = "observed" | "inferred" | "hypothesis";
export type GrowthPriority = "high" | "medium" | "low";

export interface GrowthItemRow {
  id: string;
  module: GrowthModule;
  type: string;
  title: string;
  status: string;
  priority: GrowthPriority | null;
  impact: number | null;
  effort: number | null;
  confidence: GrowthConfidence | null;
  evidence: string | null;
  source: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- market_intelligence -----------------------------------------------

export interface CompetitorData {
  url: string | null;
  category: string | null;
  targetCustomer: string | null;
  positioning: string | null;
  pricingApproach: string | null;
  cta: string | null;
  productCategories: string[];
  strengths: string[];
  weaknesses: string[];
  trustSignals: string[];
  contentStrategy: string | null;
  seoPresence: string | null;
  socialPresence: string | null;
  advertisingObservations: string | null;
  opportunityForEightByFour: string | null;
  /** Raw evidence from a real Firecrawl scrape — populated by scrapeCompetitorAction, never hand-written. The structured fields above still need a human (or a future LLM step, not wired) to read this and fill them in; a scrape alone does not populate them. */
  firecrawlScrape?: {
    title: string | null;
    description: string | null;
    markdownExcerpt: string;
    sourceUrl: string;
    scrapedAt: string;
  };
}

export const EMPTY_COMPETITOR_DATA: CompetitorData = {
  url: null,
  category: null,
  targetCustomer: null,
  positioning: null,
  pricingApproach: null,
  cta: null,
  productCategories: [],
  strengths: [],
  weaknesses: [],
  trustSignals: [],
  contentStrategy: null,
  seoPresence: null,
  socialPresence: null,
  advertisingObservations: null,
  opportunityForEightByFour: null,
};

export interface OpportunityData {
  evidence: string | null;
  competitorGap: string | null;
  eightByFourAngle: string | null;
  icp: string | null;
  funnelStage: string | null;
  recommendedAction: string | null;
}

// --- seo -----------------------------------------------------------------

export interface KeywordOpportunityData {
  intent: string | null;
  volume: number | null; // null = unknown, never a fabricated number
  difficulty: number | null;
  currentRank: number | null;
  targetPage: string | null;
  pageExists: boolean | null;
  commercialValue: GrowthPriority | null;
}

export interface ContentQueueData {
  seoKeyword: string | null;
  searchIntent: string | null;
  icp: string | null;
  funnelStage: string | null;
  targetUrl: string | null;
  internalLinks: string[];
  schema: string | null;
  geoNotes: string | null;
}

// --- leads (CRM) -----------------------------------------------------------

export interface ProspectData {
  website: string | null;
  city: string | null;
  primaryMarket: string | null;
  companyType: string | null;
  projectsGeography: string | null;
  icpFit: string | null;
  reasonForFit: string | null;
  likelyNeed: string | null;
  contactPerson: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  outreachAngle: string | null;
  lastContact: string | null;
  nextAction: string | null;
  notes: string | null;
}

export const PROSPECT_STAGES = [
  "New", "Qualified", "Researching", "Ready for Outreach", "Contacted",
  "Replied", "Meeting", "Quote", "Won", "Lost",
] as const;
export type ProspectStage = (typeof PROSPECT_STAGES)[number];

// --- social / creative / ads / cro / studio (lighter shapes) --------------

export interface SocialPostData {
  platform: "LinkedIn" | "Instagram" | "X" | null;
  hook: string | null;
  format: string | null;
  audience: string | null;
  cta: string | null;
  creativeRequired: boolean;
  publishDate: string | null;
  performance: string | null; // free text until an analytics adapter exists
}

export interface CreativeBriefData {
  campaign: string | null;
  audience: string | null;
  problem: string | null;
  hook: string | null;
  promise: string | null;
  proof: string | null;
  cta: string | null;
  format: string | null;
  aspectRatio: string | null;
  scriptCopy: string | null;
  visualDirection: string | null;
}

export interface CampaignData {
  objective: string | null;
  audience: string | null;
  angle: string | null;
  creative: string | null;
  offer: string | null;
  landingPage: string | null;
  // Metrics stay null until Meta is connected — never a placeholder number.
  spend: number | null;
  impressions: number | null;
  ctr: number | null;
  cpc: number | null;
  leads: number | null;
  cpl: number | null;
  quoteRequests: number | null;
  orders: number | null;
  cac: number | null;
  revenue: number | null;
  roas: number | null;
}

export interface CroIssueData {
  affectedPage: string | null;
  evidence: string | null;
  impact: string | null;
  recommendedChange: string | null;
}

export interface StudioServiceData {
  landingPage: string | null;
  topMaterials: string[];
  croOpportunities: string[];
}

// --- growth_tasks ----------------------------------------------------------

export type GrowthTaskType =
  | "COMPETITOR_ANALYSIS"
  | "SEO_RESEARCH"
  | "CONTENT_BRIEF"
  | "CONTENT_DRAFT"
  | "PROSPECT_RESEARCH"
  | "OUTREACH"
  | "SOCIAL_POST"
  | "AD_CREATIVE"
  | "CRO_AUDIT"
  | "STUDIO_ANALYSIS";

export type GrowthTaskStatus = "queued" | "running" | "needs_review" | "completed" | "failed";

export interface GrowthTaskRow {
  id: string;
  type: GrowthTaskType;
  title: string;
  module: GrowthModule;
  status: GrowthTaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  source: string | null;
  related_item_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- growth_integrations -----------------------------------------------

export type IntegrationStatus = "connected" | "not_connected" | "error";

export interface GrowthIntegrationRow {
  id: string;
  label: string;
  status: IntegrationStatus;
  last_sync: string | null;
  notes: string | null;
  config: Record<string, unknown>;
}

// --- growth_memory -----------------------------------------------------

export type GrowthMemorySection = "company" | "icp" | "positioning" | "brand_voice" | "growth_goals" | "content_pillars";

export interface GrowthMemoryRow {
  id: GrowthMemorySection;
  data: unknown;
  updated_at: string;
  updated_by: string | null;
}

// --- prioritization ------------------------------------------------------

/**
 * Priority Score = Impact x Confidence-weight / Effort, per the brief's own
 * formula. Confidence is not a number in the DB (it's observed/inferred/
 * hypothesis, kept human-readable) so it's weighted here rather than stored
 * pre-multiplied — an item's raw impact/effort stay visible and editable
 * without back-solving through a weight.
 */
const CONFIDENCE_WEIGHT: Record<GrowthConfidence, number> = {
  observed: 1,
  inferred: 0.7,
  hypothesis: 0.4,
};

export function priorityScore(impact: number | null, effort: number | null, confidence: GrowthConfidence | null): number | null {
  if (impact === null || effort === null || effort === 0) return null;
  const weight = confidence ? CONFIDENCE_WEIGHT[confidence] : 0.7;
  return Math.round(((impact * weight) / effort) * 100) / 100;
}
