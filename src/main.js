import { createClient } from '@supabase/supabase-js'
import * as tus from 'tus-js-client'
import { Zip, ZipPassThrough, strToU8 } from 'fflate'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const VIDEO_BUCKET = 'gym-videos'
const DEFAULT_FOLDERS = ['Shoulders', 'Legs', 'Back', 'Chest', 'Biceps', 'Triceps']
const MOTIVATION_FOLDER_NAME = '__motivation__'
const THEME_STORAGE_KEY = 'battle-angel-theme'
const REST_SECONDS = 150
const MAX_VIDEOS_PER_EXERCISE = 3
const STANDARD_UPLOAD_MAX_BYTES = 6 * 1024 * 1024
const SUPABASE_FREE_MAX_BYTES = 50 * 1024 * 1024
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm'])
const AUTO_RESUME_WINDOW_MS = 12 * 60 * 60 * 1000
const STALE_WORKOUT_MS = 72 * 60 * 60 * 1000
const OFFLINE_DB_NAME = 'battle-angel-offline'
const OFFLINE_DB_STORE = 'videos'

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
let motivationFolder = null
let motivationVideos = []
let activeFolder = null
let activeExerciseGroups = []
let workoutMode = false
let folderEditMode = false
let workoutState = null
let timerEndAt = null
let timerPausedSeconds = REST_SECONDS
let timerInterval = null
let restMotivationId = null
let cloudProgressQueue = Promise.resolve()
let cloudProgressAvailable = true
let scheduleEntries = []
let scheduleAvailable = true
let plannerMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
let plannerSelectedDate = null
let weeklyPlanEntries = []
let workoutHistory = []
let weeklyPlanAvailable = true
let historyAvailable = true
let planningUpgradeAvailable = true
let plannerStatusMessage = ''
let offlineObjectUrls = []

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char])
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromKey(key) {
  const match = String(key || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return new Date()
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function todayDateKey() {
  return formatLocalDateKey(new Date())
}

function addDaysKey(key, amount) {
  const date = dateFromKey(key)
  date.setDate(date.getDate() + Number(amount || 0))
  return formatLocalDateKey(date)
}

function formatPlanDate(key, options = {}) {
  const date = dateFromKey(key)
  return new Intl.DateTimeFormat(undefined, {
    weekday: options.short ? 'short' : 'long',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date)
}

function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', next === 'dark' ? '#0d0f10' : '#f5f5f2')
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Theme still applies for the current page if storage is unavailable.
  }
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark')
  const button = document.querySelector('#theme-toggle')
  if (button) button.textContent = getTheme() === 'dark' ? 'Light mode' : 'Dark mode'
}

function cleanFileName(name) {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Exercise'
}

function fileExtension(name = '') {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  return match?.[1] || ''
}

function isVideoFile(file) {
  if (!file) return false
  if (String(file.type || '').toLowerCase().startsWith('video/')) return true
  return VIDEO_EXTENSIONS.has(fileExtension(file.name))
}

function inferVideoMime(file) {
  const supplied = String(file?.type || '').toLowerCase()
  if (supplied.startsWith('video/')) return supplied

  const extension = fileExtension(file?.name)
  if (extension === 'mov') return 'video/quicktime'
  if (extension === 'm4v') return 'video/x-m4v'
  if (extension === 'webm') return 'video/webm'
  return 'video/mp4'
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

function getVideoFiles(fileList, limit = MAX_VIDEOS_PER_EXERCISE) {
  return [...(fileList || [])].filter(isVideoFile).slice(0, limit)
}

function safeObjectName(name) {
  const ext = fileExtension(name)
  return `${crypto.randomUUID()}.${VIDEO_EXTENSIONS.has(ext) ? ext : 'mp4'}`
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

function normalizeWorkoutStateValue(value, fallbackUpdatedAt = Date.now()) {
  if (!value || typeof value.folderId !== 'string') return null
  return {
    folderId: value.folderId,
    currentIndex: Math.max(0, Number.parseInt(value.currentIndex, 10) || 0),
    setsDone: value.setsDone && typeof value.setsDone === 'object' && !Array.isArray(value.setsDone) ? value.setsDone : {},
    completedGroupIds: Array.isArray(value.completedGroupIds) ? value.completedGroupIds : [],
    backupGroupIds: Array.isArray(value.backupGroupIds) ? value.backupGroupIds : [],
    status: value.status === 'paused' ? 'paused' : 'active',
    updatedAt: Number(value.updatedAt || fallbackUpdatedAt)
  }
}

function readWorkoutState() {
  if (!currentUser) return null
  try {
    const raw = window.localStorage.getItem(workoutStorageKey())
    if (!raw) return null
    const parsed = normalizeWorkoutStateValue(JSON.parse(raw))
    if (!parsed) return null
    if (Date.now() - parsed.updatedAt > STALE_WORKOUT_MS) {
      window.localStorage.removeItem(workoutStorageKey())
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeLocalWorkoutState(state) {
  if (!currentUser || !state) return
  try {
    window.localStorage.setItem(workoutStorageKey(), JSON.stringify(state))
  } catch {
    // Cloud sync still protects workout progress if local storage is unavailable.
  }
}

function isMissingProgressTableError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('workout_progress') && text.includes('not') && text.includes('find')
}

function isMissingScheduleTableError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('workout_schedule') && text.includes('not') && text.includes('find')
}

function isMissingPlanningUpgradeError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('workout_weekly_plan') || text.includes('workout_history') || text.includes('is_skipped') || text.includes('backup_group_ids')
}

async function loadSchedule() {
  scheduleEntries = []
  weeklyPlanEntries = []
  workoutHistory = []
  if (!currentUser || !scheduleAvailable) return

  let scheduleResult = await supabase
    .from('workout_schedule')
    .select('id,workout_date,folder_id,is_skipped,created_at,updated_at')
    .order('workout_date', { ascending: true })

  if (scheduleResult.error && isMissingPlanningUpgradeError(scheduleResult.error)) {
    planningUpgradeAvailable = false
    scheduleResult = await supabase
      .from('workout_schedule')
      .select('id,workout_date,folder_id,created_at,updated_at')
      .order('workout_date', { ascending: true })
  }

  if (scheduleResult.error) {
    if (isMissingScheduleTableError(scheduleResult.error)) {
      scheduleAvailable = false
      return
    }
    throw scheduleResult.error
  }

  scheduleEntries = (scheduleResult.data || []).map((entry) => ({ ...entry, is_skipped: Boolean(entry.is_skipped) }))

  if (planningUpgradeAvailable && weeklyPlanAvailable) {
    const { data, error } = await supabase
      .from('workout_weekly_plan')
      .select('id,weekday,folder_id,created_at,updated_at')
      .order('weekday', { ascending: true })
    if (error) {
      if (isMissingPlanningUpgradeError(error)) {
        weeklyPlanAvailable = false
        planningUpgradeAvailable = false
      } else throw error
    } else weeklyPlanEntries = data || []
  }

  if (planningUpgradeAvailable && historyAvailable) {
    const since = addDaysKey(todayDateKey(), -35)
    const { data, error } = await supabase
      .from('workout_history')
      .select('id,workout_date,folder_id,completed_at')
      .gte('workout_date', since)
      .order('workout_date', { ascending: false })
    if (error) {
      if (isMissingPlanningUpgradeError(error)) {
        historyAvailable = false
        planningUpgradeAvailable = false
      } else throw error
    } else workoutHistory = data || []
  }
}

function getScheduleEntry(dateKey) {
  return scheduleEntries.find((entry) => entry.workout_date === dateKey) || null
}

function getWeeklyPlanEntry(dateKey) {
  const weekday = dateFromKey(dateKey).getDay()
  return weeklyPlanEntries.find((entry) => Number(entry.weekday) === weekday) || null
}

function getWeeklyFolder(dateKey) {
  const entry = getWeeklyPlanEntry(dateKey)
  return entry ? folders.find((folder) => folder.id === entry.folder_id) || null : null
}

function getScheduledFolder(dateKey) {
  const entry = getScheduleEntry(dateKey)
  if (entry) {
    if (entry.is_skipped) return null
    return folders.find((folder) => folder.id === entry.folder_id) || null
  }
  return getWeeklyFolder(dateKey)
}

function wasWorkoutCompleted(dateKey, folderId) {
  return workoutHistory.some((entry) => entry.workout_date === dateKey && entry.folder_id === folderId)
}

function getMissedYesterdayFolder() {
  if (!historyAvailable || !planningUpgradeAvailable || getScheduledFolder(todayDateKey())) return null
  const yesterday = addDaysKey(todayDateKey(), -1)
  const folder = getScheduledFolder(yesterday)
  if (!folder || wasWorkoutCompleted(yesterday, folder.id)) return null
  return folder
}

function queueCloudProgress(task) {
  if (!currentUser || !cloudProgressAvailable) return
  cloudProgressQueue = cloudProgressQueue
    .catch(() => {})
    .then(async () => {
      try {
        await task()
      } catch (error) {
        console.warn('Workout cloud sync failed:', error)
      }
    })
}

async function upsertCloudWorkoutState(state) {
  if (!currentUser || !state || !cloudProgressAvailable) return
  const snapshot = normalizeWorkoutStateValue(state)
  if (!snapshot) return
  const { error } = await supabase.from('workout_progress').upsert({
    user_id: currentUser.id,
    folder_id: snapshot.folderId,
    current_index: snapshot.currentIndex,
    sets_done: snapshot.setsDone,
    completed_group_ids: snapshot.completedGroupIds,
    backup_group_ids: snapshot.backupGroupIds,
    status: snapshot.status,
    updated_at: new Date(snapshot.updatedAt).toISOString()
  }, { onConflict: 'user_id' })

  if (error) {
    if (isMissingProgressTableError(error)) cloudProgressAvailable = false
    throw error
  }
}

async function fetchCloudWorkoutState() {
  if (!currentUser || !cloudProgressAvailable) return null
  const { data, error } = await supabase
    .from('workout_progress')
    .select('folder_id,current_index,sets_done,completed_group_ids,backup_group_ids,status,updated_at')
    .eq('user_id', currentUser.id)
    .maybeSingle()

  if (error) {
    if (isMissingProgressTableError(error)) {
      cloudProgressAvailable = false
      console.warn('Cloud workout progress is not enabled yet. Run the latest supabase/schema.sql.')
      return null
    }
    throw error
  }
  if (!data) return null

  const normalized = normalizeWorkoutStateValue({
    folderId: data.folder_id,
    currentIndex: data.current_index,
    setsDone: data.sets_done,
    completedGroupIds: data.completed_group_ids,
    backupGroupIds: data.backup_group_ids,
    status: data.status,
    updatedAt: Date.parse(data.updated_at) || Date.now()
  })

  if (normalized && Date.now() - normalized.updatedAt > STALE_WORKOUT_MS) {
    queueCloudProgress(async () => {
      const { error: deleteError } = await supabase.from('workout_progress').delete().eq('user_id', currentUser.id)
      if (deleteError) throw deleteError
    })
    return null
  }
  return normalized
}

async function syncWorkoutStateFromCloud() {
  const local = readWorkoutState()
  let cloud = null
  try {
    cloud = await fetchCloudWorkoutState()
  } catch (error) {
    console.warn('Could not read workout progress from cloud:', error)
  }

  const best = !cloud ? local : !local ? cloud : (cloud.updatedAt >= local.updatedAt ? cloud : local)
  workoutState = best || null
  if (best) writeLocalWorkoutState(best)

  if (local && (!cloud || local.updatedAt > cloud.updatedAt)) {
    const snapshot = typeof structuredClone === 'function' ? structuredClone(local) : JSON.parse(JSON.stringify(local))
    queueCloudProgress(() => upsertCloudWorkoutState(snapshot))
  }
  return best
}

function saveWorkoutState(nextState = workoutState) {
  if (!currentUser || !nextState) return
  const normalized = normalizeWorkoutStateValue(nextState)
  if (!normalized) return
  normalized.updatedAt = Date.now()
  workoutState = normalized
  writeLocalWorkoutState(normalized)
  const snapshot = typeof structuredClone === 'function'
    ? structuredClone(normalized)
    : JSON.parse(JSON.stringify(normalized))
  queueCloudProgress(() => upsertCloudWorkoutState(snapshot))
}

function clearWorkoutState() {
  workoutState = null
  if (!currentUser) return
  try {
    window.localStorage.removeItem(workoutStorageKey())
  } catch {
    // Ignore storage failures.
  }
  queueCloudProgress(async () => {
    const { error } = await supabase.from('workout_progress').delete().eq('user_id', currentUser.id)
    if (error) {
      if (isMissingProgressTableError(error)) cloudProgressAvailable = false
      else throw error
    }
  })
}

function restoreTimerState() {
  if (!currentUser) return
  try {
    const raw = window.localStorage.getItem(timerStorageKey())
    if (!raw) return
    const saved = JSON.parse(raw)
    restMotivationId = typeof saved.motivationId === 'string' ? saved.motivationId : null
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
      pausedSeconds: getRemainingSeconds(),
      motivationId: restMotivationId
    }))
  } catch {
    // Ignore storage failures.
  }
}


