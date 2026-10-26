import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ArrowRight, CheckCircle2, Clapperboard, ExternalLink, Star, Youtube } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

const officialChannel = "https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA";
const officialUploadsPlaylist = "UUcEIUqR8lB_siqj1CE0XVjA";

export default function Media() {
  const submitEnquiry = useMutation(api.careerApplications.submitEnquiry);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const subscriberCount = Number(values.get("subscribers"));
    if (!Number.isInteger(subscriberCount) || subscriberCount < 200) {
      setError("You need at least 200 subscribers or followers on one public channel to apply.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const message = [
        "OpenWorlds content creator application",
        `OpenWorlds username or creator name: ${String(values.get("creatorName") ?? "").trim()}`,
        `Platform: ${String(values.get("platform") ?? "").trim()}`,
        `Public channel URL: ${String(values.get("channelUrl") ?? "").trim()}`,
        `Current subscribers/followers: ${subscriberCount}`,
        `OpenWorlds videos or examples: ${String(values.get("examples") ?? "").trim() || "Not provided"}`,
        "Why I would like to be an OpenWorlds creator:",
        String(values.get("about") ?? "").trim(),
      ].join("\n\n");
      const result = await submitEnquiry({
        type: "question",
        name: String(values.get("creatorName") ?? "").trim(),
        email: String(values.get("email") ?? "").trim(),
        message,
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

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <section className="overflow-hidden bg-[#071a30] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-sky-200"><Clapperboard className="size-4" /> OPENWORLDS MEDIA</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Stories from worlds worth exploring.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Watch official OpenWorlds videos, discover community-made content as it’s featured, and apply to join our content creator program.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#official" className="inline-flex h-11 items-center gap-2 rounded-md bg-sky-300 px-5 text-sm font-semibold text-[#071a30] transition hover:bg-sky-200">Watch official videos <ArrowRight className="size-4" /></a>
              <a href="#creator-application" className="inline-flex h-11 items-center rounded-md border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10">Apply as a creator</a>
            </div>
          </div>
          <div className="hidden size-40 items-center justify-center rounded-full border border-sky-200/20 bg-sky-300/10 text-sky-200 md:flex"><Clapperboard className="size-16 stroke-[1.2]" /></div>
        </div>
      </section>

      <section id="official" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0066cc]">From the OpenWorlds team</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Official videos</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">The latest uploads from our official YouTube channel, in one place.</p>
          </div>
          <a href={officialChannel} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Visit YouTube <ExternalLink className="size-4" /></a>
        </div>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
          <div className="aspect-video">
            <iframe
              title="Official OpenWorlds YouTube videos"
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${officialUploadsPlaylist}`}
              className="size-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#7651c9]">Community made</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Creator videos</h2>
            <p className="mt-3 leading-7 text-slate-600">We’ll feature videos from creators after they’ve been reviewed and selected. Creator channels aren’t automatically synced, and no one is listed here until there’s an approved feature.</p>
          </div>
          <div className="mt-7 flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Star className="size-5" /></span>
              <div><h3 className="font-semibold">Make something about OpenWorlds?</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Apply to be considered for an official creator feature. Applications are reviewed by the team; meeting the guidelines doesn’t guarantee selection.</p></div>
            </div>
            <a href="#creator-application" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0066cc] px-4 text-sm font-medium text-white transition hover:bg-[#004a99]">Creator requirements <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </section>

      <section id="creator-application" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold text-[#0066cc]">Join the creator community</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Apply to be featured</h2>
          <p className="mt-4 leading-7 text-slate-600">We’re looking for creators who make thoughtful, original content about OpenWorlds and help keep the community welcoming.</p>
          <ul className="mt-6 space-y-4">
            {[
              "At least 200 subscribers or followers on one public video channel.",
              "A public channel with original videos; OpenWorlds-related content is a plus.",
              "Content and conduct that follow OpenWorlds community rules.",
              "A consistent, genuine interest in creating—not just a subscriber count.",
            ].map((requirement) => <li key={requirement} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-500" />{requirement}</li>)}
          </ul>
          <p className="mt-6 text-xs leading-5 text-slate-500">Creator features are voluntary. Selection and any additional program terms are confirmed by the OpenWorlds team. Don’t share passwords or account security details.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {sent ? (
            <div role="status" className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><h3 className="font-semibold">Application sent to the team</h3><p className="mt-1 leading-6">Your application was sent to the OpenWorlds Careers inbox for review. Check your email for a confirmation. This isn’t an approval or guarantee of a feature.</p></div></div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label htmlFor="creator-website">Website</label><input id="creator-website" name="website" tabIndex={-1} autoComplete="off" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="creator-name">Creator name or OpenWorlds username</Label><Input id="creator-name" name="creatorName" required maxLength={100} autoComplete="nickname" /></div>
                <div className="space-y-2"><Label htmlFor="creator-email">Contact email</Label><Input id="creator-email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="creator-platform">Main video platform</Label><Input id="creator-platform" name="platform" required maxLength={80} placeholder="YouTube, Twitch, TikTok…" /></div>
                <div className="space-y-2"><Label htmlFor="creator-subscribers">Subscribers or followers</Label><Input id="creator-subscribers" name="subscribers" type="number" required min={200} step={1} inputMode="numeric" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="creator-channel">Public channel link</Label><Input id="creator-channel" name="channelUrl" type="url" required maxLength={500} placeholder="https://…" /></div>
              <div className="space-y-2"><Label htmlFor="creator-examples">OpenWorlds video links <span className="font-normal text-slate-500">(optional)</span></Label><Textarea id="creator-examples" name="examples" rows={3} maxLength={1500} placeholder="Share links to any videos about OpenWorlds." /></div>
              <div className="space-y-2"><Label htmlFor="creator-about">Tell us about your content and why you’d like to be featured</Label><Textarea id="creator-about" name="about" required minLength={20} maxLength={4000} rows={5} placeholder="What do you make, and what would you like to create about OpenWorlds?" /></div>
              <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"><input name="creatorConsent" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#0066cc]" /><span>I agree to have the details above emailed to OpenWorlds Careers for review. My application is not stored in this website. I understand that applying does not guarantee approval or a feature.</span></label>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <Button type="submit" disabled={busy}><Youtube className="size-4" />{busy ? "Sending application…" : "Send creator application"}</Button>
            </form>
          )}
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026 · Media and creator features</footer>
    </main>
  );
}
