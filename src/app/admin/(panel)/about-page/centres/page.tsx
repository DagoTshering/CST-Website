import { redirect } from "next/navigation";

/** The centres are listed on the About Page screen (this path is in the breadcrumbs). */
export default function Page() {
  redirect("/admin/about-page#centres");
}
