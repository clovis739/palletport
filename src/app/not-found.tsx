import { StatusScreen } from "@/components/states/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen code={404} actions={[{ href: "/search", label: "Search all lots", primary: true }, { href: "/new", label: "New arrivals" }, { href: "/", label: "Homepage" }]}>
      <form action="/search" className="mx-auto mt-6 flex max-w-md gap-2">
        <input name="q" placeholder="What were you looking for?" className="input rounded-full" aria-label="Search" />
        <button className="btn-dark shrink-0">Search</button>
      </form>
    </StatusScreen>
  );
}
