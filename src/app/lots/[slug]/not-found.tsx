import { StatusScreen } from "@/components/states/StatusScreen";

export default function LotNotFound() {
  return (
    <StatusScreen
      code={404}
      title="We can't find that lot"
      message="It may have sold, been removed, or the link is mistyped. New lots are listed every day."
      actions={[{ href: "/lots", label: "Shop all lots", primary: true }, { href: "/new", label: "New arrivals" }]}
    />
  );
}
