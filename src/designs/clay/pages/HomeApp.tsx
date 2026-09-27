import { AppShell } from "../components/AppShell";
import { Craft } from "../components/Craft";
import { Hello } from "../components/Hello";
import { Hero } from "../components/Hero";
import { Journey } from "../components/Journey";
import { StoryWorld } from "../components/Sculpture";
import { Story } from "../components/Story";
import { Trophies } from "../components/Trophies";
import { Work } from "../components/Work";

export default function HomeApp() {
  return (
    <AppShell route="home">
      <StoryWorld />
      <main>
        <Hero />
        <div className="sheet">
          <Story />
          <Craft />
          <Journey />
          <Work />
          <Trophies />
          <Hello />
        </div>
      </main>
    </AppShell>
  );
}
