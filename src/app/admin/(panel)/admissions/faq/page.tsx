import { redirect } from "next/navigation";

/** Listed on the Admissions screen (this path is in the breadcrumbs). */
export default function Page() {
  redirect("/admin/admissions#faq");
}
