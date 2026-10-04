export interface SupportReason {
  id: string;
  label: string;
  hint: string;
}

/** Reasons a visitor can pick when opening a support ticket. */
export const supportReasons: SupportReason[] = [
  { id: "account-access", label: "Account or sign-in help", hint: "Trouble getting into your account." },
  { id: "password-email", label: "Password or email change", hint: "Reset, recover, or update your login details." },
  { id: "game-bug", label: "Game bug or crash", hint: "Something in the game is broken or crashes." },
  { id: "website-bug", label: "Website problem", hint: "A page is broken, missing, or not loading." },
  { id: "report-player", label: "Report a player", hint: "Report harassment, cheating, or unsafe behaviour." },
  { id: "report-content", label: "Report content or a world", hint: "Flag a world, post, or user-created content." },
  { id: "moderation-appeal", label: "Appeal a moderation action", hint: "Ask the team to review a warning, mute, or ban." },
  { id: "purchase", label: "Purchase or payment issue", hint: "Problems with an order, refund, or charge." },
  { id: "download-install", label: "Download or installation", hint: "Help installing or updating the game." },
  { id: "creator-help", label: "Creating or sharing a world", hint: "Help with tools, publishing, or sharing." },
  { id: "careers", label: "Careers application help", hint: "Questions about a voluntary contributor role." },
  { id: "partnership", label: "Partnership or press", hint: "Business, collaboration, or media enquiries." },
  { id: "feature-idea", label: "Feature idea or feedback", hint: "Suggest an improvement or share feedback." },
  { id: "accessibility", label: "Accessibility or safety", hint: "Accessibility barriers or a safety concern." },
  { id: "other", label: "Something else", hint: "Anything that does not fit the reasons above." },
];

export const supportReasonIds = supportReasons.map((reason) => reason.id);

export function supportReasonLabel(id: string): string {
  return supportReasons.find((reason) => reason.id === id)?.label ?? "Support request";
}
