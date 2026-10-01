import { redirect } from "next/navigation";

export default function Reports() {
  redirect(`/blog?category=${encodeURIComponent("Market reports")}`);
}
