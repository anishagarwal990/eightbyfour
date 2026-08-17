"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildWhatsAppUrl, generateInquiryRef } from "@/lib/whatsapp";
import { UploadIcon } from "@/components/icons/UploadIcon";
import { Button, buttonClasses } from "@/components/ui/Button";
import type { ProductRow } from "@/lib/supabase/types";
import { productDisplayName } from "@/lib/productDisplay";

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.heic,.webp";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export interface VariantSelection {
  /** e.g. "Pinewood · 8×4 ft · 18mm" — shown read-only, already chosen before opening this form. */
  summary: string;
  thickness: string;
  price: number;
  unit: string;
}

export function QuoteRequestForm({ product, variantSelection }: { product: ProductRow; variantSelection?: VariantSelection }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [thickness, setThickness] = useState(variantSelection?.thickness || product.thicknesses?.[0] || "");
  const [sampleRequested, setSampleRequested] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showThickness = !variantSelection && (product.thicknesses?.length || 0) > 0;
  const finishLabel = product.finishes?.[0] || product.finish || "";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_FILE_SIZE) {
      setFileError("File is over 20MB — please attach a smaller file.");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
  }

  function removeFile() {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 7) return;
    setSubmitting(true);

    const inquiryRef = generateInquiryRef(product.brand);
    const supabase = createBrowserSupabaseClient();

    let uploadedFileUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${inquiryRef}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("inquiry-uploads").upload(path, file, {
        contentType: file.type || undefined,
      });
      if (uploadError) {
        setFileError("Couldn't upload file — you can still send the request and share it separately.");
        console.error("File upload failed:", uploadError.message);
      } else {
        uploadedFileUrl = supabase.storage.from("inquiry-uploads").getPublicUrl(path).data.publicUrl;
      }
    }

    const lines = [`Product inquiry (Ref: ${inquiryRef})`];
    if (product.category === "Laminates") {
      lines.push(`Product: ${productDisplayName(product)} (${product.sd_code || ""})${finishLabel ? " · " + finishLabel : ""}`);
    } else {
      lines.push(`Product: ${product.brand} — ${product.name}`);
      if (variantSelection) lines.push(`Configuration: ${variantSelection.summary} — ₹${variantSelection.price}/${variantSelection.unit === "sqft" ? "sq.ft" : variantSelection.unit}`);
      else if (showThickness) lines.push(`Thickness: ${thickness}`);
    }
    lines.push(`Name: ${name.trim()}`, `Phone: ${phone.trim()}`);
    if (email.trim()) lines.push(`Email: ${email.trim()}`);
    if (sampleRequested) lines.push("Also requesting a physical sample.");
    if (message.trim()) lines.push(`Message: ${message.trim()}`);
    if (uploadedFileUrl) lines.push(`Requirement list: ${uploadedFileUrl}`);
    else if (file) lines.push(`Attached file: ${file.name} (please attach again here — upload failed)`);

    supabase
      .from("inquiries")
      .insert({
        ref: inquiryRef,
        type: "single",
        product_id: product.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        message: message.trim() || null,
        thickness: variantSelection ? variantSelection.thickness : showThickness ? thickness : null,
        finish: product.category === "Laminates" ? finishLabel || null : null,
        sample_requested: sampleRequested,
        uploaded_file_name: file ? file.name : null,
        uploaded_file_url: uploadedFileUrl,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to log inquiry:", error.message);
      });

    const url = buildWhatsAppUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener");
    setRef(inquiryRef);
    setWaUrl(url);
    setSubmitting(false);
  }

  if (ref) {
    return (
      <div className="rounded-2xl border p-5 shadow-[var(--shadow-md)]" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Request sent
        </p>
        <p className="mt-2 text-sm">We&apos;ve opened WhatsApp with your request pre-filled — just hit send there to reach us.</p>
        <p className="mt-2 text-xs" style={{ color: "var(--line-strong)" }}>
          Reference: {ref}
        </p>
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
            Didn&apos;t open? Tap here to open WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border p-5 shadow-[var(--shadow-md)]"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        Request a quote
      </p>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
          {variantSelection
            ? `${variantSelection.summary} — ₹${variantSelection.price}/${variantSelection.unit === "sqft" ? "sq.ft" : variantSelection.unit}`
            : "Price: Available on Request"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
          Receive a personalized commercial quotation in under 15 minutes.
        </p>
      </div>
      <label className="text-xs tracked-caps">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      <label className="text-xs tracked-caps">
        Phone
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91"
          className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      <label className="text-xs tracked-caps">
        Email (optional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      {showThickness ? (
        <div className="text-xs tracked-caps">
          Thickness
          <div className="mt-1.5 flex flex-wrap gap-2">
            {product.thicknesses?.map((t) => (
              <Button
                key={t}
                type="button"
                variant="chip"
                size="sm"
                active={thickness === t}
                aria-pressed={thickness === t}
                className="normal-case tracking-normal"
                onClick={() => setThickness(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <label className="text-xs tracked-caps">
        Message (optional)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sampleRequested} onChange={(e) => setSampleRequested(e.target.checked)} />
        Also request a physical sample
      </label>
      <div className="text-xs tracked-caps">
        Requirement list (optional)
        <div className="mt-1.5">
          {file ? (
            <div
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm normal-case tracking-normal"
              style={{ borderColor: "var(--line)", background: "var(--paper)" }}
            >
              <span className="flex items-center gap-2 truncate">
                <UploadIcon />
                {file.name}
              </span>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove file"
                className="shrink-0 text-base leading-none"
                style={{ color: "var(--line-strong)" }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={buttonClasses("secondary", "md", "w-full justify-start normal-case tracking-normal")}
            >
              <UploadIcon />
              Attach PDF, Excel, Word or image
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {fileError ? (
          <p className="mt-1 normal-case tracking-normal" style={{ color: "var(--burgundy)" }}>
            {fileError}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
        {submitting ? "Sending…" : "Request Quote via WhatsApp"}
      </Button>
    </form>
  );
}
