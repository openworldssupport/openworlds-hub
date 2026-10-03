import { ArrowRight, ArrowDown, Globe2, Gamepad2, Code2, Users, Mail } from "lucide-react";
import type { FormEvent } from "react";
import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";

export default function Landing() {
  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`OpenWorlds message from ${formData.get("name")}`);
    const body = encodeURIComponent(`${formData.get("message")}\n\nReply to: ${formData.get("email")}`);
    window.location.href = `mailto:opwnworldssupport@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section id="home" className="scroll-mt-20 border-b border-slate-100">
        <div className="mx-auto grid min-h-[500px] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-[#7651c9]"><Gamepad2 className="size-4" /> The Open Worlds community</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Create, share, explore.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Open Worlds is a place to make, share, and explore worlds with other people.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#1f5fc9]">Log in <ArrowRight className="size-4" /></Link>
              <a href="#news" className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">See updates <ArrowDown className="size-4" /></a>
            </div>
            <p className="mt-4 text-sm text-slate-500">No separate website account is needed.</p>
          </div>
          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0066cc] via-[#1764bc] to-[#7651c9] p-8 text-white md:min-h-[340px]">
            <div className="text-center">
              <Globe2 className="mx-auto size-24 text-amber-200 sm:size-32" strokeWidth={1.1} />
              <p className="mt-5 text-lg font-medium">Made by the community</p>
              <p className="mt-1 text-sm text-blue-100">Worlds shaped by creators</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-b border-slate-100 border-t-4 border-t-[#7651c9]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium text-[#7651c9]">About OpenWorlds</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">A place to make and share worlds</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <p className="leading-7 text-slate-600">OpenWorlds brings people together to create, share, and explore worlds.</p>
            <p className="leading-7 text-slate-600">Our goal is to make it easier for people to bring creative ideas to life. The website is a place to learn about the project and stay up to date.</p>
          </div>
        </div>
      </section>

      <section id="learning" className="scroll-mt-20 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-7">
            <p className="text-sm font-medium text-[#7651c9]">Learning Center</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Learn to build, create, and ship</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-5"><Code2 className="size-6 text-[#2870e8]" /><h3 className="mt-4 font-semibold">Code foundations</h3><p className="mt-2 text-sm leading-6 text-slate-600">An introduction to web and software development for beginners.</p></article>
            <article className="rounded-xl border border-slate-200 bg-white p-5"><Gamepad2 className="size-6 text-[#2870e8]" /><h3 className="mt-4 font-semibold">Game Design</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ideas for making fun games and tools.</p></article>
            <article className="rounded-xl border border-slate-200 bg-white p-5"><Users className="size-6 text-[#2870e8]" /><h3 className="mt-4 font-semibold">Community growth</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ways to welcome people and build creative communities.</p></article>
          </div>
          <p className="mt-5 text-sm text-slate-500">Information only for now. Lessons and progress tracking are not available.</p>
        </div>
      </section>

      <section id="news" className="scroll-mt-20 border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-medium text-[#7651c9]">Updates</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">OpenWorlds news</h2></div>
            <Link to="/auth" className="text-sm font-medium text-[#2870e8] hover:underline">Log in to your player home <ArrowRight className="ml-1 inline size-4" /></Link>
          </div>
          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6">
            <p className="font-medium">No news posted yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Announcements will appear here once an official news feed is available.</p>
          </div>
          <Link to="/learning" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#2870e8] hover:underline">Visit the Learning Center <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <section id="downloads" className="scroll-mt-20 border-t-4 border-t-[#f3c64e]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium text-[#7651c9]">Play OpenWorlds</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Downloads</h2>
          <div className="mt-7 flex flex-col justify-between gap-5 rounded-xl border border-slate-200 p-6 sm:flex-row sm:items-center">
            <div><p className="font-medium">Official downloads</p><p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Download links and supported platforms haven’t been published here yet. We’ll only list confirmed versions.</p></div>
            <span className="w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">Not available yet</span>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-medium text-[#7651c9]">Contact</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Get in touch</h2>
              <div className="mt-6 flex items-start gap-3">
                <Mail className="mt-1 size-5 text-[#7651c9]" />
                <div><p className="font-medium">Email</p><a href="mailto:opwnworldssupport@gmail.com" className="mt-1 inline-block text-sm text-[#2870e8] hover:underline">opwnworldssupport@gmail.com</a></div>
              </div>
            </div>
            <form onSubmit={handleContactSubmit} className="grid gap-4">
              <p className="text-sm leading-6 text-slate-600">Send a message using your email app. The message is not submitted to or stored by this website.</p>
              <label className="grid gap-1.5 text-sm font-medium">Your name<input name="name" required className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-[#7651c9]" /></label>
              <label className="grid gap-1.5 text-sm font-medium">Your email<input name="email" type="email" required className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-[#7651c9]" /></label>
              <label className="grid gap-1.5 text-sm font-medium">Your message<textarea name="message" required rows={5} className="rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-[#7651c9]" /></label>
              <button type="submit" className="inline-flex h-11 w-fit items-center rounded-lg bg-[#0066cc] px-5 text-sm font-medium text-white hover:bg-[#1f5fc9]">Open email app</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm text-slate-500 sm:px-8">
          <span>OpenWorlds © 2026. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/careers" className="hover:text-slate-900">Careers</Link>
            <Link to="/community" className="hover:text-slate-900">Community</Link>
            <Link to="/learning" className="hover:text-slate-900">Learning</Link>
            <a href="https://discord.gg/JWq5hEsKRX" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Discord</a>
            <a href="https://www.youtube.com/channel/UCcEIUqR8lB_siqj1CE0XVjA" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">YouTube</a>
            <a href="#home" className="hover:text-slate-900">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
