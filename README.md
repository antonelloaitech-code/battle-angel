# battle angel

battle angel is a deliberately low-friction personal gym app. Build each muscle workout once with saved reference videos, then use Workout Mode at the gym so you do not need to reopen TikTok or remember the plan.

The app now defaults to a clean dark mode. A small light/dark toggle is available in the header and the preference is remembered on the device. Decorative muscle/camera/stopwatch emoji have been removed.

## Default folders

- Shoulders
- Legs
- Back
- Chest
- Biceps
- Triceps

## the gym flow

1. Tap the muscle you are training.
2. Tap **Start workout**.
3. battle angel shows one exercise at a time.
4. Watch the saved reference clip if you need it.
5. Follow the sets, rep range, coaching cues, and last weight.
6. Tap the big **Set done - rest 2:30** button.
7. During the 2:30 rest, one of your saved motivation clips starts playing and loops until the timer ends.
8. After the final set, battle angel moves to the next exercise automatically.

There is intentionally no social feed, calorie tracking, streak system, RPE spreadsheet, or analytics dashboard.

## Motivation clips

The home screen has one separate **motivation** section. Upload saved MP4/MOV/M4V/WebM clips from iPhone Photos or Files just like exercise references.

- Motivation clips are stored privately in the same Supabase Storage bucket as exercise references.
- They sync with the same account, so clips uploaded on your phone are available on your computer and vice versa.
- Each new 2:30 rest rotates to the next motivation clip.
- That clip loops until the rest timer ends, then playback stops automatically.
- If iPhone Safari blocks automatic audio after a page reload, battle angel shows one **Play motivation** fallback button. Normal set-complete taps usually count as the user gesture needed for playback.
- If you have no motivation clips, the timer behaves normally with no extra UI during rest.

## Exercise setup

Each exercise can have:

- 1-2 saved reference videos
- target sets
- target rep range
- last weight used
- up to 3 short technique cues
- one optional backup movement for when equipment is busy

The setup screen keeps the extra coaching fields under **Optional coaching details**. You can also edit them later from the exercise card.

## Workout Mode

Workout Mode removes the editing controls and focuses on the current movement.

It shows:

- current exercise and workout position
- saved reference video(s)
- sets and reps
- set progress
- coaching cues
- last weight / current weight field
- optional backup exercise
- one large primary action for finishing the set
- the 2:30 rest timer

Weight is optional. If you change it, it saves automatically when you leave the field or press Enter.

Workout progress is stored both locally and in Supabase. Your current exercise, completed sets, and paused/active state follow the same account across phone and computer. Local storage is still used as an instant/offline-friendly fallback. Choosing **Exit** pauses the session and the muscle folder shows **Resume workout** next time.

## TikTok videos

If your reference is a TikTok, save/download the video to your phone first where permitted, then upload the saved file to battle angel.

battle angel stores the actual uploaded video in your private Supabase Storage bucket. It does not depend on the TikTok URL still working at the gym.

# Setup

## 1. Create or upgrade Supabase

1. Create a Supabase project if you do not already have one.
2. Open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Open your project API settings and copy:
   - Project URL
   - Publishable key (or legacy anon key)

Do not put the service-role key in this frontend app.

### If you already installed an older battle angel version

If your installed version is older than the cloud-progress/backup release, run the current `supabase/schema.sql` again before deploying.

The migration is safe to rerun and adds/keeps:

- sets per exercise
- rep range
- last weight
- 3 coaching cues
- backup exercise
- the `workout_progress` table used to sync the current exercise/set across devices

It keeps the existing exercise grouping, videos, folders, and private Storage rules.

The previous Arms-to-Biceps/Triceps migration is still included for older installs.

If you already ran the schema from the immediately previous cloud-progress version, this dark-mode/motivation update does **not** require another SQL migration. Motivation clips are stored using a reserved hidden folder inside the existing `folders` + `exercises` structure, so they never appear as a muscle folder.

## 2. Create your battle angel login

battle angel uses email + password so there are no magic-link emails or email rate limits during normal use.

1. In Supabase open **Authentication -> Users**.
2. Choose **Add user -> Create new user**.
3. Enter the email and password you want to use for battle angel.
4. Turn on **Auto Confirm User** / mark the user as confirmed.
5. Create the user.

Then sign in to battle angel with that email and password. Supabase persists the browser session, so on your own phone you should normally stay signed in between gym sessions.

Because battle angel now uses password login, a magic-link redirect URL is not required for normal sign-in.

## 3. Run locally

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Then run:

```bash
npm install
npm run dev
```

Vite normally opens at `http://localhost:5173`.

## 4. Deploy to Netlify from GitHub

1. Put this project in a GitHub repository.
2. In Netlify choose **Add new project -> Import an existing project**.
3. Select the repository.
4. The included `netlify.toml` already uses:
   - build command: `npm run build`
   - publish directory: `dist`
5. In **Netlify -> Site configuration -> Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Deploy.

## 5. Optional personal-app lock-down

If battle angel is only for you, keep public signups disabled. Create your account manually in **Authentication -> Users** with Auto Confirm enabled. The app itself only signs in existing users; it does not expose a public sign-up flow.

# Data and privacy

- `folders` stores muscle folders.
- `exercises` stores the video rows and exercise metadata.
- Videos belonging to the same exercise share an `exercise_group` UUID.
- Private videos live in the `gym-videos` Supabase Storage bucket.
- Row Level Security limits database rows and Storage objects to the signed-in user.
- Playback uses temporary signed URLs.
- Large video uploads use resumable TUS uploads in 6 MB chunks.
- In-progress workout state is mirrored to the `workout_progress` table so the latest exercise/set can resume on another signed-in device. This is session progress, not a workout-history/analytics database.

## Backup your library

At the bottom of the signed-in app, tap **Backup library**. battle angel creates one ZIP containing:

- `battle-angel-backup.json` with folders, exercise order, sets/reps, weights, cues, backups, and video mapping
- a `videos/` folder containing the actual private reference video files
- a `videos/motivation/` folder containing your motivation clips

Save that ZIP somewhere independent of Supabase (for example iCloud Drive, Google Drive, or your computer). This gives you an offline copy of the plan and the actual uploaded clips. Large libraries can produce a large ZIP, so running the backup from a computer is the most reliable option if you have many videos.

The backup export is deliberately outside Workout Mode so it never adds friction during a gym session.

# File map

```text
.
|-- index.html
|-- netlify.toml
|-- package.json
|-- .env.example
|-- src/
|   |-- main.js
|   `-- styles.css
`-- supabase/
    `-- schema.sql
```

## iPhone video uploads

- Tap **Choose from Photos or Files** inside an exercise. Saved TikTok videos in the iPhone Photos library are supported.
- The app accepts MP4, MOV, M4V, and WebM, including iOS files that report an empty/odd MIME type.
- Small clips use Supabase's standard upload; clips over 6 MB use resumable TUS uploads in 6 MB chunks for better reliability on mobile connections.
- Keep the app open until the progress indicator reaches 100%.
- The current Supabase Free plan has a 50 MB maximum per individual file. If a clip is larger, trim it in Photos or export/save a smaller copy before uploading.
- Uploaded videos stay in the private `gym-videos` bucket and are played in the app through temporary signed URLs.
