# battle angel

**a warrior's spirit needs a warrior's body**

battle angel is a low-friction personal gym app: build workouts once, save the reference videos, plan the week if you want, then open the app and execute.

## main tabs

The app is split into four simple tabs so the screen stays quiet:

- **Today** — only today's workout, resume, and optional offline video prep.
- **Workouts** — your muscle modules. Open one to train or edit it.
- **Plan** — calendar, recurring weekly plan, and repeat-last-week.
- **More** — motivation videos, theme, backup, and sign out.

## exercise creation

When you create a new exercise, you can add all reference clips immediately:

- Video 1 — required
- Video 2 — optional
- Video 3 — optional

This is intentionally three separate iPhone-friendly pickers, so you do not need to create the exercise and reopen Edit just to add another reference.

## workout mode

Workout Mode stays focused on the current movement, sets/reps, reference videos, cues, optional weight, and the 2:30 rest timer.

If an exercise has a backup movement, **Use backup** switches the active movement with one tap without editing the workout.

You can pause and resume a workout or cancel only the in-progress session without deleting the workout plan or videos.

## planning

Planning is optional and cloud-synced.

### one-off calendar plan

Open **Plan**, tap a date, then tap one or more muscles. Tap a selected muscle again to remove it. Move one module or clear the whole date whenever plans change.

### recurring weekly plan

Open **Plan -> Weekly** and pick one or more muscles for each weekday. Changes save automatically. A manually changed calendar date overrides the weekly plan, so you can move or skip modules without changing the recurring week.

### repeat last week

In **Plan**, tap **Repeat last week** to copy the prior week's effective schedule into the selected week.

### missed day

If yesterday had a planned workout, it was not completed, and today is empty, Today shows one small **Move to today** action.

## saved videos for the gym

On Today, tap **Save videos** under the planned workout. battle angel downloads that workout's reference clips into the browser's local offline storage. When that device opens the workout later, it prefers the locally saved clips.

This offline copy is device-specific. Your master videos remain in private Supabase Storage and continue to sync across devices.

## motivation

Motivation stays closed under **More -> Edit motivation** until you open it. Motivation videos are private, sync across devices, rotate during rest periods, loop for the 2:30 rest, and stop when rest ends.

## safe database upgrade

If you already have battle angel with uploaded workouts/videos and already ran the planning setup, run only:

`supabase/multi_workout_upgrade.sql`

in **Supabase -> SQL Editor** once before deploying this version.

It is additive. It does **not** delete or replace existing folders, exercises, reference videos, motivation videos, weights, cues, or Storage objects.

This upgrade only changes planner uniqueness rules so one date/weekday can contain multiple workout modules. It does not delete or rewrite your existing workouts, exercises, videos, planning rows, or storage files.

For a brand-new installation, `supabase/schema.sql` contains the full schema including the same upgrade.

## deployment

After running the planning upgrade once:

1. Upload the contents of this project to the existing GitHub repository.
2. Commit the changes.
3. Netlify rebuilds automatically.
4. Refresh or reopen battle angel on the iPhone.

Your existing Netlify environment variables remain:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## data and privacy

- Workout modules: `folders`
- Exercises and video metadata: `exercises`
- In-progress session: `workout_progress`
- Calendar overrides: `workout_schedule`
- Recurring weekly plan: `workout_weekly_plan`
- Completed-workout markers: `workout_history`
- Videos: private `gym-videos` Supabase Storage bucket

Row Level Security limits data and Storage objects to the signed-in account. Video playback uses temporary signed URLs.

## iPhone uploads

Saved MP4, MOV, M4V, and WebM clips can be selected from Photos or Files. Larger clips use resumable uploads. Keep battle angel open until the upload completes.

The app currently enforces a 50 MB per-video limit to match the configured Supabase Free-plan workflow.

## backup

Open **More -> Backup library** to create a ZIP containing the workout library, planning data, motivation references, and uploaded videos. Save the ZIP somewhere independent such as iCloud Drive or your computer.

## v1.8 — multiple workouts per day + rest lock screen

- A calendar day can contain multiple workout modules (for example Chest + Triceps).
- Weekly recurring planning can also contain multiple modules on the same weekday.
- Tap a muscle in Plan to add/remove it from that date; selected muscles stay highlighted.
- Move is kept collapsed and lets you choose which module to move when a date has more than one.
- Rest is now a full-screen lock-in view: no buttons, only the 2:30 countdown and your motivation clip. It returns to the workout automatically when the timer ends.
- Run `supabase/multi_workout_upgrade.sql` once before using multi-workout planning on an existing database. The migration only changes planner uniqueness rules; it does not delete workouts, exercises, or videos.

## v1.8.1 — lock-in fixes

No new database changes. If you haven't run `supabase/multi_workout_upgrade.sql` yet, run it once (that's the v1.8 one).

**Workout loop**
- "Set done" is pinned to the bottom of the screen, always under your thumb. No scrolling.
- Skipped a busy machine? After you finish an exercise, the app goes to the next *unfinished* one and only ends the workout when everything is done.
- Set dots are tappable: tap a ✓ to undo a mis-tapped set, tap a number to mark sets done without starting a rest.
- Double taps on "Set done" are ignored.
- The weight you type sticks, even offline (it syncs when you're back online).
- Deleting an exercise mid-workout keeps the rest of your progress.

**Rest**
- Reopening the app during rest goes straight back to the rest screen (it used to show an error).
- Motivation starts muted so your music keeps playing. Tap anywhere on the rest screen for sound; the app remembers your choice.
- The end-of-rest beep works on iPhone (audio is unlocked by your "Set done" tap), and the screen stays awake while you train.
- Reference clips play silently on loop, no tap needed.

**Offline + speed**
- After the first visit the app opens instantly from what the phone already knows, then refreshes in the background.
- With no signal, the app still opens, Today shows your saved plan, and any workout you've opened or saved before runs with its saved videos. Completed workouts and weights sync later.
- "Save videos" also saves your motivation clips.
- Clips you upload from this phone are saved on it right away, so it never downloads them again.
- Video links are reused during a session, so reopening a workout doesn't re-download its clips.

**Fixes**
- Retrying a failed large upload can no longer create an exercise that points at a missing file.
- Move Up/Down always works, even when two exercises share a position.
- Plan tab: coming back to it never leaves you editing a date from another month.
- Three reference videos fit on one tab row.
- The old Arms → Biceps rename no longer runs on every launch (or in schema.sql).
- Backup uses less memory while building the ZIP.
