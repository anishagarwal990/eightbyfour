import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuoteDocument } from "./QuoteDocument";
import type { CustomerQuote } from "@/lib/customer-quote";

/** Deterministic server-side PDF bytes for a customer quotation. */
export async function renderQuotePdf(quote: CustomerQuote): Promise<Uint8Array> {
  const element = createElement(QuoteDocument, { quote }) as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}
