# Requirements Document

## Introduction

Tags and History is the final structural feature of Phase 3 (lightweight structure, no AI) for the ADHD daily companion app. It introduces a flexible tagging system for log entries and a unified history/search screen that allows users to find past logs through free-text search, tag filtering, and week-based period filtering. All schema changes are additive (no alterations to existing tables). Tags are never required in any flow, and all filters default to the most permissive state (OR logic for tags, "all weeks" as default period).

## Glossary

- **Tag_System**: The subsystem responsible for creating, listing, associating, and deleting user-defined tags
- **Log_Entry**: A text record created by the user within a specific day (stored in the `logs` table)
- **Tag**: A short user-defined label that can be associated with one or more log entries (stored in the `tags` table with UNIQUE(user_id, name))
- **Log_Tag_Junction**: The many-to-many relationship between logs and tags (stored in the `log_tags` table with composite PK)
- **History_Screen**: The dedicated page where users search and filter their log history
- **Tag_Chip**: A compact visual element representing a tag, following the existing TaskChips pattern adapted for multi-select
- **Week_Filter**: A period selector reusing the existing week navigation pattern (previous/next arrows) to restrict search results to a specific week
- **Search_Engine**: The subsystem responsible for querying log content and mood notes with text, tag, and period filters

## Requirements

### Requirement 1: Tag Creation

**User Story:** As a user, I want to create short tags for my logs, so I can group related entries by topic without rigid structure.

#### Acceptance Criteria

1. WHEN the user types a tag name that does not match any existing tag for that user, THE Tag_System SHALL create a new tag associated with the authenticated user
2. THE Tag_System SHALL enforce a UNIQUE constraint on the combination of user_id and tag name (case-insensitive comparison)
3. WHEN the user types a tag name that matches an existing tag (case-insensitive), THE Tag_System SHALL suggest the existing tag before allowing creation of a duplicate
4. THE Tag_System SHALL store each tag with a UUID primary key, a reference to the owning user, a name (text, NOT NULL), and a creation timestamp

### Requirement 2: Tag Association with Log Entries

**User Story:** As a user, I want to tag a log entry with one or more short tags, so I can group them later without being forced to decide at writing time.

#### Acceptance Criteria

1. THE Tag_System SHALL allow associating zero, one, or multiple tags with any Log_Entry both at creation time and after saving
2. THE Tag_System SHALL NOT require any tag for a Log_Entry to be saved successfully
3. WHEN a tag is associated with a Log_Entry, THE Log_Tag_Junction SHALL store the relationship using a composite primary key of (log_id, tag_id)
4. WHEN a Log_Entry is deleted, THE Log_Tag_Junction SHALL cascade-delete all tag associations for that entry
5. WHEN a Tag is deleted, THE Log_Tag_Junction SHALL cascade-delete all associations for that tag from all log entries

### Requirement 3: Tag Display on Log Entries

**User Story:** As a user, I want to see which tags are on each log entry, so I have quick visual context without opening a separate view.

#### Acceptance Criteria

1. THE Tag_System SHALL display associated tags on each Log_Entry as compact Tag_Chips
2. WHEN a Log_Entry has zero tags, THE Tag_System SHALL NOT alter the default line height or layout of the log item
3. THE Tag_Chip component SHALL use multi-select semantics (role="group" with toggle buttons) instead of the radio-group pattern used by TaskChips

### Requirement 4: Editing Tags on Saved Log Entries

**User Story:** As a user, I want to add or remove tags from an already-saved log entry, so I don't have to decide everything at writing time.

#### Acceptance Criteria

1. THE Tag_System SHALL allow editing tags of an existing Log_Entry directly from the day's log list without navigating to a separate screen
2. WHEN the user adds a tag to a Log_Entry, THE Tag_System SHALL insert a row in the Log_Tag_Junction table
3. WHEN the user removes a tag from a Log_Entry, THE Tag_System SHALL delete the corresponding row from the Log_Tag_Junction table
4. WHEN a tag is removed from all Log_Entries that used it, THE Tag_System SHALL retain the tag in the user's available tags list for future suggestions

### Requirement 5: Tag Management (Explicit Deletion)

