import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowDownToLine, Gamepad2, Megaphone, ShieldCheck } from "lucide-react";

const initialSave = JSON.stringify({ version: 1, data: { character: {}, inventory: [], milestones: [] } }, null, 2);

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const isPlayer = user?.role === "user";
  const gameData = useQuery(api.gameData.myGameData, isPlayer ? {} : "skip");
  const saveGame = useMutation(api.gameData.saveGame);
  const updateProfile = useMutation(api.gameData.updateProfile);
  const [saveText, setSaveText] = useState(initialSave);
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const playerName = gameData?.displayName ?? user?.playerName ?? "Player";

  useEffect(() => {
    if (user?.userId && loadedForUser !== user.userId && gameData !== undefined) {
      setSaveText(gameData.save ? JSON.stringify(gameData.save, null, 2) : initialSave);
      setLoadedForUser(user.userId);
    }
  }, [gameData, loadedForUser, user?.userId]);

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveMessage("");
    try {
      const state: unknown = JSON.parse(saveText);
      if (!state || typeof state !== "object" || !("version" in state) || !("data" in state)) {
        throw new Error("Use save data with version and data fields.");
      }
      setBusy(true);
      await saveGame({ state: state as { version: number; data: unknown } });
      setSaveMessage("Your game data is saved to your account.");
    } catch (error) {
      setSaveMessage(error instanceof SyntaxError ? "Save data must be valid JSON." : error instanceof Error ? error.message : "Could not save game data.");
    } finally {
      setBusy(false);
    }
  }

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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7651c9]"><Gamepad2 className="size-4" /> Player home</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your OpenWorlds hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Your profile and progress are private to your player account. Signed in as {playerName}.</p>
        </motion.div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white p-6 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="font-semibold tracking-tight">Player profile &amp; saved progress</h2><p className="mt-1 text-sm text-slate-500">Your saved data is only available through your signed-in player account.</p></div>
              <div className="flex flex-wrap gap-2"><Link to="/player-login" className="text-sm font-medium text-[#0066cc] hover:underline">Player account</Link><Button variant="outline" size="sm" onClick={() => void signOut()}>Sign out</Button></div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <form onSubmit={savePlayerName} className="space-y-3">
                <Label htmlFor="player-display-name">Player name</Label>
                <div className="flex gap-2"><Input id="player-display-name" minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={playerName} /><Button type="submit" variant="outline" disabled={!displayName.trim()}>Update</Button></div>
              </form>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Cloud save status</p>
                {gameData === undefined ? <p className="mt-1">Loading your private save…</p> : gameData.save ? <p className="mt-1">Saved {gameData.updatedAt ? new Date(gameData.updatedAt).toLocaleString() : ""}. Edit your save data below and save changes.</p> : <p className="mt-1">No game progress saved yet. Add your game data below to create your first cloud save.</p>}
              </div>
            </div>
            <form onSubmit={saveProgress} className="mt-6 space-y-3">
              <Label htmlFor="game-save-json">Game save data (JSON, max 64 KB)</Label>
              <textarea id="game-save-json" value={saveText} onChange={(event) => setSaveText(event.target.value)} maxLength={65536} rows={8} spellCheck={false} className="w-full rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" />
              {saveMessage && <p role="status" className="text-sm text-slate-600">{saveMessage}</p>}
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save game progress"}</Button>
            </form>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-[#7651c9]"><Megaphone className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Game news</h2><p className="text-xs text-slate-400">Official OpenWorlds updates</p></div>
            </div>
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">No news published here yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">There are no published announcements to show here yet. See the public News page for updates.</p>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }} className="rounded-2xl border border-slate-200 border-t-2 border-t-[#f3c64e] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-[#987000]"><ArrowDownToLine className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Game downloads</h2><p className="text-xs text-slate-400">Official builds only</p></div>
            </div>
            <div className="mt-8 rounded-xl bg-[#f5f7fb] p-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500"><span className="size-1.5 rounded-full bg-amber-400" /> No official links</span>
              <p className="mt-4 text-sm font-medium text-slate-800">Download details aren’t published here yet.</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Download links will be added once an official build is available.</p>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Availability and system requirements will be shown when officially confirmed.</div>
          </motion.section>
        </div>


      </div>
    </main>
  );
}
