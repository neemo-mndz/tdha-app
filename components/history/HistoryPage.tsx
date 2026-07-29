"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
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
    // Remove tag from local list
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setTagManagerTags((prev) => prev.filter((t) => t.id !== tagId));

    // Remove from selected filter if it was selected
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(tagId);
      // Re-run search with updated tag selection (after state settles)
      // We compute new ids inline to avoid stale closure
      startTransition(async () => {
        const weekStart = selectedWeek ? formatDateParam(selectedWeek) : null;
        const data = await searchLogs({
          text: debouncedText,
          tagIds: Array.from(next),
          weekStart,
        });
        setResults(data);
        // Refresh tags from server to reflect accurate logCount
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

      {/* ── Result list ── */}
      <div
        className="history-page__results"
        aria-live="polite"
        aria-busy={isPending}
      >
        {isPending ? (
          <p className="history-page__loading">Buscando...</p>
        ) : results.length === 0 ? (
          <p className="history-page__empty">Nada encontrado ainda</p>
        ) : (
          <ul className="history-page__result-list">
            {results.map((result) => (
              <li key={result.logId} className="history-result-item">
                {/* Date + time */}
                <div className="history-result-item__meta">
                  <time
                    className="history-result-item__date"
                    dateTime={result.date}
                  >
                    {formatDisplayDate(result.date)}
                  </time>
                  <span className="history-result-item__time">{result.time}</span>
                </div>

                {/* Content */}
                <p className="history-result-item__content">{result.content}</p>

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

// ── Helpers ────────────────────────────────────────────────────────────────

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
