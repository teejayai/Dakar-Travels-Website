import { notFound } from "next/navigation";
import { CITY_INFO, getCity } from "@/components/cityData";
import CityDetail from "@/components/CityDetail";

export function generateStaticParams() {
  return CITY_INFO.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const city = getCity((await params).slug);
  if (!city) return {};
  return {
    title: `${city.name} — Dakar Travels`,
    description: city.description.slice(0, 160),
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const city = getCity((await params).slug);
  if (!city) notFound();
  return <CityDetail city={city} />;
}
