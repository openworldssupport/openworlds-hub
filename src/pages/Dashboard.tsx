import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowDownToLine, Megaphone, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const updateProfile = useMutation(api.gameData.updateProfile);
  const [displayName, setDisplayName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function savePlayerName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage("");
    try {
      await updateProfile({ displayName });
      setDisplayName("");
      setSaveMessage("Player name updated.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not update player name.");
    }
  }

  if (!user) return null;
  if (user.role !== "user") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteNav />
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-3xl font-semibold">Player account required</h1>
          <p className="mt-3 text-slate-600">This hub is for game player accounts, separate from staff accounts.</p>
          <Link to="/player-signup" className="mt-6 inline-flex text-sm font-semibold text-[#0066cc] hover:underline">Create a player account</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7651c9]"><Megaphone className="size-4" /> Player account</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Your player profile is private to your account. Signed in as {user.playerName}.</p>
        </motion.div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="font-semibold tracking-tight">Player profile</h2><p className="mt-1 text-sm text-slate-500">Update the name shown on your player account.</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
            </div>
            <div className="mt-6">
              <form onSubmit={savePlayerName} className="space-y-3">
                <Label htmlFor="player-display-name">Player name</Label>
                <div className="flex gap-2"><Input id="player-display-name" minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={user.playerName} /><Button type="submit" variant="outline" disabled={!displayName.trim()}>Update</Button></div>
              </form>
              {saveMessage ? <p role="status" className="mt-2 text-sm text-slate-600">{saveMessage}</p> : null}
            </div>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-[#7651c9]"><ArrowDownToLine className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Downloads</h2><p className="text-xs text-slate-400">Official builds only</p></div>
            </div>
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 px-5 py-6 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">Windows launcher available</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Download the official OpenWorlds Launcher from the Downloads page.</p>
              <Button asChild className="mt-4">
                <Link to="/downloads"><ArrowDownToLine className="size-4" /> Windows download</Link>
              </Button>
              <p className="mt-3 text-xs text-slate-400">Release v2026.10.22.1946</p>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> The release does not list Windows system requirements yet.</div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

