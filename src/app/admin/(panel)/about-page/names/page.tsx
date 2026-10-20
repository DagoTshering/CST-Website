import { redirect } from "next/navigation";

/** The names are listed on the About Page screen (this path is in the breadcrumbs). */
export default function Page() {
  redirect("/admin/about-page#names");
}
