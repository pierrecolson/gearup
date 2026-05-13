import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "./types";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(input: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged = SettingsSchema.parse({ ...current, ...input });
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(
    SETTINGS_PATH,
    JSON.stringify(merged, null, 2) + "\n",
    "utf8",
  );
  return merged;
}
