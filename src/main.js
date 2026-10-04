import { createClient } from '@supabase/supabase-js'
import * as tus from 'tus-js-client'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const VIDEO_BUCKET = 'gym-videos'
const DEFAULT_FOLDERS = ['Shoulders', 'Legs', 'Back', 'Chest', 'Biceps', 'Triceps']
const REST_SECONDS = 150
const MAX_VIDEOS_PER_EXERCISE = 2
const AUTO_RESUME_WINDOW_MS = 12 * 60 * 60 * 1000
const STALE_WORKOUT_MS = 72 * 60 * 60 * 1000

if (!SUPABASE_URL || !SUPABASE_KEY) {
  document.querySelector('#app').innerHTML = `
    <main class="shell">
      <div class="notice error">
        Missing Supabase environment variables. Copy <strong>.env.example</strong> to <strong>.env</strong> and add your project URL and publishable/anon key.
      </div>
    </main>`
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const app = document.querySelector('#app')

let currentUser = null
let folders = []
let activeFolder = null
let activeExerciseGroups = []
let workoutMode = false
let workoutState = null
let timerEndAt = null
let timerPausedSeconds = REST_SECONDS
let timerInterval = null

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char])
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function cleanFileName(name) {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Exercise'
}

function safeObjectName(name) {
  const ext = name.includes('.') ? `.${name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')}` : ''
  return `${crypto.randomUUID()}${ext || '.mp4'}`
}

function normalizeMetadata(row = {}) {
  return {
    sets_target: clamp(Number.parseInt(row.sets_target, 10) || 3, 1, 10),
    reps_target: String(row.reps_target || '8-12').trim().slice(0, 24) || '8-12',
    last_weight: String(row.last_weight || '').trim().slice(0, 40),
    cue_1: String(row.cue_1 || '').trim().slice(0, 100),
    cue_2: String(row.cue_2 || '').trim().slice(0, 100),
    cue_3: String(row.cue_3 || '').trim().slice(0, 100),
    backup_exercise: String(row.backup_exercise || '').trim().slice(0, 100)
  }
}

function workoutStorageKey() {
  return currentUser ? `gymflow-workout-${currentUser.id}` : 'gymflow-workout'
}

function timerStorageKey() {
  return currentUser ? `gymflow-timer-${currentUser.id}` : 'gymflow-timer'
}

function readWorkoutState() {
  if (!currentUser) return null
  try {
    const raw = window.localStorage.getItem(workoutStorageKey())
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.folderId !== 'string') return null
    if (Date.now() - Number(parsed.updatedAt || 0) > STALE_WORKOUT_MS) {
      window.localStorage.removeItem(workoutStorageKey())
      return null
    }
    return {
      folderId: parsed.folderId,
      currentIndex: Math.max(0, Number.parseInt(parsed.currentIndex, 10) || 0),
      setsDone: parsed.setsDone && typeof parsed.setsDone === 'object' ? parsed.setsDone : {},
      completedGroupIds: Array.isArray(parsed.completedGroupIds) ? parsed.completedGroupIds : [],
      status: parsed.status === 'paused' ? 'paused' : 'active',
      updatedAt: Number(parsed.updatedAt || Date.now())
    }
  } catch {
    return null
  }
}

function saveWorkoutState(nextState = workoutState) {
  if (!currentUser || !nextState) return
  nextState.updatedAt = Date.now()
  workoutState = nextState
  try {
    window.localStorage.setItem(workoutStorageKey(), JSON.stringify(nextState))
  } catch {
    // The workout still works if local storage is unavailable.
  }
}

function clearWorkoutState() {
  workoutState = null
  if (!currentUser) return
  try {
    window.localStorage.removeItem(workoutStorageKey())
  } catch {
    // Ignore storage failures.
  }
}

function restoreTimerState() {
  if (!currentUser) return
  try {
    const raw = window.localStorage.getItem(timerStorageKey())
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved.endAt && Number(saved.endAt) > Date.now()) {
      timerEndAt = Number(saved.endAt)
      timerPausedSeconds = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000))
      clearTimerInterval()
      timerInterval = window.setInterval(tickTimer, 250)
    } else if (Number.isFinite(Number(saved.pausedSeconds))) {
      timerEndAt = null
      timerPausedSeconds = clamp(Number(saved.pausedSeconds), 0, REST_SECONDS)
    }
  } catch {
    // Ignore storage failures.
  }
}

function persistTimerState() {
  if (!currentUser) return
  try {
    window.localStorage.setItem(timerStorageKey(), JSON.stringify({
      endAt: timerEndAt,
      pausedSeconds: getRemainingSeconds()
    }))
  } catch {
    // Ignore storage failures.
  }
}

function renderLogin(message = '') {
  workoutMode = false
  app.innerHTML = `
    <main class="shell login-wrap">
      <section class="login-card" aria-labelledby="login-title">
        <div class="brand-kicker">GYM FLOW</div>
        <h1 id="login-title">Your workout. No scrolling TikTok.</h1>
        <p>Sign in once. At the gym it is just muscle, exercise, set, rest, next.</p>
        <form class="login-form" id="login-form">
          <label for="email" class="eyebrow">EMAIL</label>
          <input id="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          <button class="primary-button" type="submit">Email me a sign-in link</button>
        </form>
        <div id="login-status" class="status-line" aria-live="polite">${escapeHtml(message)}</div>
      </section>
    </main>`

  const form = document.querySelector('#login-form')
  const status = document.querySelector('#login-status')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.querySelector('#email').value.trim()
    const button = form.querySelector('button')
    button.disabled = true
    button.textContent = 'Sending...'
    status.textContent = ''

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })

    if (error) {
      status.textContent = error.message
      button.disabled = false
      button.textContent = 'Email me a sign-in link'
      return
    }

    status.textContent = 'Check your email and tap the link. You can close this page.'
    button.textContent = 'Link sent'
  })
}

