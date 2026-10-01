import { requireUser } from "@/lib/auth";
import { changePassword } from "@/app/actions/account";
import { ActionForm } from "@/components/forms/ActionForm";
import { AccountShell } from "../AccountNav";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Password & security");

export default async function SecurityPage() {
  await requireUser("/account/security");
  return (
    <AccountShell active="/account/security" title="Password & security">
      <div className="card max-w-md p-5 sm:p-6">
        <ActionForm action={changePassword} submitLabel="Update password" resetOnSuccess>
          <div><label className="label" htmlFor="current">Current password</label><input id="current" name="current" type="password" className="input" required autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" /></div>
        </ActionForm>
      </div>
    </AccountShell>
  );
}
