import { StatusScreen } from "@/components/states/StatusScreen";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Scheduled maintenance");

// Middleware rewrites every request here with HTTP 503 while MAINTENANCE_MODE=1.
export default function Maintenance() {
  return (
    <StatusScreen code={503} showCode={false} artLabel="503" actions={[{ href: "/help", label: "Help center" }]}>
      <p className="mt-4 text-sm text-muted">{process.env.MAINTENANCE_MESSAGE ?? "We expect to be back within the hour."}</p>
    </StatusScreen>
  );
}
