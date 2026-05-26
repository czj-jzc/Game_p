import type { Settings } from "../types";

type SettingsPanelProps = {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onChange: (next: Settings) => void;
};

export default function SettingsPanel({
  open,
  settings,
  onClose,
  onChange
}: SettingsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <label>
          文字速度
          <input
            type="range"
            min={10}
            max={60}
            value={settings.textSpeed}
            onChange={(event) =>
              onChange({ ...settings, textSpeed: Number(event.currentTarget.value) })
            }
          />
          <span>{settings.textSpeed}</span>
        </label>
        <label>
          自动播放速度
          <input
            type="range"
            min={800}
            max={3500}
            step={100}
            value={settings.autoSpeed}
            onChange={(event) =>
              onChange({ ...settings, autoSpeed: Number(event.currentTarget.value) })
            }
          />
          <span>{settings.autoSpeed}ms</span>
        </label>
        <label>
          音量
          <input
            type="range"
            min={0}
            max={100}
            value={settings.masterVolume}
            onChange={(event) =>
              onChange({ ...settings, masterVolume: Number(event.currentTarget.value) })
            }
          />
          <span>{settings.masterVolume}</span>
        </label>
        <label>
          语音音量
          <input
            type="range"
            min={0}
            max={100}
            value={settings.voiceVolume}
            onChange={(event) =>
              onChange({ ...settings, voiceVolume: Number(event.currentTarget.value) })
            }
          />
          <span>{settings.voiceVolume}</span>
        </label>
        <label>
          背景音乐音量
          <input
            type="range"
            min={0}
            max={100}
            value={settings.bgmVolume}
            onChange={(event) =>
              onChange({ ...settings, bgmVolume: Number(event.currentTarget.value) })
            }
          />
          <span>{settings.bgmVolume}</span>
        </label>
      </div>
    </div>
  );
}
