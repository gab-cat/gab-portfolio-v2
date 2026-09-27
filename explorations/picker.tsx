import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./picker.css";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { mount } from "./shared/mount";
import { DIRECTIONS, EARLIER, Switcher } from "./shared/Switcher";

type Detail = {
  idea: string;
  how: string;
  after: string;
  built: string;
  type: string;
  swatches: string[];
};

const DETAIL: Record<(typeof DIRECTIONS)[number]["slug"], Detail> = {
  signal: {
    idea: "22,000 particles become your portrait, then a waveform, a lattice of blocks, a globe with arcs leaving Naga City, a giant seven, and finally the word hello.",
    how: "Scroll re-forms the figure chapter by chapter with a burst of noise between shapes. Move the cursor and the particles part around it.",
    after: "Lusion, Active Theory, Igloo Inc",
    built: "Three.js points, custom GLSL, portrait sampled from your photo",
    type: "Mona Sans (wide, light) and Geist Mono",
    swatches: ["#060607", "#efebe4", "#ff6a3d"],
  },
  keys: {
    idea: "A studio-lit mechanical keyboard that assembles itself key by key. Type on your real keyboard and the 3D keys press. Type WORK and hit enter to jump there.",
    how: "Scrolling orbits the camera. Midway the board explodes into five layers, each labelled as part of your stack. Contact is the orange enter key.",
    after: "Teenage Engineering, Nothing, Apple product pages",
    built: "Three.js, physical materials, soft shadows, canvas-drawn legends",
    type: "Host Grotesk, IBM Plex Mono and Doto",
    swatches: ["#efefec", "#111111", "#ff5a1f"],
  },
  onebit: {
    idea: "A 3D flight over Bicol drawn in three inks: Mayon at sunrise, Naga City's lights under Mt. Isarog, up through the cloud deck to a globe in orbit.",
    how: "Scroll flies the route. The whole scene renders small and passes through an ordered dither shader, with a flight HUD reading altitude and position.",
    after: "Return of the Obra Dinn, the dither revival on Awwwards",
    built: "Three.js terrain, custom sky, Bayer dither post-process",
    type: "Silkscreen and JetBrains Mono",
    swatches: ["#0c0b0a", "#ff6a2b", "#f0ebe1"],
  },
  kinetic: {
    idea: "One variable typeface does everything. Your name swells wider and heavier toward the cursor, the manifesto lights up word by word, the marquee follows your scroll.",
    how: "Counter preloader, cursor-reactive letters, a colour flip into the work list with a following preview, a pinned horizontal journey, stats that stretch as they count.",
    after: "Obys, Exo Ape, Locomotive",
    built: "Roboto Flex width and weight axes, Motion, Lenis. No 3D, on purpose",
    type: "Roboto Flex",
    swatches: ["#ff5a1f", "#0d0d0d"],
  },
  toybox: {
    idea: "No scrolling, just a pit of toys. GABCAT alphabet blocks, project crates, trophies that look like trophies and tool pills all fall in with real physics.",
    how: "Each tab drops its toys. Grab and throw anything, click a toy to read its story, and the orange ball opens contact. Shake and Tidy up do what they say.",
    after: "Bruno Simon, Shopify Editions",
    built: "Three.js, cannon-es physics, clearcoat plastic, soft shadows",
    type: "Unbounded and Onest",
    swatches: ["#ff5a1f", "#2d5bff", "#ffc21a", "#ff6fae", "#18b26b"],
  },
};

function Picker() {
  return (
    <>
      <header className="pk-top">
        <span className="pk-brand">gabcat explorations</span>
        <a href="/" className="pk-live">
          Current site <ArrowUpRight size={14} weight="bold" aria-hidden />
        </a>
      </header>

      <main className="pk">
        <section className="pk-intro">
          <h1>Five directions, built to win awards.</h1>
          <p>
            Round two. Each one borrows its craft from a different award-winning studio, and four of
            them are real-time 3D like the clay site. Same facts, very different experiences.
          </p>
          <p className="pk-status">
            Signal is now the site's design. The clay world it replaced is kept in{" "}
            <code>src/designs/clay</code>; run <code>bun run dev:clay</code> to see it.
          </p>
        </section>

        <ol className="pk-list">
          {DIRECTIONS.map((d, i) => {
            const x = DETAIL[d.slug];
            return (
              <li key={d.slug} className="pk-item">
                <a className="pk-shots" href={`/explorations/${d.slug}/`} aria-label={`Open ${d.name}`}>
                  <img className="pk-desk" src={`/explorations/thumbs/${d.slug}-desk.webp`} alt="" width={1440} height={900} />
                  <img className="pk-phone" src={`/explorations/thumbs/${d.slug}-phone.webp`} alt="" width={390} height={844} />
                </a>
                <div className="pk-text">
                  <p className="pk-num">
                    {String(i + 1).padStart(2, "0")}
                    {d.slug === "signal" && <b className="pk-live-tag">Now the site</b>}
                    <span>After {x.after}</span>
                  </p>
                  <h2>{d.name}</h2>
                  <p className="pk-idea">{x.idea}</p>
                  <dl>
                    <div>
                      <dt>How it plays</dt>
                      <dd>{x.how}</dd>
                    </div>
                    <div>
                      <dt>Built with</dt>
                      <dd>{x.built}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{x.type}</dd>
                    </div>
                  </dl>
                  <div className="pk-foot">
                    <span className="pk-swatches" aria-label="Palette">
                      {x.swatches.map((c) => (
                        <i key={c} style={{ background: c }} title={c} />
                      ))}
                    </span>
                    <a className="pk-open" href={`/explorations/${d.slug}/`}>
                      Open {d.name} <ArrowRight size={16} weight="bold" aria-hidden />
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="pk-earlier" aria-labelledby="pk-earlier-title">
          <h2 id="pk-earlier-title">Round one</h2>
          <p>The first five, kept for comparison: concept-led, flatter, quieter.</p>
          <ul>
            {EARLIER.map((d) => (
              <li key={d.slug}>
                <a href={`/explorations/${d.slug}/`}>
                  <img src={`/explorations/thumbs/${d.slug}-desk.webp`} alt="" width={1440} height={900} loading="lazy" />
                  <span>{d.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Switcher />
    </>
  );
}

mount(<Picker />);