function safeBackupSegment(value, fallback = 'item') {
  const cleaned = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._ -]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  return cleaned || fallback
}

function padOrder(value) {
  return String(Math.max(1, Number.parseInt(value, 10) || 1)).padStart(2, '0')
}

function addZipBytes(zip, filename, bytes) {
  const entry = new ZipPassThrough(filename)
  zip.add(entry)
  entry.push(bytes, true)
}

function buildBackupVideoName(row, foldersById) {
  const folder = foldersById.get(row.folder_id)
  if (folder?.name === MOTIVATION_FOLDER_NAME) {
    const extension = VIDEO_EXTENSIONS.has(fileExtension(row.video_path)) ? fileExtension(row.video_path) : 'mp4'
    return `videos/motivation/${padOrder(row.sort_order)}-${safeBackupSegment(row.name, 'motivation')}.${extension}`
  }
  const folderName = safeBackupSegment(folder?.name, 'folder')
  const exerciseName = safeBackupSegment(row.name, 'exercise')
  const groupSuffix = String(row.exercise_group || row.id || '').slice(0, 8)
  const extension = VIDEO_EXTENSIONS.has(fileExtension(row.video_path)) ? fileExtension(row.video_path) : 'mp4'
  return `videos/${padOrder(folder?.sort_order)}-${folderName}/${padOrder(row.sort_order)}-${exerciseName}-${groupSuffix}/reference-${Math.max(1, Number(row.video_order) || 1)}.${extension}`
}

async function downloadFullBackup() {
  const button = document.querySelector('#backup-library')
  const status = document.querySelector('#backup-status')
  if (!button || !status || !currentUser) return

  const originalLabel = button.textContent
  button.disabled = true
  button.textContent = 'Backing up...'
  status.textContent = 'Preparing your plan and videos. Keep battle angel open.'

  try {
    const [folderResult, exerciseResult] = await Promise.all([
      supabase.from('folders').select('id,name,sort_order,created_at').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('exercises').select('id,folder_id,exercise_group,name,video_path,sort_order,video_order,created_at,sets_target,reps_target,last_weight,cue_1,cue_2,cue_3,backup_exercise').order('sort_order', { ascending: true }).order('video_order', { ascending: true })
    ])
    if (folderResult.error) throw folderResult.error
    if (exerciseResult.error) throw exerciseResult.error

    const folderRows = folderResult.data || []
    const exerciseRows = exerciseResult.data || []
    const foldersById = new Map(folderRows.map((folder) => [folder.id, folder]))
    const manifestRows = exerciseRows.map((row) => ({
      ...row,
      backup_file: buildBackupVideoName(row, foldersById)
    }))
    const motivationFolderIds = new Set(folderRows.filter((folder) => folder.name === MOTIVATION_FOLDER_NAME).map((folder) => folder.id))
    const workoutRows = manifestRows.filter((row) => !motivationFolderIds.has(row.folder_id))
    const motivationRows = manifestRows.filter((row) => motivationFolderIds.has(row.folder_id))
    let scheduleRows = []
    if (scheduleAvailable) {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('workout_schedule')
        .select('id,workout_date,folder_id,is_skipped,created_at,updated_at')
        .order('workout_date', { ascending: true })
      if (!scheduleError) scheduleRows = scheduleData || []
    }

    let weeklyPlanRows = []
    let historyRows = []
    if (planningUpgradeAvailable) {
      const [weeklyResult, historyResult] = await Promise.all([
        supabase.from('workout_weekly_plan').select('id,weekday,folder_id,created_at,updated_at').order('weekday', { ascending: true }),
        supabase.from('workout_history').select('id,workout_date,folder_id,completed_at').order('workout_date', { ascending: true })
      ])
      if (!weeklyResult.error) weeklyPlanRows = weeklyResult.data || []
      if (!historyResult.error) historyRows = historyResult.data || []
    }

    const manifest = {
      format: 'battle-angel-backup',
      version: 4,
      exported_at: new Date().toISOString(),
      account_email: currentUser.email || '',
      folders: folderRows.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME),
      exercises: workoutRows,
      motivation_videos: motivationRows,
      schedule: scheduleRows,
      weekly_plan: weeklyPlanRows,
      history: historyRows
    }

    const chunks = []
    let zipResolve
    let zipReject
    const zipFinished = new Promise((resolve, reject) => {
      zipResolve = resolve
      zipReject = reject
    })
    const zip = new Zip((error, data, final) => {
      if (error) {
        zipReject(error)
        return
      }
      chunks.push(data)
      if (final) zipResolve(new Blob(chunks, { type: 'application/zip' }))
    })

    addZipBytes(zip, 'battle-angel-backup.json', strToU8(JSON.stringify(manifest, null, 2)))

    for (let index = 0; index < manifestRows.length; index += 1) {
      const row = manifestRows[index]
      status.textContent = `Backing up video ${index + 1} of ${manifestRows.length}...`
      const { data: videoBlob, error: videoError } = await supabase.storage.from(VIDEO_BUCKET).download(row.video_path)
      if (videoError) throw new Error(`Could not back up ${row.name}: ${videoError.message}`)
      const bytes = new Uint8Array(await videoBlob.arrayBuffer())
      addZipBytes(zip, row.backup_file, bytes)
    }

    zip.end()
    const blob = await zipFinished
    const date = new Date().toISOString().slice(0, 10)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `battle-angel-backup-${date}.zip`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    status.textContent = `Backup ready: plan + ${manifestRows.length} video${manifestRows.length === 1 ? '' : 's'}. Save the ZIP somewhere safe.`
  } catch (error) {
    console.error(error)
    status.textContent = `Backup failed: ${error.message || 'Please try again.'}`
  } finally {
    button.disabled = false
    button.textContent = originalLabel
  }
}

