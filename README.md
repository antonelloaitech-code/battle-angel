# battle angel

battle angel is a deliberately low-friction personal gym app. Build each muscle workout once with saved reference videos, then use Workout Mode at the gym so you do not need to reopen TikTok or remember the plan.

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
7. After the final set, battle angel moves to the next exercise automatically.

There is intentionally no social feed, calorie tracking, streak system, RPE spreadsheet, or analytics dashboard.

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

Workout progress is stored locally on the device. If the page refreshes or the browser closes during an active session, battle angel can reopen the active workout automatically. Choosing **Exit** pauses it and the muscle folder shows **Resume workout** next time.

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

Run the new `supabase/schema.sql` again before deploying this version.

The migration is safe to rerun and adds:

- sets per exercise
- rep range
- last weight
- 3 coaching cues
- backup exercise

It keeps the existing exercise grouping, videos, folders, and private Storage rules.

The previous Arms-to-Biceps/Triceps migration is still included for older installs.

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
- In-progress workout state is local to the browser/device and is not a workout-history database.

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
