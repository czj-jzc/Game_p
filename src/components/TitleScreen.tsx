type TitleScreenProps = {
  canContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
};

export default function TitleScreen({
  canContinue,
  onStart,
  onContinue,
  onSettings
}: TitleScreenProps) {
  return (
    <section className="title-screen">
      <div className="title-screen__veil" />
      <div className="title-screen__content">
        <p className="eyebrow">Windows Visual Novel Demo</p>
        <h1>夏雾回响</h1>
        <p className="subtitle">Electron + React narrative vertical slice</p>
        <div className="title-actions">
          <button onClick={onStart}>Start</button>
          <button onClick={onContinue} disabled={!canContinue}>
            Continue
          </button>
          <button onClick={onSettings}>Settings</button>
        </div>
      </div>
    </section>
  );
}