function renderLogin(message = '') {
  workoutMode = false
  app.innerHTML = `
    <main class="shell login-wrap">
      <section class="login-card" aria-labelledby="login-title">
        <div class="brand-name">battle angel</div>
        <div class="brand-slogan">a warrior's spirit needs a warrior's body</div>
        <h1 id="login-title">Open. Train. Done.</h1>
        <p>Sign in once on this phone. battle angel keeps you signed in so your normal gym flow stays friction-free.</p>
        <form class="login-form" id="login-form">
          <label for="email" class="eyebrow">EMAIL</label>
          <input id="email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required placeholder="you@example.com" />
          <label for="password" class="eyebrow">PASSWORD</label>
          <input id="password" type="password" autocomplete="current-password" required minlength="6" placeholder="your battle angel password" />
          <button class="primary-button" type="submit">Sign in</button>
        </form>
        <div id="login-status" class="status-line" aria-live="polite">${escapeHtml(message)}</div>
      </section>
    </main>`

  const form = document.querySelector('#login-form')
  const status = document.querySelector('#login-status')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = document.querySelector('#email').value.trim()
    const password = document.querySelector('#password').value
    const button = form.querySelector('button')
    button.disabled = true
    button.textContent = 'Signing in...'
    status.textContent = ''

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const friendly = error.message.toLowerCase().includes('invalid login credentials')
        ? 'Email or password is incorrect.'
        : error.message
      status.textContent = friendly
      button.disabled = false
      button.textContent = 'Sign in'
      return
    }

    button.textContent = 'opening battle angel...'
  })
}

async function ensureDefaultFolders() {
  let { data, error } = await supabase
    .from('folders')
    .select('id,name,sort_order,created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const visibleFolders = data.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME)

  if (!visibleFolders.length) {
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

async function ensureMotivationFolder(existingFolders = []) {
  const existing = existingFolders.find((folder) => folder.name === MOTIVATION_FOLDER_NAME)
  if (existing) return existing

  const { data: found, error: findError } = await supabase
    .from('folders')
    .select('id,name,sort_order,created_at')
    .eq('name', MOTIVATION_FOLDER_NAME)
    .maybeSingle()
  if (findError) throw findError
  if (found) return found

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: currentUser.id,
      name: MOTIVATION_FOLDER_NAME,
      sort_order: 9999
    })
    .select('id,name,sort_order,created_at')
    .single()

  if (error) throw error
  return data
}

async function loadMotivationVideos() {
  motivationVideos = []
  if (!motivationFolder) return

  const { data: rows, error } = await supabase
    .from('exercises')
    .select('id,name,video_path,sort_order,created_at')
    .eq('folder_id', motivationFolder.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!rows.length) return

  const { data: signed, error: signError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .createSignedUrls(rows.map((row) => row.video_path), 60 * 60 * 12)

  if (signError) throw signError
  motivationVideos = rows.map((row, index) => ({
    ...row,
    signedUrl: signed[index]?.signedUrl || ''
  }))
}

async function loadFolders() {
  const allFolders = await ensureDefaultFolders()
  motivationFolder = await ensureMotivationFolder(allFolders)
  folders = allFolders.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME)
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

  await Promise.all([loadMotivationVideos(), loadSchedule()])
}

function getRestMotivationVideo() {
  if (!motivationVideos.length) return null
  return motivationVideos.find((video) => video.id === restMotivationId) || motivationVideos[0]
}

function chooseMotivationForNewRest() {
  if (!motivationVideos.length) {
    restMotivationId = null
    return null
  }

  const currentIndex = motivationVideos.findIndex((video) => video.id === restMotivationId)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % motivationVideos.length
  restMotivationId = motivationVideos[nextIndex].id
  return motivationVideos[nextIndex]
}

function renderRestMotivationPlayer() {
  const video = getRestMotivationVideo()
  if (!video) return ''

  return `
    <div class="rest-motivation" id="rest-motivation">
      <div class="rest-motivation-label">
        <span>motivation</span>
        <span>${escapeHtml(video.name)}</span>
      </div>
      <video id="rest-motivation-video" playsinline webkit-playsinline preload="metadata" loop src="${escapeHtml(video.signedUrl)}" aria-label="Motivation video: ${escapeHtml(video.name)}"></video>
      <button type="button" id="motivation-play-fallback" class="motivation-play-fallback hidden">Play motivation</button>
    </div>`
}

function stopRestMotivationPlayback(resetToStart = false) {
  const video = document.querySelector('#rest-motivation-video')
  if (!video) return
  video.pause()
  if (resetToStart) {
    try {
      video.currentTime = 0
    } catch {
      // Ignore browsers that do not allow seeking before metadata loads.
    }
  }
}

function syncRestMotivationPlayback() {
  const video = document.querySelector('#rest-motivation-video')
  const fallback = document.querySelector('#motivation-play-fallback')
  if (!video) return

  if (fallback) {
    fallback.addEventListener('click', () => {
      const result = video.play()
      if (result?.then) result.then(() => fallback.classList.add('hidden')).catch(() => {})
    })
  }

  if (!timerEndAt) {
    video.pause()
    return
  }

  const panel = document.querySelector('#timer-panel')
  const toggle = document.querySelector('#timer-toggle')
  panel?.classList.remove('hidden')
  toggle?.setAttribute('aria-expanded', 'true')

  video.loop = true
  video.muted = false
  const result = video.play()
  if (result?.catch) {
    result.catch(() => fallback?.classList.remove('hidden'))
  }
}

function renderBottomNav(activeTab) {
  const tabs = [
    ['today', 'Today'],
    ['workouts', 'Workouts'],
    ['plan', 'Plan'],
    ['more', 'More']
  ]
  return `<nav class="bottom-nav" aria-label="Main navigation">${tabs.map(([id, label]) => `
    <button type="button" class="bottom-nav-button ${activeTab === id ? 'active' : ''}" data-nav-tab="${id}" aria-current="${activeTab === id ? 'page' : 'false'}">${label}</button>`).join('')}</nav>`
}

function bindBottomNav() {
  document.querySelectorAll('[data-nav-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.navTab
      if (tab === 'today') renderHome()
      if (tab === 'workouts') renderWorkouts()
      if (tab === 'plan') {
        plannerMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        plannerSelectedDate = plannerSelectedDate || todayDateKey()
        renderPlanner()
      }
      if (tab === 'more') renderMore()
    })
  })
}

