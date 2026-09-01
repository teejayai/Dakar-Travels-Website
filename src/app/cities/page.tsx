import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CitiesGrid from "@/components/CitiesGrid";

export const metadata: Metadata = {
  title: "Cities — Dakar Travels",
  description:
    "Not ranked, not sorted by popularity. Pick the feeling you're after and we'll narrow the map for you.",
};

/* Cities index — Figma 36385:291662 (Cities_illustration).
   Content column starts 179px down the 1512 frame, under the fixed navbar. */
export default function CitiesPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col bg-background">
      <Navbar />

      <div className="flex-1 pb-[clamp(64px,8vw,120px)] pt-[clamp(140px,11.8vw,179px)]">
        <CitiesGrid />
      </div>

      <Footer />
    </main>
  );
}
