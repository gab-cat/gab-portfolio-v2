import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { EMAIL, PROJECTS, TOOLBOX, TROPHIES } from "../data";
import { setTheme, toggleTheme } from "../lib/theme";
import { scrollToId } from "../lib/lenis";

type Line = { kind: "cmd" | "out" | "accent"; text: string };

const PROMPT = "gab@gabcat.dev:~$";

const HELP: Line[] = [
  { kind: "out", text: "things I understand:" },
  { kind: "accent", text: "  whoami      — who is this guy?" },
  { kind: "accent", text: "  work        — what has he built?" },
  { kind: "accent", text: "  wins        — the trophy shelf" },
  { kind: "accent", text: "  toolbox     — what he builds with" },
  { kind: "accent", text: "  theme       — flip light/dark mode" },
  { kind: "accent", text: "  coffee      — essential infrastructure" },
  { kind: "accent", text: "  contact     — say hello" },
  { kind: "accent", text: "  sudo hire-me — you know what to do" },
  { kind: "out", text: "…plus a few secrets. clear wipes the screen." },
];

function respond(raw: string): { lines: Line[]; clear?: boolean } {
  const cmd = raw.trim().toLowerCase();
  switch (cmd) {
    case "":
      return { lines: [] };
    case "help":
    case "?":
      return { lines: HELP };
    case "whoami":
      return {
        lines: [
          { kind: "out", text: "Gabriel Angelo Catimbang — Gab for short." },
          {
            kind: "out",
            text: "Developer & DevOps engineer from Naga City, PH.",
          },
          {
            kind: "out",
            text: "Builds things for the internet, keeps them alive.",
          },
        ],
      };
    case "work":
    case "projects":
      scrollLater("work");
      return {
        lines: [
          ...PROJECTS.map(
            (p): Line => ({
              kind: "accent",
              text: `  ${p.index}. ${p.name} — ${p.tagline}`,
            }),
          ),
          { kind: "out", text: "scrolling you there…" },
        ],
      };
    case "wins":
    case "awards":
    case "trophies":
      return {
        lines: [
          ...TROPHIES.slice(0, 4).map(
            (t): Line => ({
              kind: "accent",
              text: `  ${t.year} · ${t.place} — ${t.event}`,
            }),
          ),
          { kind: "out", text: `…and ${TROPHIES.length - 4} more. shelf's getting heavy.` },
        ],
      };
    case "toolbox":
    case "stack":
    case "skills":
      return {
        lines: TOOLBOX.map(
          (g): Line => ({
            kind: "accent",
            text: `  ${g.group.toLowerCase()}: ${g.items.join(", ")}`,
          }),
        ),
      };
    case "contact":
    case "email":
      return {
        lines: [
          { kind: "accent", text: `  ${EMAIL}` },
          { kind: "out", text: "inbox is open. he actually replies." },
        ],
      };
    case "coffee":
      return {
        lines: [
          { kind: "out", text: "brewing… ☕" },
          { kind: "accent", text: "coffee.service started. productivity +200%." },
        ],
      };
    case "theme":
      toggleTheme();
      return { lines: [{ kind: "accent", text: "mood flipped. easy on the eyes." }] };
    case "theme dark":
      setTheme("dark");
      return { lines: [{ kind: "accent", text: "lights off. welcome to the night shift." }] };
    case "theme light":
      setTheme("light");
      return { lines: [{ kind: "accent", text: "lights on. fresh paper." }] };
    case "clear":
      return { lines: [], clear: true };
    case "sudo hire-me":
    case "sudo hire me":
      window.setTimeout(() => {
        window.location.href = `mailto:${EMAIL}?subject=Let's build something`;
      }, 900);
      return {
        lines: [
          { kind: "accent", text: "permission granted." },
          { kind: "out", text: "opening inbox…" },
        ],
      };
    case "sudo":
      return {
        lines: [{ kind: "out", text: "you're not root here. but `sudo hire-me` works." }],
      };
    case "ls":
      return {
        lines: [
          { kind: "accent", text: "story/  journey/  work/  wins/  hello/" },
          { kind: "out", text: "they're all just a scroll away." },
        ],
      };
    case "cat resume":
    case "resume":
      return {
        lines: [
          { kind: "out", text: "the good stuff is on this very page — scroll on." },
          { kind: "accent", text: "or: linkedin.com/in/gabrielcatimbang" },
        ],
      };
    case "hi":
    case "hello":
    case "hey":
      return { lines: [{ kind: "accent", text: "hey there 👋 glad you found the terminal." }] };
    case "exit":
    case "quit":
      return {
        lines: [
          {
            kind: "out",
            text: "you can check out any time you like, but you can never leave 🎸",
          },
        ],
      };
    default:
      return {
        lines: [
          {
            kind: "out",
            text: `command not found: ${cmd} — type 'help' (it's friendly, promise)`,
          },
        ],
      };
  }
}

