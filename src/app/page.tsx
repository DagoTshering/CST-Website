import { About } from "@/components/home/About";
import { Announcements } from "@/components/home/Announcements";
import { Events } from "@/components/home/Events";
import { Facilities } from "@/components/home/Facilities";
import { Hero } from "@/components/home/hero/Hero";
import { Leadership } from "@/components/home/Leadership";
import { MissionVision } from "@/components/home/MissionVision";
import { Programmes } from "@/components/home/Programmes";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <MissionVision />
      <Facilities />
      {/* from the homepage on main, in its order */}
      <Programmes />
      <Events />
      <Leadership />
      <Announcements />
    </>
  );
}
