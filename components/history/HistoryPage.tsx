"use client";

import { useState, useEffect, useTransition, useCallback, useMemo, useRef } from "react";
import { searchLogs } from "@/lib/actions/search";
import { getUserTags, getTagsWithLogCount } from "@/lib/actions/tags";
import { TagChips } from "@/components/logs/TagChips";
import { WeekFilter } from "@/components/history/WeekFilter";
import { TagManager } from "@/components/history/TagManager";
import { formatDateParam } from "@/lib/utils/date";
import { getMoodEmoji } from "@/components/mood/moodConstants";
import type { MoodValue } from "@/lib/types/calendar";
import type { SearchResult } from "@/lib/db/queries/search";

interface HistoryPageProps {
  userTags: { id: string; name: string }[];
  initialResults: SearchResult[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Formats a "yyyy-MM-dd" string into a localised short date like "23 jul. 2025".
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
 * e.g., "2025-07-14" → "Semana de 14 – 20 jul. 2025"
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
  moodEmojis: string[];
}

/**
 * Groups results by week (Monday–Sunday) in reverse chronological order.
 * Collects distinct mood emojis for each week.
 */
function groupByWeek(results: SearchResult[]): WeekGroup[] {
  const map = new Map<string, SearchResult[]>();
  const moodMap = new Map<string, Set<string>>();

  for (const result of results) {
    const key = getWeekStartKey(result.date);
    const existing = map.get(key);
    if (existing) {
      existing.push(result);
    } else {
      map.set(key, [result]);
    }

    if (result.mood) {
      const emojiSet = moodMap.get(key) ?? new Set<string>();
      const emoji = getMoodEmoji(result.mood as MoodValue);
      if (emoji) emojiSet.add(emoji);
      moodMap.set(key, emojiSet);
    }
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    weekStart: key,
    label: formatWeekLabel(key),
    results: map.get(key)!,
    moodEmojis: Array.from(moodMap.get(key) ?? []),
  }));
}

/**
 * Computes 3 recent weeks for the Activity Heatmap banner based on current date.
 */
function computeHeatmapData(results: SearchResult[]) {
  const logCountByDate = new Map<string, number>();
  for (const r of results) {
    logCountByDate.set(r.date, (logCountByDate.get(r.date) ?? 0) + 1);
  }

  const today = new Date();
  const currentMonKey = getWeekStartKey(formatDateParam(today));
  const [cy, cm, cd] = currentMonKey.split("-").map(Number);
  const currentMon = new Date(cy, cm - 1, cd);

  const weeks = [];
  for (let w = 2; w >= 0; w--) {
    const mon = new Date(currentMon);
    mon.setDate(mon.getDate() - w * 7);
    const monStr = formatDateParam(mon);
    const monthLabel = mon.toLocaleDateString("pt-BR", { month: "short" });

    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(mon);
      day.setDate(day.getDate() + d);
      const dayStr = formatDateParam(day);
      const count = logCountByDate.get(dayStr) ?? 0;
      days.push({ dayStr, count });
    }

    weeks.push({ monStr, monthLabel, days, isCurrent: w === 0 });
  }

  return weeks;
}

// ── Component ────────────────────────────────────────────────────────────

