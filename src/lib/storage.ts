import type { SaveSnapshot, Settings } from "../types";

const SAVE_KEY = "galgame-demo-save";
const SETTINGS_KEY = "galgame-demo-settings";

const hasElectronApi = () => typeof window.electronAPI !== "undefined";

export const defaultSettings: Settings = {
  textSpeed: 28,
  autoSpeed: 1800,
  masterVolume: 70
};

export async function saveProgress(snapshot: SaveSnapshot) {
  if (hasElectronApi()) {
    await window.electronAPI!.saveProgress(snapshot);
    return;
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
}

export async function loadProgress() {
  if (hasElectronApi()) {
    return (await window.electronAPI!.loadProgress()) as SaveSnapshot | null;
  }
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? (JSON.parse(raw) as SaveSnapshot) : null;
}

export async function clearProgress() {
  if (hasElectronApi()) {
    await window.electronAPI!.clearProgress();
    return;
  }
  localStorage.removeItem(SAVE_KEY);
}

export function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return defaultSettings;
  }
  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
