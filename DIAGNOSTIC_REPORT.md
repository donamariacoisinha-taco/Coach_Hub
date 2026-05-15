# Coach Rubi 2.0 - Complete Diagnostic Report

**Status:** Draft / Active Investigation
**Date:** 2026-05-15
**Auditor:** Senior Software Architect & Product Manager

---

## 🎯 1. SYSTEM OVERVIEW

Coach Rubi 2.0 is an AI-driven strength training platform. It differentiates itself through technical depth (1RM estimation, RPE tracking) and "Coach Rubi," an AI agent that analyzes workout performance.

*   **Architecture:**
    *   **Frontend:** React 19 (SPA) with Zustand for global state.
    *   **Backend:** Express 5.0 (Proxy & AI processing).
    *   **Database:** Supabase (PostgreSQL + Auth).
    *   **Media:** Cloudinary (hosting training videos).
    *   **AI Engine:** Google Gemini (1.5 Flash / 3 Flash Preview).

---

## 🧩 2. CRITICAL ISSUES (HIGH PRIORITY)

### ⚠️ A. Data Connectivity - "Failed to fetch" (FIXED)
*   **Description:** Consistent network errors when trying to reach third-party services (Supabase/API).
*   **Root Cause:**
    1.  **Stale Credentials:** The application relied on hardcoded credentials in `src/lib/api/supabase.ts`.
    2.  **Environment Mismatch:** The development server lacked a standardized build/start process for full-stack logic.
    3.  **Invalid AI Key:** The Gemini API was failing silently or with generic errors when the key was invalid.
*   **Impact:** Complete blocker. No exercises load, no workouts save.
*   **Fix Applied:** 
    *   Updated `package.json` with standard full-stack scripts (`build`, `start`).
    *   Improved error logging in `supabase.ts`.
    *   Refactored Gemini initialization in `server.ts` with explicit `API_KEY_INVALID` handling.
    *   Updated frontend `geminiService.ts` to display server-side error messages.

### ⚠️ B. Exercise Filtering Logic (FIXED)
*   **Description:** Filters (especially for "Ombros") frequently return zero results even when data exists.
*   **Root Cause:** Strict string matching between UI labels ("Ombros") and database fields ("Ombro", "Deltóide"). Lack of normalization (lowercase/trim) in comparison logic.
*   **Impact:** Users cannot find exercises when creating workouts.
*   **Fix Applied:** 
    *   Implemented robust, fuzzy-search-like matching in `useExerciseFilters.ts`.
    *   Updated `ExerciseLibrary.tsx` to prioritize `muscle_group_id` for accurate relational matching.

### ⚠️ C. "God Object" Architecture (`WorkoutPlayer.tsx`) (PENDING)
*   **Description:** The main workout engine is a single file exceeding 1800 lines.
*   **Root Cause:** Excessive accumulation of features (timers, AI feedback, video, progression logic, audio, persistence) into a single React component.
*   **Impact:** Extremely high maintenance risk. Changing a CSS class in the timer could theoretically break the database save logic. Performance degradation due to massive re-renders.
*   **Recommended Fix:** Refactor into a decoupled architecture.

### ⚠️ D. Security: Exposed Secrets (FIXED)
*   **Description:** `vite.config.ts` was previously exposing API keys to the client bundle.
*   **Fix Applied:** Removed `define` from `vite.config.ts`. All AI calls now proxy through the backend where secrets remain hidden. Added `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` to metadata.

---

### ⚠️ E. Database Schema Alignment & Missing Columns (FIXED)
*   **Description:** "Could not find the 'static_frame_url' column of 'exercises' in the schema cache" errors when updating exercises.
*   **Root Cause:** The application was attempting to save to columns (`static_frame_url`, `technical_prompt`, etc.) that do not exist in the database. Previous retry logic wasn't capturing all error message formats from PostGREST.
*   **Fix Applied:** 
    *   Enhanced regex in `adminApi.ts` and `mediaApi.ts` to catch more error variants (e.g., `'column' column`, `field "name"`, `column name (does not exist)`).
    *   Added fallback manual checks for specific broken columns if extraction fails.
    *   Implemented aggressive fallback in `getAdminData` and `exerciseApi.getExercises()` to ensure the app works even if the schema cache is outdated.
    *   Fixed all React `textarea` value warnings (null propagation).

### ⚠️ F. Media Upload - Simplified Asset Hub (V3 REDESIGN)
*   **Description:** Image uploads in the admin section were failing or not reflecting in the database despite success messages.
*   **Root Cause:** Over-complex tabbed system with auto-saves and dependency on a non-existent `static_frame_url` column. The auto-retry logic in the API was hiding issues by stripping failed columns, leading to "false successes".
*   **Fix Applied:** 
    *   **Full Redesign:** Completely replaced `AssetMediaHub.tsx` with a simplified, single-page manager.
    *   **Direct Storage:** Implementation of direct Supabase Storage uploads within the component for maximum transparency.
    *   **Column Consolidation:** Shifted primary image storage exclusively to `image_url` (valid column), with an automatic migration path for legacy `static_frame_url` data.
    *   **Clear UX:** Replaced auto-saves with a dedicated "Confirmar e Salvar" button for media, providing absolute certainty of the operation's outcome.
    *   **API Integrity:** Improved `mediaApi` to log exactly which fields are being persisted and which (if any) are dropped due to schema issues.

---

## 🧩 3. UX / UI AUDIT

### 🟢 Strengths
*   **Visual Polish:** Use of `motion/react` provides a premium feel.
*   **Offline Resilience:** Implementation of `fetchWithRetry` and `localStorage` session recovery is excellent.

### 🔴 Weaknesses
*   **Visual Hierarchy in Workout Player:** The screen is extremely dense. With video, timers, RPE sliders, and set history, the primary action (completing a set) can get lost.
*   **Cognitive Load (Onboarding):** The initial flow requires many data points. Adding "Skip for now" or "AI Profile Import" could reduce friction.
*   **Admin Tools:** The "Library OS" is functional but separate in feel from the rest of the app. It lacks the cohesive "Rubi" branding.

---

## 🧩 4. PERFORMANCE & DATA INTEGRITY

### Performance Risks
*   **Image Bloat:** The app prefetches images but doesn't necessarily optimize them for mobile data.
*   **Zustand Over-subscription:** Massive stores mean small updates in one corner might trigger major re-renders if selectors aren't used strictly.

### Data Integrity
*   **Race Conditions:** Rapid set completion may trigger overlapping async saves.
*   **Schema Drift:** The `saveSetLog` function has a "Schema Cache Fix" loop. This indicates an underlying issue where the database schema and the client's expectations are frequently out of sync.

---

## 🚀 5. OPPORTUNITIES FOR IMPROVEMENT

1.  **Rubi Voice Mode:** Use Gemini's Live API for real-time audio coaching during rest periods.
2.  **Video Analysis:** Integrate Gemini Pro Vision to analyze exercise form from uploaded progress videos.
3.  **Bento Dashboard:** Redesign the dashboard with a "Bento-grid" style for better data visualization of 1RM progress.
4.  **LocalDB Fallback:** Implement IndexedDB for extreme offline scenarios (e.g., basement gyms with 0% signal).

---

## 🛠️ NEXT STEPS

1.  [DONE] Standardize Full-Stack scripts.
2.  [PENDING] Refactor `WorkoutPlayer.tsx` into smaller components.
3.  [PENDING] Implement form validation for workout creation.
4.  [PENDING] Add "Force Refresh Schema" button in Admin.
