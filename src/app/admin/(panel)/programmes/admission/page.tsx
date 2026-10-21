import { redirect } from "next/navigation";

/** The admission details moved to Admin › Admissions (the documents section). */
export default function Page() {
  redirect("/admin/admissions");
}