function renderShell(content, options = {}) {
  const title = options.title || (activeFolder ? activeFolder.name : 'Today')
  const showAccount = options.showAccount !== false
  const showTimer = options.showTimer !== false
  app.innerHTML = `
    <main class="shell ${workoutMode ? 'workout-shell' : ''} ${options.navTab ? 'has-bottom-nav' : ''}">
      <header class="topbar">
        <div class="topbar-title">
          <div class="brand-name brand-name-compact">battle angel</div>
          <h1 id="page-title">${escapeHtml(title)}</h1>
        </div>
        ${showTimer ? `<div class="topbar-actions">
          <button type="button" id="timer-toggle" class="timer-chip" aria-expanded="${timerEndAt ? 'true' : 'false'}">rest <span id="timer-mini">2:30</span></button>
        </div>` : ''}
      </header>
      ${showTimer ? `<section id="timer-panel" class="timer-panel ${timerEndAt ? '' : 'hidden'}" aria-label="Rest timer">
        <div class="timer-row">
          <div>
            <div class="timer-label">REST</div>
            <div id="timer-value" class="timer-value" aria-live="polite">2:30</div>
          </div>
          <div class="timer-actions">
            <button type="button" id="timer-start" class="primary-button">Start</button>
            <button type="button" id="timer-reset" class="secondary-button">Reset</button>
          </div>
        </div>
        ${renderRestMotivationPlayer()}
      </section>` : ''}
      <div id="main-content">${content}</div>
      ${showAccount ? `<details class="account-menu">
        <summary>More</summary>
        <div class="account-panel">
          <div class="account-email">${escapeHtml(currentUser?.email || '')}</div>
          <div class="account-actions">
            <button type="button" class="secondary-button" id="theme-toggle">${getTheme() === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            <button type="button" class="secondary-button" id="backup-library">Backup</button>
            <button type="button" class="secondary-button" id="sign-out">Sign out</button>
          </div>
          <div id="backup-status" class="status-line backup-status" aria-live="polite"></div>
        </div>
      </details>` : ''}
      ${options.navTab ? renderBottomNav(options.navTab) : ''}
    </main>`
  if (showTimer) {
    bindTimerControls()
    updateTimerUI()
    syncRestMotivationPlayback()
  }
  if (showAccount) {
    document.querySelector('#theme-toggle')?.addEventListener('click', toggleTheme)
    const signOut = document.querySelector('#sign-out')
    if (signOut) signOut.addEventListener('click', () => supabase.auth.signOut())
    const backup = document.querySelector('#backup-library')
    if (backup) backup.addEventListener('click', downloadFullBackup)
  }
  if (options.navTab) bindBottomNav()
}

function getSavedWorkoutForFolder(folderId) {
  const saved = workoutState || readWorkoutState()
  return saved?.folderId === folderId ? saved : null
}

function renderMotivationLibrary() {
  const items = motivationVideos.map((video) => `
    <article class="motivation-item">
      <video controls playsinline webkit-playsinline preload="metadata" src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(video.name)}"></video>
      <div class="motivation-item-row">
        <div class="motivation-item-name">${escapeHtml(video.name)}</div>
        <button type="button" class="text-button danger-text motivation-remove" data-remove-motivation="${video.id}" data-motivation-path="${escapeHtml(video.video_path)}">Remove</button>
      </div>
    </article>`).join('')

  return `
    <details class="motivation-library">
      <summary>
        <span>Edit motivation</span>
        <span class="motivation-count">${motivationVideos.length}</span>
      </summary>
      <div class="motivation-editor-body">
        <label class="file-picker motivation-picker">
          <span class="file-picker-button">Add videos</span>
          <span class="picked-files">Photos or Files</span>
          <input id="motivation-videos" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" multiple aria-label="Choose motivation videos" />
        </label>
        <div id="motivation-status" class="status-line motivation-status" aria-live="polite"></div>
        ${items ? `<div class="motivation-list">${items}</div>` : ''}
      </div>
    </details>`
}

function renderHome(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false

  const saved = workoutState || readWorkoutState()
  const savedFolder = saved ? folders.find((folder) => folder.id === saved.folderId) : null
  const todayKey = todayDateKey()
  const todayFolder = getScheduledFolder(todayKey)
  const todaySaved = todayFolder && saved?.folderId === todayFolder.id
  const missedFolder = savedFolder ? null : getMissedYesterdayFolder()

  const resumeCard = savedFolder && (!todayFolder || savedFolder.id !== todayFolder.id) ? `
    <button type="button" class="resume-home" id="resume-home">
      <span>Resume</span>
      <strong>${escapeHtml(savedFolder.name)}</strong>
    </button>` : ''

  const todayCard = `
    <section class="today-card">
      <div class="today-label">Today</div>
      ${todayFolder ? `
        <div class="today-workout">${escapeHtml(todayFolder.name)}</div>
        <button type="button" class="start-workout-button today-start" id="start-today">${todaySaved ? 'Resume workout' : 'Start workout'}</button>
        <button type="button" class="quiet-action" id="preload-today">Save videos</button>
        <div id="preload-status" class="micro-status" aria-live="polite"></div>` : `
        <div class="today-empty">No workout planned</div>
        <button type="button" class="secondary-button full-button today-choose" id="choose-workout">Choose workout</button>`}
    </section>`

  const missedCard = missedFolder ? `
    <button type="button" class="missed-card" id="move-missed-today">
      <span>Missed yesterday</span>
      <strong>${escapeHtml(missedFolder.name)}</strong>
      <small>Move to today</small>
    </button>` : ''

  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${resumeCard}
    ${todayCard}
    ${missedCard}`, { title: 'Today', showAccount: false, showTimer: false, navTab: 'today' })

  document.querySelector('#start-today')?.addEventListener('click', () => openFolder(todayFolder.id, { mode: 'workout' }))
  document.querySelector('#resume-home')?.addEventListener('click', () => openFolder(savedFolder.id, { mode: 'workout' }))
  document.querySelector('#choose-workout')?.addEventListener('click', renderWorkouts)
  document.querySelector('#move-missed-today')?.addEventListener('click', moveMissedToToday)
  document.querySelector('#preload-today')?.addEventListener('click', () => preloadFolderVideos(todayFolder.id))
}

function renderWorkouts(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false
  const saved = workoutState || readWorkoutState()
  const cards = folders.map((folder) => `
    <button type="button" class="folder-card" data-folder-id="${folder.id}">
      <span class="folder-name">${escapeHtml(folder.name)}</span>
      ${saved?.folderId === folder.id ? '<span class="resume-dot">resume</span>' : ''}
    </button>`).join('')

  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    <section class="folder-grid" aria-label="Workouts">${cards}</section>
    <details class="add-folder compact-editor">
      <summary>Edit muscles</summary>
      <form id="add-folder-form">
        <input id="folder-name" type="text" maxlength="28" required placeholder="Add a muscle" aria-label="Folder name" />
        <button class="primary-button" type="submit">Add</button>
      </form>
      <div id="folder-status" class="status-line inline-status" aria-live="polite"></div>
    </details>`, { title: 'Workouts', showAccount: false, showTimer: false, navTab: 'workouts' })

  document.querySelectorAll('[data-folder-id]').forEach((button) => {
    button.addEventListener('click', () => openFolder(button.dataset.folderId))
  })
  document.querySelector('#add-folder-form')?.addEventListener('submit', addFolder)
}

