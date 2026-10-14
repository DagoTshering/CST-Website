import { AboutSection } from "@/components/home/AboutSection";
import { AcademicProgramsSection } from "@/components/home/AcademicProgramsSection";
import { AnnouncementsSection } from "@/components/home/AnnouncementsSection";
import { EventsSection } from "@/components/home/EventsSection";
import { FacilitiesSection } from "@/components/home/FacilitiesSection";
import { HeroSection } from "@/components/home/HeroSection";
import { LeadershipSection } from "@/components/home/LeadershipSection";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <HeroSection />
        <AboutSection />
        <FacilitiesSection />
        <AcademicProgramsSection />
        <EventsSection />
        <LeadershipSection />
        <AnnouncementsSection />
      </main>
      <Footer />
    </>
  );
}
