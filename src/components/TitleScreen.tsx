type TitleScreenProps = {
  canContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
  titleColumns: string[];
  subtitle?: string;
};

export default function TitleScreen({
  canContinue,
  onStart,
  onContinue,
  onSettings,
  titleColumns,
  subtitle
}: TitleScreenProps) {
  return (
    <section className="title-screen">
      <div className="title-screen__veil" />
      <div className="title-screen__frame">
        <div className="title-screen__title-block">
          {titleColumns.map((column, index) => (
            <div className="title-mark" key={`${index}-${column}`}>
              <span className="title-mark__jp">
                {Array.from(column).map((character, characterIndex) => (
                  <span
                    className="title-mark__char"
                    key={`${index}-${characterIndex}-${character}`}
                  >
                    {character}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="title-screen__menu">
          <div className="title-screen__menu-row">
            <button className="title-link" onClick={onStart}>
              Start
            </button>
            <button className="title-link" onClick={onContinue} disabled={!canContinue}>
              Load
            </button>
            <button className="title-link" onClick={onSettings}>
              Config
            </button>
            <button className="title-link" type="button">
              CG
            </button>
            <button className="title-link" type="button">
              Quit
            </button>
          </div>
          <div className="title-screen__menu-row title-screen__menu-row--sub">
            <button className="title-link title-link--sub" type="button">
              Liner notes
            </button>
            <button className="title-link title-link--sub" type="button">
              Music
            </button>
            <button className="title-link title-link--sub" type="button">
              Scene
            </button>
          </div>
        </div>

        {subtitle ? <p className="title-screen__subtitle">{subtitle}</p> : null}
      </div>
    </section>
  );
}
