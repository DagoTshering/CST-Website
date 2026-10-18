import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { listDepartmentOptions } from "@/lib/cms/resources/staff";

export const metadata: Metadata = { title: "Arrange staff" };

export default async function Page({ searchParams }: PageProps<"/admin/staff/arrange">) {
  const [{ department }, departments] = await Promise.all([searchParams, listDepartmentOptions()]);
  const selected = departments.find((d) => String(d.id) === department) ?? departments[0];
  if (!selected) {
    return (
      <ArrangePage
        list="staff"
        group="0"
        title="Arrange staff"
        description="There are no departments yet."
        cancelHref="/admin/staff"
      />
    );
  }
  return (
    <ArrangePage
      list="staff"
      group={String(selected.id)}
      title={`Arrange staff — ${selected.name}`}
      description="The order of the people in this department in the Staff Directory. Drag a row, or use its arrows, then save. Choose another department above."
      cancelHref={`/admin/staff?department=${selected.id}`}
      showPhotos
      groups={departments.map((d) => ({
        label: d.name,
        href: `/admin/staff/arrange?department=${d.id}`,
        active: d.id === selected.id,
      }))}
    />
  );
}
