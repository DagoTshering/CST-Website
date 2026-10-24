import { redirect } from "next/navigation";

/** Listed on the Contact page screen (this path is in the breadcrumbs). */
export default function Page() {
  redirect("/admin/contact#online");
}
