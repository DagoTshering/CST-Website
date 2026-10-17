/*
 * Each admin page has its own loading.tsx: on a navigation between admin pages only the page's
 * own segment re-renders, so a loading boundary higher up would not cover it.
 */
export { PageSkeleton as default } from "@/components/admin/PageSkeleton";
