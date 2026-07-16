type Reminder = {
  id: string;
  hour: number;
  minute: number;
  active: boolean;
};

type Props = {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ReminderItem({ reminder, onToggle, onDelete }: Props) {
  const time = `${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`;

  return (
    <div className={`reminder-item ${!reminder.active ? "reminder-item--inactive" : ""}`}>
      <span className="reminder-item__time">{time}</span>
      <div className="reminder-item__actions">
        <label className="reminder-item__toggle">
          <input
            type="checkbox"
            checked={reminder.active}
            onChange={() => onToggle(reminder.id)}
            aria-label={`${reminder.active ? "Desativar" : "Ativar"} lembrete ${time}`}
          />
          <span className="reminder-item__toggle-track" />
        </label>
        <button
          className="reminder-item__delete"
          onClick={() => onDelete(reminder.id)}
          aria-label={`Excluir lembrete ${time}`}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
