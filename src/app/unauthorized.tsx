import { StatusScreen } from "@/components/states/StatusScreen";

// Rendered when a page calls unauthorized() (HTTP 401).
export default function Unauthorized() {
  return <StatusScreen code={401} actions={[{ href: "/login", label: "Sign in", primary: true }, { href: "/register", label: "Create an account" }]} />;
}