function renderMore(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false
  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${renderMotivationLibrary()}
    <section class="more-card">
      <button type="button" class="secondary-button full-button" id="theme-toggle">${getTheme() === 'dark' ? 'Light mode' : 'Dark mode'}</button>
      <button type="button" class="secondary-button full-button" id="backup-library">Backup library</button>
      <button type="button" class="secondary-button full-button" id="sign-out">Sign out</button>
      <div id="backup-status" class="status-line backup-status" aria-live="polite"></div>
    </section>`, { title: 'More', showAccount: false, showTimer: false, navTab: 'more' })

  document.querySelector('#theme-toggle')?.addEventListener('click', () => { toggleTheme(); renderMore() })
  document.querySelector('#backup-library')?.addEventListener('click', downloadFullBackup)
  document.querySelector('#sign-out')?.addEventListener('click', () => supabase.auth.signOut())
  document.querySelector('#motivation-videos')?.addEventListener('change', uploadMotivationVideos)
  document.querySelectorAll('[data-remove-motivation]').forEach((button) => {
    button.addEventListener('click', () => removeMotivationVideo(button.dataset.removeMotivation, button.dataset.motivationPath))
  })
}

function calendarCells(monthStart) {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i += 1) cells.push('<div class="calendar-blank" aria-hidden="true"></div>')

  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day)
    const key = formatLocalDateKey(date)
    const scheduled = getScheduledFolder(key)
    const isToday = key === todayDateKey()
    const selected = key === plannerSelectedDate
    cells.push(`
      <button type="button" class="calendar-day ${isToday ? 'is-today' : ''} ${scheduled ? 'is-planned' : ''} ${selected ? 'is-selected' : ''}" data-plan-date="${key}">
        <span class="calendar-number">${day}</span>
        ${scheduled ? `<span class="calendar-workout">${escapeHtml(scheduled.name)}</span>` : ''}
      </button>`)
  }
  return cells.join('')
}

function renderPlanner(errorMessage = '') {
  workoutMode = false
  activeFolder = null
  activeExerciseGroups = []
  folderEditMode = false
  if (!plannerSelectedDate) plannerSelectedDate = todayDateKey()

  const selectedFolder = getScheduledFolder(plannerSelectedDate)
  const tomorrowKey = addDaysKey(plannerSelectedDate, 1)
  const folderButtons = folders.map((folder) => `
    <button type="button" class="plan-muscle-button ${selectedFolder?.id === folder.id ? 'selected' : ''}" data-schedule-folder="${folder.id}">${escapeHtml(folder.name)}</button>`).join('')

  renderShell(`
    <div class="planner-toolbar">
      <div class="month-nav">
        <button type="button" class="small-button" id="month-prev" aria-label="Previous month">&larr;</button>
        <strong>${escapeHtml(formatMonthTitle(plannerMonthStart))}</strong>
        <button type="button" class="small-button" id="month-next" aria-label="Next month">&rarr;</button>
      </div>
      <button type="button" class="small-button" id="weekly-plan">Weekly</button>
    </div>
    <button type="button" class="quiet-action planner-repeat" id="repeat-last-week">Repeat last week</button>
    ${!scheduleAvailable ? `<div class="notice error">Planning is not enabled yet.</div>` : ''}
    ${!planningUpgradeAvailable ? `<div class="notice info">Run the new planning upgrade SQL once to enable weekly plans and missed-day handling.</div>` : ''}
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${plannerStatusMessage ? `<div class="status-line planner-status">${escapeHtml(plannerStatusMessage)}</div>` : ''}
    <div class="calendar-weekdays" aria-hidden="true">
      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
    </div>
    <div class="calendar-grid" aria-label="Workout calendar">${calendarCells(plannerMonthStart)}</div>
    <section class="plan-day-editor">
      <div class="plan-day-title">${escapeHtml(formatPlanDate(plannerSelectedDate))}</div>
      <div class="plan-muscle-grid">${folderButtons}</div>
      ${selectedFolder ? `<div class="plan-day-actions">
        <details class="move-plan">
          <summary>Move</summary>
          <form id="move-plan-form" class="move-plan-form">
            <input id="move-plan-date" type="date" value="${tomorrowKey}" aria-label="Move workout to date" />
            <button type="submit" class="secondary-button">Move</button>
          </form>
        </details>
        <button type="button" class="text-button danger-text" id="clear-plan">Clear</button>
      </div>` : ''}
    </section>`, { title: 'Plan', showAccount: false, showTimer: false, navTab: 'plan' })

  document.querySelector('#month-prev').addEventListener('click', () => {
    plannerMonthStart = new Date(plannerMonthStart.getFullYear(), plannerMonthStart.getMonth() - 1, 1)
    plannerSelectedDate = formatLocalDateKey(plannerMonthStart)
    plannerStatusMessage = ''
    renderPlanner()
  })
  document.querySelector('#month-next').addEventListener('click', () => {
    plannerMonthStart = new Date(plannerMonthStart.getFullYear(), plannerMonthStart.getMonth() + 1, 1)
    plannerSelectedDate = formatLocalDateKey(plannerMonthStart)
    plannerStatusMessage = ''
    renderPlanner()
  })
  document.querySelector('#weekly-plan')?.addEventListener('click', renderWeeklyPlan)
  document.querySelector('#repeat-last-week')?.addEventListener('click', repeatLastWeek)
  document.querySelectorAll('[data-plan-date]').forEach((button) => {
    button.addEventListener('click', () => {
      plannerSelectedDate = button.dataset.planDate
      plannerStatusMessage = ''
      renderPlanner()
    })
  })
  document.querySelectorAll('[data-schedule-folder]').forEach((button) => {
    button.addEventListener('click', () => saveScheduledWorkout(plannerSelectedDate, button.dataset.scheduleFolder))
  })
  document.querySelector('#clear-plan')?.addEventListener('click', () => clearScheduledWorkout(plannerSelectedDate))
  document.querySelector('#move-plan-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const target = document.querySelector('#move-plan-date').value
    moveScheduledWorkout(plannerSelectedDate, target)
  })
}

function renderWeeklyPlan(errorMessage = '') {
  if (!planningUpgradeAvailable || !weeklyPlanAvailable) {
    plannerStatusMessage = 'Run the planning upgrade SQL once first.'
    renderPlanner()
    return
  }
  const days = [
    [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday']
  ]
  const rows = days.map(([weekday, label]) => {
    const current = weeklyPlanEntries.find((entry) => Number(entry.weekday) === weekday)
    const options = [`<option value="">Rest</option>`, ...folders.map((folder) => `<option value="${folder.id}" ${current?.folder_id === folder.id ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`)].join('')
    return `<label class="weekly-row"><span>${label}</span><select data-weekly-day="${weekday}">${options}</select></label>`
  }).join('')
  renderShell(`
    <button type="button" class="back-button" id="weekly-back">Back</button>
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    <div class="weekly-plan-list">${rows}</div>
    <div id="weekly-status" class="status-line planner-status" aria-live="polite"></div>`, { title: 'Weekly plan', showAccount: false, showTimer: false })
  document.querySelector('#weekly-back').addEventListener('click', renderPlanner)
  document.querySelectorAll('[data-weekly-day]').forEach((select) => {
    select.addEventListener('change', () => saveWeeklyPlanDay(Number(select.dataset.weeklyDay), select.value))
  })
}

async function upsertScheduledWorkout(dateKey, folderId, isSkipped = false) {
  const payload = {
    user_id: currentUser.id,
    workout_date: dateKey,
    folder_id: isSkipped ? null : folderId,
    updated_at: new Date().toISOString()
  }
  if (planningUpgradeAvailable) payload.is_skipped = Boolean(isSkipped)
  const { error } = await supabase.from('workout_schedule').upsert(payload, { onConflict: 'user_id,workout_date' })
  if (error) throw error
}

async function saveScheduledWorkout(dateKey, folderId) {
  if (!scheduleAvailable || !dateKey || !folderId) return
  try {
    await upsertScheduledWorkout(dateKey, folderId, false)
    await loadSchedule()
    plannerStatusMessage = ''
    renderPlanner()
  } catch (error) {
    if (isMissingScheduleTableError(error)) scheduleAvailable = false
    renderPlanner(error.message)
  }
}

async function clearScheduledWorkout(dateKey) {
  if (!scheduleAvailable || !dateKey) return
  try {
    const hasWeekly = Boolean(getWeeklyFolder(dateKey))
    if (hasWeekly && planningUpgradeAvailable) {
      await upsertScheduledWorkout(dateKey, null, true)
    } else {
      const { error } = await supabase.from('workout_schedule').delete().eq('workout_date', dateKey)
      if (error) throw error
    }
    await loadSchedule()
    plannerStatusMessage = ''
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

async function moveScheduledWorkout(fromDate, toDate) {
  if (!scheduleAvailable || !fromDate || !toDate || fromDate === toDate) return
  const sourceFolder = getScheduledFolder(fromDate)
  if (!sourceFolder) return
  const existing = getScheduledFolder(toDate)
  if (existing && existing.id !== sourceFolder.id && !confirm(`${formatPlanDate(toDate, { short: true })} already has a workout. Replace it?`)) return

  try {
    await upsertScheduledWorkout(toDate, sourceFolder.id, false)
    if (planningUpgradeAvailable) await upsertScheduledWorkout(fromDate, null, true)
    else {
      const { error } = await supabase.from('workout_schedule').delete().eq('workout_date', fromDate)
      if (error) throw error
    }
    await loadSchedule()
    plannerSelectedDate = toDate
    plannerMonthStart = new Date(dateFromKey(toDate).getFullYear(), dateFromKey(toDate).getMonth(), 1)
    plannerStatusMessage = ''
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

function startOfWeekKey(dateKey) {
  const date = dateFromKey(dateKey)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return formatLocalDateKey(date)
}

async function repeatLastWeek() {
  if (!scheduleAvailable) return
  const weekStart = startOfWeekKey(plannerSelectedDate || todayDateKey())
  const hasPlans = Array.from({ length: 7 }, (_, i) => getScheduledFolder(addDaysKey(weekStart, i))).some(Boolean)
  if (hasPlans && !confirm('Replace this week with last week?')) return
  try {
    for (let i = 0; i < 7; i += 1) {
      const target = addDaysKey(weekStart, i)
      const source = addDaysKey(target, -7)
      const sourceFolder = getScheduledFolder(source)
      if (sourceFolder) {
        await upsertScheduledWorkout(target, sourceFolder.id, false)
      } else if (planningUpgradeAvailable && getWeeklyFolder(target)) {
        await upsertScheduledWorkout(target, null, true)
      } else {
        const { error } = await supabase.from('workout_schedule').delete().eq('workout_date', target)
        if (error) throw error
      }
    }
    await loadSchedule()
    plannerStatusMessage = 'Last week copied.'
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

async function saveWeeklyPlanDay(weekday, folderId) {
  const status = document.querySelector('#weekly-status')
  if (status) status.textContent = 'Saving...'
  try {
    if (!folderId) {
      const { error } = await supabase.from('workout_weekly_plan').delete().eq('weekday', weekday)
      if (error) throw error
    } else {
      const { error } = await supabase.from('workout_weekly_plan').upsert({
        user_id: currentUser.id,
        weekday,
        folder_id: folderId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,weekday' })
      if (error) throw error
    }
    await loadSchedule()
    if (status) status.textContent = 'Saved'
  } catch (error) {
    if (status) status.textContent = error.message
  }
}

async function moveMissedToToday() {
  const yesterday = addDaysKey(todayDateKey(), -1)
  const folder = getScheduledFolder(yesterday)
  if (!folder) return
  try {
    await upsertScheduledWorkout(todayDateKey(), folder.id, false)
    if (planningUpgradeAvailable) await upsertScheduledWorkout(yesterday, null, true)
    else {
      const { error } = await supabase.from('workout_schedule').delete().eq('workout_date', yesterday)
      if (error) throw error
    }
    await loadSchedule()
    renderHome()
  } catch (error) {
    renderHome(error.message)
  }
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
  renderWorkouts()
}

function openOfflineVideoDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Offline video storage is not supported in this browser.'))
      return
    }
    const request = indexedDB.open(OFFLINE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(OFFLINE_DB_STORE)) db.createObjectStore(OFFLINE_DB_STORE, { keyPath: 'path' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open offline video storage.'))
  })
}

async function getOfflineVideo(path) {
  try {
    const db = await openOfflineVideoDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_DB_STORE, 'readonly')
      const req = tx.objectStore(OFFLINE_DB_STORE).get(path)
      req.onsuccess = () => resolve(req.result?.blob || null)
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

async function putOfflineVideo(path, blob, name = '') {
  const db = await openOfflineVideoDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_DB_STORE, 'readwrite')
    tx.objectStore(OFFLINE_DB_STORE).put({ path, blob, name, storedAt: Date.now() })
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

function revokeOfflineObjectUrls() {
  offlineObjectUrls.forEach((url) => URL.revokeObjectURL(url))
  offlineObjectUrls = []
}

async function preloadFolderVideos(folderId) {
  const button = document.querySelector('#preload-today')
  const status = document.querySelector('#preload-status')
  if (!folderId || !button || !status) return
  button.disabled = true
  status.textContent = 'Preparing...'
  try {
    const { data: rows, error } = await supabase
      .from('exercises')
      .select('name,video_path')
      .eq('folder_id', folderId)
      .order('sort_order', { ascending: true })
      .order('video_order', { ascending: true })
    if (error) throw error
    if (!rows?.length) {
      status.textContent = 'No videos yet.'
      return
    }
    const { data: signed, error: signError } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrls(rows.map((row) => row.video_path), 60 * 60 * 12)
    if (signError) throw signError
    for (let i = 0; i < rows.length; i += 1) {
      const existing = await getOfflineVideo(rows[i].video_path)
      if (existing) {
        status.textContent = `Saving videos ${i + 1}/${rows.length}`
        continue
      }
      status.textContent = `Saving videos ${i + 1}/${rows.length}`
      const response = await fetch(signed[i]?.signedUrl || '')
      if (!response.ok) throw new Error(`Could not save ${rows[i].name}.`)
      const blob = await response.blob()
      await putOfflineVideo(rows[i].video_path, blob, rows[i].name)
    }
    status.textContent = 'Videos ready.'
    button.textContent = 'Videos ready'
  } catch (error) {
    status.textContent = error.message || 'Could not save videos.'
    button.disabled = false
  }
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
  const previousFolderId = activeFolder?.id || null
  activeFolder = folder
  activeExerciseGroups = []
  workoutMode = false
  if (previousFolderId !== folder.id) folderEditMode = Boolean(options.editMode)
  else if (typeof options.editMode === 'boolean') folderEditMode = options.editMode
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

  revokeOfflineObjectUrls()
  const hydratedRows = await Promise.all(rows.map(async (row) => {
    const cachedBlob = await getOfflineVideo(row.video_path)
    if (cachedBlob) {
      const offlineUrl = URL.createObjectURL(cachedBlob)
      offlineObjectUrls.push(offlineUrl)
      return { ...row, signedUrl: offlineUrl, offline: true }
    }
    return { ...row, signedUrl: signedUrlMap[row.video_path], offline: false }
  }))
  activeExerciseGroups = groupExerciseRows(hydratedRows)

  if (options.mode === 'workout' && activeExerciseGroups.length) {
    startOrResumeWorkout({ forceResume: true })
    return
  }

  renderFolder(activeExerciseGroups)
}

function renderFolderLoading() {
  renderShell(`<div class="notice info">Loading...</div>`, { showAccount: false, showTimer: false })
}

function renderCueChips(group) {
  const cues = [group.cue_1, group.cue_2, group.cue_3].filter(Boolean)
  if (!cues.length) return ''
  return `<div class="cue-list">${cues.map((cue) => `<span class="cue-chip">${escapeHtml(cue)}</span>`).join('')}</div>`
}

function renderPlanCard(group, index, total, editing = false) {
  if (!editing) {
    return `
      <article class="exercise-card compact-plan-card" data-exercise-group="${group.id}">
        <div class="exercise-heading">
          <div class="exercise-number">${index + 1}</div>
          <div class="exercise-name-wrap">
            <div class="exercise-name">${escapeHtml(group.name)}</div>
            <div class="exercise-prescription">${group.sets_target} x ${escapeHtml(group.reps_target)}${group.last_weight ? ` &middot; ${escapeHtml(group.last_weight)}` : ''}</div>
          </div>
        </div>
      </article>`
  }

  const videos = group.videos.map((video, videoIndex) => `
    <div class="reference-video">
      <div class="reference-label">Reference ${videoIndex + 1}</div>
      <video controls playsinline webkit-playsinline preload="metadata" src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(group.name)} reference ${videoIndex + 1}"></video>
      ${group.videos.length > 1 ? `<button type="button" class="text-button danger-text" data-remove-video="${video.id}" data-video-path="${escapeHtml(video.video_path)}" data-video-group="${group.id}">Remove video</button>` : ''}
    </div>`).join('')

  const canAddVideo = group.videos.length < MAX_VIDEOS_PER_EXERCISE
  const nextReferenceNumber = group.videos.length + 1

  return `
    <article class="exercise-card plan-card" data-exercise-group="${group.id}">
      <div class="exercise-heading">
        <div class="exercise-number">${index + 1}</div>
        <div class="exercise-name-wrap">
          <div class="exercise-name">${escapeHtml(group.name)}</div>
          <div class="exercise-prescription">${group.sets_target} x ${escapeHtml(group.reps_target)}${group.last_weight ? ` &middot; ${escapeHtml(group.last_weight)}` : ''}</div>
        </div>
      </div>
      <div class="reference-grid">${videos}</div>
      <details class="manage-exercise">
        <summary>Edit</summary>
        <form class="edit-exercise-form" data-edit-form="${group.id}">
          <label class="field-span-2"><span class="eyebrow">NAME</span><input name="name" type="text" maxlength="80" value="${escapeHtml(group.name)}" required /></label>
          <label><span class="eyebrow">SETS</span><input name="sets_target" type="number" inputmode="numeric" min="1" max="10" value="${group.sets_target}" required /></label>
          <label><span class="eyebrow">REPS</span><input name="reps_target" type="text" maxlength="24" value="${escapeHtml(group.reps_target)}" placeholder="8-12" required /></label>
          <label class="field-span-2"><span class="eyebrow">LAST WEIGHT</span><input name="last_weight" type="text" maxlength="40" value="${escapeHtml(group.last_weight)}" placeholder="25 kg" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 1</span><input name="cue_1" type="text" maxlength="100" value="${escapeHtml(group.cue_1)}" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 2</span><input name="cue_2" type="text" maxlength="100" value="${escapeHtml(group.cue_2)}" /></label>
          <label class="field-span-2"><span class="eyebrow">CUE 3</span><input name="cue_3" type="text" maxlength="100" value="${escapeHtml(group.cue_3)}" /></label>
          <label class="field-span-2"><span class="eyebrow">BACKUP</span><input name="backup_exercise" type="text" maxlength="100" value="${escapeHtml(group.backup_exercise)}" /></label>
          <div class="edit-actions field-span-2">
            <button type="submit" class="primary-button">Save</button>
            <button type="button" class="secondary-button" data-move-group="${group.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>Up</button>
            <button type="button" class="secondary-button" data-move-group="${group.id}" data-direction="down" ${index === total - 1 ? 'disabled' : ''}>Down</button>
            ${canAddVideo ? `<label class="secondary-button add-reference">Add video ${nextReferenceNumber}<input type="file" accept="video/*,.mp4,.mov,.m4v,.webm" data-add-video="${group.id}" aria-label="Choose reference video ${nextReferenceNumber}" /></label>` : ''}
            <button type="button" class="danger-button" data-delete-group="${group.id}">Delete</button>
          </div>
          <div class="status-line field-span-2" data-edit-status="${group.id}" aria-live="polite"></div>
        </form>
      </details>
    </article>`
}

function renderFolder(groups, errorMessage = '') {
  workoutMode = false
  if (!groups.length) folderEditMode = true
  const editing = folderEditMode
  const exerciseCards = groups.map((group, index) => renderPlanCard(group, index, groups.length, editing)).join('')
  const saved = getSavedWorkoutForFolder(activeFolder.id)
  const completedCount = saved?.completedGroupIds?.length || 0
  const startLabel = saved ? `Resume workout${completedCount ? ` - ${completedCount}/${groups.length} done` : ''}` : 'Start workout'

  renderShell(`
    <div class="folder-header">
      <button type="button" class="back-button" id="back-home">Back</button>
      ${editing ? `<button type="button" class="ghost-danger" id="delete-folder">Delete folder</button>` : ''}
    </div>
    ${groups.length ? `<button type="button" class="start-workout-button" id="start-workout">${escapeHtml(startLabel)} <span aria-hidden="true">&rarr;</span></button>` : ''}
    <button type="button" class="secondary-button full-button edit-workout-button ${editing ? 'editing' : ''}" id="toggle-edit-workout">${editing ? 'Done editing' : 'Edit workout'}</button>
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${editing ? `<details class="add-exercise" id="add-exercise-box" ${groups.length ? '' : 'open'}>
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
        <div class="video-create-grid field-span-2">
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 1</span>
            <span class="file-picker-button">Choose video</span>
            <span id="picked-video-1" class="picked-files">Required</span>
            <input id="exercise-video-1" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" required aria-label="Choose first reference video" />
          </label>
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 2</span>
            <span class="file-picker-button">Choose video</span>
            <span id="picked-video-2" class="picked-files">Optional</span>
            <input id="exercise-video-2" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" aria-label="Choose second reference video" />
          </label>
          <label class="file-picker compact-file-picker">
            <span class="eyebrow">VIDEO 3</span>
            <span class="file-picker-button">Choose video</span>
            <span id="picked-video-3" class="picked-files">Optional</span>
            <input id="exercise-video-3" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" aria-label="Choose third reference video" />
          </label>
        </div>
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
    </div>` : ''}
    ${groups.length ? `<section class="exercise-list">${exerciseCards}</section>` : `
      <section class="empty-state">
        <div class="empty-title">No exercises yet</div>
      </section>`}`, { showAccount: false, showTimer: false })

  document.querySelector('#back-home').addEventListener('click', async () => {
    folderEditMode = false
    await loadFolders()
    renderWorkouts()
  })
  document.querySelector('#delete-folder')?.addEventListener('click', deleteActiveFolder)
  document.querySelector('#toggle-edit-workout').addEventListener('click', () => {
    folderEditMode = !editing
    renderFolder(activeExerciseGroups)
  })
  const startButton = document.querySelector('#start-workout')
  if (startButton) startButton.addEventListener('click', () => startOrResumeWorkout())
  document.querySelector('#add-exercise-form')?.addEventListener('submit', addExercise)
  ;[1, 2, 3].forEach((slot) => {
    document.querySelector(`#exercise-video-${slot}`)?.addEventListener('change', (event) => updatePickedFileSlot(event, slot))
  })
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

