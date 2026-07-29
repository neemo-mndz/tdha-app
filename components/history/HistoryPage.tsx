"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { searchLogs } from "@/lib/actions/search";
import { getUserTags, getTagsWithLogCount } from "@/lib/actions/tags";
import { TagChips } from "@/components/logs/TagChips";
import { WeekFilter } from "@/components/history/WeekFilter";
import { TagManager } from "@/components/history/TagManager";
import { formatDateParam } from "@/lib/utils/date";
import type { SearchResult } from "@/lib/db/queries/search";

interface HistoryPageProps {
  userTags: { id: string; name: string }[];
  initialResults: SearchResult[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Formats a "yyyy-MM-dd" string into a localised short date like "2 jul. 2025".
 */
function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Gets the Monday (start of week) for a given "yyyy-MM-dd" date string.
 */
function getWeekStartKey(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  // Adjust to Monday (0=Sun → offset 6, 1=Mon → 0, 2=Tue → 1, etc.)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - offset);
  const yy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Formats a week label from a Monday date string.
 * e.g., "2025-07-14" → "14 – 20 jul. 2025"
 */
function formatWeekLabel(weekStartStr: string): string {
  const [year, month, day] = weekStartStr.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString("pt-BR", { month: "short" });
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} – ${endDay} ${endMonth} ${endYear}`;
  }
  const startMonth = start.toLocaleDateString("pt-BR", { month: "short" });
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
}

interface WeekGroup {
  weekStart: string;
  label: string;
  results: SearchResult[];
}

/**
 * Groups results by week (Monday–Sunday) in reverse chronological order.
 */
function groupByWeek(results: SearchResult[]): WeekGroup[] {
  const map = new Map<string, SearchResult[]>();

  for (const result of results) {
    const key = getWeekStartKey(result.date);
    const existing = map.get(key);
    if (existing) {
      existing.push(result);
    } else {
      map.set(key, [result]);
    }
  }

  // Sort weeks descending
  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    weekStart: key,
    label: formatWeekLabel(key),
    results: map.get(key)!,
  }));
}

// ── Component ────────────────────────────────────────────────────────────

export function HistoryPage({ userTags, initialResults }: HistoryPageProps) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);

  // ── Results & UI state ────────────────────────────────────────────────────
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [tags, setTags] = useState(userTags);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [tagManagerTags, setTagManagerTags] = useState<
    { id: string; name: string; logCount: number }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  // ── Grouped results (by week) ─────────────────────────────────────────────
  const weekGroups = useMemo(() => groupByWeek(results), [results]);

  // ── Debounce searchText → debouncedText (300ms) ───────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // ── Run search whenever any filter changes ────────────────────────────────
  const runSearch = useCallback(
    (text: string, tagIds: Set<string>, week: Date | null) => {
      startTransition(async () => {
        const weekStart = week ? formatDateParam(week) : null;
        const data = await searchLogs({
          text,
          tagIds: Array.from(tagIds),
          weekStart,
        });
        setResults(data);
      });
    },
    []
  );

  // Re-run when debounced text changes
  useEffect(() => {
    runSearch(debouncedText, selectedTagIds, selectedWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  // ── Tag toggle ────────────────────────────────────────────────────────────
  function handleTagToggle(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      runSearch(debouncedText, next, selectedWeek);
      return next;
    });
  }

  // ── Week change ───────────────────────────────────────────────────────────
  function handleWeekChange(week: Date | null) {
    setSelectedWeek(week);
    runSearch(debouncedText, selectedTagIds, week);
  }

  // ── Tag deleted in TagManager ─────────────────────────────────────────────
  function handleTagDeleted(tagId: string) {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setTagManagerTags((prev) => prev.filter((t) => t.id !== tagId));

    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(tagId);
      startTransition(async () => {
        const weekStart = selectedWeek ? formatDateParam(selectedWeek) : null;
        const data = await searchLogs({
          text: debouncedText,
          tagIds: Array.from(next),
          weekStart,
        });
        setResults(data);
        const freshTags = await getUserTags();
        setTags(freshTags.map(({ id, name }) => ({ id, name })));
        const freshTagsWithCount = await getTagsWithLogCount();
        setTagManagerTags(
          freshTagsWithCount.map(({ id, name, logCount }) => ({
            id,
            name,
            logCount,
          }))
        );
      });
      return next;
    });
  }

  // ── Open TagManager (fetch real logCounts from server) ────────────────────
  function handleOpenTagManager() {
    setTagManagerOpen(true);
    startTransition(async () => {
      const freshTagsWithCount = await getTagsWithLogCount();
      setTagManagerTags(
        freshTagsWithCount.map(({ id, name, logCount }) => ({
          id,
          name,
          logCount,
        }))
      );
    });
  }

  return (
    <div className="history-page">
      {/* ── Header row ── */}
      <div className="history-page__header">
        <h1 className="history-page__title">Histórico</h1>
        <button
          type="button"
          className="history-page__manage-tags-btn"
          onClick={handleOpenTagManager}
          aria-label="Gerenciar tags"
        >
          Gerenciar tags
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="history-page__filters">
        {/* Search field */}
        <div className="history-page__search-wrapper">
          <label htmlFor="history-search" className="sr-only">
            Buscar registros
          </label>
          <input
            id="history-search"
            type="search"
            className="history-page__search-input"
            placeholder="Buscar em registros e notas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Buscar registros"
          />
        </div>

        {/* Tag filter chips */}
        {tags.length > 0 && (
          <TagChips
            tags={tags}
            selectedTagIds={selectedTagIds}
            onToggle={handleTagToggle}
            size="md"
          />
        )}

        {/* Week filter */}
        <WeekFilter
          selectedWeek={selectedWeek}
          onWeekChange={handleWeekChange}
        />
      </div>

      {/* ── Results (grouped by week) ── */}
      <div
        className="history-page__results"
        aria-live="polite"
        aria-busy={isPending}
      >
        {isPending ? (
          <p className="history-page__loading">Buscando...</p>
        ) : results.length === 0 ? (
          <p className="history-page__empty">
            Nenhum registro encontrado.
            <br />
            Seus registros aparecerão aqui organizados por semana.
          </p>
        ) : (
          weekGroups.map((group) => (
            <div key={group.weekStart} className="history-page__week-group">
              {/* Week header */}
              <div className="history-page__week-label">
                <span>{group.label}</span>
                <span className="history-page__week-count">
                  {group.results.length}
                </span>
              </div>

              {/* Results within this week */}
              <ul className="history-page__result-list">
                {group.results.map((result) => (
                  <li key={result.logId} className="history-result-item">
                    {/* Date + time */}
                    <div className="history-result-item__meta">
                      <time
                        className="history-result-item__date"
                        dateTime={result.date}
                      >
                        {formatDisplayDate(result.date)}
                      </time>
                      <span className="history-result-item__time">
                        {result.time}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="history-result-item__content">
                      {result.content}
                    </p>

                    {/* Tags (read-only display) */}
                    {result.tags.length > 0 && (
                      <TagChips
                        tags={result.tags}
                        selectedTagIds={new Set<string>()}
                        onToggle={() => {}}
                        size="sm"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* ── TagManager modal ── */}
      {tagManagerOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Gerenciar tags"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTagManagerOpen(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-content__header">
              <h2 className="modal-content__title">Gerenciar tags</h2>
              <button
                type="button"
                className="modal-content__close-btn"
                onClick={() => setTagManagerOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <TagManager
              tags={tagManagerTags}
              onDelete={handleTagDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
