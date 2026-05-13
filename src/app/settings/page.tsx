import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
        description="Preferences are stored in data/settings.json."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
