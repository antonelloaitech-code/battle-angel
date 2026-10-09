# battle angel

**a warrior's spirit needs a warrior's body**

battle angel is a low-friction daily-system + gym app built for an ADHD brain: set your routine and workouts once, then open the app and execute the next thing without deciding what comes next. Prioritizing, starting, and finishing are all reduced to one small decision at a time.

## main tabs

The app is split into four simple tabs so the screen stays quiet:

- **Gifts** (the day) — each morning it asks which power actions you're getting done today, then serves your routine and those power actions one card at a time. The **eye** (top left) shows every card of today; tap any to mark it done. **Open the full day** in there has power actions, boosters, today's order, Inbox, and setup.
- **Forge** (the gym) — today's planned workouts, resume, offline video prep, and access to all workouts.
- **Destiny** (the calendar) — calendar, recurring weekly plan, and repeat-last-week.
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
- Routine steps: `daily_steps` (`weekdays` = the days a step runs, `opens_workout` = the step that opens today's workout)
- Boosters list: `daily_meds` (shown as Boosters in the app)
- Boosters checkmarks by date: `daily_med_log`
- Master todo list: `power_todos`
- Today's Power Action selections/status: `power_action_plan`
- v1.18 additions: core flag on `daily_steps`; energy mode, Later counts, and wrap-up time on `daily_progress`; size, snooze, and first-step link on `power_todos`
- Videos: private `gym-videos` Supabase Storage bucket

Row Level Security limits data and Storage objects to the signed-in account. Video playback uses temporary signed URLs.

## iPhone uploads

Saved MP4, MOV, M4V, and WebM clips can be selected from Photos or Files. Larger clips use resumable uploads. Keep battle angel open until the upload completes.

Videos over 12 MB are compressed on the phone before uploading (H.264 MP4, up to 1280px, sized to land under about 45 MB). Reference clips lose their audio since they always play muted; motivation clips keep it. Photos are resized to 1600px JPEG. Keep battle angel open while it compresses; the screen stays awake. Anything still over 50 MB after compressing (very long clips) has to be trimmed first.

## backup

Open **More -> Backup library** to create a ZIP containing the workout library, planning data, Daily System, boosters, Power Actions/todos, motivation references, and uploaded videos. Save the ZIP somewhere independent such as iCloud Drive or your computer.

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


## v1.14.3 — autopilot polish

No database changes.

- Daily execution remains strictly one action at a time; the full routine only appears in Edit routine.
- The primary **DONE** action is visually dominant and stays in the bottom thumb zone.
- Secondary choices are explicitly **Later today** and **Skip today** so their meaning is obvious without thinking.
- **Later today** always moves the current parent step behind all other remaining steps for today, while preserving any substep progress already completed.
- Exit is hidden behind a small ••• menu so leaving autopilot is available without competing with the current action.
- The active card can still scroll if a note is unusually long, but its scrollbar is hidden so the runner feels like a native iPhone screen.
- Text selection and accidental browser-style interaction are disabled inside the runner.


## v1.15 — daily meds

**Database:** run the whole `supabase/schema.sql` once, or run the small `battle-angel-v1.15-meds-upgrade.sql` supplied with this release. This is additive only.

- A compact **Meds** section sits directly below **Edit routine** on the Day overview.
- Tap a medication row once to mark it taken; tap again to undo.
- The check state is tied to the local calendar date, so every new day starts unchecked automatically.
- **Edit meds** stays collapsed by default and lets you add, rename, reorder, or delete medications without cluttering the normal Day view.
- Medication checks work from the phone cache and sync to Supabase when online.
- Backups now include the medication list and daily taken log.
- The tracker records only what you enter and whether you marked it taken; it does not make dosing decisions or change your routine automatically.


## v1.16 — Power Actions

**Database:** run the whole `supabase/schema.sql` once, or run `supabase/power_actions_upgrade.sql`. This is additive only and does not delete gym data, routine steps, meds, videos, plans, history, or weights.

- Daily Autopilot and one-off todos are intentionally separate. The recurring routine stays your fixed daily sequence.
- Directly under the Start Day card is a compact **Start power actions** card for only the todos you chose for today.
- **Todos** is a dedicated collapsed section. Add a todo once, then tap **Today** beside only the items you want served today.
- Power Actions use the same one-card execution model as Daily Autopilot: one action, one large **DONE** button, plus **Later today** and **Skip today**.
- **Done** permanently completes that todo and removes it from the active todo list. **Skip today** leaves the todo in the master list for another day. **Later today** moves it behind the remaining Power Actions for today.
- Today's selections are date-specific. A new day starts with zero Power Actions selected, while unfinished todos remain available in the master list.
- If Power Actions were started and the app closes, battle angel resumes the current Power Action automatically when the fixed Daily routine is not actively running.
- Power Action execution is cached locally and queued for Supabase sync, matching the app's low-friction/offline-first behavior.
- Backups include the master todo list and dated Power Action plan/history.

## v1.17 — Day Stack

The Day tab is now one system instead of a separate routine runner and Power Actions runner.

**Capture first, decide later.** The Day overview has one small **Dump a todo...** field. Anything you type there goes to **Inbox** only. It does not interrupt the current day or force you to prioritize it immediately. While Autopilot is running, the small **+** button opens the same quick capture without leaving the current action.

**Plan today only when you want to plan.** Open **Plan today** to see one ordered stack containing the repeating routine plus the todos selected for today. Choose items from Inbox with **+ Today** and use the compact up/down controls to put those todos anywhere between routine actions. This changes only today's order; it never rearranges the permanent routine.

**Execute one thing at a time.** **Start day** runs that combined stack as a single Autopilot. Routine actions, routine substeps, Gym, and selected todos all arrive through the same one-card screen. The only normal decisions are **Done**, **Later today**, or **Skip today**.

- **Done** on a todo completes it and removes it from Inbox.
- **Later today** moves the current routine block or todo behind the remaining stack.
- **Skip today** removes it from today's execution. A skipped todo stays in Inbox.
- A todo that simply never gets finished also stays in Inbox and is available to choose on any future day.
- A new calendar day starts with a fresh routine and no todos selected. Med checkmarks also reset for the new date.

The visual hierarchy is intentionally quiet: **Start day** first, quick capture second, then collapsed planning/editing sections. The full Inbox is hidden unless you deliberately open it.

### v1.17 database upgrade

Existing installs should run `supabase/day_stack_upgrade.sql` once. It adds the ordered Day Stack field and also creates/repairs the Todo Inbox tables if the earlier v1.16 SQL did not finish. The migration is additive only and does not delete workouts, uploads, routines, meds, calendar data, history, or existing todos.


## v1.17.1 - startup fix

- Fixes the blank/black screen in v1.17 caused by missing Day Stack queue helper functions.
- Adds a visible startup error fallback so a future runtime failure cannot leave a silent black screen.
- No database changes from v1.17. If the v1.17 Day Stack SQL already ran successfully, do not run another migration for this fix.


## v1.18.1 — Action Engine: open → act

**Database:** run the whole `supabase/schema.sql` once (always safe), or run `supabase/action_engine_upgrade.sql` if v1.17's SQL already ran. It is additive only: it never deletes workouts, uploads, routines, meds, calendar data, history, or todos. The last query prints a row of checks that should all say `true`. (v1.18.1 has no database changes beyond v1.18.)

battle angel keeps working before you run it. It detects the missing columns and switches off only the parts that need them (core steps, snooze, picks, wrap-up). More shows a small reminder until the SQL has run.

**The rule for this version: zero decisions between opening the app and acting.** Every option that isn't needed in the moment stays out of sight until it is.

### Open → act

- Opening battle angel (or tapping **Day**) lands on the next action. There's no overview and no Start button. **Plan / edit day** is behind •••.
- The top bar shows only what you've done (**✓ 7**) and a thin progress line. There's no "to go" number, so the day never looks like a wall.
- **DONE** lands a check on the card with a short tick (More → Done sound) before the next card slides in. Undo stays available for a few seconds.

### No morning planning

- When the day starts with fewer than 3 todos chosen, battle angel **fills the gap from Inbox, oldest first**, and puts them after your routine, marked **picked for you**.
- Don't want one today? **Skip today.** It stays in Inbox and comes back after a growing gap: tomorrow, then 3 days, then a week. Things you keep skipping fade out on their own.
- Items you've passed on 3 times are no longer picked. They wait in **Sort inbox** (Inbox or Plan today), which asks one item at a time: Today, Not today, or Drop (with a gentle "dropping it is a real decision" note). It stops at 3.
- Sorting and picking by hand are optional tools, never steps you must take.

### When you're stuck

- Todo cards show only **DONE / Later / Skip**. Stay on one for 30 seconds, or see it again after a Later, and **Stuck? ▶ Just 5 minutes · Shrink it** appears.
- **Just 5 minutes**: a countdown that keeps the screen on and chimes at the end ("Time's up. You started. +5 more?").
- **Shrink it**: type the first tiny physical step. It goes in front of the big todo, linked to it ("step of: Do taxes").
- Push the same card to Later twice and it says so without blame: shrink it, 5 minutes, or skip today. On the Gym card the deal is "just the first exercise".

### Rough days

- Mark 3–5 routine steps as **Core** in Edit routine.
- The first card of the day offers **Rough day? Core only**, one tap right when you'd decide. It's also in •••. Only core steps run; nothing is lost.
- Finishing a core-only day says "Minimum day: done. That counts." and offers **Got energy left? Do the full day**.
- **Wrap up day** (in •••) ends the day on purpose, shows your wins, and keeps anything unfinished safe in Inbox. **Reopen day** undoes it.

### Capture

- In the runner, **+** opens one field. Type, Enter, and you're back on the same card. Nothing to decide.
- If it's urgent, the toast offers **Do next**, which puts it right after the current card.
- The **Dump a thought...** field in Plan / edit day stays focused for brain-dumps, and each capture offers **Do today**.
- Capture, Done, Skip, Later, and sorting all work **with no signal**. Everything saves on the phone instantly and syncs when you're back online.

### Point of performance

- A **Meds** pill sits in the runner's top bar until everything is checked. Tap it to check meds without leaving the card.
- **Gym suggests a workout** when nothing is planned: the muscle you trained least recently, one tap to start. The Gym card in your day does the same.
- Finishing a workout from your day returns you to the next card with a "done ✓" toast. Finishing one from the Gym tab shows this week's golden-week progress.
- Optional **App icon count** (More): actions left today on the home-screen icon. On iPhone this needs notification permission; battle angel never sends notifications.

### Fixes

- Leaving the app open overnight on a card no longer lets yesterday's card complete a step for the new day. A new day always opens fresh.
- A background sync redraws the runner only when the current card actually changed (for example, finished on another device).
- Editing the routine mid-day no longer throws you back into the runner, and open sections stay open after edits.
- Undo replaces "Are you sure?" for todo deletes. Undo toasts no longer stack or vanish early.
- A database error that isn't a missing table (no signal, a policy, a deleted row) can no longer switch the whole Day tab off.
- Removed the unused v1.16 Power Actions runner and other dead code.

### Not in this zip

The app registers `/sw.js` for offline opening, but this project had no `public/` folder. If your GitHub repo already has `public/sw.js`, keep it. If it doesn't, offline *opening* isn't active (offline *saving* works either way).

## v1.18.2 — pink

The green accent is now neon pink (`#eb4ff6`) everywhere it appeared: DONE and other main buttons, progress bars, checks, highlights and the done glow. The light theme uses a deeper pink (`#ba12a3`) so white text on buttons stays readable. The colors live in the `--accent` variables at the top of `src/styles.css`. No database changes.

## v1.18.3 — pinker

The accent moves from violet-pink to hot pink: `#f651bf` in dark mode, `#ba1282` in light mode. No database changes.

## v1.19 — morning power actions, Boosters, a Day tab you can find your way around

No database changes. Everything you have stays as it is.

### The morning question

- The first time you open battle angel each day, it asks: **"What power actions are you getting done today to get to another place?"**
- Tap your todos **in order of importance**: the first tap is #1, the next #2, then #3. Type a new one straight into the next open slot. **↑** moves a pick up, **×** takes it out.
- Three is the limit, so the day stays winnable. Things you skipped recently rest in a separate list, one tap away.
- **Lock in and start** puts them after your routine, in your order, and starts the day. Each card says **Power action 1 of 3**. **Skip and start with my routine** is always there.
- Changed your mind? **Change** on the Day overview reopens the same picker; what's already done stays done.
- This replaces v1.18.1's automatic "picked for you".

### Meds are now Boosters

- Same list, same checkmarks, new name everywhere: the runner pill, the sheet, the Day tab, the editor.

### The Day tab, organized

- In the runner, **Today** (top right) opens the whole day, and the tab bar stays visible. No more hidden ••• menu.
- The overview reads top to bottom, one pattern for every section (title, count, one button on the right):
  1. **Up now** with **Continue**, plus Low energy and Wrap up day
  2. **Power actions** (Change)
  3. **Boosters**, checked right there
  4. **Today's order**, the next few (Reorder, Show all)
  5. **Inbox**: dump a thought; your backlog, newest first, without today's picks repeated (Sort, Edit)
  6. **Setup**: **Edit routine** and **Edit boosters**, two matching rows that each open their own screen with a back button
- Editing never happens in the middle of the overview anymore, so the page stays about today.

## v1.20 — routine steps on chosen days, a workout step that opens Train, new tab names

**Database:** run `supabase/routine_upgrade.sql` once in the Supabase SQL editor (or the whole `supabase/schema.sql`, always safe). It only adds two columns to `daily_steps`; nothing is deleted or changed. The last query prints `true` twice. Until it runs, battle angel keeps working: every step runs every day, and steps with gym, workout or training in their name still open the workout. More shows a reminder.

### Steps on chosen days

- **Edit routine** → open a step → **Days**: seven buttons, Monday first. All on means every day. Turn off the days it shouldn't run. The last day can't be switched off.
- New steps get the same buttons right under the name.
- On days a step doesn't run, it's simply not in your autopilot. **Today's order** says so ("Not on Thursdays: Laundry."), so nothing looks lost.
- The step list shows each step's days: Weekdays, Weekends, or Mon, Wed, Fri.

### Your workout step opens Train

- A routine step with **workout**, **gym** or **training** in its name (like "battle angel workout") is your workout card. Any step can be linked or unlinked with **Opens today's workout** in Edit routine.
- On the card, **START BACK** (or whatever Calendar planned for today) goes straight into that workout. Nothing planned? It suggests the muscle you trained least recently, with **Choose another**.
- A workout you paused shows **RESUME**.
- Finish the workout and you're back on your day with the step checked off. Did the workout from Train first? The step is checked off there too, so you never do it twice.

### New tab names

- **Gifts** (was Day), **Forge** (was Gym), **Campaign** (was Plan), **More**. Page titles and back buttons match.

### Fix

- In Edit routine, the checkbox rows (Core step, Opens today's workout) sit on one line again.

## v1.21 — the eye, Train and Calendar

No database changes (v1.20's `routine_upgrade.sql` is still the latest).

### The eye

- A small **eye** sits at the top left of every card. Tap it to see every card of today: **To do** in the order they come up (the current one says *Up now*), then **Done**.
- **Tap any card to mark it done**, in any order: a routine step (a step with substeps is done as a whole), a power action, a first step. Tap it again to undo; within the same look it goes back exactly where it was.
- Skipped cards show under Done as skipped. Tap one to put it back on today.
- Close it and the autopilot picks up at the next card that isn't done. If that was the last one, the day is complete.
- The same view is on the day overview (**All cards**) and on the finished-day card (**See today's cards**), so a slip is always one tap to fix.
- **Open the full day** at the bottom goes to power actions, boosters, inbox and setup. It replaces the Today button.

### Tab names

- **Gifts · Train · Calendar · More**. Train was Forge, Calendar was Campaign. A workout step's card says *battle angel workout · Train*.

## v1.22 — Finish my day, Forge and Destiny

No database changes.

### Finish my day

- When the day is done (every card, or **Wrap up day**), the finished-day card shows **Finish my day**.
- It closes the day and plays your motivation videos and photos full screen for **5 minutes straight**: the same library as the rest timer, shuffled, looping until the time is up. The screen stays on.
- Small controls at the top: a progress line with the time left, **Sound on/off**, and **Skip** if you ever need it.
- Then black, and one question: **"Are you living life like the person you want to be?"**, signed **battle angel.** After a few seconds (or a tap) it exits back to Gifts.
- No motivation saved yet? It goes straight to the question and tells you where to add some (More → Edit motivation).

### Tab names

- **Gifts · Forge · Destiny · More**. Forge is the gym, Destiny is the calendar. The workout card says *battle angel workout · Forge*.
