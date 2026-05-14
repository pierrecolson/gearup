import { redirect } from "next/navigation";

type SearchParams = Promise<{ status?: string }>;

export default async function NewDevicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  redirect(status === "wishlist" ? "/wishlist?add=1" : "/devices?add=1");
}
