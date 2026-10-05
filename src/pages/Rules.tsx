import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { AlertTriangle, ArrowRight, Ban, CheckCircle2, EyeOff, Gavel, HeartHandshake, MessageCircleWarning, ShieldCheck, XCircle } from "lucide-react";

const goldenRules = [
  {
    title: "Respect people, not just rules",
    text: "No harassment, hate, discrimination, or targeted abuse. Disagree with an idea, never with a person's right to be here.",
    icon: HeartHandshake,
    tone: "bg-blue-50 text-[#0066cc]",
    bar: "border-t-[#0066cc]",
  },
  {
    title: "Keep people's private things private",
    text: "Do not share someone's real name, address, photos, or accounts without their permission. Never ask for them.",
    icon: EyeOff,
    tone: "bg-violet-50 text-[#7651c9]",
    bar: "border-t-[#7651c9]",
  },
  {
    title: "Make your own work",
    text: "Original worlds and assets only. Do not reupload someone else's build, art, music, or code without credit and consent.",
    icon: CheckCircle2,
    tone: "bg-amber-50 text-[#987000]",
    bar: "border-t-[#f3c64e]",
  },
  {
    title: "Play fair",
    text: "No cheating, exploiting, harassment through game mechanics, or deliberately ruining another player's session.",
    icon: ShieldCheck,
    tone: "bg-blue-50 text-[#0066cc]",
    bar: "border-t-[#0066cc]",
  },
];

const doList = [
  "Report anything that makes you or someone else feel unsafe",
  "Give credit when you build on another creator's work",
  "Keep conversations in community spaces appropriate for all ages",
  "Use the support form for account, payment, and bug reports",
];

const dontList = [
  "Share screenshots of private conversations or personal details",
  "Post links to unofficial downloads, cheats, or trading sites",
  "Spam, advertise, or mass-mention other members",
  "Evade a warning, mute, or ban with a second account",
];

const enforcement = [
  { step: "1", label: "Warning", detail: "A clear note from a moderator explaining what broke and what to change.", tone: "bg-blue-50 text-[#0066cc]" },
  { step: "2", label: "Mute or restriction", detail: "Temporary loss of chat or posting rights when the behaviour continues.", tone: "bg-violet-50 text-[#7651c9]" },
  { step: "3", label: "Ban", detail: "Removal from community spaces for serious or repeated violations.", tone: "bg-amber-50 text-[#987000]" },
];

export default function Rules() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-blue-100">Rules</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Keep OpenWorlds worth visiting</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            These rules apply everywhere OpenWorlds is discussed: in-game, in worlds, in Discord, in comments,
            and in support tickets. They are short on purpose.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#golden" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0052a3] hover:bg-blue-50">Read the rules</a>
            <Link to="/community" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Community guidelines</Link>
          </div>
        </div>
      </section>

      <section id="golden" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-[#7651c9]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">The four rules that matter most</h2>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {goldenRules.map(({ title, text, icon: Icon, tone, bar }) => (
            <article key={title} className={`rounded-xl border border-slate-200 border-t-2 bg-white p-5 sm:p-6 ${bar}`}>
              <div className={`flex size-11 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Do and don't</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-blue-100 bg-white p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-semibold text-[#0066cc]">
                <CheckCircle2 className="size-5" /> Please do
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {doList.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#0066cc]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-xl border border-violet-100 bg-white p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-semibold text-[#7651c9]">
                <XCircle className="size-5" /> Please don't
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {dontList.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#7651c9]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-3">
          <Gavel className="size-5 text-[#987000]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How enforcement works</h2>
        </div>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Most situations are resolved with a conversation. Escalation is predictable and proportionate.
        </p>
        <ol className="mt-7 grid gap-4 sm:grid-cols-3">
          {enforcement.map((item) => (
            <li key={item.step} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${item.tone}`}>
                {item.step}
              </span>
              <h3 className="mt-3 font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <AlertTriangle className="size-5 shrink-0 text-[#987000]" />
          <p className="flex-1 text-sm leading-6 text-slate-700">
            Serious harm, threats, child safety issues, or illegal content are reported immediately and are not
            subject to the warning step.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 via-white to-violet-50 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <MessageCircleWarning className="size-5 text-[#7651c9]" /> See something breaking the rules?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Open a ticket with the reason “Report a player” or “Report content or a world”. Reports are read
                by people, not bots, and the reporter is never named.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/support" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#004a99]">Report something <ArrowRight className="size-4" /></Link>
              <Link to="/support/status" className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">Check a ticket</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/terms" className="hover:underline">Terms</Link> · <Ban className="mx-1 inline size-3.5 align-[-2px] text-[#7651c9]" /> Zero tolerance for abuse.
      </footer>
    </main>
  );
}
