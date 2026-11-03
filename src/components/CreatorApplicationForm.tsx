import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationFields, applicationMessage, type ApplicationSection } from "@/components/ApplicationFormFields";
import { api } from "@/convex/_generated/api";

const creatorSections: ApplicationSection[] = [
  {
    title: "About you",
    fields: [
      { name: "username", label: "OpenWorlds username", required: true, minLength: 2, maxLength: 32, placeholder: "Your in-game username" },
      { name: "channelName", label: "Channel or creator name", required: true, maxLength: 100 },
      { name: "email", label: "Contact email", type: "email", required: true, maxLength: 254, placeholder: "you@example.com" },
      { name: "country", label: "Country or region", maxLength: 80 },
      { name: "timezone", label: "Time zone", maxLength: 60, placeholder: "e.g. Central European Time (UTC+1)" },
      { name: "language", label: "Main language of your content", maxLength: 60, placeholder: "e.g. English" },
    ],
  },
  {
    title: "Your channel",
    fields: [
      { name: "platform", label: "Main platform", type: "select", required: true, options: ["YouTube", "Twitch", "TikTok", "Instagram", "X", "Kick", "Other"] },
      { name: "channelUrl", label: "Public channel link", type: "url", required: true, maxLength: 500, placeholder: "https://…" },
      { name: "subscribers", label: "Subscribers or followers", type: "number", required: true, min: 200, placeholder: "200" },
      { name: "averageViews", label: "Average views per video", type: "number", min: 0 },
      { name: "uploadFrequency", label: "How often do you post?", type: "select", options: ["Daily", "Several times a week", "Weekly", "A few times a month", "Less often"] },
      { name: "channelAge", label: "How long has your channel been active?", maxLength: 60, placeholder: "e.g. 2 years" },
      { name: "otherPlatforms", label: "Other channels or platforms", maxLength: 600, rows: 3, placeholder: "Names and links, one per line." },
    ],
  },
  {
    title: "Your content",
    fields: [
      { name: "contentType", label: "What is your content closest to?", type: "select", required: true, options: ["Gameplay", "Streams", "Shorts or clips", "Reviews and commentary", "Builds and creative", "Guides and tutorials", "Mixed", "Something else"] },
      { name: "foundOpenWorlds", label: "How did you find OpenWorlds?", type: "select", options: ["OpenWorlds game", "A friend or community member", "A creator or streamer", "Social media", "Search engine", "Other"] },
      { name: "examples", label: "Links to OpenWorlds videos you have made", maxLength: 1500, rows: 3, placeholder: "One link per line, if you have any." },
      { name: "creationPlan", label: "What OpenWorlds content would you like to make?", required: true, minLength: 20, maxLength: 3000, rows: 5, placeholder: "Describe the series, videos, streams, or projects you have in mind." },
      { name: "collaborations", label: "Previous brand, studio, or creator collaborations", maxLength: 1200, rows: 3 },
    ],
  },
  {
    title: "The program",
    fields: [
      { name: "motivation", label: "Why do you want to join the OpenWorlds Creator Program?", required: true, minLength: 20, maxLength: 2500, rows: 5, placeholder: "Tell us why this program fits what you already make." },
      { name: "support", label: "What would help you create more OpenWorlds content?", maxLength: 1200, rows: 3, placeholder: "Early access, assets, interviews, feedback — whatever would genuinely help." },
      { name: "anythingElse", label: "Anything else we should know?", maxLength: 2000, rows: 3 },
    ],
  },
];

export function CreatorApplicationForm() {
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const subscriberCount = Number(values.get("subscribers"));
    if (!Number.isInteger(subscriberCount) || subscriberCount < 200) {
      setError("You need at least 200 subscribers or followers on one public channel to apply.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await submitEnquiry({
        type: "creator-application",
        name: String(values.get("channelName") ?? "").trim(),
        email: String(values.get("email") ?? "").trim(),
        portfolio: String(values.get("channelUrl") ?? "").trim(),
        message: applicationMessage(values, creatorSections),
        honeypot: String(values.get("website") ?? ""),
        privacyAccepted: values.get("creatorConsent") === "on",
      });
      if (!result.accepted) throw new Error("Submission was not accepted.");
      setSent(true);
    } catch {
      setError("We couldn’t send your application. Check the details and try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <div>
          <h3 className="font-semibold">Application sent to the team</h3>
          <p className="mt-1 leading-6">Your application was sent to the OpenWorlds Careers inbox for review. Check your email for a confirmation. This isn’t an approval or guarantee of a feature.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="creator-website">Website</label>
        <input id="creator-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <ApplicationFields sections={creatorSections} />
      <p className="text-xs leading-5 text-slate-500">Please don’t include passwords or sensitive account information.</p>
      <div className="space-y-3">
        <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
          <input name="creatorConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" />
          <span>I agree that the details above will be emailed to OpenWorlds Careers for review. My application is not stored in this website.</span>
        </label>
        <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700">
          <input name="creatorTerms" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" />
          <span>I understand that applying does not guarantee approval, a verified badge, or a feature, and that approved creators follow the OpenWorlds community rules.</span>
        </label>
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" disabled={busy}>
        <Youtube className="size-4" />
        {busy ? "Sending application…" : "Send creator application"}
      </Button>
    </form>
  );
}
