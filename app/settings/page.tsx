/** Route: `/settings` — user preferences and app configuration. */
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";

/** Shows account and integration settings inside the app shell. */
export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  );
}