function updatePickedFileSlot(event, slot) {
  const file = [...(event.currentTarget.files || [])].find(isVideoFile) || null
  const picked = document.querySelector(`#picked-video-${slot}`)
  const status = document.querySelector('#add-exercise-status')
  if (!picked) return
  if (!file) {
    picked.textContent = slot === 1 ? 'Required' : 'Optional'
    if (event.currentTarget.files?.length && status) status.textContent = 'Choose an MP4, MOV, M4V, or WebM video.'
    return
  }
  picked.textContent = `${cleanFileName(file.name)} · ${formatFileSize(file.size)}`
  if (file.size > SUPABASE_FREE_MAX_BYTES && status) {
    status.textContent = `${cleanFileName(file.name)} is over 50 MB. Trim/export it smaller first.`
  } else if (status) {
    const selected = [1, 2, 3].map((index) => document.querySelector(`#exercise-video-${index}`)?.files?.[0]).filter(isVideoFile)
    status.textContent = `${selected.length} video${selected.length === 1 ? '' : 's'} ready.`
  }
}

async function uploadMotivationVideos(event) {
  const input = event.currentTarget
  const status = document.querySelector('#motivation-status')
  const files = [...(input.files || [])].filter(isVideoFile)
  input.value = ''

  if (!files.length) {
    if (status) status.textContent = 'Choose a saved MP4, MOV, M4V, or WebM video.'
    return
  }

  const oversized = files.find((file) => file.size > SUPABASE_FREE_MAX_BYTES)
  if (oversized) {
    if (status) status.textContent = `${cleanFileName(oversized.name)} is ${formatFileSize(oversized.size)}. Keep each clip under 50 MB.`
    return
  }

  if (!motivationFolder) {
    if (status) status.textContent = 'Motivation storage is still loading. Try once more.'
    return
  }

  input.disabled = true
  let uploaded = 0
  const uploadedPaths = []
  const insertedIds = []
  const nextOrder = motivationVideos.reduce((max, video) => Math.max(max, Number(video.sort_order) || 0), 0) + 1

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const objectPath = `${currentUser.id}/${motivationFolder.id}/${safeObjectName(file.name)}`
      if (status) status.textContent = `Uploading ${index + 1} of ${files.length}: ${cleanFileName(file.name)}...`

      await uploadVideoFile(file, objectPath, (percent) => {
        if (status) status.textContent = `Uploading ${index + 1} of ${files.length}: ${cleanFileName(file.name)} · ${Math.round(percent)}%`
      })
      uploadedPaths.push(objectPath)

      const { data, error } = await supabase.from('exercises').insert({
        user_id: currentUser.id,
        folder_id: motivationFolder.id,
        name: cleanFileName(file.name).slice(0, 80),
        video_path: objectPath,
        sort_order: nextOrder + index,
        video_order: 1
      }).select('id').single()

      if (error) throw error
      insertedIds.push(data.id)
      uploaded += 1
    }

    await loadMotivationVideos()
    renderMore()
    const nextStatus = document.querySelector('#motivation-status')
    if (nextStatus) nextStatus.textContent = `${uploaded} motivation clip${uploaded === 1 ? '' : 's'} saved. They will play automatically during rest.`
  } catch (error) {
    for (let index = insertedIds.length; index < uploadedPaths.length; index += 1) {
      await supabase.storage.from(VIDEO_BUCKET).remove([uploadedPaths[index]])
    }
    await loadMotivationVideos().catch(() => {})
    renderMore()
    const nextStatus = document.querySelector('#motivation-status')
    if (nextStatus) nextStatus.textContent = fileUploadErrorMessage(error, files.find((file) => file.size > SUPABASE_FREE_MAX_BYTES))
  }
}

