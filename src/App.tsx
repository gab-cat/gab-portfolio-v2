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
import { Footer } from "./components/Footer";
import { Contact } from "./components/Contact";
import { Work } from "./components/Work";

export default function App({ path = "/" }: { path?: string }) {
  const contact = /^\/contact\/?$/.test(path);
  useEffect(() => initLenis(), []);
  return (
    <MotionConfig reducedMotion="user">
      <a href={contact ? "#contact-title" : "#work"} className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Nav contact={contact} />
      {!contact && <StoryWorld />}
      <main>
        {contact ? <Contact /> : <>
        <Hero />
        <Story />
        <Journey />
        <Work />
        <Trophies />
        <Hello />
        </>}
      </main>
      <div className={contact ? "contact-route" : undefined}><Footer /></div>
    </MotionConfig>
  );
}
