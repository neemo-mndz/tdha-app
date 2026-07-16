/**
 * Painel de tarefas da semana.
 * Por agora, exibe um placeholder — a funcionalidade de tarefas será implementada
 * em uma spec futura (task-system ou similar).
 */
export function WeeklyTasksPanel() {
  return (
    <div className="panel">
      <h2 className="panel__title">Tarefas da semana</h2>
      <p className="panel__subtitle">Contagem informativa, sem cobrança</p>

      <div className="task-empty">
        Nenhuma tarefa planejada ainda.
        <br />
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
          Em breve: planeje e acompanhe tarefas semanais.
        </span>
      </div>
    </div>
  );
}