async function removeMotivationVideo(rowId, videoPath) {
  if (!rowId || !videoPath) return
  if (!confirm('Remove this motivation video?')) return

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

  if (restMotivationId === rowId) restMotivationId = null
  await loadMotivationVideos()
  renderMore()
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

function fileUploadErrorMessage(error, file = null) {
  const raw = String(error?.message || error || 'Upload failed')
  const lower = raw.toLowerCase()

  if ((file && file.size > SUPABASE_FREE_MAX_BYTES) || lower.includes('maximum') || lower.includes('too large') || lower.includes('413')) {
    return `This clip is too large for the current Supabase Free file limit (50 MB). Trim it or export it smaller, then try again.`
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('offline')) {
    return 'The upload was interrupted. Keep battle angel open, reconnect to Wi-Fi/cellular, and try again.'
  }

  return `Upload failed: ${raw}`
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
  const status = document.querySelector('#add-exercise-status')
  const submit = document.querySelector('#save-exercise')
  const files = [1, 2, 3]
    .map((slot) => document.querySelector(`#exercise-video-${slot}`)?.files?.[0])
    .filter(isVideoFile)

  if (!files.length) {
    status.textContent = 'Choose at least video 1.'
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

      await uploadVideoFile(file, objectPath, (percent) => {
        setUploadStatus(`Uploading reference ${i + 1} of ${files.length}: ${cleanFileName(file.name)} · ${Math.round(percent)}%`, percent)
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
    setUploadStatus(fileUploadErrorMessage(error, files.find((file) => file.size > SUPABASE_FREE_MAX_BYTES)), 0)
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
  const file = getVideoFiles(input.files, 1)[0]
  input.value = ''
  if (!file || !activeFolder) return

  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group || group.videos.length >= MAX_VIDEOS_PER_EXERCISE) return

  const objectPath = `${currentUser.id}/${activeFolder.id}/${safeObjectName(file.name)}`
  const videoOrder = group.videos.length + 1
  const metadata = normalizeMetadata(group)

  try {
    setUploadStatus(`Adding reference ${videoOrder}: ${cleanFileName(file.name)}`, 0)
    await uploadVideoFile(file, objectPath, (percent) => {
      setUploadStatus(`Adding reference ${videoOrder}: ${cleanFileName(file.name)} · ${Math.round(percent)}%`, percent)
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

    setUploadStatus(`Reference ${videoOrder} added`, 100)
    await openFolder(activeFolder.id)
  } catch (error) {
    setUploadStatus(fileUploadErrorMessage(error, file), 0)
  }
}

async function uploadVideoFile(file, objectPath, onProgress) {
  if (!isVideoFile(file)) throw new Error('Choose an MP4, MOV, M4V, or WebM video.')

  // Supabase recommends normal uploads for small files and TUS resumable uploads
  // for files over 6 MB. This keeps quick clips simple while making larger
  // iPhone/TikTok videos much more reliable on mobile connections.
  if (file.size <= STANDARD_UPLOAD_MAX_BYTES) {
    onProgress(5)
    const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(objectPath, file, {
      cacheControl: '3600',
      contentType: inferVideoMime(file),
      upsert: false
    })
    if (error) throw error
    onProgress(100)
    return
  }

  await uploadResumable(file, objectPath, onProgress)
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
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'false'
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: VIDEO_BUCKET,
        objectName: objectPath,
        contentType: inferVideoMime(file),
        cacheControl: '3600'
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (uploaded, total) => onProgress(total ? (uploaded / total) * 100 : 0),
      onSuccess: resolve
    })

    // Some Safari privacy/storage modes can block TUS's saved-upload lookup.
    // That should never prevent a new upload from starting.
    upload.findPreviousUploads()
      .then((previous) => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0])
        upload.start()
      })
      .catch(() => upload.start())
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

  const saved = workoutState || readWorkoutState()
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

  const saved = workoutState || readWorkoutState()
  if (saved?.folderId === activeFolder.id) clearWorkoutState()
  await loadFolders()
  renderWorkouts()
}

