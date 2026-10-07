# battle angel

**a warrior's spirit needs a warrior's body**

battle angel is a low-friction daily-system + gym app: set your routine and workouts once, then open the app and execute the next thing without deciding what comes next.

## main tabs

The app is split into four simple tabs so the screen stays quiet:

- **Day** — your daily system. Tap Start and battle angel shows one step at a time.
- **Gym** — today's planned gym modules, resume, offline video prep, and access to all workouts.
- **Plan** — calendar, recurring weekly plan, and repeat-last-week.
- **More** — motivation videos and photos, theme, backup, and sign out.

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

Planning is optional and cloud-synced. Weeks run Monday to Sunday everywhere in the app.

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

Motivation stays closed under **More -> Edit motivation** until you open it. Motivation videos and photos are private, sync across devices, play one after another in random order during the 2:30 rest, and stop when rest ends.

## database

`supabase/schema.sql` is the only database file. It builds a new project from scratch and upgrades an existing one. Every statement is safe to re-run; it never deletes workouts, exercises, videos, plans, history, or Storage files.

When an update says it has database changes, open **Supabase -> SQL Editor**, paste the whole `schema.sql`, and run it. The last query prints a row of checks that should all say `true`.

Older one-off migration files were removed in v1.10. They live on in the GitHub history if you ever need them.

## deployment

After running the latest `supabase/schema.sql` once:

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
- Daily routine steps: `daily_steps`
- Daily routine progress by date: `daily_progress`
- Videos: private `gym-videos` Supabase Storage bucket

Row Level Security limits data and Storage objects to the signed-in account. Video playback uses temporary signed URLs.

## iPhone uploads

Saved MP4, MOV, M4V, and WebM clips can be selected from Photos or Files. Larger clips use resumable uploads. Keep battle angel open until the upload completes.

Videos over 12 MB are compressed on the phone before uploading (H.264 MP4, up to 1280px, sized to land under about 45 MB). Reference clips lose their audio since they always play muted; motivation clips keep it. Photos are resized to 1600px JPEG. Keep battle angel open while it compresses; the screen stays awake. Anything still over 50 MB after compressing (very long clips) has to be trimmed first.

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

## v1.9 — golden weeks, logging past days, skip, photo motivation

Photos need the storage bucket to accept images. This is included in `supabase/schema.sql`.

**Golden weeks**
- When 4 or more workouts are marked done in a calendar week (Monday to Sunday, one row), that row turns gold.
- Each module counts once, so Chest + Triceps on the same day counts as 2.
- The selected day in Plan shows how close the week is: "2 of 4 done this week".
- Days with a finished workout show a ✓ in the calendar.

**Log past days**
- In Plan, tap any past date (or today), tap the muscles you trained, then tap **Mark done** next to each one.
- Tap **✓ Done** again to undo.
- Workouts you finish from the Workouts tab without planning them also show on the calendar and count toward the golden week.

**Rest screen**
- Sound now toggles with a double tap only. A single touch, including swiping up to leave the app, does nothing.

**Skip an exercise**
- In Workout Mode, **Machine busy? Skip for now** moves to the next unfinished exercise. The skipped one comes back after the others, and the workout won't finish without it.

**Motivation photos + shuffle**
- **More -> Edit motivation** accepts photos as well as videos.
- During each 2:30 rest, motivation plays one item after another in random order: videos play once through, photos stay on screen for 6 seconds. If everything has played before rest ends, it reshuffles and keeps going.

## v1.10 — Monday weeks, compression, weight history, streaks

**Database:** run the whole `supabase/schema.sql` once. Then delete these from the `supabase/` folder in GitHub: `calendar_migration.sql`, `planning_upgrade.sql`, `multi_workout_upgrade.sql`, `motivation_images_upgrade.sql`. `schema.sql` already contains everything they did, and it removes an old, looser calendar security rule.

- The calendar, golden weeks, and Repeat last week all run Monday to Sunday.
- Today shows this week's progress toward a golden week, plus your golden streak ("3 golden weeks in a row"). The current week never breaks a streak while it's still in progress.
- Undoing a done workout works offline and syncs when you reconnect, the same way marking it done already did.
- Videos and photos are compressed on the phone before uploading (see iPhone uploads above).
- Weight history: each exercise keeps the weight you used on each day. It's logged when you finish a set, and updated if you change the weight afterwards that day. Open **Weight history** under the set dots in Workout Mode. It works offline and is included in backups.

## v1.10.1 — mark done from the calendar

No database changes.

- **Hold a day** on the Plan calendar to mark all of its workouts done. Hold it again to undo. On a day with nothing planned, it asks you to pick the muscles first.
- Workout Mode always shows the weight history line, with a hint before the first entry, so it's clear where weights are saved.
- **More** shows the app version at the bottom. If it doesn't say v1.10.1 after deploying, the phone or Netlify is still on the old version.

