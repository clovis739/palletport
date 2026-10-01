import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/account";
import { ActionForm } from "@/components/forms/ActionForm";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Reset your password");

export default function ForgotPasswordPage() {
  return (
    <div className="container-pp max-w-md py-10 sm:py-16">
      <h1 className="font-display text-3xl font-bold">Forgot your password?</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Enter your email and we'll send you a link to choose a new one.</p>
      <div className="card p-5 sm:p-6">
        <ActionForm action={requestPasswordReset} submitLabel="Send reset link" submitClass="btn-primary w-full py-3">
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required /></div>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-signal-dark hover:underline">Back to sign in</Link></p>
    </div>
  );
}