**User Story:** As a user, I want to delete a tag I no longer need from my general list, so my tag suggestions stay relevant.

#### Acceptance Criteria

1. THE Tag_System SHALL provide a tag management interface accessible from the History_Screen
2. WHEN the user requests deletion of a tag, THE Tag_System SHALL display a warning that the tag will be removed from all Log_Entries currently using it
3. WHEN the user confirms tag deletion, THE Tag_System SHALL delete the tag from the tags table, cascading removal from all Log_Tag_Junction entries
4. THE Tag_System SHALL NOT allow deleting a tag without explicit user confirmation

### Requirement 6: Free-Text Search

**User Story:** As a user, I want to search my logs by a word or phrase, so I can find something I remember writing without navigating day by day.

#### Acceptance Criteria

1. THE History_Screen SHALL provide a text search field that queries log content and mood notes (mood_note field on the days table) for the authenticated user
2. THE Search_Engine SHALL perform case-insensitive matching that does not require exact accents (accent-insensitive)
3. WHEN matching results are found, THE History_Screen SHALL display each result with its date and time for temporal context
4. IF no results are found, THEN THE History_Screen SHALL display a neutral message (e.g., "Nada encontrado ainda") without error styling or tone

### Requirement 7: Tag Filter on History Screen

**User Story:** As a user, I want to filter my history by one or more tags, so I can quickly see everything related to a specific topic.

#### Acceptance Criteria

1. THE History_Screen SHALL display the user's existing tags as selectable Tag_Chips
2. WHEN the user selects one or more tags, THE Search_Engine SHALL return only Log_Entries associated with ANY of the selected tags (OR logic)
3. WHEN no tags are selected, THE Search_Engine SHALL not restrict results by tag (show all)
4. THE History_Screen SHALL allow combining the tag filter with the text search field simultaneously

### Requirement 8: Week Period Filter

**User Story:** As a user, I want to restrict search to a specific week, so I don't have to wade through all history when I roughly know when something happened.

#### Acceptance Criteria

1. THE History_Screen SHALL provide a week period selector reusing the same navigation pattern as the existing WeekNavigator (previous/next arrows)
2. THE History_Screen SHALL default to "all weeks" as the initial state, not forcing the user to choose a period before searching
3. WHEN a specific week is selected, THE Search_Engine SHALL restrict results to Log_Entries created within that week's date range
4. THE Search_Engine SHALL combine the week filter with tag and text filters using AND logic (all active filters apply cumulatively)

### Requirement 9: Combined Filter Behavior

**User Story:** As a user, I want all my filters to work together, so I can narrow results precisely.

#### Acceptance Criteria

1. THE Search_Engine SHALL apply text search, tag filter, and week filter cumulatively (AND between filter types)
2. WHEN multiple tags are selected, THE Search_Engine SHALL use OR logic within the tag filter (a log matches if it has ANY of the selected tags)
3. WHEN all filters are cleared (no text, no tags, all weeks), THE History_Screen SHALL display all Log_Entries for the user in reverse chronological order
4. THE History_Screen SHALL update results immediately as the user changes any filter parameter

### Requirement 10: Schema Additivity Constraint

**User Story:** As a developer, I want all schema changes to be additive, so existing features remain unaffected.

#### Acceptance Criteria

1. THE Tag_System SHALL introduce only new tables (tags, log_tags) without altering any existing table schema
2. THE tags table SHALL contain: id (uuid PK), user_id (uuid FK → users.id ON DELETE CASCADE), name (text NOT NULL), created_at (timestamptz NOT NULL DEFAULT now()), with UNIQUE(user_id, name)
3. THE log_tags table SHALL contain: log_id (uuid FK → logs.id ON DELETE CASCADE), tag_id (uuid FK → tags.id ON DELETE CASCADE), with composite primary key PK(log_id, tag_id)

## Out of Scope

- Any automatic tag suggestion via AI
- Tag hierarchy (parent tags, folders, nested groupings)
- Mandatory colors per tag (if there is visual color, it is generated neutrally by the system)
- Filter by "type" of entry beyond tag/week/text
- Data export (CSV, PDF)
- Engagement mechanics or gamification
