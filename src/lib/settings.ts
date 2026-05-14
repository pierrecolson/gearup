import "server-only";
import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "./types";
import { supabase } from "./supabase";

type SettingsRow = {
  id: number;
  display_currency: string;
  default_input_currency: string;
  date_format: string;
  open_router_model: string | null;
  updated_at: string;
};

function fromRow(r: SettingsRow) {
  // dateFormat is an enum; legacy stored values that aren't in the enum are
  // coerced to the default via the schema's .catch() at parse time.
  return {
    displayCurrency: r.display_currency,
    defaultInputCurrency: r.default_input_currency,
    dateFormat: r.date_format,
    openRouterModel: r.open_router_model,
  };
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  const parsed = SettingsSchema.safeParse(fromRow(data as SettingsRow));
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveSettings(input: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged = SettingsSchema.parse({ ...current, ...input });
  const { error } = await supabase
    .from("settings")
    .update({
      display_currency: merged.displayCurrency,
      default_input_currency: merged.defaultInputCurrency,
      date_format: merged.dateFormat,
      open_router_model: merged.openRouterModel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw error;
  return merged;
}
