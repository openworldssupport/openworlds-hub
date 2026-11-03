import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Stops restricted accounts at the door and gives them a way to appeal.
 * Policy pages remain public and no policy acceptance is required to browse.
 */
export function AccountStatusGate({ children }: { children: ReactNode }) {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const siteAccess = useQuery(api.security.accessStatus);
  const submitAppeal = useMutation(api.security.submitAppeal);
  const { signOut } = useAuthActions();
  const [error, setError] = useState("");
  const [appealText, setAppealText] = useState("");
  const [appealSent, setAppealSent] = useState(false);

  async function handleAppeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await submitAppeal({ message: appealText });
      setAppealSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your appeal. Please try again.");
    }
  }

  if (isAuthLoading || siteAccess === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground" role="status" aria-live="polite">
        Checking account status…
      </main>
    );
  }

  if (!siteAccess.isBanned) return <>{children}</>;

  const temporary = siteAccess.banType === "temporary" && Boolean(siteAccess.banExpiresAt);
  const appealWasDeclined = siteAccess.lastAppeal?.status === "declined" && !siteAccess.hasPendingAppeal && !appealSent;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 text-slate-900">
      <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-red-700">Account status · action taken</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {temporary ? "Your account is temporarily unavailable" : "Your account is unavailable"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This restriction applies to your OpenWorlds website and game account. You can still read this notice and submit an appeal.
        </p>

        <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-200 text-sm">
          <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Restriction</dt><dd className="text-right font-medium">{temporary ? "Temporary suspension" : "Permanent suspension"}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">{temporary ? "Access returns" : "Duration"}</dt><dd className="text-right font-medium">{temporary && siteAccess.banExpiresAt ? new Date(siteAccess.banExpiresAt).toLocaleString() : "Does not expire automatically"}</dd></div>
          {siteAccess.reason && <div className="flex justify-between gap-4 py-3"><dt className="shrink-0 text-slate-500">Reason</dt><dd className="text-right leading-6 text-slate-700">{siteAccess.reason}</dd></div>}
        </dl>

        {appealSent || siteAccess.hasPendingAppeal ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">Your appeal is under review</p>
            <p className="mt-1 leading-6">An authorized moderator will review the original decision and evidence. You do not need to send another appeal while this one is pending.</p>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950">
            <p className="font-medium">{appealWasDeclined ? "Your previous appeal was declined" : "Think this was a mistake?"}</p>
            <p className="mt-1">
              {appealWasDeclined && siteAccess.lastAppeal?.reviewedAt
                ? `The last appeal was reviewed on ${new Date(siteAccess.lastAppeal.reviewedAt).toLocaleString()}. You can submit a new appeal if you have new information.`
                : "If you believe this decision was unfair, explain what happened and include any case reference you have."}
            </p>
          </div>
        )}

        {!appealSent && !siteAccess.hasPendingAppeal && isAuthenticated && (
          <form onSubmit={(event) => void handleAppeal(event)} className="mt-5 space-y-3">
            <label htmlFor="ban-appeal" className="text-sm font-medium">Appeal this restriction</label>
            <Textarea id="ban-appeal" value={appealText} onChange={(event) => setAppealText(event.target.value)} minLength={20} maxLength={3000} required rows={5} placeholder="Explain what happened, why you believe the decision should be reviewed, and include any new evidence." />
            <Button type="submit" disabled={appealText.trim().length < 20}>Send appeal</Button>
          </form>
        )}
        {!isAuthenticated && <p className="mt-5 text-sm text-slate-600">Sign in to the affected account to submit an appeal.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-500">
          <div>
            <p>Need help outside the appeal process? Email <a href="mailto:contact@openworlds.dk" className="font-medium text-[#176b45] underline">contact@openworlds.dk</a>.</p>
            <p className="mt-1">Do not create another account to get around a restriction; that can lead to further action.</p>
          </div>
          {isAuthenticated && (
            <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
