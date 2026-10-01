import { resetPassword } from "@/app/actions/account";
import { ActionForm } from "@/components/forms/ActionForm";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Choose a new password");

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="container-pp max-w-md py-10 sm:py-16">
      <h1 className="mb-6 font-display text-3xl font-bold">Choose a new password</h1>
      <div className="card p-5 sm:p-6">
        <ActionForm action={resetPassword} submitLabel="Save password" submitClass="btn-primary w-full py-3">
          <input type="hidden" name="token" value={token} />
          <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" /></div>
        </ActionForm>
      </div>
    </div>
  );
}
