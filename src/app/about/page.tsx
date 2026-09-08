import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "About us — Dakar Travels",
  description:
    "Travel planning, without the guesswork. Honest guides, local knowledge and support from the first search to the journey home.",
};

/* About us — Figma 36565:75440. */
export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <Navbar />

      <div className="flex-1 pb-[clamp(48px,6.2vw,94px)]">
        <About />
      </div>

      <Footer />
    </main>
  );
}
