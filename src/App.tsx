import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { initLenis } from "./lib/lenis";
import { Hello } from "./components/Hello";
import { Hero } from "./components/Hero";
import { Journey } from "./components/Journey";
import { Nav } from "./components/Nav";
import { ScrollProgress } from "./components/ScrollProgress";
import { Story } from "./components/Story";
import { Trophies } from "./components/Trophies";
import { StoryWorld } from "./components/Sculpture";
import { Work } from "./components/Work";

export default function App() {
  useEffect(() => initLenis(), []);
  return (
    <MotionConfig reducedMotion="user">
      <a href="#work" className="skip-link">
        Skip to work
      </a>
      <ScrollProgress />
      <Nav />
      <StoryWorld />
      <main>
        <Hero />
        <Story />
        <Journey />
        <Work />
        <Trophies />
        <Hello />
      </main>
    </MotionConfig>
  );
}
