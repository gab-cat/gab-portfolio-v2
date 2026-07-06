import { useEffect } from "react";
import { HELLO_MARQUEE, MARQUEE_ITEMS, WINS_TICKER } from "./data";
import { initLenis } from "./lib/lenis";
import { Cursor } from "./components/Cursor";
import {
  OrbitDivider,
  RouteDivider,
  ShippedDivider,
} from "./components/Dividers";
import { Hello } from "./components/Hello";
import { Hero } from "./components/Hero";
import { Journey } from "./components/Journey";
import { Marquee } from "./components/Marquee";
import { Nav } from "./components/Nav";
import { ScrollProgress } from "./components/ScrollProgress";
import { Story } from "./components/Story";
import { Toolbox } from "./components/Toolbox";
import { Trophies } from "./components/Trophies";
import { Work } from "./components/Work";

export default function App() {
  useEffect(() => initLenis(), []);

  return (
    <>
      <ScrollProgress />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Marquee items={MARQUEE_ITEMS} />
        <Story />
        <RouteDivider />
        <Journey />
        <ShippedDivider />
        <Work />
        <Marquee items={WINS_TICKER} variant="ticker" />
        <Trophies />
        <OrbitDivider />
        <Toolbox />
        <Marquee items={HELLO_MARQUEE} variant="giant" />
        <Hello />
      </main>
    </>
  );
}