export function HistoryPage({ userTags, initialResults }: HistoryPageProps) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"weeks" | "flat">("weeks");

  // ── Results & UI state ────────────────────────────────────────────────────
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [tags, setTags] = useState(userTags);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [tagManagerTags, setTagManagerTags] = useState<
    { id: string; name: string; logCount: number }[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Grouped results & Heatmap ─────────────────────────────────────────────
  const weekGroups = useMemo(() => groupByWeek(results), [results]);
  const heatmapWeeks = useMemo(() => computeHeatmapData(results), [results]);

  // ── Shortcut: Ctrl + K / Cmd + K to focus search ─────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  useEffect(() => {
    runSearch(debouncedText, selectedTagIds, selectedWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

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

  function handleWeekChange(week: Date | null) {
    setSelectedWeek(week);
    runSearch(debouncedText, selectedTagIds, week);
  }

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
        <div>
          <h1 className="history-page__title">Sua Memória Semanal</h1>
          <p className="history-page__subtitle">
            Navegue pelas suas anotações e momentos vividos organizados por semana. Sem pressão, no seu ritmo.
          </p>
        </div>
        <div className="history-page__header-actions">
          <span className="history-page__count-pill">
            📅 {results.length} {results.length === 1 ? "registro" : "registros"} ({weekGroups.length} {weekGroups.length === 1 ? "semana" : "semanas"})
          </span>
          <button
            type="button"
            className="history-page__manage-tags-btn"
            onClick={handleOpenTagManager}
            aria-label="Gerenciar tags"
          >
            🏷️ Gerenciar tags
          </button>
        </div>
      </div>

      {/* ── Concept Explanation Banner ── */}
      <div className="history-page__concept-banner">
        💡 <strong>Proposta do Histórico SaaS:</strong> Agrupamento temporal por semana (segunda a domingo), filtro rápido por tags, busca instantânea e mini-heatmap de consciência temporal. Para pessoas com TDAH, visualizar a memória em blocos semanais reduz a desorientação e a cegueira de tempo.
      </div>

      {/* ── Heatmap & Activity Widget ── */}
      <div className="history-page__activity-banner">
        <div className="history-page__activity-info">
          <h3>Presença nas últimas semanas</h3>
          <p>Cada coluna é uma semana (seg a dom). As bolinhas destacam a presença de registros.</p>
        </div>
        <div className="history-page__weeks-heatmap">
          {heatmapWeeks.map((w, idx) => (
            <div key={w.monStr} className="history-page__week-col">
              <span className="history-page__week-col-label">
                {w.isCurrent ? "atual" : w.monthLabel}
              </span>
              <div className="history-page__day-dots-grid">
                {w.days.map((d) => {
                  const lvlClass =
                    d.count === 0
                      ? ""
                      : d.count === 1
                      ? "lvl-1"
                      : d.count === 2
                      ? "lvl-2"
                      : "lvl-3";
                  return (
                    <div
                      key={d.dayStr}
                      className={`history-page__heatmap-dot ${lvlClass}`}
                      title={`${d.dayStr}: ${d.count} registro(s)`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Toolbar (Search, Filters, View Modes) ── */}
      <div className="history-page__filters">
        {/* Search field */}
        <div className="history-page__search-wrapper">
          <label htmlFor="history-search" className="sr-only">
            Buscar registros
          </label>
          <input
            ref={searchInputRef}
            id="history-search"
            type="search"
            className="history-page__search-input"
            placeholder="Buscar em registros, tarefas e notas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Buscar registros"
          />
          <span className="history-page__shortcut-badge">Ctrl K</span>
        </div>

        {/* Tag filter chips + View Mode toggle */}
        <div className="history-page__toolbar-row">
          {tags.length > 0 && (
            <div className="history-page__tags-wrapper">
              <span className="history-page__filter-label">Filtrar:</span>
              <TagChips
                tags={tags}
                selectedTagIds={selectedTagIds}
                onToggle={handleTagToggle}
                size="md"
              />
            </div>
          )}

          {/* Week Filter Selector */}
          <WeekFilter
            selectedWeek={selectedWeek}
            onWeekChange={handleWeekChange}
          />

          {/* View mode toggle */}
          <div className="history-page__view-toggle" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              className={`history-page__view-btn ${viewMode === "weeks" ? "active" : ""}`}
              onClick={() => setViewMode("weeks")}
            >
              Semanal
            </button>
            <button
              type="button"
              className={`history-page__view-btn ${viewMode === "flat" ? "active" : ""}`}
              onClick={() => setViewMode("flat")}
            >
              Lista Contínua
            </button>
          </div>
        </div>
      </div>

      {/* ── Results Feed ── */}
      <div
        className="history-page__results"
        aria-live="polite"
        aria-busy={isPending}
      >
        {isPending ? (
          <p className="history-page__loading">Buscando registros...</p>
        ) : results.length === 0 ? (
          <p className="history-page__empty">
            Nenhum registro encontrado.
            <br />
            Seus registros aparecerão aqui organizados por semana.
          </p>
        ) : viewMode === "weeks" ? (
          /* View Mode: Grouped by Week */
          weekGroups.map((group) => (
            <div key={group.weekStart} className="history-page__week-group">
              {/* Week header with emoji summary */}
              <div className="history-page__week-label">
                <div className="history-page__week-title-wrap">
                  <span className="history-page__week-title">{group.label}</span>
                  <span className="history-page__week-count">
                    {group.results.length} {group.results.length === 1 ? "registro" : "registros"}
                  </span>
                </div>
                {group.moodEmojis.length > 0 && (
                  <div
                    className="history-page__week-summary-moods"
                    title="Humor registrado na semana"
                  >
                    {group.moodEmojis.join(" ")}
                  </div>
                )}
              </div>

              {/* Results within this week */}
              <ul className="history-page__result-list">
                {group.results.map((result) => (
                  <li key={result.logId} className="history-result-item">
                    {/* Date + time + task name */}
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
                      {result.taskName && (
                        <span className="history-result-item__task-badge">
                          📋 {result.taskName}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="history-result-item__content">
                      {result.content}
                    </p>

                    {/* Tags */}
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
        ) : (
          /* View Mode: Flat List */
          <ul className="history-page__result-list">
            {results.map((result) => (
              <li key={result.logId} className="history-result-item">
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
                  {result.taskName && (
                    <span className="history-result-item__task-badge">
                      📋 {result.taskName}
                    </span>
                  )}
                </div>
                <p className="history-result-item__content">
                  {result.content}
                </p>
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
