import { StatusScreen } from "@/components/states/StatusScreen";

// Rendered when a page calls forbidden() (HTTP 403).
export default function Forbidden() {
  return <StatusScreen code={403} actions={[{ href: "/", label: "Go to homepage", primary: true }, { href: "/contact", label: "Contact support" }]} />;
}
