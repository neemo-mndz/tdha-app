export default function WeekLoading() {
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">semana<span>.</span></div>
      </header>

      <div className="loading-skeleton">
        <div className="loading-skeleton__nav" />
        <div className="loading-skeleton__grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="loading-skeleton__cell" />
          ))}
        </div>
        <div className="loading-skeleton__panels">
          <div className="loading-skeleton__panel" />
          <div className="loading-skeleton__panel" />
        </div>
      </div>
    </div>
  );
}
