import { About } from "@/components/home/About";
import { Facilities } from "@/components/home/Facilities";
import { Hero } from "@/components/home/hero/Hero";
import { MissionVision } from "@/components/home/MissionVision";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <MissionVision />
      <Facilities />
    </>
  );
}
