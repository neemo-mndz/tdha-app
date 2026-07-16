export default function HomeLoading() {
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">semana<span>.</span></div>
      </header>

      <div className="loading-skeleton">
        <div className="loading-skeleton__greeting" />
        <div className="loading-skeleton__panels">
          <div className="loading-skeleton__panel" />
          <div className="loading-skeleton__panel" />
        </div>
      </div>
    </div>
  );
}
