# Implementation Plan: Live Greeting & Badge Update

## Overview

Implement client-side reactivity for the greeting and badge on the home screen. This covers Requirement 3, AC 6 (live update within 60s on period/date boundary crossing) and AC 7 (instant update on app resume from background). The approach extracts pure utility functions, creates a `useCurrentTime` hook with interval + visibilitychange, and replaces the static `HomeGreeting` with a reactive `HomeGreetingLive` client component.

## Tasks

- [x] 1. Extract pure greeting utility functions
  - [x] 1.1 Create `lib/utils/greeting.ts` with `getGreetingText`, `formatGreetingDate`, `getBadgeText`, and `getTimePeriod`
    - `getGreetingText(hour: number)` returns "Bom dia" (0–11), "Boa tarde" (12–17), "Boa noite" (18–23)
    - `formatGreetingDate(date: Date)` returns pt-BR formatted string using date-fns: `"segunda-feira, 7 de julho"`
    - `getBadgeText(date: Date)` returns `"faltam N dias no mês"` or `"último dia do mês"`
    - `getTimePeriod(hour: number)` returns `"morning" | "afternoon" | "evening"`
    - Export the `TimePeriod` type
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 1.2 Write property tests for greeting utilities using fast-check
    - **Property 1: Greeting period mapping is exhaustive and correct**
    - For any hour in [0, 23], `getGreetingText` returns the correct greeting for that range
    - Generator: `fc.integer({min: 0, max: 23})`
    - **Validates: Requirements 3.1, 3.6**
    - **Property 2: Date formatting produces valid pt-BR pattern**
    - For any valid Date, `formatGreetingDate` matches `<weekday>, <day> de <month>` with valid Portuguese names
    - Generator: `fc.date({min: new Date(2020,0,1), max: new Date(2030,11,31)})`
    - **Validates: Requirements 3.2**
    - **Property 3: Badge text is consistent with date arithmetic**
    - For any valid Date, `getBadgeText` returns "último dia do mês" on last day, or "faltam N dias no mês" with correct N otherwise
    - Generator: `fc.date({min: new Date(2020,0,1), max: new Date(2030,11,31)})`
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 1.3 Write unit tests for greeting utilities
    - Test `getGreetingText` boundary hours: 0, 11, 12, 17, 18, 23
    - Test `formatGreetingDate` with known dates for expected output
    - Test `getBadgeText` for mid-month, last day, and first day scenarios
    - Test `getTimePeriod` for each range boundary
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 2. Implement `useCurrentTime` hook
  - [x] 2.1 Create `lib/hooks/useCurrentTime.ts` with interval and visibilitychange logic
    - Accept optional `intervalMs` parameter (default: 30000)
    - Use `useState<Date>` initialized from `initialTime` parameter or `new Date()`
    - Set up `setInterval` that updates state every `intervalMs`
    - Add `visibilitychange` event listener that immediately sets `new Date()` when document becomes visible
    - Clean up interval and event listener on unmount
    - Mark file with `"use client"` directive
    - _Requirements: 3.6, 3.7_

  - [ ]* 2.2 Write unit tests for `useCurrentTime` hook
    - Test that hook returns a Date object
    - Test that interval tick updates the returned time (use `vi.useFakeTimers`)
    - Test that `visibilitychange` to "visible" triggers immediate time update
    - Test cleanup on unmount (no lingering intervals or listeners)
    - _Requirements: 3.6, 3.7_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build `HomeGreetingLive` client component and integrate
  - [x] 4.1 Create `components/home/HomeGreetingLive.tsx` client component
    - Accept `initialTime: string` prop (ISO string from server)
    - Use `useCurrentTime` hook initialized with parsed `initialTime`
    - Render greeting text via `getGreetingText(currentTime.getHours())`
    - Render formatted date via `formatGreetingDate(currentTime)`
    - Render fixed subtitle: "Seu espaço para registrar o dia, sem pressão."
    - Export a `MonthBadgeLive` component that renders `getBadgeText(currentTime)`
    - Use same CSS classes as existing `HomeGreeting` (`greeting`, `month-badge`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Update `app/(app)/page.tsx` to use `HomeGreetingLive` instead of static `HomeGreeting`
    - Import `HomeGreetingLive` and `MonthBadgeLive` from new component
    - Pass `initialTime={today.toISOString()}` to `HomeGreetingLive`
    - Replace `<MonthBadge today={today} />` with `<MonthBadgeLive initialTime={today.toISOString()} />`
    - Replace `<HomeGreeting today={today} />` with `<HomeGreetingLive initialTime={today.toISOString()} />`
    - Keep existing `HomeGreeting` file intact (may be used elsewhere or as fallback)
    - _Requirements: 3.6, 3.7_

  - [ ]* 4.3 Write unit tests for `HomeGreetingLive` component
    - Render with a fixed `initialTime` and verify greeting, date, subtitle, and badge text
    - Simulate `visibilitychange` and verify re-render with updated time
    - Verify CSS class names match existing design (`greeting`, `month-badge`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `HomeGreeting` server component is preserved (not deleted) for backward compatibility
- `fast-check` is used for property-based tests; `vitest` is the test runner
- The 30s interval is chosen to stay well within the 60s AC 6 requirement

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] }
  ]
}
```
