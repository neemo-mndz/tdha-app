"use client";

import type { MoodValue } from "@/lib/types/calendar";
import { MOOD_OPTIONS, getMoodEmoji, getMoodAriaLabel } from "@/components/mood/moodConstants";

interface MoodSelectorProps {
  currentMood: MoodValue | null;
  onSelect: (mood: MoodValue | null) => void;
  disabled?: boolean;
}

export function MoodSelector({ currentMood, onSelect, disabled }: MoodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Seletor de humor"
      className="mood-selector"
    >
      {MOOD_OPTIONS.map((mood) => {
        const isActive = currentMood === mood;
        const isDimmed = currentMood !== null && !isActive;

        return (
          <button
            key={mood}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={getMoodAriaLabel(mood)}
            disabled={disabled}
            onClick={() => onSelect(isActive ? null : mood)}
            className={`mood-selector__option${isActive ? " mood-selector__option--active" : ""}${isDimmed ? " mood-selector__option--dimmed" : ""}`}
          >
            <span aria-hidden="true">{getMoodEmoji(mood)}</span>
          </button>
        );
      })}
    </div>
  );
}
