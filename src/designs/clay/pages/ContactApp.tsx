import { AppShell } from "../components/AppShell";
import { Contact } from "../components/Contact";

export default function ContactApp() {
  return (
    <AppShell route="contact">
      <main>
        <Contact />
      </main>
    </AppShell>
  );
}
