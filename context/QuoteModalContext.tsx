"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildWhatsAppUrl, generateInquiryRef } from "@/lib/whatsapp";
import { UploadIcon } from "@/components/icons/UploadIcon";
import { Button, buttonClasses } from "@/components/ui/Button";

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.heic,.webp";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface ListItem {
  desc: string;
  qty: string;
}

interface QuoteModalContextValue {
  openModal: (prefillDesc?: string, note?: string, title?: string) => void;
}

const QuoteModalContext = createContext<QuoteModalContextValue | null>(null);

export function useQuoteModal(): QuoteModalContextValue {
  const ctx = useContext(QuoteModalContext);
  if (!ctx) throw new Error("useQuoteModal must be used within QuoteModalProvider");
  return ctx;
}

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [descInput, setDescInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function openModal(prefillDesc?: string, note?: string, title?: string) {
    if (prefillDesc) {
      setItems((prev) => (prev.some((i) => i.desc === prefillDesc) ? prev : [...prev, { desc: prefillDesc, qty: "1" }]));
    }
    setModalNote(note ?? null);
    setModalTitle(title ?? null);
    setOpen(true);
  }

  function resetForm() {
    setItems([]);
    setDescInput("");
    setQtyInput("1");
    setFile(null);
    setFileError(null);
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setSubmitNote(null);
    setRef(null);
    setWaUrl(null);
    setModalNote(null);
    setModalTitle(null);
  }

  function addItem() {
    if (!descInput.trim()) return;
    setItems((prev) => [...prev, { desc: descInput.trim(), qty: qtyInput.trim() || "1" }]);
    setDescInput("");
    setQtyInput("1");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 7) return;
    if (items.length === 0 && !file) {
      setSubmitNote("Add at least one item, or upload a file, before requesting a quotation.");
      return;
    }
    setSubmitNote(null);
    setSubmitting(true);

    const inquiryRef = generateInquiryRef();
    const supabase = createBrowserSupabaseClient();

    let uploadedFileUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${inquiryRef}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("inquiry-uploads").upload(path, file, {
        contentType: file.type || undefined,
      });
      if (uploadError) {
        console.error("File upload failed:", uploadError.message);
      } else {
        uploadedFileUrl = supabase.storage.from("inquiry-uploads").getPublicUrl(path).data.publicUrl;
      }
    }

    const lines = [`List inquiry (Ref: ${inquiryRef})`];
    if (items.length > 0) {
      lines.push("Items:");
      items.forEach((item, i) => lines.push(`${i + 1}. ${item.desc} × ${item.qty}`));
    }
    if (uploadedFileUrl) lines.push(`Requirement list file: ${uploadedFileUrl}`);
    else if (file) lines.push(`Attached file: ${file.name} (please attach again here — upload failed)`);
    lines.push(`Name: ${name.trim()}`, `Phone: ${phone.trim()}`);
    if (email.trim()) lines.push(`Email: ${email.trim()}`);
    if (message.trim()) lines.push(`Message: ${message.trim()}`);

    supabase
      .from("inquiries")
      .insert({
        ref: inquiryRef,
        type: "list",
        items: items.length > 0 ? items : null,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        message: message.trim() || null,
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

  return (
    <QuoteModalContext.Provider value={{ openModal }}>
      {children}

      {open ? (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm p-6"
            style={{ background: "var(--paper)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {ref ? (
              <div>
                <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                  Request sent
                </p>
                <p className="mt-2 text-sm">
                  We&apos;ve opened WhatsApp with your request pre-filled — just hit send there to reach us.
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--line-strong)" }}>
                  Reference: {ref}
                </p>
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
                    Didn&apos;t open? Tap here to open WhatsApp
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  className="mt-5"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                    {modalTitle || "Request a quote"}
                  </p>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-2xl leading-none">
                    ×
                  </button>
                </div>

                {modalNote ? (
                  <p className="rounded-sm border px-3 py-2 text-sm" style={{ borderColor: "var(--line)", background: "var(--paper-dim)", color: "var(--ink)" }}>
                    {modalNote}
                  </p>
                ) : null}

                <div>
                  <p className="text-xs tracked-caps">Items needed</p>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      placeholder="e.g. 19mm BWP plywood"
                      className="flex-1 rounded-sm border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--line)" }}
                    />
                    <input
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                      placeholder="Qty"
                      className="w-16 rounded-sm border px-2 py-2 text-sm"
                      style={{ borderColor: "var(--line)" }}
                    />
                    <button type="button" onClick={addItem} className={buttonClasses("secondary", "sm", "shrink-0")}>
                      Add
                    </button>
                  </div>

                  {items.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-sm border px-3 py-1.5 text-sm"
                          style={{ borderColor: "var(--line)" }}
                        >
                          <span>
                            <strong>{item.qty} ×</strong> {item.desc}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            aria-label="Remove item"
                            className="text-base leading-none"
                            style={{ color: "var(--line-strong)" }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm italic" style={{ color: "var(--line-strong)" }}>
                      No items added yet — add your first item above.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                  <span className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
                    OR
                  </span>
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                </div>

                <div>
                  <p className="text-xs tracked-caps" style={{ color: "var(--burgundy)" }}>
                    Upload a file instead
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--line-strong)" }}>
                    Excel, PDF, photo — whatever&apos;s easiest.
                  </p>
                  <div className="mt-2">
                    {file ? (
                      <div
                        className="flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <UploadIcon />
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
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
                        className={buttonClasses("secondary", "md", "w-full justify-start")}
                      >
                        <UploadIcon />
                        Choose File
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
                    <p className="mt-1 text-sm" style={{ color: "var(--burgundy)" }}>
                      {fileError}
                    </p>
                  ) : null}
                </div>

                <hr style={{ borderColor: "var(--line)" }} />

                <label className="text-xs tracked-caps">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-sm border px-3 py-2 text-sm"
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
                    className="mt-1 block w-full rounded-sm border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--line)" }}
                  />
                </label>
                <label className="text-xs tracked-caps">
                  Email (optional)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-sm border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--line)" }}
                  />
                </label>
                <label className="text-xs tracked-caps">
                  Additional notes
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Delivery location, timeline…"
                    className="mt-1 block w-full rounded-sm border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--line)" }}
                  />
                </label>

                {submitNote ? (
                  <p className="text-sm" style={{ color: "var(--burgundy)" }}>
                    {submitNote}
                  </p>
                ) : null}

                <Button type="submit" variant="primary" disabled={submitting} className="w-full">
                  {submitting ? "Sending…" : "Request Quotation via WhatsApp"}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </QuoteModalContext.Provider>
  );
}
