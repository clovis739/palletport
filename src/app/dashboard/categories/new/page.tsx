import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryForm } from "../CategoryForm";

export const metadata = { title: "New category" };

export default async function NewCategory() {
  await requireStaff("lots", "/dashboard/categories/new");
  const groups = (await db.category.findMany({ select: { group: true }, distinct: ["group"] })).map((g) => g.group);
  return (
    <>
      <PageHeader back={{ href: "/dashboard/categories", label: "All categories" }} title="New category" description="After creating it, add its subcategories." />
      <div className="max-w-3xl">
        <CategoryForm groups={groups} />
      </div>
    </>
  );
}
