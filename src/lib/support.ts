export interface SupportReason {
  id: string;
  label: string;
  hint: string;
}

/** Reasons a visitor can pick when opening a support ticket. */
export const supportReasons: SupportReason[] = [
  { id: "website-bug", label: "Website problem", hint: "A page is broken, missing, or not loading." },
  { id: "company-access", label: "Company sign-in", hint: "Help with an invited company account." },
  { id: "report-player", label: "Report a person", hint: "Report a concern about someone in a community space." },
  { id: "report-content", label: "Report content", hint: "Flag content linked to OpenWorlds." },
  { id: "careers", label: "Careers enquiry", hint: "Questions about contributor openings." },
  { id: "partnership", label: "Partnership or press enquiry", hint: "Business, collaboration, or media enquiry." },
  { id: "feature-idea", label: "Feedback", hint: "Suggest an improvement or share feedback." },
  { id: "other", label: "Something else", hint: "A question that does not fit the reasons above." },
];

export const supportReasonIds = supportReasons.map((reason) => reason.id);

export function supportReasonLabel(id: string): string {
  return supportReasons.find((reason) => reason.id === id)?.label ?? "Support request";
}
