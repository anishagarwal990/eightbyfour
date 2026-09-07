// Hand-maintained until we wire up `supabase gen types` — kept minimal,
// just the shape the app code actually reads/writes.
export interface ProductRow {
  id: number;
  slug: string;
  category: string;
  brand: string;
  name: string;
  collection: string | null;
  grade: string | null;
  size: string | null;
  thicknesses: string[] | null;
  sd_code: string | null;
  eb_code: string | null;
  finish: string | null;
  finishes: string[] | null;
  mood: string | null;
  tone: string | null;
  main_img_url: string | null;
  edge_img_url: string | null;
  app_img_url: string | null;
  gallery_img_urls: string[] | null;
  price_table: unknown;
  variants: unknown;
  description: string | null;
  core: string | null;
  density: string | null;
  warranty: string | null;
  certifications: string[] | null;
  applications: string[] | null;
  catalogue_url: string | null;
  tech_sheet_url: string | null;
  installation_guide_url: string | null;
  features: string[] | null;
  how_to_apply: string[] | null;
  spec_table: { label: string; value: string }[] | null;
  custom_faqs: { question: string; answer: string }[] | null;
  created_at: string;
  updated_at: string;
}

export interface BrandRow {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  overview: string | null;
  website_url: string | null;
  range_image_url: string | null;
  created_at: string;
}

// ---------- Enquiry OS (supabase/enquiry-os-slice1.sql) ----------

export interface CustomerRow {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  /** Generated column — last 10 digits of `phone`, for duplicate detection. */
  phone_normalized: string | null;
  whatsapp: string | null;
  email: string | null;
  gstin: string | null;
  billing_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * The enquiry header. The legacy columns — ref, type, product_id, items, name,
 * phone, email, message, thickness, finish, sample_requested, the uploaded_
 * pair and the utm_ set — belong to the public website form and stay exactly
 * as they were. Everything from `customer_id` down was added for the internal
 * pipeline and is nullable.
 */
export interface InquiryRow {
  id: string;
  ref: string;
  type: string;
  product_id: number | null;
  items: unknown;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  thickness: string | null;
  finish: string | null;
  sample_requested: boolean;
  uploaded_file_name: string | null;
  uploaded_file_url: string | null;
  status: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_path: string | null;
  customer_id: string | null;
  source: string | null;
  project_name: string | null;
  delivery_location: string | null;
  required_delivery_date: string | null;
  assigned_to: string | null;
  priority: string | null;
  next_followup_at: string | null;
  requirement_verified_at: string | null;
  requested_brand: string | null;
  internal_notes: string | null;
  lost_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface InquiryItemRow {
  id: string;
  inquiry_id: string;
  category: string | null;
  material: string | null;
  requested_brand: string | null;
  requested_product: string | null;
  thickness: string | null;
  size: string | null;
  grade: string | null;
  finish: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  specification_complete: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InquiryAttachmentRow {
  id: string;
  inquiry_id: string;
  /** Object key inside the private `enquiry-attachments` bucket — never a public URL. */
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: string;
  caption: string | null;
  extraction_status: string;
  extracted_payload: unknown;
  created_at: string;
  created_by: string | null;
}

export interface InquiryActivityRow {
  id: number;
  inquiry_id: string;
  kind: string;
  summary: string;
  detail: unknown;
  entity_type: string | null;
  entity_id: string | null;
  actor_email: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface FollowupRow {
  id: string;
  inquiry_id: string;
  due_at: string;
  note: string | null;
  result: string | null;
  outcome: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  completed_by: string | null;
}


// ---------------------------------------------------------------- Slice 2 --
// Rate Book + quotes. See supabase/enquiry-os-slice2.sql.

export interface QuoteRateRow {
  id: string;
  product_id: number | null;
  category: string | null;
  brand: string | null;
  product_name: string | null;
  range_name: string | null;
  thickness: string | null;
  grade: string | null;
  finish: string | null;
  size: string | null;
  pricing_basis: string;
  sheet_width_ft: number | null;
  sheet_length_ft: number | null;
  sheet_area_sqft: number | null;
  rate: number;
  rate_input_mode: string;
  gst_rate: number;
  warranty_text: string | null;
  notes: string | null;
  effective_from: string;
  effective_to: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface QuoteRow {
  id: string;
  ref: string;
  inquiry_id: string;
  customer_id: string | null;
  status: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface QuoteVersionRow {
  id: string;
  quote_id: string;
  version_no: number;
  status: string;
  label: string | null;
  pricing_display: string;
  customer_snapshot: unknown;
  terms: unknown;
  tax_assumption: string;
  revision_reason: string | null;
  frozen_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface QuoteOptionRow {
  id: string;
  quote_version_id: string;
  label: string;
  brand: string | null;
  range_name: string | null;
  warranty_text: string | null;
  customer_notes: string | null;
  sort_order: number;
  option_discount: number;
  freight: number;
  freight_taxable: boolean;
  loading_unloading: number;
  loading_taxable: boolean;
  packing: number;
  packing_taxable: boolean;
  other_charges: number;
  other_taxable: boolean;
  charges_gst_rate: number;
  round_off: number | null;
  totals_snapshot: unknown;
  created_at: string;
  updated_at: string;
}

export interface QuoteItemRow {
  id: string;
  quote_option_id: string;
  enquiry_item_id: string | null;
  sort_order: number;
  rate_book_id: string | null;
  product_id: number | null;
  match_state: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  product_name: string | null;
  range_name: string | null;
  thickness: string | null;
  grade: string | null;
  finish: string | null;
  size: string | null;
  quantity: number;
  unit: string;
  pricing_basis: string;
  sheet_width_ft: number | null;
  sheet_length_ft: number | null;
  sheet_area_sqft: number | null;
  pricing_quantity: number;
  gst_rate: number;
  rate_input_mode: string;
  entered_rate: number | null;
  rate_book_rate_snapshot: number | null;
  rate_book_mode_snapshot: string | null;
  is_overridden: boolean;
  base_rate_ex_gst: number | null;
  rate_incl_gst: number | null;
  line_discount: number;
  manual_amount: number | null;
  taxable_amount: number;
  gst_amount: number;
  amount_incl_gst: number;
  warranty_text: string | null;
  customer_note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}
