import { StatusScreen } from "@/components/states/StatusScreen";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("You're offline");

export default function Offline() {
  return (
    <StatusScreen
      code={0}
      showCode={false} artLabel="OFF"
      title="You're offline"
      message="PalletPort needs an internet connection to show current prices and stock. Reconnect and refresh the page."
      actions={[{ href: "/", label: "Retry", primary: true }]}
    />
  );
}
