import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";
import { Reveal } from "@/components/Reveal";

/**
 * The conversion module that closes every commercial page. Its job is to move
 * a single-material search ("18mm plywood price") onto the thing that
 * actually differentiates EightByFour — one requirement, one quotation across
 * every category — without turning into a nag banner on top of the content.
 */
export function BoqCtaBlock({
  heading = "Buying for a whole project?",
  body = "Send the full list — plywood, laminates, hardware, adhesive, edge banding — and it comes back as one itemised quotation with a single delivery schedule, instead of four vendor conversations you have to reconcile yourself.",
  whatsappMessage,
  source,
}: {
  heading?: string;
  body?: string;
  whatsappMessage: string;
  source: string;
}) {
  return (
    <Reveal as="section" className="px-7 py-10">
      <div className="rounded-lg p-6 sm:p-8" style={{ background: "var(--paper-dim)" }}>
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          {heading}
        </h2>
        <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
          {body}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <RequestQuoteButton label="Upload Requirement" />
          <WhatsAppTrackedLink
            href={buildWhatsAppUrl(whatsappMessage)}
            source={source}
            className={buttonClasses("secondary")}
          >
            WhatsApp Your List
          </WhatsAppTrackedLink>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
          Excel, PDF, a photo of a handwritten list, or a screenshot — whatever the list already exists as.
        </p>
      </div>
    </Reveal>
  );
}
