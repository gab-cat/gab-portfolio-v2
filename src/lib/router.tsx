import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { ROUTES, jsonLdFor, normalizePath, routeFromPath, type RouteId } from "../seo";
import { scrollToId, scrollToTop } from "./scroll";

type Location = { path: string; hash: string };
/** How the page should land once the new route has rendered. */
type Landing = { kind: "push" } | { kind: "pop"; scroll: number | null } | null;

type Router = {
  path: string;
  route: RouteId;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

const RouterContext = createContext<Router | null>(null);

// useLayoutEffect warns during renderToString; the prerender never navigates anyway.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function parse(to: string): Location {
  const url = new URL(to, window.location.href);
  return { path: normalizePath(url.pathname), hash: url.hash.slice(1) };
}

function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function setMeta(selector: string, attr: "content" | "href", value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

/** Mirror the prerendered head so titles, canonicals and JSON-LD follow the route. */
function syncHead(route: RouteId) {
  const seo = ROUTES[route];
  document.title = seo.title;
  setMeta('meta[name="description"]', "content", seo.description);
  setMeta('meta[name="robots"]', "content", seo.index ? "index, follow, max-image-preview:large" : "noindex, nofollow");
  setMeta('link[rel="canonical"]', "href", seo.canonical);
  setMeta('meta[property="og:type"]', "content", seo.ogType);
  setMeta('meta[property="og:url"]', "content", seo.canonical);
  setMeta('meta[property="og:title"]', "content", seo.title);
  setMeta('meta[property="og:description"]', "content", seo.description);
  setMeta('meta[name="twitter:title"]', "content", seo.title);
  setMeta('meta[name="twitter:description"]', "content", seo.description);
  const ld = document.head.querySelector('script[type="application/ld+json"]');
  if (ld) ld.textContent = JSON.stringify(jsonLdFor(route));
}

/** Park focus at the top of the new page so screen readers start from the content. */
function focusMain() {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });
}

function jumpTo(hash: string) {
  const el = hash ? document.getElementById(hash) : null;
  if (el) el.scrollIntoView({ behavior: "instant" });
  else window.scrollTo({ top: 0, behavior: "instant" });
}

export function RouterProvider({
  initialPath,
  prepare,
  children,
}: {
  initialPath: string;
  /** Resolves once the next route's code is ready, so the swap never shows a blank frame. */
  prepare?: (route: RouteId) => Promise<unknown>;
  children: ReactNode;
}) {
  const [path, setPath] = useState(() => normalizePath(initialPath));
  const landing = useRef<Landing>(null);
  const pending = useRef<Location | null>(null);
  const hash = useRef("");
  const route = routeFromPath(path);

  const land = useCallback(() => {
    const how = landing.current;
    landing.current = null;
    if (!how) return;
    if (how.kind === "pop" && how.scroll !== null) window.scrollTo({ top: how.scroll, behavior: "instant" });
    else jumpTo(hash.current);
    if (how.kind === "push") focusMain();
  }, []);

  useEffect(() => {
    // We restore scroll ourselves once the next page has actually rendered.
    window.history.scrollRestoration = "manual";
    const onPop = (event: PopStateEvent) => {
      const next = parse(window.location.href);
      const scroll = typeof event.state?.scroll === "number" ? event.state.scroll : null;
      pending.current = next;
      void (prepare?.(routeFromPath(next.path)) ?? Promise.resolve()).then(() => {
        if (pending.current !== next) return;
        hash.current = next.hash;
        landing.current = { kind: "pop", scroll };
        setPath(next.path);
        // Same page, different hash: nothing re-renders, so land right away.
        if (next.path === path) land();
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  useIsoLayoutEffect(() => {
    if (!landing.current) return;
    syncHead(route);
    land();
  }, [path, land, route]);

  const navigate = useCallback(
    (to: string, { replace = false }: { replace?: boolean } = {}) => {
      const next = parse(to);
      const url = `${next.path}${next.hash ? `#${next.hash}` : ""}`;

      // Same page: just glide to the section like the in-page nav does.
      if (next.path === path) {
        window.history[replace ? "replaceState" : "pushState"]({}, "", url);
        if (next.hash) scrollToId(next.hash);
        else scrollToTop();
        return;
      }

      pending.current = next;
      void (prepare?.(routeFromPath(next.path)) ?? Promise.resolve()).then(() => {
        if (pending.current !== next) return;
        // Remember where we were so Back returns to the same spot.
        window.history.replaceState({ ...window.history.state, scroll: window.scrollY }, "");
        window.history[replace ? "replaceState" : "pushState"]({}, "", url);
        hash.current = next.hash;
        landing.current = { kind: "push" };
        setPath(next.path);
      });
    },
    [path, prepare],
  );

  return (
    <RouterContext.Provider value={{ path, route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) throw new Error("useRouter must be used inside <RouterProvider>");
  return router;
}

/** An anchor that swaps routes in place for internal paths and falls back to a normal link otherwise. */
export function Link({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useRouter();
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (props.target && props.target !== "_self") ||
      props.download !== undefined ||
      !isInternal(href)
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...props} />;
}
