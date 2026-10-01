import { requireUser } from "@/lib/auth";
import { submitCertificate } from "@/app/actions/account";
import { ActionForm } from "@/components/forms/ActionForm";
import { AccountShell } from "../AccountNav";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Business verification");

const STATUS: Record<string, { title: string; tone: string; text: string }> = {
  NONE: { title: "Not verified", tone: "bg-sand", text: "Add your resale certificate to unlock Net 30 terms and tax-exempt purchasing." },
  PENDING: { title: "Under review", tone: "bg-amber-100 text-amber-900", text: "We're checking your certificate. This usually takes one business day." },
  APPROVED: { title: "Verified reseller", tone: "bg-moss/10 text-moss", text: "You're approved for Net 30 terms and tax-exempt checkout." },
  REJECTED: { title: "Needs attention", tone: "bg-rust/10 text-rust", text: "We couldn't verify that certificate. Check the number and state, then resubmit." },
};

export default async function VerificationPage() {
  const u = await requireUser("/account/verification");
  const s = STATUS[u.certStatus] ?? STATUS.NONE;
  return (
    <AccountShell active="/account/verification" title="Business verification">
      <div className="max-w-2xl space-y-6">
        <div className={`rounded-2xl p-5 ${s.tone}`}>
          <p className="font-display text-lg font-bold">{s.title}</p>
          <p className="text-sm">{s.text}</p>
        </div>
        {u.certStatus !== "APPROVED" && (
          <div className="card p-5 sm:p-6">
            <ActionForm action={submitCertificate} submitLabel={u.certStatus === "PENDING" ? "Update submission" : "Submit for review"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="certNumber">Resale certificate number</label><input id="certNumber" name="certNumber" defaultValue={u.certNumber ?? ""} className="input" required /></div>
                <div><label className="label" htmlFor="certState">Issuing state</label><input id="certState" name="certState" defaultValue={u.certState ?? ""} placeholder="e.g. OH" className="input" required /></div>
              </div>
              <p className="text-xs text-muted">We use this only to verify you're a reseller. It's kept private and used only for tax and terms.</p>
            </ActionForm>
          </div>
        )}
        <div className="card p-5 sm:p-6 text-sm">
          <p className="font-display font-semibold">What verification unlocks</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
            <li>Net 30 payment terms on qualifying orders</li>
            <li>Tax-exempt checkout where your certificate applies</li>
            <li>Priority access to new truckloads and warehouse events</li>
          </ul>
        </div>
      </div>
    </AccountShell>
  );
}