async function ensureDefaultFolders() {
  let { data, error } = await supabase
    .from('folders')
    .select('id,name,sort_order,created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  if (!data.length) {
    const rows = DEFAULT_FOLDERS.map((name, index) => ({
      user_id: currentUser.id,
      name,
      sort_order: index + 1
    }))

    const { data: created, error: insertError } = await supabase
      .from('folders')
      .insert(rows)
      .select('id,name,sort_order,created_at')

    if (insertError) throw insertError
    return created.sort((a, b) => a.sort_order - b.sort_order)
  }

  const arms = data.find((folder) => folder.name.toLowerCase() === 'arms')
  const hasBiceps = data.some((folder) => folder.name.toLowerCase() === 'biceps')
  const hasTriceps = data.some((folder) => folder.name.toLowerCase() === 'triceps')
  if (arms && !hasBiceps) {
    const { error: renameError } = await supabase
      .from('folders')
      .update({ name: 'Biceps', sort_order: 5 })
      .eq('id', arms.id)
    if (renameError) throw renameError

    if (!hasTriceps) {
      const { error: tricepsError } = await supabase.from('folders').insert({
        user_id: currentUser.id,
        name: 'Triceps',
        sort_order: 6
      })
      if (tricepsError) throw tricepsError
    }
  }

  const { data: finalFolders, error: finalError } = await supabase
    .from('folders')
    .select('id,name,sort_order,created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (finalError) throw finalError
  return finalFolders
}

async function loadFolders() {
  folders = await ensureDefaultFolders()
  const { data: rows, error } = await supabase
    .from('exercises')
    .select('folder_id,exercise_group')

  if (error) throw error

  const groupMap = {}
  rows.forEach((row) => {
    if (!groupMap[row.folder_id]) groupMap[row.folder_id] = new Set()
    groupMap[row.folder_id].add(row.exercise_group)
  })

  folders = folders.map((folder) => ({
    ...folder,
    count: groupMap[folder.id]?.size || 0
  }))
}

function renderShell(content, options = {}) {
  const title = options.title || (activeFolder ? activeFolder.name : 'What are you training?')
  const showAccount = options.showAccount !== false
  app.innerHTML = `
    <main class="shell ${workoutMode ? 'workout-shell' : ''}">
      <header class="topbar">
        <div class="topbar-title">
          <div class="brand-kicker">GYM FLOW</div>
          <h1 id="page-title">${escapeHtml(title)}</h1>
        </div>
        <button type="button" id="timer-toggle" class="timer-chip" aria-expanded="false">&#9201; <span id="timer-mini">2:30</span></button>
      </header>
      <section id="timer-panel" class="timer-panel hidden" aria-label="Rest timer">
        <div class="timer-row">
          <div>
            <div class="timer-label">REST TIMER</div>
            <div id="timer-value" class="timer-value" aria-live="polite">2:30</div>
          </div>
          <div class="timer-actions">
            <button type="button" id="timer-start" class="primary-button">Start</button>
            <button type="button" id="timer-reset" class="secondary-button">Reset</button>
          </div>
        </div>
      </section>
      <div id="main-content">${content}</div>
      ${showAccount ? `<div class="account-row">
        <span>${escapeHtml(currentUser?.email || '')}</span>
        <button type="button" class="secondary-button" id="sign-out">Sign out</button>
      </div>` : ''}
    </main>`
  bindTimerControls()
  const signOut = document.querySelector('#sign-out')
  if (signOut) signOut.addEventListener('click', () => supabase.auth.signOut())
  updateTimerUI()
}

function getSavedWorkoutForFolder(folderId) {
  const saved = readWorkoutState()
  return saved?.folderId === folderId ? saved : null
}

function renderHome(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false

  const cards = folders.map((folder) => {
    const saved = getSavedWorkoutForFolder(folder.id)
    const resumeText = saved ? '<span class="resume-dot">Workout in progress</span>' : ''
    return `
      <button type="button" class="folder-card" data-folder-id="${folder.id}">
        <span class="folder-icon" aria-hidden="true">${folderIcon(folder.name)}</span>
        <span class="folder-card-copy">
          <span class="folder-name">${escapeHtml(folder.name)}</span>
          <span class="folder-count">${folder.count ? `${folder.count} exercise${folder.count === 1 ? '' : 's'}` : 'Tap to build'}</span>
          ${resumeText}
        </span>
      </button>`
  }).join('')

  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    <section class="folder-grid" aria-label="Muscle folders">${cards}</section>
    <details class="add-folder">
      <summary>+ Add a folder</summary>
      <form id="add-folder-form">
        <input id="folder-name" type="text" maxlength="28" required placeholder="e.g. Glutes" aria-label="Folder name" />
        <button class="primary-button" type="submit">Add</button>
      </form>
      <div id="folder-status" class="status-line inline-status" aria-live="polite"></div>
    </details>`)

  document.querySelectorAll('[data-folder-id]').forEach((button) => {
    button.addEventListener('click', () => openFolder(button.dataset.folderId))
  })
  document.querySelector('#add-folder-form').addEventListener('submit', addFolder)
}

function folderIcon(name) {
  const key = name.toLowerCase()
  if (key.includes('leg') || key.includes('glute')) return '&#129461;'
  if (key.includes('chest')) return '&#128293;'
  return '&#128170;'
}

async function addFolder(event) {
  event.preventDefault()
  const input = document.querySelector('#folder-name')
  const status = document.querySelector('#folder-status')
  const name = input.value.trim()
  if (!name) return

  if (folders.some((folder) => folder.name.toLowerCase() === name.toLowerCase())) {
    status.textContent = 'That folder already exists.'
    return
  }

  const nextOrder = folders.reduce((max, folder) => Math.max(max, folder.sort_order || 0), 0) + 1
  const { error } = await supabase.from('folders').insert({
    user_id: currentUser.id,
    name,
    sort_order: nextOrder
  })

  if (error) {
    status.textContent = error.message
    return
  }

  await loadFolders()
  renderHome()
}

function groupExerciseRows(rows) {
  const map = new Map()

  rows.forEach((row) => {
    const key = row.exercise_group
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: row.name,
        sort_order: row.sort_order,
        created_at: row.created_at,
        ...normalizeMetadata(row),
        videos: []
      })
    }
    map.get(key).videos.push(row)
  })

  return [...map.values()]
    .map((group) => ({
      ...group,
      videos: group.videos.sort((a, b) => (a.video_order || 1) - (b.video_order || 1))
    }))
    .sort((a, b) => (a.sort_order - b.sort_order) || String(a.created_at).localeCompare(String(b.created_at)))
}

async function openFolder(folderId, options = {}) {
  const folder = folders.find((item) => item.id === folderId) || activeFolder
  if (!folder) return
  activeFolder = folder
  activeExerciseGroups = []
  workoutMode = false
  renderFolderLoading()

  const { data: rows, error } = await supabase
    .from('exercises')
    .select('id,name,video_path,sort_order,video_order,exercise_group,created_at,sets_target,reps_target,last_weight,cue_1,cue_2,cue_3,backup_exercise')
    .eq('folder_id', folder.id)
    .order('sort_order', { ascending: true })
    .order('video_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    renderFolder([], error.message)
    return
  }

  let signedUrlMap = {}
  if (rows.length) {
    const paths = rows.map((row) => row.video_path)
    const { data: signed, error: signError } = await supabase.storage
      .from(VIDEO_BUCKET)
      .createSignedUrls(paths, 60 * 60 * 12)

    if (signError) {
      renderFolder([], signError.message)
      return
    }

    signedUrlMap = Object.fromEntries(
      rows.map((row, index) => [row.video_path, signed[index]?.signedUrl || ''])
    )
  }

  const hydratedRows = rows.map((row) => ({
    ...row,
    signedUrl: signedUrlMap[row.video_path]
  }))
  activeExerciseGroups = groupExerciseRows(hydratedRows)

  if (options.mode === 'workout' && activeExerciseGroups.length) {
    startOrResumeWorkout({ forceResume: true })
    return
  }

  renderFolder(activeExerciseGroups)
}

function renderFolderLoading() {
  renderShell(`<div class="notice info">Loading ${escapeHtml(activeFolder.name)}...</div>`)
}

function renderCueChips(group) {
  const cues = [group.cue_1, group.cue_2, group.cue_3].filter(Boolean)
  if (!cues.length) return ''
  return `<div class="cue-list">${cues.map((cue) => `<span class="cue-chip">${escapeHtml(cue)}</span>`).join('')}</div>`
}

function renderPlanCard(group, index, total) {
  const videos = group.videos.map((video, videoIndex) => `
    <div class="reference-video">
      <div class="reference-label">Reference ${videoIndex + 1}</div>
      <video controls playsinline preload="metadata" src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(group.name)} reference ${videoIndex + 1}"></video>
      ${group.videos.length > 1 ? `<button type="button" class="text-button danger-text" data-remove-video="${video.id}" data-video-path="${escapeHtml(video.video_path)}" data-video-group="${group.id}">Remove this video</button>` : ''}
    </div>`).join('')

  const canAddVideo = group.videos.length < MAX_VIDEOS_PER_EXERCISE

  return `
    <article class="exercise-card plan-card" data-exercise-group="${group.id}">
      <div class="exercise-heading">
        <div class="exercise-number">${index + 1}</div>
        <div class="exercise-name-wrap">
          <div class="exercise-name">${escapeHtml(group.name)}</div>
          <div class="exercise-prescription">${group.sets_target} sets x ${escapeHtml(group.reps_target)} reps${group.last_weight ? ` &middot; Last ${escapeHtml(group.last_weight)}` : ''}</div>
        </div>
      </div>
      ${renderCueChips(group)}
      ${group.backup_exercise ? `<div class="backup-line"><strong>Backup:</strong> ${escapeHtml(group.backup_exercise)}</div>` : ''}
      <div class="reference-grid">${videos}</div>
      <details class="manage-exercise">
        <summary>Edit exercise</summary>
        <form class="edit-exercise-form" data-edit-form="${group.id}">
          <label class="field-span-2">
            <span class="eyebrow">NAME</span>
            <input name="name" type="text" maxlength="80" value="${escapeHtml(group.name)}" required />
          </label>
          <label>
            <span class="eyebrow">SETS</span>
            <input name="sets_target" type="number" inputmode="numeric" min="1" max="10" value="${group.sets_target}" required />
          </label>
          <label>
            <span class="eyebrow">REPS</span>
            <input name="reps_target" type="text" maxlength="24" value="${escapeHtml(group.reps_target)}" placeholder="8-12" required />
          </label>
          <label class="field-span-2">
            <span class="eyebrow">LAST WEIGHT</span>
            <input name="last_weight" type="text" maxlength="40" value="${escapeHtml(group.last_weight)}" placeholder="e.g. 25 kg" />
          </label>
          <label class="field-span-2">
            <span class="eyebrow">CUE 1</span>
            <input name="cue_1" type="text" maxlength="100" value="${escapeHtml(group.cue_1)}" placeholder="e.g. Keep elbows back" />
          </label>
          <label class="field-span-2">
            <span class="eyebrow">CUE 2</span>
            <input name="cue_2" type="text" maxlength="100" value="${escapeHtml(group.cue_2)}" placeholder="e.g. Control the negative" />
          </label>
          <label class="field-span-2">
            <span class="eyebrow">CUE 3</span>
            <input name="cue_3" type="text" maxlength="100" value="${escapeHtml(group.cue_3)}" placeholder="e.g. Full stretch" />
          </label>
          <label class="field-span-2">
            <span class="eyebrow">BACKUP IF EQUIPMENT IS BUSY</span>
            <input name="backup_exercise" type="text" maxlength="100" value="${escapeHtml(group.backup_exercise)}" placeholder="e.g. Dumbbell curl" />
          </label>
          <div class="edit-actions field-span-2">
            <button type="submit" class="primary-button">Save</button>
            <button type="button" class="secondary-button" data-move-group="${group.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>Move up</button>
            <button type="button" class="secondary-button" data-move-group="${group.id}" data-direction="down" ${index === total - 1 ? 'disabled' : ''}>Move down</button>
            ${canAddVideo ? `<label class="secondary-button add-reference">+ Add 2nd video<input type="file" accept="video/*" data-add-video="${group.id}" /></label>` : ''}
            <button type="button" class="danger-button" data-delete-group="${group.id}">Delete</button>
          </div>
          <div class="status-line field-span-2" data-edit-status="${group.id}" aria-live="polite"></div>
        </form>
      </details>
    </article>`
}

function renderFolder(groups, errorMessage = '') {
  workoutMode = false
  const exerciseCards = groups.map((group, index) => renderPlanCard(group, index, groups.length)).join('')
  const saved = getSavedWorkoutForFolder(activeFolder.id)
  const completedCount = saved?.completedGroupIds?.length || 0
  const startLabel = saved ? `Resume workout${completedCount ? ` - ${completedCount}/${groups.length} done` : ''}` : 'Start workout'

  renderShell(`
    <div class="folder-header">
      <button type="button" class="back-button" id="back-home">&larr; Muscles</button>
      <button type="button" class="ghost-danger" id="delete-folder">Delete folder</button>
    </div>
    ${groups.length ? `<button type="button" class="start-workout-button" id="start-workout">${escapeHtml(startLabel)} <span aria-hidden="true">&rarr;</span></button>` : ''}
    <div class="workout-intro">
      <div class="eyebrow">YOUR PLAN</div>
      <div class="workout-copy">Set it up here. At the gym, tap Start workout and the editing controls disappear.</div>
    </div>
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    <details class="add-exercise" id="add-exercise-box" ${groups.length ? '' : 'open'}>
      <summary>+ Add exercise</summary>
      <form id="add-exercise-form" class="add-exercise-form">
        <label class="field-span-2">
          <span class="eyebrow">EXERCISE</span>
          <input id="exercise-name" type="text" maxlength="80" placeholder="e.g. Bayesian cable curl" />
        </label>
        <label>
          <span class="eyebrow">SETS</span>
          <input id="exercise-sets" type="number" inputmode="numeric" min="1" max="10" value="3" />
        </label>
        <label>
          <span class="eyebrow">REPS</span>
          <input id="exercise-reps" type="text" maxlength="24" value="8-12" />
        </label>
        <label class="file-picker field-span-2">
          <span class="eyebrow">VIDEOS (1-2)</span>
          <span class="file-picker-button">Choose saved videos</span>
          <span id="picked-files" class="picked-files">No videos selected</span>
          <input id="exercise-videos" type="file" accept="video/*" multiple required />
        </label>
        <details class="optional-details field-span-2">
          <summary>+ Optional coaching details</summary>
          <div class="optional-grid">
            <label class="field-span-2">
              <span class="eyebrow">LAST WEIGHT</span>
              <input id="exercise-weight" type="text" maxlength="40" placeholder="e.g. 25 kg" />
            </label>
            <label class="field-span-2"><span class="eyebrow">CUE 1</span><input id="exercise-cue-1" type="text" maxlength="100" placeholder="Keep elbows back" /></label>
            <label class="field-span-2"><span class="eyebrow">CUE 2</span><input id="exercise-cue-2" type="text" maxlength="100" placeholder="Control the negative" /></label>
            <label class="field-span-2"><span class="eyebrow">CUE 3</span><input id="exercise-cue-3" type="text" maxlength="100" placeholder="Full stretch" /></label>
            <label class="field-span-2"><span class="eyebrow">BACKUP</span><input id="exercise-backup" type="text" maxlength="100" placeholder="If the machine is busy" /></label>
          </div>
        </details>
        <button class="primary-button field-span-2" id="save-exercise" type="submit">Add to workout</button>
      </form>
      <div id="add-exercise-status" class="status-line inline-status" aria-live="polite"></div>
    </details>
    <div id="upload-status" class="upload-status hidden" aria-live="polite">
      <div id="upload-label">Uploading...</div>
      <div class="progress-track"><div id="upload-progress" class="progress-bar"></div></div>
    </div>
    ${groups.length ? `<section class="exercise-list">${exerciseCards}</section>` : `
      <section class="empty-state">
        <div class="empty-icon">&#127916;</div>
        <div class="empty-title">Build this workout once</div>
        <div class="empty-copy">Add each exercise in order with 1-2 saved reference videos. After that, gym mode does the thinking for you.</div>
      </section>`}`)

  document.querySelector('#back-home').addEventListener('click', async () => {
    await loadFolders()
    renderHome()
  })
  document.querySelector('#delete-folder').addEventListener('click', deleteActiveFolder)
  const startButton = document.querySelector('#start-workout')
  if (startButton) startButton.addEventListener('click', () => startOrResumeWorkout())
  document.querySelector('#add-exercise-form').addEventListener('submit', addExercise)
  document.querySelector('#exercise-videos').addEventListener('change', updatePickedFiles)
  document.querySelectorAll('[data-edit-form]').forEach((form) => {
    form.addEventListener('submit', updateExerciseDetails)
  })
  document.querySelectorAll('[data-move-group]').forEach((button) => {
    button.addEventListener('click', () => moveExercise(button.dataset.moveGroup, button.dataset.direction))
  })
  document.querySelectorAll('[data-delete-group]').forEach((button) => {
    button.addEventListener('click', () => deleteExerciseGroup(button.dataset.deleteGroup))
  })
  document.querySelectorAll('[data-remove-video]').forEach((button) => {
    button.addEventListener('click', () => removeVideo(button.dataset.removeVideo, button.dataset.videoPath, button.dataset.videoGroup))
  })
  document.querySelectorAll('[data-add-video]').forEach((input) => {
    input.addEventListener('change', () => addVideoToExercise(input.dataset.addVideo, input))
  })
}

function updatePickedFiles(event) {
  const files = [...(event.currentTarget.files || [])].filter((file) => file.type.startsWith('video/'))
  const picked = document.querySelector('#picked-files')
  if (!picked) return
  if (!files.length) {
    picked.textContent = 'No videos selected'
    return
  }
  picked.textContent = files.slice(0, MAX_VIDEOS_PER_EXERCISE).map((file) => cleanFileName(file.name)).join(' + ')
  if (files.length > MAX_VIDEOS_PER_EXERCISE) picked.textContent += ' - only first 2 will be used'
}

function setUploadStatus(labelText, percent = 0, visible = true) {
  const statusBox = document.querySelector('#upload-status')
  const label = document.querySelector('#upload-label')
  const bar = document.querySelector('#upload-progress')
  if (!statusBox || !label || !bar) return
  statusBox.classList.toggle('hidden', !visible)
  label.textContent = labelText
  bar.style.width = `${clamp(percent, 0, 100)}%`
}

async function getNextExerciseOrder() {
  const { data, error } = await supabase
    .from('exercises')
    .select('sort_order')
    .eq('folder_id', activeFolder.id)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (error) throw error
  return (data?.[0]?.sort_order || 0) + 1
}

async function addExercise(event) {
  event.preventDefault()
  if (!activeFolder) return

  const nameInput = document.querySelector('#exercise-name')
  const videoInput = document.querySelector('#exercise-videos')
  const status = document.querySelector('#add-exercise-status')
  const submit = document.querySelector('#save-exercise')
  const files = [...(videoInput.files || [])].filter((file) => file.type.startsWith('video/')).slice(0, MAX_VIDEOS_PER_EXERCISE)

  if (!files.length) {
    status.textContent = 'Choose 1 or 2 videos first.'
    return
  }

  const exerciseName = nameInput.value.trim() || cleanFileName(files[0].name)
  const metadata = normalizeMetadata({
    sets_target: document.querySelector('#exercise-sets').value,
    reps_target: document.querySelector('#exercise-reps').value,
    last_weight: document.querySelector('#exercise-weight').value,
    cue_1: document.querySelector('#exercise-cue-1').value,
    cue_2: document.querySelector('#exercise-cue-2').value,
    cue_3: document.querySelector('#exercise-cue-3').value,
    backup_exercise: document.querySelector('#exercise-backup').value
  })
  const groupId = crypto.randomUUID()
  const uploadedPaths = []
  submit.disabled = true
  submit.textContent = 'Adding...'
  status.textContent = ''

  try {
    const sortOrder = await getNextExerciseOrder()

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      const objectPath = `${currentUser.id}/${activeFolder.id}/${safeObjectName(file.name)}`
      setUploadStatus(`Uploading reference ${i + 1} of ${files.length}: ${cleanFileName(file.name)}`, 0)

      await uploadResumable(file, objectPath, (percent) => {
        setUploadStatus(`Uploading reference ${i + 1} of ${files.length}: ${cleanFileName(file.name)}`, percent)
      })
      uploadedPaths.push(objectPath)

      const { error: insertError } = await supabase.from('exercises').insert({
        user_id: currentUser.id,
        folder_id: activeFolder.id,
        exercise_group: groupId,
        name: exerciseName.slice(0, 80),
        video_path: objectPath,
        sort_order: sortOrder,
        video_order: i + 1,
        ...metadata
      })

      if (insertError) throw insertError
    }

    setUploadStatus('Exercise added', 100)
    await openFolder(activeFolder.id)
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(VIDEO_BUCKET).remove(uploadedPaths)
      await supabase.from('exercises').delete().eq('exercise_group', groupId)
    }
    setUploadStatus(`Could not add exercise: ${error.message || error}`, 0)
    submit.disabled = false
    submit.textContent = 'Add to workout'
  }
}

async function updateExerciseDetails(event) {
  event.preventDefault()
  const form = event.currentTarget
  const groupId = form.dataset.editForm
  const status = document.querySelector(`[data-edit-status="${groupId}"]`)
  const submit = form.querySelector('button[type="submit"]')
  const payload = normalizeMetadata({
    sets_target: form.elements.sets_target.value,
    reps_target: form.elements.reps_target.value,
    last_weight: form.elements.last_weight.value,
    cue_1: form.elements.cue_1.value,
    cue_2: form.elements.cue_2.value,
    cue_3: form.elements.cue_3.value,
    backup_exercise: form.elements.backup_exercise.value
  })
  payload.name = form.elements.name.value.trim().slice(0, 80)
  if (!payload.name) {
    status.textContent = 'Give the exercise a name.'
    return
  }

  submit.disabled = true
  status.textContent = 'Saving...'
  const { error } = await supabase
    .from('exercises')
    .update(payload)
    .eq('exercise_group', groupId)

  if (error) {
    status.textContent = error.message
    submit.disabled = false
    return
  }

  status.textContent = 'Saved'
  await openFolder(activeFolder.id)
}

async function addVideoToExercise(groupId, input) {
  const file = [...(input.files || [])].find((item) => item.type.startsWith('video/'))
  input.value = ''
  if (!file || !activeFolder) return

  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group || group.videos.length >= MAX_VIDEOS_PER_EXERCISE) return

  const objectPath = `${currentUser.id}/${activeFolder.id}/${safeObjectName(file.name)}`
  const videoOrder = group.videos.length + 1
  const metadata = normalizeMetadata(group)

  try {
    setUploadStatus(`Adding reference ${videoOrder}: ${cleanFileName(file.name)}`, 0)
    await uploadResumable(file, objectPath, (percent) => {
      setUploadStatus(`Adding reference ${videoOrder}: ${cleanFileName(file.name)}`, percent)
    })

    const { error } = await supabase.from('exercises').insert({
      user_id: currentUser.id,
      folder_id: activeFolder.id,
      exercise_group: group.id,
      name: group.name,
      video_path: objectPath,
      sort_order: group.sort_order,
      video_order: videoOrder,
      ...metadata
    })
    if (error) {
      await supabase.storage.from(VIDEO_BUCKET).remove([objectPath])
      throw error
    }

    setUploadStatus('Second reference added', 100)
    await openFolder(activeFolder.id)
  } catch (error) {
    setUploadStatus(`Upload failed: ${error.message || error}`, 0)
  }
}

async function uploadResumable(file, objectPath, onProgress) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw error || new Error('Your session expired. Please sign in again.')

  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: VIDEO_BUCKET,
        objectName: objectPath,
        contentType: file.type || 'video/mp4',
        cacheControl: '3600'
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (uploaded, total) => onProgress(total ? (uploaded / total) * 100 : 0),
      onSuccess: resolve
    })

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0])
      upload.start()
    }).catch(reject)
  })
}

async function moveExercise(groupId, direction) {
  const index = activeExerciseGroups.findIndex((group) => group.id === groupId)
  if (index < 0) return
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= activeExerciseGroups.length) return

  const current = activeExerciseGroups[index]
  const target = activeExerciseGroups[targetIndex]

  const { error: firstError } = await supabase
    .from('exercises')
    .update({ sort_order: target.sort_order })
    .eq('exercise_group', current.id)
  if (firstError) {
    alert(firstError.message)
    return
  }

  const { error: secondError } = await supabase
    .from('exercises')
    .update({ sort_order: current.sort_order })
    .eq('exercise_group', target.id)
  if (secondError) {
    alert(secondError.message)
    return
  }

  await openFolder(activeFolder.id)
}

async function removeVideo(rowId, videoPath, groupId) {
  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group || group.videos.length <= 1) return
  if (!confirm('Remove this reference video?')) return

  const { error: storageError } = await supabase.storage.from(VIDEO_BUCKET).remove([videoPath])
  if (storageError) {
    alert(storageError.message)
    return
  }

  const { error: rowError } = await supabase.from('exercises').delete().eq('id', rowId)
  if (rowError) {
    alert(rowError.message)
    return
  }

  const { data: remaining, error: remainingError } = await supabase
    .from('exercises')
    .select('id,video_order')
    .eq('exercise_group', groupId)
    .order('video_order', { ascending: true })

  if (remainingError) {
    alert(remainingError.message)
    return
  }

  for (let i = 0; i < remaining.length; i += 1) {
    if (remaining[i].video_order !== i + 1) {
      await supabase.from('exercises').update({ video_order: i + 1 }).eq('id', remaining[i].id)
    }
  }

  await openFolder(activeFolder.id)
}

async function deleteExerciseGroup(groupId) {
  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group) return
  if (!confirm(`Delete ${group.name} and its ${group.videos.length} video${group.videos.length === 1 ? '' : 's'}?`)) return

  const paths = group.videos.map((video) => video.video_path)
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(VIDEO_BUCKET).remove(paths)
    if (storageError) {
      alert(storageError.message)
      return
    }
  }

  const { error } = await supabase.from('exercises').delete().eq('exercise_group', groupId)
  if (error) {
    alert(error.message)
    return
  }

  const saved = readWorkoutState()
  if (saved?.folderId === activeFolder.id) clearWorkoutState()
  await openFolder(activeFolder.id)
}

async function deleteActiveFolder() {
  if (!activeFolder) return
  if (!confirm(`Delete ${activeFolder.name} and every exercise/video inside it?`)) return

  const { data: videos, error: loadError } = await supabase
    .from('exercises')
    .select('video_path')
    .eq('folder_id', activeFolder.id)
  if (loadError) {
    alert(loadError.message)
    return
  }

  if (videos.length) {
    const { error: storageError } = await supabase.storage
      .from(VIDEO_BUCKET)
      .remove(videos.map((item) => item.video_path))
    if (storageError) {
      alert(storageError.message)
      return
    }
  }

  const { error } = await supabase.from('folders').delete().eq('id', activeFolder.id)
  if (error) {
    alert(error.message)
    return
  }

  const saved = readWorkoutState()
  if (saved?.folderId === activeFolder.id) clearWorkoutState()
  await loadFolders()
  renderHome()
}

function createFreshWorkoutState() {
  return {
    folderId: activeFolder.id,
    currentIndex: 0,
    setsDone: {},
    completedGroupIds: [],
    status: 'active',
    updatedAt: Date.now()
  }
}

function startOrResumeWorkout(options = {}) {
  if (!activeFolder || !activeExerciseGroups.length) return
  const saved = readWorkoutState()
  if (saved?.folderId === activeFolder.id) {
    workoutState = saved
    workoutState.status = 'active'
  } else {
    workoutState = createFreshWorkoutState()
  }
  workoutState.currentIndex = clamp(workoutState.currentIndex, 0, activeExerciseGroups.length - 1)
  saveWorkoutState()
  workoutMode = true
  renderWorkout()
}

function getCurrentWorkoutGroup() {
  if (!workoutState || !activeExerciseGroups.length) return null
  workoutState.currentIndex = clamp(workoutState.currentIndex, 0, activeExerciseGroups.length - 1)
  return activeExerciseGroups[workoutState.currentIndex]
}

function renderWorkoutVideoSwitcher(group) {
  if (!group.videos.length) return ''
  if (group.videos.length === 1) {
    return `
      <div class="workout-video-frame">
        <video controls playsinline preload="metadata" src="${escapeHtml(group.videos[0].signedUrl)}" aria-label="${escapeHtml(group.name)} reference video"></video>
      </div>`
  }

  return `
    <div class="video-switcher" data-video-switcher>
      <div class="video-tabs" role="tablist" aria-label="Reference videos">
        <button type="button" class="video-tab active" data-video-tab="0">Video 1</button>
        <button type="button" class="video-tab" data-video-tab="1">Video 2</button>
      </div>
      <div class="workout-video-frame" data-video-panel="0">
        <video controls playsinline preload="metadata" src="${escapeHtml(group.videos[0].signedUrl)}" aria-label="${escapeHtml(group.name)} reference video 1"></video>
      </div>
      <div class="workout-video-frame hidden" data-video-panel="1">
        <video controls playsinline preload="metadata" src="${escapeHtml(group.videos[1].signedUrl)}" aria-label="${escapeHtml(group.name)} reference video 2"></video>
      </div>
    </div>`
}

function renderSetDots(group, setsDone, completed) {
  return Array.from({ length: group.sets_target }, (_, index) => {
    const done = completed || index < setsDone
    const current = !completed && index === setsDone
    return `<span class="set-dot ${done ? 'done' : ''} ${current ? 'current' : ''}" aria-hidden="true">${done ? '&#10003;' : index + 1}</span>`
  }).join('')
}

function renderWorkout() {
  workoutMode = true
  const group = getCurrentWorkoutGroup()
  if (!group) {
    renderFolder(activeExerciseGroups)
    return
  }

  const completed = workoutState.completedGroupIds.includes(group.id)
  const setsDone = clamp(Number(workoutState.setsDone[group.id] || 0), 0, group.sets_target)
  const setNumber = Math.min(setsDone + 1, group.sets_target)
  const completedCount = workoutState.completedGroupIds.length
  const progress = activeExerciseGroups.length ? (completedCount / activeExerciseGroups.length) * 100 : 0
  const isLastExercise = workoutState.currentIndex === activeExerciseGroups.length - 1
  const isLastSet = setNumber >= group.sets_target
  let actionLabel = `Set ${setNumber} done - rest 2:30`
  if (isLastSet && !isLastExercise) actionLabel = 'Finish exercise - rest 2:30'
  if (isLastSet && isLastExercise) actionLabel = 'Finish workout'
  if (completed) actionLabel = 'Exercise complete'

  const cues = [group.cue_1, group.cue_2, group.cue_3].filter(Boolean)

  renderShell(`
    <section class="workout-mode-header">
      <button type="button" class="back-button" id="exit-workout">&larr; Exit</button>
      <div class="workout-position">Exercise ${workoutState.currentIndex + 1} of ${activeExerciseGroups.length}</div>
    </section>
    <div class="workout-progress" aria-label="Workout progress"><span style="width:${progress}%"></span></div>
    <div class="completed-count">${completedCount} of ${activeExerciseGroups.length} exercises complete</div>

    <article class="focus-card">
      <div class="focus-number">${workoutState.currentIndex + 1}</div>
      <h2>${escapeHtml(group.name)}</h2>
      <div class="focus-prescription">${group.sets_target} sets x ${escapeHtml(group.reps_target)} reps</div>

      ${cues.length ? `<div class="coach-cues"><div class="eyebrow">COACH CUES</div>${cues.map((cue) => `<div class="coach-cue"><span>&#10003;</span>${escapeHtml(cue)}</div>`).join('')}</div>` : ''}

      ${renderWorkoutVideoSwitcher(group)}

      ${group.backup_exercise ? `<div class="backup-card"><span class="eyebrow">MACHINE BUSY?</span><strong>${escapeHtml(group.backup_exercise)}</strong></div>` : ''}

      <div class="set-section">
        <div class="set-topline">
          <div>
            <div class="eyebrow">SETS</div>
            <div class="set-label">${completed ? 'Done' : `Set ${setNumber} of ${group.sets_target}`}</div>
          </div>
          <label class="weight-inline">
            <span>Weight</span>
            <input id="workout-weight" type="text" maxlength="40" value="${escapeHtml(group.last_weight)}" placeholder="optional" inputmode="decimal" />
          </label>
        </div>
        <div class="set-dots">${renderSetDots(group, setsDone, completed)}</div>
        <div id="weight-status" class="micro-status" aria-live="polite"></div>
      </div>

      <button type="button" id="complete-set" class="big-action" ${completed ? 'disabled' : ''}>${escapeHtml(actionLabel)}</button>

      <div class="workout-nav">
        <button type="button" class="secondary-button" id="previous-exercise" ${workoutState.currentIndex === 0 ? 'disabled' : ''}>&larr; Previous</button>
        ${completed ? '<button type="button" class="secondary-button" id="reopen-exercise">Reopen</button>' : ''}
        <button type="button" class="secondary-button" id="next-exercise" ${workoutState.currentIndex === activeExerciseGroups.length - 1 ? 'disabled' : ''}>Next &rarr;</button>
      </div>
    </article>`, { title: `${activeFolder.name} workout`, showAccount: false })

  document.querySelector('#exit-workout').addEventListener('click', pauseAndExitWorkout)
  document.querySelector('#complete-set').addEventListener('click', completeCurrentSet)
  document.querySelector('#previous-exercise').addEventListener('click', () => jumpWorkout(-1))
  document.querySelector('#next-exercise').addEventListener('click', () => jumpWorkout(1))
  const reopen = document.querySelector('#reopen-exercise')
  if (reopen) reopen.addEventListener('click', reopenCurrentExercise)
  const weight = document.querySelector('#workout-weight')
  weight.addEventListener('change', () => saveWorkoutWeight(group.id, weight.value))
  weight.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      weight.blur()
    }
  })
  bindVideoSwitcher()
}

function bindVideoSwitcher() {
  const switcher = document.querySelector('[data-video-switcher]')
  if (!switcher) return
  const tabs = [...switcher.querySelectorAll('[data-video-tab]')]
  const panels = [...switcher.querySelectorAll('[data-video-panel]')]
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const index = tab.dataset.videoTab
      tabs.forEach((item) => item.classList.toggle('active', item === tab))
      panels.forEach((panel) => {
        const shouldShow = panel.dataset.videoPanel === index
        panel.classList.toggle('hidden', !shouldShow)
        if (!shouldShow) panel.querySelector('video')?.pause()
      })
    })
  })
}

async function saveWorkoutWeight(groupId, value) {
  const nextValue = String(value || '').trim().slice(0, 40)
  const status = document.querySelector('#weight-status')
  if (status) status.textContent = 'Saving...'
  const { error } = await supabase
    .from('exercises')
    .update({ last_weight: nextValue })
    .eq('exercise_group', groupId)

  if (error) {
    if (status) status.textContent = error.message
    return
  }

  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (group) group.last_weight = nextValue
  if (status) status.textContent = 'Saved'
}

function completeCurrentSet() {
  const group = getCurrentWorkoutGroup()
  if (!group || workoutState.completedGroupIds.includes(group.id)) return

  const previousDone = clamp(Number(workoutState.setsDone[group.id] || 0), 0, group.sets_target)
  const nextDone = Math.min(group.sets_target, previousDone + 1)
  workoutState.setsDone[group.id] = nextDone

  if (nextDone >= group.sets_target) {
    if (!workoutState.completedGroupIds.includes(group.id)) workoutState.completedGroupIds.push(group.id)

    if (workoutState.currentIndex >= activeExerciseGroups.length - 1) {
      saveWorkoutState()
      finishWorkout()
      return
    }

    workoutState.currentIndex += 1
    saveWorkoutState()
    startTimer(true)
    renderWorkout()
    return
  }

  saveWorkoutState()
  startTimer(true)
  renderWorkout()
}

function jumpWorkout(delta) {
  if (!workoutState) return
  workoutState.currentIndex = clamp(workoutState.currentIndex + delta, 0, activeExerciseGroups.length - 1)
  saveWorkoutState()
  renderWorkout()
}

function reopenCurrentExercise() {
  const group = getCurrentWorkoutGroup()
  if (!group) return
  workoutState.completedGroupIds = workoutState.completedGroupIds.filter((id) => id !== group.id)
  workoutState.setsDone[group.id] = Math.max(0, group.sets_target - 1)
  saveWorkoutState()
  renderWorkout()
}

function pauseAndExitWorkout() {
  if (!workoutState) {
    renderFolder(activeExerciseGroups)
    return
  }
  workoutState.status = 'paused'
  saveWorkoutState()
  workoutMode = false
  renderFolder(activeExerciseGroups)
}

function finishWorkout() {
  const total = activeExerciseGroups.length
  clearWorkoutState()
  workoutMode = false
  renderShell(`
    <section class="finish-card">
      <div class="finish-check">&#10003;</div>
      <h2>${escapeHtml(activeFolder.name)} done.</h2>
      <p>${total} exercise${total === 1 ? '' : 's'} complete. No extra logging required.</p>
      <button type="button" class="start-workout-button" id="finish-home">Back to muscles</button>
      <button type="button" class="secondary-button full-button" id="finish-plan">View this workout</button>
    </section>`, { title: 'Workout complete', showAccount: false })

  document.querySelector('#finish-home').addEventListener('click', async () => {
    await loadFolders()
    renderHome()
  })
  document.querySelector('#finish-plan').addEventListener('click', () => renderFolder(activeExerciseGroups))
}

function bindTimerControls() {
  const toggle = document.querySelector('#timer-toggle')
  const panel = document.querySelector('#timer-panel')
  toggle.addEventListener('click', () => {
    panel.classList.toggle('hidden')
    toggle.setAttribute('aria-expanded', String(!panel.classList.contains('hidden')))
  })
  document.querySelector('#timer-start').addEventListener('click', () => {
    if (timerEndAt) pauseTimer()
    else startTimer(false)
  })
  document.querySelector('#timer-reset').addEventListener('click', resetTimer)
}

function getRemainingSeconds() {
  if (!timerEndAt) return timerPausedSeconds
  return Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000))
}

function formatTime(seconds) {
  const safe = clamp(Number.isFinite(seconds) ? seconds : 0, 0, 3599)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function startTimer(forceRestart = false) {
  if (forceRestart) {
    clearTimerInterval()
    timerPausedSeconds = REST_SECONDS
    timerEndAt = null
  }

  if (timerPausedSeconds <= 0) timerPausedSeconds = REST_SECONDS
  timerEndAt = Date.now() + timerPausedSeconds * 1000
  clearTimerInterval()
  timerInterval = window.setInterval(tickTimer, 250)
  persistTimerState()
  updateTimerUI()
}

function pauseTimer() {
  timerPausedSeconds = getRemainingSeconds()
  timerEndAt = null
  clearTimerInterval()
  persistTimerState()
  updateTimerUI()
}

function resetTimer() {
  timerEndAt = null
  timerPausedSeconds = REST_SECONDS
  clearTimerInterval()
  persistTimerState()
  updateTimerUI()
}

function tickTimer() {
  const remaining = getRemainingSeconds()
  if (remaining <= 0) {
    timerEndAt = null
    timerPausedSeconds = 0
    clearTimerInterval()
    persistTimerState()
    tryBeep()
  }
  updateTimerUI()
}

function clearTimerInterval() {
  if (timerInterval) window.clearInterval(timerInterval)
  timerInterval = null
}

function updateTimerUI() {
  const remaining = getRemainingSeconds()
  const mini = document.querySelector('#timer-mini')
  const value = document.querySelector('#timer-value')
  const start = document.querySelector('#timer-start')
  if (!mini || !value || !start) return

  if (remaining <= 0) {
    mini.textContent = 'Done'
    value.textContent = 'DONE'
    start.textContent = 'Again'
    return
  }

  const text = formatTime(remaining)
  mini.textContent = text
  value.textContent = text
  start.textContent = timerEndAt ? 'Pause' : (remaining === REST_SECONDS ? 'Start' : 'Resume')
}

function tryBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 740
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.35)
  } catch {
    // Timer still works if audio is blocked.
  }
}

async function boot() {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser = session?.user || null

  if (!currentUser) {
    renderLogin()
  } else {
    try {
      restoreTimerState()
      await loadFolders()
      const saved = readWorkoutState()
      const resumableFolder = saved && folders.find((folder) => folder.id === saved.folderId)
      const shouldAutoResume = resumableFolder && saved.status === 'active' && (Date.now() - saved.updatedAt) < AUTO_RESUME_WINDOW_MS
      if (shouldAutoResume) {
        await openFolder(resumableFolder.id, { mode: 'workout' })
      } else {
        if (saved?.status === 'active') {
          saved.status = 'paused'
          saveWorkoutState(saved)
        }
        renderHome()
      }
    } catch (error) {
      renderHome(error.message)
    }
  }

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    window.setTimeout(() => handleSessionChange(nextSession), 0)
  })
}

async function handleSessionChange(session) {
  const nextUser = session?.user || null
  if (nextUser?.id === currentUser?.id) return
  currentUser = nextUser
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  workoutState = null
  clearTimerInterval()
  timerEndAt = null
  timerPausedSeconds = REST_SECONDS

  if (!currentUser) {
    renderLogin()
    return
  }

  try {
    restoreTimerState()
    await loadFolders()
    renderHome()
  } catch (error) {
    renderHome(error.message)
  }
}

boot()