## v1.10.2

- Holding a day on the calendar no longer selects its text on iPhone, so hold-to-mark-done works. Double-tapping the rest screen can't select text either.


## v1.11 — daily system

**Database:** run the whole `supabase/schema.sql` once. It only adds the daily-system tables and policies; it does not delete or change existing workout videos, exercises, plans, history, or weight logs.

- New **Day** tab for a personal daily routine.
- Set the routine up once under **Edit routine**: add a step, optional short note, reorder, edit, or delete.
- Tap **Start my day** and the app switches to a focused one-card-at-a-time flow.
- Each card shows only the current step and one large **Done** action; completing it immediately advances to the next step.
- **Back one step** is available only while running the routine in case of an accidental tap.
- Daily progress resets by date automatically, saves to Supabase, and is also cached locally so the routine keeps working offline.
- The previous gym Today screen is now the **Gym** tab. **All workouts** opens the muscle library without adding another bottom tab.
- Full backups now include daily-system steps and daily progress.


## v1.12 — substeps + skip

**Database:** run the whole `supabase/schema.sql` once. This is additive only: it adds substep/skip fields to the Daily System and does not delete gym data, videos, plans, history, or daily steps.

- Daily steps can now have optional substeps. Add them as one line each under the collapsed **Substeps** editor.
- Substeps stay friction-free during the day: battle angel still shows exactly one action at a time. The parent step is only a small context label.
- **Done** advances immediately to the next action.
- **Skip** advances immediately with no confirmation. A normal step is recorded as skipped; a substep simply advances within its parent.
- **Undo** stays secondary and reverses the most recent daily action if you tapped too quickly.
- Daily substep position and skipped steps sync to Supabase and are cached locally/offline with the rest of the Daily System.
- Backups include substeps and skip/substep progress.


## v1.13 — daily autopilot

**Database:** run the whole `supabase/schema.sql` once, or run the small `battle-angel-v1.13-daily-flow-upgrade.sql` supplied with this release. This only adds the Daily System `later_step_ids` field and does not delete gym data, videos, plans, history, weights, or daily steps.

- If today's Day routine is already in progress, opening battle angel returns directly to the exact current action. There is no Continue tap.
- The Day runner is now a full-height iPhone-style focus screen with one dominant action button and no bottom navigation.
- **Undo** is no longer a permanent button. After Done, Skip, or Later it appears briefly as a small transient toast, then disappears.
- **Later** moves the current step to the end of today's unresolved routine without changing the routine itself. Swipe the card left for the same action.
- **Skip** still advances immediately for things that do not need to happen today.
- A Daily step named **Gym**, **Workout**, or **Training** becomes a bridge to today's planned gym modules. It shows the planned muscles, launches the next workout, and returns to the next Daily action automatically after the gym work is complete.
- If a Gym step has no planned workout, **Choose workout** opens the workout library; finishing that workout still returns to the Daily flow.
- Daily backups now include deferred/Later state.


## v1.14 — swipe autopilot

No database changes.

- Day stays one card at a time so you do not have to scan a list or choose what comes next.
- Swipe **right** to finish the current action. On the special Gym card, right starts the next planned workout instead of falsely marking Gym complete.
- Swipe **left** to send the current step to Later. Later is hidden when there is nothing else left to do.
- Swipe **up** to skip the current step for today.
- The card follows your finger and shows a clear Done/Start, Later, or Skip stamp before the swipe commits.
- Three small tap controls remain as a fallback, but the full routine list stays out of the active runner. Exit is the deliberate escape hatch to edit the routine.


## v1.14.1 — iPhone swipe fix

No database changes.

- Daily Autopilot now locks page scrolling while the one-card runner is open, so the iPhone page scrollbar cannot steal the gesture.
- iPhone uses explicit non-passive touch handling for the card; the card follows your finger immediately.
- Swipe right = Done/Start, left = Later, up = Skip.
- Swipe distance is slightly shorter so the gesture feels more natural one-handed.
- Leaving Daily Autopilot restores normal page scrolling everywhere else in battle angel.


## v1.14.2 — buttons-only daily autopilot

No database changes.

- Removed Daily Autopilot swipe gestures. iPhone scrolling and browser gesture handling no longer compete with the routine controls.
- Daily Autopilot is still one action at a time.
- A large primary button at the bottom does the expected action: **Done** for normal steps or **Start** for the Gym step.
- **Later** and **Skip** are smaller secondary buttons above it. **Later** only appears when another unresolved step exists.
- The runner remains full-screen and automatically resumes the current action when battle angel is reopened.
- Undo remains a short-lived toast after Done, Later, or Skip.

The default execution mode deliberately does not show the full routine. The routine list stays in the editor/overview so execution requires as little choosing and scanning as possible.
