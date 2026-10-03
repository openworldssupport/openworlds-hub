import { SiteNav } from "@/components/SiteNav";
import { useState } from "react";
import { ArrowRight, Brain, Code2, CodeXml, Database, Gamepad2, GitBranch, GraduationCap, Palette, Rocket, Sprout, ShieldCheck, Users } from "lucide-react";

const paths = [
  { title: "Start from Zero", description: "Learn coding basics, problem solving, and how websites and apps work.", icon: Sprout },
  { title: "Frontend", description: "Explore HTML, CSS, JavaScript, responsive design, and user interfaces.", icon: Palette },
  { title: "Backend", description: "Learn APIs, databases, authentication, server logic, and app architecture.", icon: Database },
  { title: "Full Stack", description: "Connect frontend and backend to build complete products.", icon: GitBranch },
  { title: "Game Making", description: "Learn how games work and how to make your own.", icon: Gamepad2 },
  { title: "AI & Tools", description: "Explore AI-assisted development, automation, and modern coding workflows.", icon: Brain },
];

const lessons = [
  { category: "code", label: "Code", title: "HTML & CSS for Beginners", description: "Structure webpages, style layouts, and build responsive interfaces.", level: "Beginner", count: 8 },
  { category: "code", label: "Code", title: "JavaScript Fundamentals", description: "Variables, functions, conditions, arrays, loops, and logic.", level: "Beginner", count: 10 },
  { category: "frontend", label: "Frontend", title: "Responsive Web Design", description: "Build layouts for desktop, tablet, and mobile screens.", level: "Beginner", count: 7 },
  { category: "frontend", label: "Frontend", title: "JavaScript for User Interfaces", description: "Learn events, UI updates, forms, and user interactions.", level: "Intermediate", count: 9 },
  { category: "backend", label: "Backend", title: "Node.js & APIs", description: "Build servers, create API routes, and handle requests.", level: "Intermediate", count: 11 },
  { category: "backend", label: "Backend", title: "Databases & SQL", description: "Learn tables, relationships, queries, and data models.", level: "Intermediate", count: 8 },
  { category: "backend", label: "Backend", title: "Authentication & Security", description: "Understand login, sessions, authorization, and safe app design.", level: "Intermediate", count: 6 },
  { category: "games", label: "Games", title: "Game Logic & Interactivity", description: "Explore movement, collisions, game states, and event systems.", level: "Beginner", count: 7 },
  { category: "games", label: "Games", title: "Building Worlds Together", description: "Learn how shared worlds are made and kept welcoming.", level: "Intermediate", count: 6 },
  { category: "ai", label: "AI", title: "AI for Developers", description: "Use AI tools for coding, testing, automation, and problem solving.", level: "Beginner", count: 5 },
  { category: "ai", label: "AI", title: "Prompt Engineering Basics", description: "Structure prompts and get more useful responses from AI tools.", level: "Beginner", count: 4 },
  { category: "code", label: "Code", title: "Git & GitHub Essentials", description: "Learn version control, branches, collaboration, and pull requests.", level: "Beginner", count: 5 },
];

const filters = [
  { id: "all", label: "All" },
  { id: "code", label: "Code" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "games", label: "Games" },
  { id: "ai", label: "AI" },
];

const benefits = [
  { title: "Beginner friendly", description: "Start with foundational concepts and build skills step by step.", icon: GraduationCap },
  { title: "Practical learning", description: "Focus on useful skills for real projects and products.", icon: Rocket },
  { title: "Different paths", description: "Explore web development, backend, game logic, and AI tools.", icon: CodeXml },
  { title: "Community focused", description: "Connect learning with creator culture and collaboration.", icon: Users },
];

export default function Learning() {
  const [activeFilter, setActiveFilter] = useState("all");
  const visibleLessons = activeFilter === "all" ? lessons : lessons.filter((lesson) => lesson.category === activeFilter);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />
      <header className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_0.8fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium"><GraduationCap className="size-4" /> Learning Center</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Learn coding for everyone.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-blue-50">OpenWorlds Learning is a beginner-friendly guide to coding, websites, games, online services, and useful AI tools.</p>
          </div>
          <aside className="rounded-xl border border-white/20 bg-white/10 p-5 sm:p-6">
            <h2 className="font-semibold">What you can explore</h2>
            <ul className="mt-4 grid gap-3 text-sm text-blue-50">
              {["HTML, CSS, and JavaScript", "Frontend, backend, and full stack", "Making games and shared worlds", "AI tools, APIs, and deployment"].map((item) => <li key={item} className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" />{item}</li>)}
            </ul>
          </aside>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7">
          <p className="text-sm font-medium text-[#7651c9]">Choose your path</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start wherever you are.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-slate-200 p-5 transition-colors hover:border-blue-200">
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-[#0066cc]"><Icon className="size-5" /></span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 via-white to-violet-50 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7">
            <p className="text-sm font-medium text-[#7651c9]">Browse topics</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Learning library</h2>
          </div>
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter lessons by topic">
            {filters.map((filter) => (
              <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${activeFilter === filter.id ? "border-[#0066cc] bg-[#0066cc] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                {filter.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleLessons.map((lesson) => (
              <article key={lesson.title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
                <span className="w-fit rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0066cc]">{lesson.label}</span>
                <h3 className="mt-4 font-semibold">{lesson.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{lesson.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>{lesson.level}</span><span>{lesson.count} topics</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400" aria-disabled="true">Lesson guide coming soon <ArrowRight className="size-4" /></span>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">These are planned learning topics, not published lessons. There are no lesson links or progress tracking yet.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7">
          <p className="text-sm font-medium text-[#7651c9]">Why OpenWorlds Learning?</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Built for curious people.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-xl border border-slate-200 p-5">
              <Icon className="size-6 text-[#0066cc]" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">OpenWorlds © 2026. All rights reserved.</footer>
    </main>
  );
}