function createFreshWorkoutState() {
  return {
    folderId: activeFolder.id,
    currentIndex: 0,
    setsDone: {},
    completedGroupIds: [],
    backupGroupIds: [],
    status: 'active',
    updatedAt: Date.now()
  }
}

function startOrResumeWorkout(options = {}) {
  if (!activeFolder || !activeExerciseGroups.length) return
  folderEditMode = false
  const saved = workoutState || readWorkoutState()
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
        <video controls playsinline webkit-playsinline preload="metadata" src="${escapeHtml(group.videos[0].signedUrl)}" aria-label="${escapeHtml(group.name)} reference video"></video>
      </div>`
  }

  const tabs = group.videos.map((video, index) => `
    <button type="button" class="video-tab ${index === 0 ? 'active' : ''}" data-video-tab="${index}">Video ${index + 1}</button>`).join('')
  const panels = group.videos.map((video, index) => `
    <div class="workout-video-frame ${index === 0 ? '' : 'hidden'}" data-video-panel="${index}">
      <video controls playsinline webkit-playsinline preload="metadata" src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(group.name)} reference video ${index + 1}"></video>
    </div>`).join('')

  return `
    <div class="video-switcher" data-video-switcher>
      <div class="video-tabs" role="tablist" aria-label="Reference videos">${tabs}</div>
      ${panels}
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
  const usingBackup = workoutState.backupGroupIds?.includes(group.id)
  const displayName = usingBackup && group.backup_exercise ? group.backup_exercise : group.name

  renderShell(`
    <section class="workout-mode-header">
      <details class="workout-exit-menu">
        <summary>Exit</summary>
        <div class="workout-exit-actions">
          <button type="button" class="secondary-button" id="exit-workout">Pause</button>
          <button type="button" class="danger-button" id="cancel-workout">Cancel workout</button>
        </div>
      </details>
      <div class="workout-position">${workoutState.currentIndex + 1} / ${activeExerciseGroups.length}</div>
    </section>
    <div class="workout-progress" aria-label="Workout progress"><span style="width:${progress}%"></span></div>

    <article class="focus-card">
      <div class="focus-number">${workoutState.currentIndex + 1}</div>
      <h2>${escapeHtml(displayName)}</h2>
      <div class="focus-prescription">${group.sets_target} sets x ${escapeHtml(group.reps_target)} reps</div>

      ${cues.length ? `<div class="coach-cues"><div class="eyebrow">CUES</div>${cues.map((cue) => `<div class="coach-cue"><span>&#10003;</span>${escapeHtml(cue)}</div>`).join('')}</div>` : ''}

      ${renderWorkoutVideoSwitcher(group)}

      ${group.backup_exercise ? `<button type="button" class="backup-toggle ${usingBackup ? 'active' : ''}" id="toggle-backup">${usingBackup ? `Using backup · ${escapeHtml(group.backup_exercise)}` : `Use backup · ${escapeHtml(group.backup_exercise)}`}</button>` : ''}

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
  document.querySelector('#cancel-workout').addEventListener('click', cancelWorkout)
  document.querySelector('#toggle-backup')?.addEventListener('click', () => toggleWorkoutBackup(group.id))
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

function toggleWorkoutBackup(groupId) {
  if (!workoutState) return
  const ids = new Set(workoutState.backupGroupIds || [])
  if (ids.has(groupId)) ids.delete(groupId)
  else ids.add(groupId)
  workoutState.backupGroupIds = [...ids]
  saveWorkoutState()
  renderWorkout()
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

function cancelWorkout() {
  if (!confirm('Cancel this workout? Your workout plan and uploaded videos will stay saved. Only this in-progress session will be cleared.')) return
  clearWorkoutState()
  resetTimer()
  workoutMode = false
  folderEditMode = false
  renderFolder(activeExerciseGroups)
}

function pauseAndExitWorkout() {
  if (timerEndAt) pauseTimer()
  if (!workoutState) {
    renderFolder(activeExerciseGroups)
    return
  }
  workoutState.status = 'paused'
  saveWorkoutState()
  workoutMode = false
  renderFolder(activeExerciseGroups)
}

async function recordWorkoutCompletion(folderId, dateKey) {
  if (!currentUser || !historyAvailable || !planningUpgradeAvailable || !folderId) return
  const { error } = await supabase.from('workout_history').upsert({
    user_id: currentUser.id,
    workout_date: dateKey,
    folder_id: folderId,
    completed_at: new Date().toISOString()
  }, { onConflict: 'user_id,workout_date,folder_id' })
  if (error) {
    console.warn('Could not record workout completion:', error)
    return
  }
  await loadSchedule().catch(() => {})
}

function finishWorkout() {
  const completedFolderId = activeFolder?.id
  if (completedFolderId) recordWorkoutCompletion(completedFolderId, todayDateKey())
  clearWorkoutState()
  resetTimer()
  workoutMode = false
  renderShell(`
    <section class="finish-card">
      <div class="finish-check">&#10003;</div>
      <h2>${escapeHtml(activeFolder.name)} done.</h2>
      <button type="button" class="start-workout-button" id="finish-home">Done</button>
    </section>`, { title: 'Workout complete', showAccount: false, showTimer: false })

  document.querySelector('#finish-home').addEventListener('click', async () => {
    await loadFolders()
    renderHome()
  })
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
  const startingNewRest = forceRestart || timerPausedSeconds <= 0
  if (forceRestart) {
    clearTimerInterval()
    timerPausedSeconds = REST_SECONDS
    timerEndAt = null
  }

  if (startingNewRest) chooseMotivationForNewRest()
  else if (!restMotivationId && motivationVideos.length) restMotivationId = motivationVideos[0].id

  if (timerPausedSeconds <= 0) timerPausedSeconds = REST_SECONDS
  timerEndAt = Date.now() + timerPausedSeconds * 1000
  clearTimerInterval()
  timerInterval = window.setInterval(tickTimer, 250)
  persistTimerState()
  updateTimerUI()
  if (!forceRestart) syncRestMotivationPlayback()
}

function pauseTimer() {
  timerPausedSeconds = getRemainingSeconds()
  timerEndAt = null
  clearTimerInterval()
  persistTimerState()
  updateTimerUI()
  stopRestMotivationPlayback(false)
}

function resetTimer() {
  timerEndAt = null
  timerPausedSeconds = REST_SECONDS
  clearTimerInterval()
  persistTimerState()
  updateTimerUI()
  stopRestMotivationPlayback(true)
}

function tickTimer() {
  const remaining = getRemainingSeconds()
  if (remaining <= 0) {
    timerEndAt = null
    timerPausedSeconds = 0
    clearTimerInterval()
    persistTimerState()
    stopRestMotivationPlayback(true)
    tryBeep()
    window.setTimeout(() => {
      if (timerEndAt || getRemainingSeconds() > 0) return
      document.querySelector('#timer-panel')?.classList.add('hidden')
      document.querySelector('#timer-toggle')?.setAttribute('aria-expanded', 'false')
    }, 450)
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
      const saved = await syncWorkoutStateFromCloud()
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
  cloudProgressAvailable = true
  cloudProgressQueue = Promise.resolve()
  scheduleEntries = []
  weeklyPlanEntries = []
  workoutHistory = []
  scheduleAvailable = true
  weeklyPlanAvailable = true
  historyAvailable = true
  planningUpgradeAvailable = true
  plannerSelectedDate = null
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
    await syncWorkoutStateFromCloud()
    renderHome()
  } catch (error) {
    renderHome(error.message)
  }
}

boot()
