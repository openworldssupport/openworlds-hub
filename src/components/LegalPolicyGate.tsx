import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { privacySections } from "@/pages/Privacy";
import { termsSections } from "@/pages/Terms";
import { ACTIVE_AGREEMENT_REVISION, ACTIVE_PRIVACY_VERSION, ACTIVE_TERMS_VERSION } from "@/lib/legalVersions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const storageKey = `openworlds-policy-acceptance:${ACTIVE_PRIVACY_VERSION}:${ACTIVE_TERMS_VERSION}:${ACTIVE_AGREEMENT_REVISION}`;

export function LegalPolicyGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const legalStatus = useQuery(api.legal.status, isAuthenticated ? {} : "skip");
  const siteAccess = useQuery(api.security.accessStatus);
  const acceptCurrent = useMutation(api.legal.acceptCurrent);
  const submitAppeal = useMutation(api.security.submitAppeal);
  const { signOut } = useAuthActions();
  const [localReady, setLocalReady] = useState(false);
  const [localAccepted, setLocalAccepted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [appealText, setAppealText] = useState("");
  const [appealSent, setAppealSent] = useState(false);

  useEffect(() => {
    try {
      setLocalAccepted(window.localStorage.getItem(storageKey) === "accepted");
    } catch {
      setLocalAccepted(false);
    }
    setLocalReady(true);
  }, []);

  const isPublicPolicyPage = location.pathname === "/privacy" || location.pathname === "/terms";
  const isChecking = isAuthLoading || siteAccess === undefined || (isAuthenticated && legalStatus === undefined) || (!isAuthenticated && !localReady);
  const isAccepted = isAuthenticated ? legalStatus?.accepted === true : localAccepted;

  async function handleAppeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await submitAppeal({ message: appealText });
      setAppealSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your appeal. Please try again.");
    }
  }

  async function handleAccept() {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (isAuthenticated) {
        await acceptCurrent({
          privacyVersion: ACTIVE_PRIVACY_VERSION,
          termsVersion: ACTIVE_TERMS_VERSION,
          agreementRevision: ACTIVE_AGREEMENT_REVISION,
        });
      } else {
        window.localStorage.setItem(storageKey, "accepted");
        setLocalAccepted(true);
      }
    } catch {
      setError("We couldn't save your agreement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (siteAccess?.isBanned) {
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

  // Keep these public legal URLs directly readable without accepting a modal first.
  if (isPublicPolicyPage) return <>{children}</>;

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground" role="status" aria-live="polite">
        Checking policy agreement…
      </main>
    );
  }
  if (isAccepted) return <>{children}</>;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="flex max-h-[94vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-5 text-left sm:px-7">
          <DialogTitle className="text-2xl">Please review and agree</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6">
            Review the current policies below before continuing. Returning visitors will be asked again only when a policy version changes.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm leading-6 sm:px-7">
          <article>
            <h2 className="font-semibold">Privacy Policy · version {ACTIVE_PRIVACY_VERSION}</h2>
            <p className="mt-2 text-slate-600">This policy describes player and staff account/security data, support tickets stored in the website database, career submissions emailed to the Careers inbox (with a hashed-email rate-limit record), and generic submission alerts configured by admins. Admin and staff visibility, privacy controls, and provider/game-data verification limits are detailed below. Convex provides the website database, authentication, and file storage; configured email services deliver website messages.</p>
            <p className="mt-2 text-slate-600">When you use in-game voice chat, your voice is transmitted to other players so you can communicate. The full policy is a transparency draft based on reviewed code and requires live-deployment and legal review.</p>
            <details id="policy-full-privacy" open className="mt-4 border-t border-slate-200 pt-3">
              <summary className="cursor-pointer font-medium text-[#0066cc]">Read the complete Privacy Policy</summary>
              <div className="mt-4 space-y-5">
                {privacySections.map((section) => (
                  <section key={section.title}>
                    <h3 className="font-semibold">{section.title}</h3>
                    <div className="mt-2 space-y-2 text-slate-600">
                      {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </section>
                ))}
              </div>
            </details>
          </article>

          <article className="border-t border-slate-200 pt-5">
            <h2 className="font-semibold">Terms of Service · version {ACTIVE_TERMS_VERSION}</h2>
            <p className="mt-2 text-slate-600">The Terms explain how to use the OpenWorlds website and game respectfully, including multiplayer features such as voice chat.</p>
            <details id="policy-full-terms" open className="mt-4 border-t border-slate-200 pt-3">
              <summary className="cursor-pointer font-medium text-[#0066cc]">Read the complete Terms of Service</summary>
              <div className="mt-4 space-y-5">
                {termsSections.map((section) => (
                  <section key={section.title}>
                    <h3 className="font-semibold">{section.title}</h3>
                    <div className="mt-2 space-y-2 text-slate-600">
                      {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </section>
                ))}
              </div>
            </details>
          </article>

          <label className="flex cursor-pointer items-start gap-3 border-t border-slate-200 pt-5 font-medium text-slate-800">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#0066cc]"
            />
            <span>I have reviewed and agree to the current OpenWorlds Privacy Policy and Terms of Service. These are informational drafts; final legal terms and service data practices require operator and deployment review.</span>
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="text-xs leading-5 text-slate-500">
            <p>Signed-in agreements are saved to your account; visitor agreements are saved in this browser.</p>
            <p className="mt-1">OpenWorlds is not currently a registered company.</p>
          </div>
          <Button onClick={handleAccept} disabled={!agreed || submitting}>
            {submitting ? "Saving…" : "Agree and continue"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
