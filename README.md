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

Open **Plan**, tap a date, then tap a muscle. Move or clear a date whenever plans change.

### recurring weekly plan

Open **Plan -> Weekly** and pick a muscle for each weekday. Changes save automatically. A manually changed calendar date overrides the weekly plan, so you can move or skip one day without changing the recurring week.

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

If you already have battle angel with uploaded workouts/videos, run only:

`supabase/planning_upgrade.sql`

in **Supabase -> SQL Editor** once before deploying this version.

It is additive. It does **not** delete or replace existing folders, exercises, reference videos, motivation videos, weights, cues, or Storage objects.

The upgrade adds:

- recurring weekly planning
- explicit skipped-date overrides
- minimal completed-workout history for missed-day handling
- cloud sync for the one-tap backup-exercise state

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
