import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/app/actions/account";
import { ActionForm } from "@/components/forms/ActionForm";
import { BUSINESS_TYPES } from "@/lib/format";
import { AccountShell } from "./AccountNav";
import { Select } from "@/components/ui/Select";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Your account");

export default async function AccountPage() {
  const u = await requireUser("/account");
  return (
    <AccountShell active="/account" title="Profile & address">
      <div className="card max-w-2xl p-5 sm:p-6">
        <ActionForm action={updateProfile} submitLabel="Save changes" successText="Saved">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" defaultValue={u.name} className="input" required /></div>
            <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={u.phone ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="businessName">Business name</label><input id="businessName" name="businessName" defaultValue={u.businessName ?? ""} className="input" required /></div>
            <div>
              <label className="label" htmlFor="businessType">Business type</label>
              <Select id="businessType" name="businessType" defaultValue={u.businessType ?? ""} className="input">
                <option value="">Select…</option>
                {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <p className="pt-2 font-display font-semibold">Default delivery address</p>
          <div><label className="label" htmlFor="shipAddress">Street address</label><input id="shipAddress" name="shipAddress" defaultValue={u.shipAddress ?? ""} className="input" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="shipCity">City</label><input id="shipCity" name="shipCity" defaultValue={u.shipCity ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="shipRegion">State / region</label><input id="shipRegion" name="shipRegion" defaultValue={u.shipRegion ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="shipPostal">Postal code</label><input id="shipPostal" name="shipPostal" defaultValue={u.shipPostal ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="shipCountry">Country</label><input id="shipCountry" name="shipCountry" defaultValue={u.shipCountry ?? "United States"} className="input" /></div>
          </div>
          <p className="break-all text-xs text-muted">Signed in as {u.email}</p>
        </ActionForm>
      </div>
    </AccountShell>
  );
}