function scrollLater(id: string) {
  window.setTimeout(() => scrollToId(id), 700);
}

export function Terminal() {
  const shellRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bootedRef = useRef(false);
  const inView = useInView(shellRef, { once: true, amount: 0.4 });

  const [history, setHistory] = useState<Line[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");

  // Boot sequence: auto-type `whoami`, then hand the keyboard over.
  useEffect(() => {
    if (!inView || bootedRef.current) return;
    bootedRef.current = true;
    let alive = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = async () => {
      const sleep = (ms: number) =>
        new Promise((r) => setTimeout(r, reduced ? 0 : ms));
      await sleep(600);
      const cmd = "whoami";
      for (let i = 1; i <= cmd.length; i++) {
        if (!alive) return;
        setTyping(cmd.slice(0, i));
        await sleep(70);
      }
      await sleep(250);
      if (!alive) return;
      setTyping(null);
      setHistory([{ kind: "cmd", text: cmd }, ...respond(cmd).lines]);
      await sleep(500);
      if (!alive) return;
      setHistory((h) => [
        ...h,
        { kind: "out", text: "" },
        { kind: "out", text: "this terminal works. type `help` to poke around —" },
        { kind: "out", text: "non-nerds welcome (try `coffee`)." },
      ]);
      setReady(true);
    };
    void run();
    return () => {
      alive = false;
    };
  }, [inView]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, typing, value]);

  const submit = () => {
    const raw = value;
    setValue("");
    const { lines, clear } = respond(raw);
    setHistory((h) =>
      clear ? [] : [...h, { kind: "cmd", text: raw }, ...lines],
    );
  };

  return (
    <div
      ref={shellRef}
      className="w-full overflow-hidden rounded-xl border border-line bg-term shadow-[0_24px_80px_-24px_var(--glow),0_8px_30px_rgba(0,0,0,0.35)]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-[#8a8375]">
          gab@gabcat.dev — this thing actually works
        </span>
      </div>

      <div
        ref={bodyRef}
        data-lenis-prevent
        className="h-[340px] cursor-text overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed"
      >
        {history.map((line, i) =>
          line.kind === "cmd" ? (
            <p key={i} className="text-[#ece5d6]">
              <span className="mr-2 text-[#ff5c1a]">{PROMPT}</span>
              {line.text}
            </p>
          ) : (
            <p
              key={i}
              className={`whitespace-pre-wrap ${
                line.kind === "accent" ? "text-[#ffa26b]" : "text-[#9b9384]"
              }`}
            >
              {line.text || " "}
            </p>
          ),
        )}

        {typing !== null && (
          <p className="text-[#ece5d6]">
            <span className="mr-2 text-[#ff5c1a]">{PROMPT}</span>
            {typing}
            <span className="caret ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#ff5c1a]" />
          </p>
        )}

        {ready && (
          <div className="flex items-center text-[#ece5d6]">
            <span className="mr-2 shrink-0 text-[#ff5c1a]">{PROMPT}</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-transparent font-mono text-[13px] text-[#ece5d6] caret-[#ff5c1a] outline-none placeholder:text-[#5d574c]"
              placeholder="type help…"
              aria-label="Terminal input"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
