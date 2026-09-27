import { design } from "@design/server";
import { RouterProvider, useRouter } from "./lib/router";

const { Frame, pages } = design;

function Page() {
  const Current = pages[useRouter().route];
  return <Current />;
}

/** Used by prerender. The client entry lazy-loads each route module instead. */
export default function App({ path = "/" }: { path?: string }) {
  return (
    <RouterProvider initialPath={path}>
      <Frame>
        <Page />
      </Frame>
    </RouterProvider>
  );
}
