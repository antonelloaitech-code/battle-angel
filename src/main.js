import { createClient } from '@supabase/supabase-js'
import * as tus from 'tus-js-client'
import { Zip, ZipPassThrough, strToU8 } from 'fflate'
import './styles.css'

const APP_VERSION = '1.14.2'
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
// Upload compression. Videos over VIDEO_COMPRESS_OVER_BYTES are re-encoded on the phone to H.264 MP4,
// at most 1280px on the long side, with the bitrate chosen so the result lands under ~45 MB.
const VIDEO_COMPRESS_OVER_BYTES = 12 * 1024 * 1024
const VIDEO_TARGET_BYTES = 45 * 1024 * 1024
const VIDEO_MAX_EDGE = 1280
const VIDEO_MAX_BITRATE = 2_500_000
const VIDEO_MIN_BITRATE = 300_000
const VIDEO_AUDIO_BITRATE = 128_000
const IMAGE_MAX_EDGE = 1600
const IMAGE_JPEG_QUALITY = 0.82
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'])
const MOTIVATION_IMAGE_SECONDS = 6
const GOLDEN_WEEK_TARGET = 4
const HISTORY_LOOKBACK_DAYS = 400
const AUTO_RESUME_WINDOW_MS = 12 * 60 * 60 * 1000
const STALE_WORKOUT_MS = 72 * 60 * 60 * 1000
const OFFLINE_DB_NAME = 'battle-angel-offline'
const OFFLINE_DB_STORE = 'videos'
const DAILY_STEP_TITLE_MAX = 120
const DAILY_STEP_NOTE_MAX = 320
const DAILY_SUBSTEP_TITLE_MAX = 120
const DAILY_SUBSTEP_MAX = 20

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
let restQueue = []
let restQueueIndex = 0
let restImageTimer = null
let restMediaErrors = 0
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
const motivationUrlByPath = new Map()
let signedUrlCache = new Map()
let viewVersion = 0
let currentView = ''
let usingCachedData = false
let lastSetTapAt = 0
let lastDailyTapAt = 0
let audioCtx = null
let wakeLock = null
let lastVideoSignAt = 0
let workoutNotice = ''
let weightLogAvailable = true
let weightLogRows = []
let dailySteps = []
let dailyProgress = null
let dailySystemAvailable = true
let dailyUndoSnapshot = null
let dailyUndoLabel = ''
let dailyUndoExpiresAt = 0
let dailyUndoTimer = null

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 12
const MOTIVATION_SOUND_KEY = 'battle-angel-motivation-sound'
const SET_TAP_GUARD_MS = 1200
const NETWORK_FALLBACK_MS = 4000
const SIGN_TIMEOUT_MS = 6000
const EXERCISE_COLUMNS = 'id,name,video_path,sort_order,video_order,exercise_group,created_at,sets_target,reps_target,last_weight,cue_1,cue_2,cue_3,backup_exercise'

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

function isImageFile(file) {
  if (!file) return false
  if (String(file.type || '').toLowerCase().startsWith('image/')) return true
  return IMAGE_EXTENSIONS.has(fileExtension(file.name))
}

function isMotivationFile(file) {
  return isVideoFile(file) || isImageFile(file)
}

function isImagePath(path = '') {
  return IMAGE_EXTENSIONS.has(fileExtension(path))
}

function inferImageMime(file) {
  const supplied = String(file?.type || '').toLowerCase()
  if (supplied.startsWith('image/')) return supplied
  const extension = fileExtension(file?.name)
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'
  if (extension === 'heic') return 'image/heic'
  if (extension === 'heif') return 'image/heif'
  return 'image/jpeg'
}

function inferMediaMime(file) {
  return isImageFile(file) && !isVideoFile(file) ? inferImageMime(file) : inferVideoMime(file)
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
  if (VIDEO_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(ext)) return `${crypto.randomUUID()}.${ext}`
  return `${crypto.randomUUID()}.mp4`
}

function safeImageObjectName(file) {
  const ext = fileExtension(file?.name)
  if (IMAGE_EXTENSIONS.has(ext)) return `${crypto.randomUUID()}.${ext}`
  const fromMime = inferImageMime(file).split('/')[1]
  return `${crypto.randomUUID()}.${fromMime === 'jpeg' ? 'jpg' : fromMime}`
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
    currentGroupId: typeof value.currentGroupId === 'string' ? value.currentGroupId : null,
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

function isMissingWeightLogError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('exercise_weight_log')
}

function isMissingPlanningUpgradeError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('workout_weekly_plan') || text.includes('workout_history') || text.includes('is_skipped') || text.includes('backup_group_ids')
}

async function loadSchedule() {
  if (!currentUser || !scheduleAvailable) {
    scheduleEntries = []
    weeklyPlanEntries = []
    workoutHistory = mergePendingCompletions([])
    return
  }

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
      scheduleEntries = []
      weeklyPlanEntries = []
      workoutHistory = mergePendingCompletions([])
      return
    }
    throw scheduleResult.error
  }

  const nextSchedule = (scheduleResult.data || []).map((entry) => ({ ...entry, is_skipped: Boolean(entry.is_skipped) }))
  let nextWeekly = []
  let nextHistory = []
  const wantsWeekly = planningUpgradeAvailable && weeklyPlanAvailable
  const wantsHistory = planningUpgradeAvailable && historyAvailable
  const [weeklyResult, historyResult] = await Promise.all([
    wantsWeekly
      ? supabase.from('workout_weekly_plan').select('id,weekday,folder_id,created_at,updated_at').order('weekday', { ascending: true }).order('created_at', { ascending: true })
      : null,
    wantsHistory
      ? supabase.from('workout_history').select('id,workout_date,folder_id,completed_at').gte('workout_date', addDaysKey(todayDateKey(), -HISTORY_LOOKBACK_DAYS)).order('workout_date', { ascending: false })
      : null
  ])

  if (weeklyResult) {
    if (weeklyResult.error) {
      if (isMissingPlanningUpgradeError(weeklyResult.error)) {
        weeklyPlanAvailable = false
        planningUpgradeAvailable = false
      } else throw weeklyResult.error
    } else nextWeekly = weeklyResult.data || []
  }

  if (historyResult) {
    if (historyResult.error) {
      if (isMissingPlanningUpgradeError(historyResult.error)) {
        historyAvailable = false
        planningUpgradeAvailable = false
      } else throw historyResult.error
    } else nextHistory = historyResult.data || []
  }

  scheduleEntries = nextSchedule
  weeklyPlanEntries = nextWeekly
  workoutHistory = mergePendingCompletions(nextHistory)
}

function isMissingDailySystemError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('daily_steps') || text.includes('daily_progress') || text.includes('substeps') || text.includes('skipped_step_ids') || text.includes('substep_positions') || text.includes('later_step_ids')
}

function normalizeDailySubsteps(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, DAILY_SUBSTEP_TITLE_MAX))
    .filter(Boolean)
    .slice(0, DAILY_SUBSTEP_MAX)
}

function parseDailySubstepsText(value = '') {
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim().slice(0, DAILY_SUBSTEP_TITLE_MAX))
    .filter(Boolean)
    .slice(0, DAILY_SUBSTEP_MAX)
}

function dailySubstepsText(step) {
  return normalizeDailySubsteps(step?.substeps).join('\n')
}

function emptyDailyProgress(dateKey = todayDateKey()) {
  return {
    progress_date: dateKey,
    completed_step_ids: [],
    skipped_step_ids: [],
    later_step_ids: [],
    substep_positions: {},
    is_complete: false,
    started_at: null,
    updated_at: null
  }
}

function normalizeDailyProgressValue(value, dateKey = todayDateKey()) {
  if (!value || value.progress_date !== dateKey) return emptyDailyProgress(dateKey)
  const positions = value.substep_positions && typeof value.substep_positions === 'object' && !Array.isArray(value.substep_positions)
    ? Object.fromEntries(Object.entries(value.substep_positions).filter(([id, position]) => typeof id === 'string' && Number.isFinite(Number(position))).map(([id, position]) => [id, Math.max(0, Number.parseInt(position, 10) || 0)]))
    : {}
  return {
    progress_date: dateKey,
    completed_step_ids: Array.isArray(value.completed_step_ids) ? [...new Set(value.completed_step_ids.filter((id) => typeof id === 'string'))] : [],
    skipped_step_ids: Array.isArray(value.skipped_step_ids) ? [...new Set(value.skipped_step_ids.filter((id) => typeof id === 'string'))] : [],
    later_step_ids: Array.isArray(value.later_step_ids) ? [...new Set(value.later_step_ids.filter((id) => typeof id === 'string'))] : [],
    substep_positions: positions,
    is_complete: Boolean(value.is_complete),
    started_at: value.started_at || null,
    updated_at: value.updated_at || null
  }
}

function pendingDailyProgressFor(dateKey = todayDateKey()) {
  const value = readPending().dailyProgress
  return value?.progress_date === dateKey ? normalizeDailyProgressValue(value, dateKey) : null
}

async function loadDailySystem() {
  const dateKey = todayDateKey()
  if (!currentUser || !dailySystemAvailable) {
    dailySteps = []
    dailyProgress = emptyDailyProgress(dateKey)
    return
  }

  const [stepsResult, progressResult] = await Promise.all([
    supabase
      .from('daily_steps')
      .select('id,title,note,substeps,sort_order,created_at,updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_progress')
      .select('progress_date,completed_step_ids,skipped_step_ids,later_step_ids,substep_positions,is_complete,started_at,updated_at')
      .eq('progress_date', dateKey)
      .maybeSingle()
  ])

  const firstError = stepsResult.error || progressResult.error
  if (firstError) {
    if (isMissingDailySystemError(firstError)) {
      dailySystemAvailable = false
      dailySteps = []
      dailyProgress = emptyDailyProgress(dateKey)
      return
    }
    throw firstError
  }

  dailySteps = (stepsResult.data || []).map((step) => ({ ...step, substeps: normalizeDailySubsteps(step.substeps) }))
  const cloud = normalizeDailyProgressValue(progressResult.data, dateKey)
  const pending = pendingDailyProgressFor(dateKey)
  const cloudTime = Date.parse(cloud.updated_at || '') || 0
  const pendingTime = Date.parse(pending?.updated_at || '') || 0
  dailyProgress = pending && pendingTime >= cloudTime ? pending : cloud
}

function currentDailyProgress() {
  const dateKey = todayDateKey()
  if (!dailyProgress || dailyProgress.progress_date !== dateKey) dailyProgress = emptyDailyProgress(dateKey)
  return dailyProgress
}

function saveDailyProgress(nextValue) {
  const dateKey = todayDateKey()
  const next = normalizeDailyProgressValue(nextValue, dateKey)
  next.updated_at = new Date().toISOString()
  dailyProgress = next
  const pending = readPending()
  pending.dailyProgress = next
  writePending(pending)
  saveSnapshot()
  flushPendingWrites()
}

function dailyResolvedStepIds(progress = currentDailyProgress()) {
  return new Set([...(progress.completed_step_ids || []), ...(progress.skipped_step_ids || [])])
}

function dailyLaterStepIds(progress = currentDailyProgress()) {
  const resolved = dailyResolvedStepIds(progress)
  const valid = new Set(dailySteps.map((step) => step.id))
  return (progress.later_step_ids || []).filter((id) => valid.has(id) && !resolved.has(id))
}

function getOrderedUnresolvedDailySteps(progress = currentDailyProgress()) {
  const resolved = dailyResolvedStepIds(progress)
  const laterIds = dailyLaterStepIds(progress)
  const laterSet = new Set(laterIds)
  const immediate = dailySteps.filter((step) => !resolved.has(step.id) && !laterSet.has(step.id))
  const byId = new Map(dailySteps.map((step) => [step.id, step]))
  const deferred = laterIds.map((id) => byId.get(id)).filter(Boolean)
  return [...immediate, ...deferred]
}

function getCurrentDailyStep() {
  return getOrderedUnresolvedDailySteps()[0] || null
}

function getDailyStepPosition(stepId) {
  const index = dailySteps.findIndex((step) => step.id === stepId)
  return index >= 0 ? index + 1 : 1
}

function totalDailyActions() {
  return dailySteps.reduce((total, step) => total + Math.max(1, normalizeDailySubsteps(step.substeps).length), 0)
}

function completedDailyActionsCount(progress = currentDailyProgress()) {
  const resolved = dailyResolvedStepIds(progress)
  return dailySteps.reduce((total, step) => {
    const count = Math.max(1, normalizeDailySubsteps(step.substeps).length)
    if (resolved.has(step.id)) return total + count
    if (count === 1) return total
    return total + clamp(Number.parseInt(progress.substep_positions?.[step.id], 10) || 0, 0, count)
  }, 0)
}

function getCurrentDailyAction() {
  const progress = currentDailyProgress()
  const step = getCurrentDailyStep()
  if (!step) return null
  const substeps = normalizeDailySubsteps(step.substeps)
  if (!substeps.length) return { step, substeps, substepIndex: -1, title: step.title, isSubstep: false }
  const substepIndex = clamp(Number.parseInt(progress.substep_positions?.[step.id], 10) || 0, 0, Math.max(0, substeps.length - 1))
  return { step, substeps, substepIndex, title: substeps[substepIndex], isSubstep: true }
}

function hasDailyActionHistory(progress = currentDailyProgress()) {
  if ((progress.completed_step_ids || []).length || (progress.skipped_step_ids || []).length || (progress.later_step_ids || []).length) return true
  return Object.values(progress.substep_positions || {}).some((value) => Number(value) > 0)
}

function cloneDailyProgress(progress = currentDailyProgress()) {
  return normalizeDailyProgressValue(JSON.parse(JSON.stringify(progress)), todayDateKey())
}

function clearDailyUndo() {
  if (dailyUndoTimer) window.clearTimeout(dailyUndoTimer)
  dailyUndoTimer = null
  dailyUndoSnapshot = null
  dailyUndoLabel = ''
  dailyUndoExpiresAt = 0
}

function rememberDailyUndo(progress, label) {
  if (dailyUndoTimer) window.clearTimeout(dailyUndoTimer)
  dailyUndoTimer = null
  dailyUndoSnapshot = cloneDailyProgress(progress)
  dailyUndoLabel = label
  dailyUndoExpiresAt = Date.now() + 5000
}

function renderDailyUndoToast() {
  if (!dailyUndoSnapshot || Date.now() >= dailyUndoExpiresAt) return ''
  return `
    <div class="day-undo-toast" id="day-undo-toast" role="status">
      <span>${escapeHtml(dailyUndoLabel)}</span>
      <button type="button" id="undo-daily-action">Undo</button>
    </div>`
}

function bindDailyUndoToast() {
  const toast = document.querySelector('#day-undo-toast')
  const undo = document.querySelector('#undo-daily-action')
  if (!toast || !undo || !dailyUndoSnapshot) return
  undo.addEventListener('click', () => {
    const snapshot = dailyUndoSnapshot
    clearDailyUndo()
    saveDailyProgress(snapshot)
    renderDayRunner()
  })
  const delay = Math.max(0, dailyUndoExpiresAt - Date.now())
  dailyUndoTimer = window.setTimeout(() => {
    toast.classList.add('is-hiding')
    window.setTimeout(() => {
      toast.remove()
      clearDailyUndo()
    }, 180)
  }, delay)
}

function isGymDailyStep(step) {
  const title = String(step?.title || '').trim().toLowerCase()
  return ['gym', 'workout', 'training'].includes(title) && normalizeDailySubsteps(step?.substeps).length === 0
}

function getDailyGymState(step = getCurrentDailyStep()) {
  if (!isGymDailyStep(step)) return null
  const planned = getScheduledFolders(todayDateKey())
  const remaining = planned.filter((folder) => !wasWorkoutCompleted(todayDateKey(), folder.id))
  return { planned, remaining }
}

function startDailySystem() {
  if (!dailySteps.length) return
  const progress = currentDailyProgress()
  if (!progress.started_at) progress.started_at = new Date().toISOString()
  progress.is_complete = false
  saveDailyProgress(progress)
  renderDayRunner()
}

function advanceDailyAction(stepId, skip = false, options = {}) {
  const now = Date.now()
  if (!options.bypassGuard && now - lastDailyTapAt < 900) return false
  if (!options.bypassGuard) lastDailyTapAt = now
  const progress = currentDailyProgress()
  const step = dailySteps.find((item) => item.id === stepId)
  if (!step) return false
  if (options.rememberUndo !== false) rememberDailyUndo(progress, options.undoLabel || (skip ? 'Skipped' : 'Done'))

  const substeps = normalizeDailySubsteps(step.substeps)
  const completed = new Set(progress.completed_step_ids || [])
  const skipped = new Set(progress.skipped_step_ids || [])
  const later = (progress.later_step_ids || []).filter((id) => id !== stepId)
  const positions = { ...(progress.substep_positions || {}) }

  if (substeps.length) {
    const current = clamp(Number.parseInt(positions[stepId], 10) || 0, 0, substeps.length - 1)
    const next = current + 1
    positions[stepId] = next
    if (next >= substeps.length) completed.add(stepId)
  } else if (skip) {
    skipped.add(stepId)
  } else {
    completed.add(stepId)
  }

  progress.completed_step_ids = [...completed]
  progress.skipped_step_ids = [...skipped]
  progress.later_step_ids = later
  progress.substep_positions = positions
  progress.is_complete = dailySteps.length > 0 && dailySteps.every((item) => completed.has(item.id) || skipped.has(item.id))
  if (!progress.started_at) progress.started_at = new Date().toISOString()
  saveDailyProgress(progress)
  if (options.render !== false) renderDayRunner()
  return true
}

function completeDailyStep(stepId) {
  advanceDailyAction(stepId, false, { undoLabel: 'Done' })
}

function skipDailyStep(stepId) {
  advanceDailyAction(stepId, true, { undoLabel: 'Skipped' })
}

function deferDailyStep(stepId) {
  const now = Date.now()
  if (now - lastDailyTapAt < 900) return
  lastDailyTapAt = now
  const progress = currentDailyProgress()
  const unresolved = getOrderedUnresolvedDailySteps(progress)
  if (unresolved.length <= 1) return
  const step = dailySteps.find((item) => item.id === stepId)
  if (!step) return
  rememberDailyUndo(progress, 'Moved to later')
  progress.later_step_ids = [...(progress.later_step_ids || []).filter((id) => id !== stepId), stepId]
  if (!progress.started_at) progress.started_at = new Date().toISOString()
  saveDailyProgress(progress)
  renderDayRunner()
}

function triggerDailyPrimaryAction(step) {
  const gymState = getDailyGymState(step)
  if (gymState) {
    const nextFolder = gymState.remaining?.[0] || null
    if (nextFolder) openFolder(nextFolder.id, { mode: 'workout' })
    else renderWorkouts()
    return
  }
  completeDailyStep(step.id)
}

function dailyGymStepCanAutoComplete(step) {
  const gym = getDailyGymState(step)
  return Boolean(gym && gym.planned.length && gym.remaining.length === 0)
}

function maybeCompleteDailyGymStepAfterWorkout() {
  const progress = currentDailyProgress()
  if (!progress.started_at || progress.is_complete) return false
  const step = getCurrentDailyStep()
  if (!isGymDailyStep(step)) return false
  const gym = getDailyGymState(step)
  if (!gym) return false
  const shouldComplete = gym.planned.length ? gym.remaining.length === 0 : true
  if (!shouldComplete) return true
  advanceDailyAction(step.id, false, { bypassGuard: true, rememberUndo: false, render: false })
  return true
}

function getScheduleEntries(dateKey) {
  return scheduleEntries.filter((entry) => entry.workout_date === dateKey)
}

function hasDateScheduleOverride(dateKey) {
  return getScheduleEntries(dateKey).length > 0
}

function getWeeklyPlanEntries(dateKey) {
  const weekday = dateFromKey(dateKey).getDay()
  return weeklyPlanEntries.filter((entry) => Number(entry.weekday) === weekday)
}

function getWeeklyFolders(dateKey) {
  const ids = new Set(getWeeklyPlanEntries(dateKey).map((entry) => entry.folder_id))
  return folders.filter((folder) => ids.has(folder.id))
}

function getScheduledFolders(dateKey) {
  const overrides = getScheduleEntries(dateKey)
  if (overrides.length) {
    const chosenIds = new Set(overrides.filter((entry) => !entry.is_skipped && entry.folder_id).map((entry) => entry.folder_id))
    return folders.filter((folder) => chosenIds.has(folder.id))
  }
  return getWeeklyFolders(dateKey)
}

function getScheduledFolder(dateKey) {
  return getScheduledFolders(dateKey)[0] || null
}

function wasWorkoutCompleted(dateKey, folderId) {
  return workoutHistory.some((entry) => entry.workout_date === dateKey && entry.folder_id === folderId)
}

function getMissedYesterdayFolders() {
  if (!historyAvailable || !planningUpgradeAvailable || getScheduledFolders(todayDateKey()).length) return []
  const yesterday = addDaysKey(todayDateKey(), -1)
  return getScheduledFolders(yesterday).filter((folder) => !wasWorkoutCompleted(yesterday, folder.id))
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
    restQueue = Array.isArray(saved.queue) ? saved.queue.filter((id) => typeof id === 'string') : []
    restQueueIndex = clamp(Number.parseInt(saved.queueIndex, 10) || 0, 0, Math.max(0, restQueue.length - 1))
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
      motivationId: restMotivationId,
      queue: restQueue,
      queueIndex: restQueueIndex
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
    const pathExt = fileExtension(row.video_path)
    const extension = VIDEO_EXTENSIONS.has(pathExt) || IMAGE_EXTENSIONS.has(pathExt) ? pathExt : 'mp4'
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
    let weightLogBackupRows = []
    let dailyStepBackupRows = []
    let dailyProgressBackupRows = []
    if (weightLogAvailable) {
      const { data: weightData, error: weightError } = await supabase
        .from('exercise_weight_log')
        .select('exercise_group,folder_id,workout_date,weight,updated_at')
        .order('workout_date', { ascending: true })
      if (!weightError) weightLogBackupRows = weightData || []
    }
    if (planningUpgradeAvailable) {
      const [weeklyResult, historyResult] = await Promise.all([
        supabase.from('workout_weekly_plan').select('id,weekday,folder_id,created_at,updated_at').order('weekday', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('workout_history').select('id,workout_date,folder_id,completed_at').order('workout_date', { ascending: true })
      ])
      if (!weeklyResult.error) weeklyPlanRows = weeklyResult.data || []
      if (!historyResult.error) historyRows = historyResult.data || []
    }
    if (dailySystemAvailable) {
      const [dailyStepsResult, dailyProgressResult] = await Promise.all([
        supabase.from('daily_steps').select('id,title,note,substeps,sort_order,created_at,updated_at').order('sort_order', { ascending: true }),
        supabase.from('daily_progress').select('progress_date,completed_step_ids,skipped_step_ids,later_step_ids,substep_positions,is_complete,started_at,updated_at').order('progress_date', { ascending: true })
      ])
      if (!dailyStepsResult.error) dailyStepBackupRows = dailyStepsResult.data || []
      if (!dailyProgressResult.error) dailyProgressBackupRows = dailyProgressResult.data || []
    }

    const manifest = {
      format: 'battle-angel-backup',
      version: 8,
      exported_at: new Date().toISOString(),
      account_email: currentUser.email || '',
      folders: folderRows.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME),
      exercises: workoutRows,
      motivation_videos: motivationRows,
      schedule: scheduleRows,
      weekly_plan: weeklyPlanRows,
      history: historyRows,
      weight_log: weightLogBackupRows,
      daily_steps: dailyStepBackupRows,
      daily_progress: dailyProgressBackupRows
    }

    const parts = []
    let chunks = []
    let chunkBytes = 0
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
      chunkBytes += data.length
      // Fold finished chunks into a Blob regularly so the whole library never sits in JS memory at once.
      if (chunkBytes >= 16 * 1024 * 1024 || final) {
        parts.push(new Blob(chunks))
        chunks = []
        chunkBytes = 0
      }
      if (final) zipResolve(new Blob(parts, { type: 'application/zip' }))
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
  document.documentElement.classList.remove('day-runner-active')
  document.body.classList.remove('day-runner-active')
  workoutMode = false
  viewVersion += 1
  currentView = 'login'
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
  const { data, error } = await supabase
    .from('folders')
    .select('id,name,sort_order,created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const visibleFolders = data.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME)
  if (visibleFolders.length) return data

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
  return [...data, ...created.sort((a, b) => a.sort_order - b.sort_order)]
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
  if (!motivationFolder) {
    motivationVideos = []
    return
  }

  const { data: rows, error } = await supabase
    .from('exercises')
    .select('id,name,video_path,sort_order,created_at')
    .eq('folder_id', motivationFolder.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  motivationVideos = await hydrateMotivationRows(rows || [])
}

async function hydrateMotivationRows(rows) {
  const keep = new Set(rows.map((row) => row.video_path))
  for (const [path, url] of motivationUrlByPath) {
    if (!keep.has(path)) {
      URL.revokeObjectURL(url)
      motivationUrlByPath.delete(path)
    }
  }
  if (!rows.length) return []
  return hydrateVideoRows(rows, null, motivationUrlByPath)
}

async function loadFolders() {
  const allFolders = await ensureDefaultFolders()
  motivationFolder = await ensureMotivationFolder(allFolders)
  const visibleFolders = allFolders.filter((folder) => folder.name !== MOTIVATION_FOLDER_NAME)

  const [countResult] = await Promise.all([
    supabase.from('exercises').select('folder_id,exercise_group'),
    loadMotivationVideos(),
    loadSchedule(),
    loadDailySystem()
  ])
  if (countResult.error) throw countResult.error

  const groupMap = {}
  ;(countResult.data || []).forEach((row) => {
    if (!groupMap[row.folder_id]) groupMap[row.folder_id] = new Set()
    groupMap[row.folder_id].add(row.exercise_group)
  })

  folders = visibleFolders.map((folder) => ({
    ...folder,
    count: groupMap[folder.id]?.size || 0
  }))
  usingCachedData = false
  saveSnapshot()
  flushPendingWrites()
}

// ---------- offline-first helpers ----------

function snapshotKey() {
  return `battle-angel-snapshot-${currentUser?.id || 'anon'}`
}

function folderRowsKey(folderId) {
  return `battle-angel-rows-${currentUser?.id || 'anon'}-${folderId}`
}

function pendingKey() {
  return `battle-angel-pending-${currentUser?.id || 'anon'}`
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the app still works online.
  }
}

function stripVideoUrls(rows) {
  return rows.map(({ signedUrl, offline, ...row }) => row)
}

function saveSnapshot() {
  if (!currentUser) return
  writeJson(snapshotKey(), {
    savedAt: Date.now(),
    folders,
    motivationFolder,
    motivationRows: stripVideoUrls(motivationVideos),
    scheduleEntries,
    weeklyPlanEntries,
    workoutHistory,
    dailySteps,
    dailyProgress
  })
}

async function restoreSnapshot() {
  const snapshot = readJson(snapshotKey(), null)
  if (!snapshot || !Array.isArray(snapshot.folders)) return false
  folders = snapshot.folders
  motivationFolder = snapshot.motivationFolder || null
  scheduleEntries = snapshot.scheduleEntries || []
  weeklyPlanEntries = snapshot.weeklyPlanEntries || []
  workoutHistory = mergePendingCompletions(snapshot.workoutHistory || [])
  dailySteps = Array.isArray(snapshot.dailySteps) ? snapshot.dailySteps : []
  dailyProgress = normalizeDailyProgressValue(snapshot.dailyProgress, todayDateKey())
  const pendingDaily = pendingDailyProgressFor(todayDateKey())
  if (pendingDaily) dailyProgress = pendingDaily
  motivationVideos = await hydrateMotivationRows(snapshot.motivationRows || [])
  return true
}

function cacheFolderRows(folderId, rows) {
  writeJson(folderRowsKey(folderId), stripVideoUrls(rows))
}

function readCachedFolderRows(folderId) {
  const rows = readJson(folderRowsKey(folderId), null)
  return Array.isArray(rows) ? rows : null
}

function raceTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('Network timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer))
}

function isNetworkError(error) {
  const text = `${error?.name || ''} ${error?.message || error || ''}`.toLowerCase()
  return navigator.onLine === false || /fetch|network|timeout|load failed|offline|retryable/.test(text)
}

async function fetchFolderRows(folderId) {
  const cached = readCachedFolderRows(folderId)
  if (navigator.onLine === false && cached) return { rows: cached, fromCache: true }
  try {
    const query = supabase
      .from('exercises')
      .select(EXERCISE_COLUMNS)
      .eq('folder_id', folderId)
      .order('sort_order', { ascending: true })
      .order('video_order', { ascending: true })
      .order('created_at', { ascending: true })
    const { data, error } = cached ? await raceTimeout(query, NETWORK_FALLBACK_MS) : await query
    if (error) throw error
    const rows = data || []
    cacheFolderRows(folderId, rows)
    return { rows, fromCache: false }
  } catch (error) {
    if (cached) return { rows: cached, fromCache: true }
    throw error
  }
}

async function signVideoPaths(paths) {
  const now = Date.now()
  const unique = [...new Set(paths.filter(Boolean))]
  const missing = unique.filter((path) => {
    const cached = signedUrlCache.get(path)
    return !cached || cached.expiresAt - now < 60 * 60 * 1000
  })
  if (missing.length && navigator.onLine !== false) {
    try {
      const { data, error } = await raceTimeout(supabase.storage.from(VIDEO_BUCKET).createSignedUrls(missing, SIGNED_URL_TTL_SECONDS), SIGN_TIMEOUT_MS)
      if (error) throw error
      ;(data || []).forEach((item, index) => {
        const path = item?.path || missing[index]
        if (item?.signedUrl) signedUrlCache.set(path, { url: item.signedUrl, expiresAt: now + SIGNED_URL_TTL_SECONDS * 1000 })
      })
      lastVideoSignAt = now
    } catch (error) {
      console.warn('Could not sign video URLs:', error)
    }
  }
  return Object.fromEntries(unique.map((path) => [path, signedUrlCache.get(path)?.url || '']))
}

// Saved (offline) copies win; everything else gets a reusable signed URL so the browser can cache it.
async function hydrateVideoRows(rows, objectUrlBucket = offlineObjectUrls, objectUrlByPath = null) {
  const withBlobs = await Promise.all(rows.map(async (row) => {
    if (objectUrlByPath?.has(row.video_path)) return { row, existingUrl: objectUrlByPath.get(row.video_path) }
    return { row, blob: await getOfflineVideo(row.video_path) }
  }))
  const needsSigning = withBlobs.filter((item) => !item.blob && !item.existingUrl).map((item) => item.row.video_path)
  const signed = needsSigning.length ? await signVideoPaths(needsSigning) : {}
  return withBlobs.map(({ row, blob, existingUrl }) => {
    if (existingUrl) return { ...row, signedUrl: existingUrl, offline: true }
    if (blob) {
      const offlineUrl = URL.createObjectURL(blob)
      if (objectUrlByPath) objectUrlByPath.set(row.video_path, offlineUrl)
      else objectUrlBucket.push(offlineUrl)
      return { ...row, signedUrl: offlineUrl, offline: true }
    }
    return { ...row, signedUrl: signed[row.video_path] || '', offline: false }
  })
}

function readPending() {
  const pending = readJson(pendingKey(), {})
  return {
    weights: pending.weights && typeof pending.weights === 'object' ? pending.weights : {},
    completions: Array.isArray(pending.completions) ? pending.completions : [],
    uncompletions: Array.isArray(pending.uncompletions) ? pending.uncompletions : [],
    weightLogs: pending.weightLogs && typeof pending.weightLogs === 'object' ? pending.weightLogs : {},
    dailyProgress: pending.dailyProgress && typeof pending.dailyProgress === 'object' ? pending.dailyProgress : null
  }
}

function writePending(pending) {
  writeJson(pendingKey(), pending)
}

function mergePendingCompletions(history) {
  const all = currentUser ? readPending() : { completions: [], uncompletions: [] }
  const pending = all.completions
  const undone = new Set(all.uncompletions.map((item) => `${item.workout_date}|${item.folder_id}`))
  const merged = history.filter((entry) => !undone.has(`${entry.workout_date}|${entry.folder_id}`))
  pending.forEach((item) => {
    if (!merged.some((entry) => entry.workout_date === item.workout_date && entry.folder_id === item.folder_id)) {
      merged.unshift({ id: `pending-${item.folder_id}-${item.workout_date}`, ...item })
    }
  })
  return merged
}

let flushingPending = false
async function flushPendingWrites() {
  if (!currentUser || flushingPending || navigator.onLine === false) return
  const pending = readPending()
  if (!Object.keys(pending.weights).length && !pending.completions.length && !pending.uncompletions.length && !Object.keys(pending.weightLogs).length && !pending.dailyProgress) return
  flushingPending = true
  try {
    for (const [groupId, value] of Object.entries(pending.weights)) {
      const { error } = await supabase.from('exercises').update({ last_weight: value }).eq('exercise_group', groupId)
      if (!error) {
        const next = readPending()
        if (next.weights[groupId] === value) delete next.weights[groupId]
        writePending(next)
      }
    }
    for (const item of pending.completions) {
      const stillPending = readPending().completions.some((entry) => entry.workout_date === item.workout_date && entry.folder_id === item.folder_id)
      if (!stillPending) continue
      const { error } = await supabase.from('workout_history').upsert({
        user_id: currentUser.id,
        workout_date: item.workout_date,
        folder_id: item.folder_id,
        completed_at: item.completed_at
      }, { onConflict: 'user_id,workout_date,folder_id' })
      if (!error) {
        const next = readPending()
        next.completions = next.completions.filter((entry) => !(entry.workout_date === item.workout_date && entry.folder_id === item.folder_id))
        writePending(next)
      }
    }
    for (const item of pending.uncompletions) {
      const stillPending = readPending().uncompletions.some((entry) => entry.workout_date === item.workout_date && entry.folder_id === item.folder_id)
      if (!stillPending) continue
      const { error } = await supabase.from('workout_history').delete().eq('workout_date', item.workout_date).eq('folder_id', item.folder_id)
      if (!error) {
        const next = readPending()
        next.uncompletions = next.uncompletions.filter((entry) => !(entry.workout_date === item.workout_date && entry.folder_id === item.folder_id))
        writePending(next)
      }
    }
    const dailyItem = readPending().dailyProgress
    if (dailyItem && dailySystemAvailable) {
      const { error } = await supabase.from('daily_progress').upsert({
        user_id: currentUser.id,
        progress_date: dailyItem.progress_date,
        completed_step_ids: dailyItem.completed_step_ids || [],
        skipped_step_ids: dailyItem.skipped_step_ids || [],
        later_step_ids: dailyItem.later_step_ids || [],
        substep_positions: dailyItem.substep_positions || {},
        is_complete: Boolean(dailyItem.is_complete),
        started_at: dailyItem.started_at || null,
        updated_at: dailyItem.updated_at || new Date().toISOString()
      }, { onConflict: 'user_id,progress_date' })
      if (error) {
        if (isMissingDailySystemError(error)) dailySystemAvailable = false
      } else {
        const next = readPending()
        if (next.dailyProgress?.updated_at === dailyItem.updated_at) next.dailyProgress = null
        writePending(next)
      }
    }
    if (weightLogAvailable) {
      for (const [key, item] of Object.entries(pending.weightLogs)) {
        const { error } = await supabase.from('exercise_weight_log').upsert({
          user_id: currentUser.id,
          folder_id: item.folder_id,
          exercise_group: item.exercise_group,
          workout_date: item.workout_date,
          weight: item.weight,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,exercise_group,workout_date' })
        if (error && isMissingWeightLogError(error)) {
          weightLogAvailable = false
          break
        }
        if (!error) {
          const next = readPending()
          if (next.weightLogs[key]?.weight === item.weight) delete next.weightLogs[key]
          writePending(next)
        }
      }
    }
  } finally {
    flushingPending = false
  }
}

function dataSignature() {
  return JSON.stringify([
    folders,
    scheduleEntries,
    weeklyPlanEntries,
    workoutHistory.map((entry) => [entry.workout_date, entry.folder_id]),
    motivationVideos.map((video) => video.id),
    dailySteps.map((step) => [step.id, step.title, step.note, step.substeps, step.sort_order]),
    dailyProgress
  ])
}

// Re-render the current tab with fresh data, but only if the user hasn't moved on and something actually changed.
async function refreshInBackground() {
  if (!currentUser) return
  const version = viewVersion
  const before = dataSignature()
  const wasCached = usingCachedData
  try {
    await loadFolders()
  } catch (error) {
    console.warn('Background refresh failed:', error)
    return
  }
  if (viewVersion !== version || (dataSignature() === before && !wasCached)) return
  if (currentView === 'day') renderDay()
  else if (currentView === 'home') renderHome()
  else if (currentView === 'workouts') renderWorkouts()
}

function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    // Not supported: saved videos still work, the browser may just evict them under pressure.
  }
}

async function deleteOfflineVideos(paths) {
  const list = (paths || []).filter(Boolean)
  if (!list.length) return
  try {
    const db = await openOfflineVideoDb()
    await new Promise((resolve) => {
      const tx = db.transaction(OFFLINE_DB_STORE, 'readwrite')
      const store = tx.objectStore(OFFLINE_DB_STORE)
      list.forEach((path) => store.delete(path))
      tx.oncomplete = resolve
      tx.onerror = resolve
    })
    db.close()
  } catch {
    // Nothing saved on this device.
  }
  list.forEach((path) => signedUrlCache.delete(path))
}

function shuffleIds(ids) {
  const list = [...ids]
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}

// Every rest gets a fresh random order of all motivation clips and photos.
// The first item never repeats the last one shown in the previous rest.
function buildMotivationQueue(avoidFirstId = null) {
  const ids = motivationVideos.filter((item) => item.signedUrl).map((item) => item.id)
  const queue = shuffleIds(ids)
  if (queue.length > 1 && queue[0] === avoidFirstId) queue.push(queue.shift())
  return queue
}

function chooseMotivationForNewRest() {
  restQueue = buildMotivationQueue(restMotivationId)
  restQueueIndex = 0
  restMotivationId = restQueue[0] || null
  restMediaErrors = 0
}

function currentRestMedia() {
  if (!restQueue.length) return null
  return motivationVideos.find((item) => item.id === restQueue[restQueueIndex] && item.signedUrl) || null
}

function clearRestImageTimer() {
  if (restImageTimer) window.clearTimeout(restImageTimer)
  restImageTimer = null
}

function stopRestMotivationPlayback(resetToStart = false) {
  clearRestImageTimer()
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

function advanceRestMedia() {
  if (currentView !== 'rest' || !timerEndAt) return
  restQueueIndex += 1
  if (restQueueIndex >= restQueue.length) {
    // Went through everything before the rest ended: reshuffle and keep going.
    restQueue = buildMotivationQueue(restQueue[restQueue.length - 1])
    restQueueIndex = 0
  }
  restMotivationId = restQueue[restQueueIndex] || null
  persistTimerState()
  playRestMedia()
}

function playRestMedia() {
  clearRestImageTimer()
  const videoEl = document.querySelector('#rest-motivation-video')
  const imageEl = document.querySelector('#rest-motivation-image')
  if (!videoEl || !imageEl) return
  // Skip anything that was removed since the queue was built.
  let item = currentRestMedia()
  let guard = restQueue.length
  while (!item && guard > 0 && restQueue.length) {
    restQueueIndex = (restQueueIndex + 1) % restQueue.length
    item = currentRestMedia()
    guard -= 1
  }
  if (!item) {
    videoEl.classList.add('hidden')
    imageEl.classList.add('hidden')
    return
  }
  restMotivationId = item.id

  if (isImagePath(item.video_path)) {
    videoEl.pause()
    videoEl.classList.add('hidden')
    imageEl.classList.remove('hidden')
    imageEl.src = item.signedUrl
    restImageTimer = window.setTimeout(advanceRestMedia, MOTIVATION_IMAGE_SECONDS * 1000)
    preloadNextRestImage()
    return
  }

  imageEl.classList.add('hidden')
  imageEl.removeAttribute('src')
  videoEl.classList.remove('hidden')
  // One <video> element is reused for every clip so iPhone keeps the sound permission between clips.
  if (videoEl.getAttribute('src') !== item.signedUrl) videoEl.src = item.signedUrl
  videoEl.muted = !motivationSoundOn()
  const result = videoEl.play()
  if (result?.catch) {
    result.catch((error) => {
      if (error?.name === 'NotAllowedError' && !videoEl.muted) {
        // Sound wasn't allowed without a fresh tap: keep the clip going muted.
        videoEl.muted = true
        updateRestSoundHint(false)
        videoEl.play()?.catch?.(() => {})
      }
    })
  }
  preloadNextRestImage()
}

function preloadNextRestImage() {
  const nextId = restQueue[restQueueIndex + 1]
  const next = motivationVideos.find((item) => item.id === nextId)
  if (next?.signedUrl && isImagePath(next.video_path)) {
    const img = new Image()
    img.src = next.signedUrl
  }
}

function updateRestSoundHint(soundOn) {
  const hint = document.querySelector('#rest-sound-hint')
  if (hint) hint.textContent = soundOn ? 'sound on · double-tap to mute' : 'muted · double-tap for sound'
}

function motivationSoundOn() {
  try {
    return window.localStorage.getItem(MOTIVATION_SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

function setMotivationSound(on) {
  try {
    window.localStorage.setItem(MOTIVATION_SOUND_KEY, on ? 'on' : 'off')
  } catch {
    // Preference just won't persist.
  }
}

const DOUBLE_TAP_MS = 350
const TAP_MOVE_PX = 12
const TAP_MAX_MS = 300

function showRestLockScreen() {
  if (!timerEndAt) return
  viewVersion += 1
  currentView = 'rest'
  keepAwake()
  if (!currentRestMedia() && motivationVideos.length) chooseMotivationForNewRest()
  const hasMedia = motivationVideos.some((item) => item.signedUrl)
  const hasVideo = motivationVideos.some((item) => item.signedUrl && !isImagePath(item.video_path))
  const remaining = getRemainingSeconds()
  const soundOn = motivationSoundOn()
  app.innerHTML = `
    <main class="rest-lock-screen" aria-label="Rest timer">
      ${hasMedia ? `
        <video id="rest-motivation-video" class="rest-lock-video hidden" playsinline webkit-playsinline preload="auto" ${soundOn ? '' : 'muted'} aria-label="Motivation video"></video>
        <img id="rest-motivation-image" class="rest-lock-image hidden" alt="" />` : '<div class="rest-lock-blank" aria-hidden="true"></div>'}
      <div id="timer-value" class="rest-lock-timer" aria-live="off">${formatTime(remaining)}</div>
      ${hasVideo ? '<div id="rest-sound-hint" class="rest-sound-hint"></div>' : ''}
    </main>`

  if (hasMedia) {
    const videoEl = document.querySelector('#rest-motivation-video')
    const imageEl = document.querySelector('#rest-motivation-image')
    videoEl.loop = false
    videoEl.addEventListener('ended', () => {
      restMediaErrors = 0
      advanceRestMedia()
    })
    const onMediaError = () => {
      restMediaErrors += 1
      if (restMediaErrors >= Math.max(1, restQueue.length)) return
      advanceRestMedia()
    }
    videoEl.addEventListener('error', onMediaError)
    imageEl.addEventListener('error', onMediaError)
    imageEl.addEventListener('load', () => { restMediaErrors = 0 })
    updateRestSoundHint(soundOn)
    playRestMedia()
    bindRestDoubleTap(videoEl)
  }
  updateTimerUI()
}

// Sound only toggles on a deliberate double tap. A single touch (including the start of
// the iPhone swipe-home gesture) does nothing.
function bindRestDoubleTap(videoEl) {
  const screen = document.querySelector('.rest-lock-screen')
  if (!screen) return
  const shownAt = Date.now()
  let down = null
  let lastTapAt = 0
  screen.addEventListener('pointerdown', (event) => {
    down = { x: event.clientX, y: event.clientY, at: Date.now(), id: event.pointerId }
  })
  screen.addEventListener('pointercancel', () => {
    down = null
    lastTapAt = 0
  })
  screen.addEventListener('pointerup', (event) => {
    const start = down
    down = null
    if (!start || start.id !== event.pointerId) return
    const now = Date.now()
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (now - shownAt < 700 || moved > TAP_MOVE_PX || now - start.at > TAP_MAX_MS) {
      lastTapAt = 0
      return
    }
    if (now - lastTapAt > DOUBLE_TAP_MS) {
      lastTapAt = now
      return
    }
    lastTapAt = 0
    // Follow what's actually audible: after reopening the app iPhone may have forced the clip muted.
    const videoVisible = !videoEl.classList.contains('hidden')
    const nextSoundOn = videoVisible ? videoEl.muted : !motivationSoundOn()
    setMotivationSound(nextSoundOn)
    updateRestSoundHint(nextSoundOn)
    if (!videoEl.classList.contains('hidden')) {
      videoEl.muted = !nextSoundOn
      videoEl.play()?.catch?.(() => {})
    }
  })
}

function returnFromRestScreen() {
  if (currentView !== 'rest') return
  if (workoutMode && activeFolder && workoutState) {
    renderWorkout()
    return
  }
  if (activeFolder) {
    renderFolder(activeExerciseGroups)
    return
  }
  renderHome()
}

function renderBottomNav(activeTab) {
  const tabs = [
    ['day', 'Day'],
    ['gym', 'Gym'],
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
      if (tab === 'day') renderDay()
      if (tab === 'gym') renderHome()
      if (tab === 'plan') {
        plannerMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        if (!plannerSelectedDate || plannerSelectedDate.slice(0, 7) !== todayDateKey().slice(0, 7)) plannerSelectedDate = todayDateKey()
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
  const showHeader = options.showHeader !== false
  viewVersion += 1
  currentView = options.view || options.navTab || ''
  const lockDayRunner = currentView === 'day-runner'
  document.documentElement.classList.toggle('day-runner-active', lockDayRunner)
  document.body.classList.toggle('day-runner-active', lockDayRunner)
  app.innerHTML = `
    <main class="shell ${workoutMode ? 'workout-shell' : ''} ${options.navTab ? 'has-bottom-nav' : ''} ${showHeader ? '' : 'shell-no-header'}">
      ${showHeader ? `<header class="topbar">
        <div class="topbar-title">
          <div class="brand-name brand-name-compact">battle angel</div>
          <h1 id="page-title">${escapeHtml(title)}</h1>
        </div>
        ${showTimer ? `<div class="topbar-actions">
          <button type="button" id="timer-toggle" class="timer-chip">rest <span id="timer-mini">2:30</span></button>
        </div>` : ''}
      </header>` : ''}
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
      ${isImagePath(video.video_path)
        ? `<img src="${escapeHtml(video.signedUrl)}" alt="${escapeHtml(video.name)}" loading="lazy" />`
        : `<video controls playsinline webkit-playsinline preload="metadata" src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(video.name)}"></video>`}
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
          <span class="file-picker-button">Add videos or photos</span>
          <span class="picked-files">Shuffled during rest · photos show ${MOTIVATION_IMAGE_SECONDS}s each</span>
          <input id="motivation-videos" type="file" accept="video/*,image/*,.mp4,.mov,.m4v,.webm,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif" multiple aria-label="Choose motivation videos or photos" />
        </label>
        <div id="motivation-status" class="status-line motivation-status" aria-live="polite"></div>
        ${items ? `<div class="motivation-list">${items}</div>` : ''}
      </div>
    </details>`
}

function renderDailyEditor() {
  const progress = currentDailyProgress()
  const rows = dailySteps.map((step, index) => {
    const substeps = normalizeDailySubsteps(step.substeps)
    return `
    <details class="daily-edit-item">
      <summary>
        <span>${index + 1}. ${escapeHtml(step.title)}</span>
        <span class="daily-edit-more">${substeps.length ? `${substeps.length} substeps · ` : ''}Edit</span>
      </summary>
      <form class="daily-edit-form" data-daily-edit="${step.id}">
        <label>
          <span class="eyebrow">STEP</span>
          <input name="title" type="text" maxlength="${DAILY_STEP_TITLE_MAX}" required value="${escapeHtml(step.title)}" />
        </label>
        <label>
          <span class="eyebrow">SHORT NOTE · OPTIONAL</span>
          <textarea name="note" maxlength="${DAILY_STEP_NOTE_MAX}" rows="2" placeholder="Only what you need to remember">${escapeHtml(step.note || '')}</textarea>
        </label>
        <details class="daily-substeps-editor" ${substeps.length ? 'open' : ''}>
          <summary>Substeps${substeps.length ? ` · ${substeps.length}` : ' · optional'}</summary>
          <label>
            <span class="eyebrow">ONE PER LINE</span>
            <textarea name="substeps" rows="${Math.min(6, Math.max(3, substeps.length + 1))}" placeholder="Brush teeth\nSkincare\nGet dressed">${escapeHtml(dailySubstepsText(step))}</textarea>
          </label>
        </details>
        <div class="daily-edit-actions">
          <button type="submit" class="primary-button">Save</button>
          <button type="button" class="secondary-button" data-daily-move="up" data-daily-step-id="${step.id}" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button type="button" class="secondary-button" data-daily-move="down" data-daily-step-id="${step.id}" ${index === dailySteps.length - 1 ? 'disabled' : ''}>Down</button>
          <button type="button" class="ghost-danger" data-daily-delete="${step.id}">Delete</button>
        </div>
      </form>
    </details>`
  }).join('')

  return `
    <details class="daily-editor" ${dailySteps.length ? '' : 'open'}>
      <summary>Edit routine</summary>
      <div class="daily-editor-body">
        <form id="add-daily-step" class="daily-add-form">
          <label>
            <span class="eyebrow">NEW STEP</span>
            <input id="daily-step-title" type="text" maxlength="${DAILY_STEP_TITLE_MAX}" required placeholder="e.g. Get ready" />
          </label>
          <label>
            <span class="eyebrow">SHORT NOTE · OPTIONAL</span>
            <textarea id="daily-step-note" maxlength="${DAILY_STEP_NOTE_MAX}" rows="2" placeholder="Only if it helps"></textarea>
          </label>
          <details class="daily-substeps-editor">
            <summary>Add substeps · optional</summary>
            <label>
              <span class="eyebrow">ONE PER LINE</span>
              <textarea id="daily-step-substeps" rows="4" placeholder="Brush teeth\nSkincare\nGet dressed"></textarea>
            </label>
          </details>
          <button type="submit" class="primary-button">Add step</button>
        </form>
        ${rows ? `<div class="daily-edit-list">${rows}</div>` : '<div class="daily-editor-empty">Add your routine once. During the day you only see the next action.</div>'}
        ${progress.started_at ? '<button type="button" class="text-button danger-text daily-reset" id="reset-day-progress">Restart today</button>' : ''}
        <div id="daily-editor-status" class="status-line" aria-live="polite"></div>
      </div>
    </details>`
}

function bindDailyEditor() {
  document.querySelector('#add-daily-step')?.addEventListener('submit', addDailyStep)
  document.querySelectorAll('[data-daily-edit]').forEach((form) => form.addEventListener('submit', updateDailyStep))
  document.querySelectorAll('[data-daily-move]').forEach((button) => {
    button.addEventListener('click', () => moveDailyStep(button.dataset.dailyStepId, button.dataset.dailyMove))
  })
  document.querySelectorAll('[data-daily-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteDailyStep(button.dataset.dailyDelete))
  })
  document.querySelector('#reset-day-progress')?.addEventListener('click', resetTodayDailyProgress)
}

function renderDay(errorMessage = '', options = {}) {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false

  if (!dailySystemAvailable) {
    renderShell(`
      <div class="notice error">Daily system needs the latest Supabase schema once. Your gym data is untouched.</div>`,
      { title: 'Day', showAccount: false, showTimer: false, navTab: 'day', view: 'day' })
    return
  }

  const progress = currentDailyProgress()
  const resolved = dailyResolvedStepIds(progress)
  const completedCount = dailySteps.filter((step) => resolved.has(step.id)).length
  const allComplete = dailySteps.length > 0 && completedCount >= dailySteps.length
  const inProgress = Boolean(progress.started_at) && !allComplete

  // Once the day has started, opening battle angel goes straight back to the next action.
  // Exit is the deliberate escape hatch to edit or inspect the routine.
  if (inProgress && !options.forceOverview && !errorMessage) {
    renderDayRunner()
    return
  }

  let mainCard = ''
  if (!dailySteps.length) {
    mainCard = `
      <section class="day-start-card">
        <div class="today-label">Daily system</div>
        <h2>Build your sequence.</h2>
        <p>Add it once. battle angel will serve one next action at a time.</p>
      </section>`
  } else if (allComplete) {
    mainCard = `
      <section class="day-complete-card">
        <div class="day-complete-mark">Done</div>
        <h2>Day complete.</h2>
      </section>`
  } else {
    mainCard = `
      <section class="day-start-card">
        <div class="today-label">${inProgress ? 'In progress' : 'Today'}</div>
        <h2>${inProgress ? 'Continue.' : 'Start.'}</h2>
        <p>${inProgress ? `${completedDailyActionsCount(progress)} of ${totalDailyActions()} actions passed.` : `${totalDailyActions()} actions. One at a time.`}</p>
        <button type="button" class="start-workout-button day-start-button" id="start-day">${inProgress ? 'Continue' : 'Start my day'} <span aria-hidden="true">&rarr;</span></button>
      </section>`
  }

  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${usingCachedData ? '<div class="offline-note">Offline · saved routine available</div>' : ''}
    ${mainCard}
    ${renderDailyEditor()}`,
    { title: 'Day', showAccount: false, showTimer: false, navTab: 'day', view: options.forceOverview ? 'day-overview' : 'day' })

  document.querySelector('#start-day')?.addEventListener('click', startDailySystem)
  bindDailyEditor()
}

function renderDayRunner() {
  if (!dailySteps.length) {
    renderDay()
    return
  }
  const progress = currentDailyProgress()
  const action = getCurrentDailyAction()
  if (!action) {
    progress.is_complete = true
    progress.later_step_ids = []
    saveDailyProgress(progress)
    clearDailyUndo()
    renderDay()
    return
  }

  const { step, substeps, substepIndex, title, isSubstep } = action
  const gymState = !isSubstep ? getDailyGymState(step) : null

  // If today's planned gym work is already finished, the Gym routine step disappears automatically.
  if (gymState?.planned.length && gymState.remaining.length === 0) {
    advanceDailyAction(step.id, false, { bypassGuard: true, rememberUndo: false, render: false })
    renderDayRunner()
    return
  }

  const actionNumber = completedDailyActionsCount(progress) + 1
  const actionTotal = totalDailyActions()
  const substepMeta = isSubstep ? `${substepIndex + 1} of ${substeps.length}` : ''
  const unresolvedCount = getOrderedUnresolvedDailySteps(progress).length
  const canLater = unresolvedCount > 1

  let cardBody = ''
  let rightLabel = 'Done'
  if (gymState) {
    const plannedNames = gymState.planned.map((folder) => folder.name).join(' + ')
    const nextFolder = gymState.remaining[0] || null
    rightLabel = nextFolder ? 'Start' : 'Choose'
    cardBody = `
      <div class="day-step-parent">Gym${gymState.planned.length > 1 ? ` <span>${gymState.planned.length} modules</span>` : ''}</div>
      <h2>${escapeHtml(plannedNames || 'Gym')}</h2>
      ${step.note ? `<p>${escapeHtml(step.note)}</p>` : ''}
      ${gymState.planned.length ? '' : '<p class="day-gym-empty">No workout planned today.</p>'}`
  } else {
    cardBody = `
      ${isSubstep ? `<div class="day-step-parent">${escapeHtml(step.title)} <span>${escapeHtml(substepMeta)}</span></div>` : ''}
      <h2>${escapeHtml(title)}</h2>
      ${step.note ? `<p>${escapeHtml(step.note)}</p>` : ''}`
  }

  renderShell(`
    <div class="day-runner-screen">
      <div class="day-runner-top">
        <div class="day-runner-position">${actionNumber} / ${actionTotal}</div>
        <button type="button" class="text-button day-exit" id="exit-day-runner">Exit</button>
      </div>
      <section class="day-step-card ${gymState ? 'day-step-card-gym' : ''}" id="day-step-card" aria-label="Current action: ${escapeHtml(title)}">
        ${cardBody}
      </section>
      <div class="day-action-controls" aria-label="Daily action controls">
        <div class="day-secondary-actions">
          ${canLater ? '<button type="button" class="day-option-button" id="later-daily-step">Later</button>' : ''}
          <button type="button" class="day-option-button" id="skip-daily-step">Skip</button>
        </div>
        <button type="button" class="day-primary-action" id="primary-daily-action">${escapeHtml(rightLabel)} <span aria-hidden="true">&rarr;</span></button>
      </div>
      ${renderDailyUndoToast()}
    </div>`,
    { title: 'Day', showAccount: false, showTimer: false, showHeader: false, view: 'day-runner' })

  document.querySelector('#primary-daily-action')?.addEventListener('click', () => triggerDailyPrimaryAction(step))
  document.querySelector('#skip-daily-step')?.addEventListener('click', () => skipDailyStep(step.id))
  document.querySelector('#later-daily-step')?.addEventListener('click', () => deferDailyStep(step.id))
  document.querySelector('#exit-day-runner')?.addEventListener('click', () => renderDay('', { forceOverview: true }))
  bindDailyUndoToast()
}

async function addDailyStep(event) {
  event.preventDefault()
  if (!currentUser || !dailySystemAvailable) return
  const title = document.querySelector('#daily-step-title')?.value.trim().slice(0, DAILY_STEP_TITLE_MAX)
  const note = document.querySelector('#daily-step-note')?.value.trim().slice(0, DAILY_STEP_NOTE_MAX) || ''
  const substeps = parseDailySubstepsText(document.querySelector('#daily-step-substeps')?.value || '')
  const status = document.querySelector('#daily-editor-status')
  if (!title) return
  if (status) status.textContent = 'Saving...'
  const nextOrder = Math.max(0, ...dailySteps.map((step) => Number(step.sort_order) || 0)) + 1
  const { error } = await supabase.from('daily_steps').insert({
    user_id: currentUser.id,
    title,
    note,
    substeps,
    sort_order: nextOrder,
    updated_at: new Date().toISOString()
  })
  if (error) {
    if (status) status.textContent = isNetworkError(error) ? 'Connect to edit your routine.' : error.message
    return
  }
  await loadDailySystem()
  saveSnapshot()
  renderDay()
}

async function updateDailyStep(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.dailyEdit
  const title = form.elements.title.value.trim().slice(0, DAILY_STEP_TITLE_MAX)
  const note = form.elements.note.value.trim().slice(0, DAILY_STEP_NOTE_MAX)
  const substeps = parseDailySubstepsText(form.elements.substeps?.value || '')
  if (!title) return
  const { error } = await supabase.from('daily_steps').update({
    title,
    note,
    substeps,
    updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) {
    alert(isNetworkError(error) ? 'Connect to edit your routine.' : error.message)
    return
  }
  await loadDailySystem()
  saveSnapshot()
  renderDay()
}

async function moveDailyStep(stepId, direction) {
  const index = dailySteps.findIndex((step) => step.id === stepId)
  if (index < 0) return
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= dailySteps.length) return
  const ordered = [...dailySteps]
  const [moved] = ordered.splice(index, 1)
  ordered.splice(target, 0, moved)
  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await supabase.from('daily_steps').update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq('id', ordered[i].id)
    if (error) {
      alert(isNetworkError(error) ? 'Connect to reorder your routine.' : error.message)
      return
    }
  }
  await loadDailySystem()
  saveSnapshot()
  renderDay()
}

async function deleteDailyStep(stepId) {
  const step = dailySteps.find((item) => item.id === stepId)
  if (!step || !confirm(`Delete "${step.title}"?`)) return
  const { error } = await supabase.from('daily_steps').delete().eq('id', stepId)
  if (error) {
    alert(isNetworkError(error) ? 'Connect to edit your routine.' : error.message)
    return
  }
  const progress = currentDailyProgress()
  progress.completed_step_ids = progress.completed_step_ids.filter((id) => id !== stepId)
  progress.skipped_step_ids = (progress.skipped_step_ids || []).filter((id) => id !== stepId)
  progress.later_step_ids = (progress.later_step_ids || []).filter((id) => id !== stepId)
  const positions = { ...(progress.substep_positions || {}) }
  delete positions[stepId]
  progress.substep_positions = positions
  progress.is_complete = false
  saveDailyProgress(progress)
  await loadDailySystem()
  saveSnapshot()
  renderDay()
}

function resetTodayDailyProgress() {
  if (!confirm('Restart today from step 1?')) return
  saveDailyProgress(emptyDailyProgress(todayDateKey()))
  renderDay()
}

function renderHome(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false

  const saved = workoutState || readWorkoutState()
  const savedFolder = saved ? folders.find((folder) => folder.id === saved.folderId) : null
  const todayKey = todayDateKey()
  const todayFolders = getScheduledFolders(todayKey)
  const missedFolders = savedFolder ? [] : getMissedYesterdayFolders()
  const todayIds = new Set(todayFolders.map((folder) => folder.id))

  const resumeCard = savedFolder && !todayIds.has(savedFolder.id) ? `
    <button type="button" class="resume-home" id="resume-home">
      <span>Resume</span>
      <strong>${escapeHtml(savedFolder.name)}</strong>
    </button>` : ''

  const todayRows = todayFolders.map((folder) => {
    const isSaved = saved?.folderId === folder.id
    const isDone = wasWorkoutCompleted(todayKey, folder.id)
    return `
      <div class="today-workout-row">
        <div class="today-workout-name">${escapeHtml(folder.name)}</div>
        <button type="button" class="start-workout-button today-module-start" data-start-today="${folder.id}" ${isDone ? 'disabled' : ''}>${isDone ? 'Done' : (isSaved ? 'Resume' : 'Start')}</button>
      </div>`
  }).join('')

  const todayCard = `
    <section class="today-card">
      <div class="today-label">Today</div>
      ${todayFolders.length ? `
        <div class="today-workout-list">${todayRows}</div>
        <button type="button" class="quiet-action" id="preload-today">Save videos</button>
        <div id="preload-status" class="micro-status" aria-live="polite"></div>` : `
        <div class="today-empty">No workout planned</div>
        <button type="button" class="secondary-button full-button today-choose" id="choose-workout">Choose workout</button>`}
    </section>`

  const missedCard = missedFolders.length ? `
    <button type="button" class="missed-card" id="move-missed-today">
      <span>Missed yesterday</span>
      <strong>${escapeHtml(missedFolders.map((folder) => folder.name).join(' + '))}</strong>
      <small>Move to today</small>
    </button>` : ''

  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${usingCachedData ? '<div class="offline-note">Offline · showing your saved plan</div>' : ''}
    ${resumeCard}
    ${todayCard}
    ${missedCard}
    ${historyAvailable && planningUpgradeAvailable ? `<section class="week-card">${renderWeekProgress(todayKey, { streak: true })}</section>` : ''}
    <button type="button" class="quiet-action gym-all-workouts" id="open-all-workouts">All workouts</button>`, { title: 'Gym', showAccount: false, showTimer: false, navTab: 'gym', view: 'home' })

  document.querySelectorAll('[data-start-today]').forEach((button) => {
    button.addEventListener('click', () => openFolder(button.dataset.startToday, { mode: 'workout' }))
  })
  document.querySelector('#resume-home')?.addEventListener('click', () => openFolder(savedFolder.id, { mode: 'workout' }))
  document.querySelector('#choose-workout')?.addEventListener('click', renderWorkouts)
  document.querySelector('#open-all-workouts')?.addEventListener('click', renderWorkouts)
  document.querySelector('#move-missed-today')?.addEventListener('click', moveMissedToToday)
  document.querySelector('#preload-today')?.addEventListener('click', () => preloadScheduledVideos(todayFolders))
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
    </details>`, { title: 'Workouts', showAccount: false, showTimer: false, navTab: 'gym', view: 'workouts' })

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
      <div class="app-version">battle angel v${APP_VERSION}</div>
    </section>`, { title: 'More', showAccount: false, showTimer: false, navTab: 'more' })

  document.querySelector('#theme-toggle')?.addEventListener('click', () => { toggleTheme(); renderMore() })
  document.querySelector('#backup-library')?.addEventListener('click', downloadFullBackup)
  document.querySelector('#sign-out')?.addEventListener('click', () => supabase.auth.signOut())
  document.querySelector('#motivation-videos')?.addEventListener('change', uploadMotivationVideos)
  document.querySelectorAll('[data-remove-motivation]').forEach((button) => {
    button.addEventListener('click', () => removeMotivationVideo(button.dataset.removeMotivation, button.dataset.motivationPath))
  })
}

function calendarWorkoutLabel(folderList) {
  if (!folderList.length) return ''
  const names = folderList.slice(0, 2).map((folder) => folder.name)
  return `${names.join(' · ')}${folderList.length > 2 ? ` +${folderList.length - 2}` : ''}`
}

function getCompletedFolders(dateKey) {
  const ids = new Set(workoutHistory.filter((entry) => entry.workout_date === dateKey).map((entry) => entry.folder_id))
  return folders.filter((folder) => ids.has(folder.id))
}

// Planned modules first, then anything done that day that wasn't on the plan.
function getDayFolders(dateKey) {
  const planned = getScheduledFolders(dateKey)
  const plannedIds = new Set(planned.map((folder) => folder.id))
  return [...planned, ...getCompletedFolders(dateKey).filter((folder) => !plannedIds.has(folder.id))]
}

// Each workout module marked done counts once (Chest + Triceps on one day = 2).
function weekDoneCount(weekStartKey) {
  let count = 0
  for (let i = 0; i < 7; i += 1) count += getCompletedFolders(addDaysKey(weekStartKey, i)).length
  return count
}

function isGoldenWeek(weekStartKey) {
  return weekDoneCount(weekStartKey) >= GOLDEN_WEEK_TARGET
}

function calendarDayCell(key, dayNumber) {
  const dayFolders = getDayFolders(key)
  const doneCount = getCompletedFolders(key).length
  const allDone = dayFolders.length > 0 && doneCount === dayFolders.length
  const isToday = key === todayDateKey()
  const selected = key === plannerSelectedDate
  return `
    <button type="button" class="calendar-day ${isToday ? 'is-today' : ''} ${dayFolders.length ? 'is-planned' : ''} ${allDone ? 'is-done' : ''} ${selected ? 'is-selected' : ''}" data-plan-date="${key}" aria-label="${escapeHtml(formatPlanDate(key))}${dayFolders.length ? `: ${escapeHtml(dayFolders.map((folder) => folder.name).join(', '))}` : ''}${doneCount ? `, ${doneCount} done` : ''}">
      <span class="calendar-number">${dayNumber}${doneCount ? '<span class="calendar-done" aria-hidden="true">&#10003;</span>' : ''}</span>
      ${dayFolders.length ? `<span class="calendar-workout">${escapeHtml(calendarWorkoutLabel(dayFolders))}</span>` : ''}
    </button>`
}

function calendarCells(monthStart) {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  // Weeks run Monday -> Sunday everywhere: calendar rows, golden weeks, and Repeat last week.
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const slots = []
  for (let i = 0; i < firstDay; i += 1) slots.push(null)
  for (let day = 1; day <= days; day += 1) slots.push(day)
  while (slots.length % 7) slots.push(null)

  const weeks = []
  for (let row = 0; row < slots.length; row += 7) {
    const rowSlots = slots.slice(row, row + 7)
    const firstDayInRow = rowSlots.find((day) => day !== null)
    const weekStart = startOfWeekKey(formatLocalDateKey(new Date(year, month, firstDayInRow)))
    const golden = isGoldenWeek(weekStart)
    const cells = rowSlots.map((day) => day === null
      ? '<div class="calendar-blank" aria-hidden="true"></div>'
      : calendarDayCell(formatLocalDateKey(new Date(year, month, day)), day)).join('')
    weeks.push(`<div class="calendar-week ${golden ? 'is-golden' : ''}"${golden ? ' aria-label="Golden week"' : ''}>${cells}</div>`)
  }
  return weeks.join('')
}

// Consecutive golden weeks up to now. The current week only counts once it's golden,
// so an unfinished week never breaks the streak.
function goldenStreak() {
  let week = startOfWeekKey(todayDateKey())
  if (!isGoldenWeek(week)) week = addDaysKey(week, -7)
  let count = 0
  while (count < 60 && isGoldenWeek(week)) {
    count += 1
    week = addDaysKey(week, -7)
  }
  return count
}

function renderStreakLine() {
  const streak = goldenStreak()
  if (!streak) return ''
  const thisWeekGolden = isGoldenWeek(startOfWeekKey(todayDateKey()))
  if (streak === 1) return thisWeekGolden ? '' : '<div class="golden-streak">Last week was golden. Keep it going.</div>'
  return `<div class="golden-streak">${streak} golden weeks in a row</div>`
}

function renderWeekProgress(dateKey, options = {}) {
  const done = weekDoneCount(startOfWeekKey(dateKey))
  const streak = options.streak ? renderStreakLine() : ''
  if (done >= GOLDEN_WEEK_TARGET) {
    return `<div class="week-progress is-golden">Golden week · ${done} workouts done</div>${streak}`
  }
  const pips = Array.from({ length: GOLDEN_WEEK_TARGET }, (_, i) => `<span class="week-pip ${i < done ? 'filled' : ''}"></span>`).join('')
  return `<div class="week-progress"><span class="week-pips" aria-hidden="true">${pips}</span>${done} of ${GOLDEN_WEEK_TARGET} done this week</div>${streak}`
}

function renderDoneControls(dateKey) {
  if (dateKey > todayDateKey()) return ''
  const dayFolders = getDayFolders(dateKey)
  if (!dayFolders.length) return '<div class="plan-done-empty">Tap the muscles you trained to mark them done.</div>'
  if (!canMarkDone()) return '<div class="plan-done-empty">Run schema.sql in Supabase to turn on marking days done.</div>'
  const rows = dayFolders.map((folder) => {
    const done = wasWorkoutCompleted(dateKey, folder.id)
    return `
      <div class="plan-done-row">
        <span class="plan-done-name">${escapeHtml(folder.name)}</span>
        <button type="button" class="plan-done-toggle ${done ? 'done' : ''}" data-done-folder="${folder.id}" aria-pressed="${done}">${done ? '&#10003; Done' : 'Mark done'}</button>
      </div>`
  }).join('')
  return `<div class="plan-done-list">${rows}</div>`
}

function renderPlanner(errorMessage = '') {
  workoutMode = false
  activeFolder = null
  activeExerciseGroups = []
  folderEditMode = false
  if (!plannerSelectedDate) plannerSelectedDate = todayDateKey()

  const selectedFolders = getScheduledFolders(plannerSelectedDate)
  const selectedIds = new Set(selectedFolders.map((folder) => folder.id))
  const weeklyFolders = getWeeklyFolders(plannerSelectedDate)
  const tomorrowKey = addDaysKey(plannerSelectedDate, 1)
  const folderButtons = folders.map((folder) => `
    <button type="button" class="plan-muscle-button ${selectedIds.has(folder.id) ? 'selected' : ''}" data-schedule-folder="${folder.id}">${escapeHtml(folder.name)}</button>`).join('')
  const moveOptions = selectedFolders.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`).join('')

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
    ${!planningUpgradeAvailable ? `<div class="notice info">Run the planning upgrade SQL once.</div>` : ''}
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${plannerStatusMessage ? `<div class="status-line planner-status">${escapeHtml(plannerStatusMessage)}</div>` : ''}
    <div class="calendar-weekdays" aria-hidden="true">
      <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
    </div>
    <div class="calendar-grid" aria-label="Workout calendar">${calendarCells(plannerMonthStart)}</div>
    ${canMarkDone() ? '<div class="calendar-hint">Hold a day to mark it done</div>' : ''}
    <section class="plan-day-editor">
      <div class="plan-day-title">${escapeHtml(formatPlanDate(plannerSelectedDate))}</div>
      ${renderWeekProgress(plannerSelectedDate, { streak: startOfWeekKey(plannerSelectedDate) === startOfWeekKey(todayDateKey()) })}
      <div class="plan-muscle-grid">${folderButtons}</div>
      ${renderDoneControls(plannerSelectedDate)}
      ${selectedFolders.length ? `<div class="plan-day-actions">
        <details class="move-plan">
          <summary>Move</summary>
          <form id="move-plan-form" class="move-plan-form">
            ${selectedFolders.length > 1 ? `<select id="move-plan-folder" aria-label="Workout to move">${moveOptions}</select>` : `<input id="move-plan-folder" type="hidden" value="${selectedFolders[0].id}" />`}
            <input id="move-plan-date" type="date" value="${tomorrowKey}" aria-label="Move workout to date" />
            <button type="submit" class="secondary-button">Move</button>
          </form>
        </details>
        <button type="button" class="text-button danger-text" id="clear-plan">Clear day</button>
        ${hasDateScheduleOverride(plannerSelectedDate) && weeklyFolders.length ? '<button type="button" class="text-button" id="reset-weekly">Use weekly</button>' : ''}
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
  const LONG_PRESS_MS = 450
  document.querySelectorAll('[data-plan-date]').forEach((button) => {
    let pressTimer = null
    let start = null
    let longPressed = false
    const cancelPress = () => {
      if (pressTimer) window.clearTimeout(pressTimer)
      pressTimer = null
      button.classList.remove('is-pressing')
    }
    button.addEventListener('pointerdown', (event) => {
      longPressed = false
      start = { x: event.clientX, y: event.clientY }
      button.classList.add('is-pressing')
      pressTimer = window.setTimeout(() => {
        pressTimer = null
        longPressed = true
        button.classList.remove('is-pressing')
        quickToggleDayDone(button.dataset.planDate)
      }, LONG_PRESS_MS)
    })
    button.addEventListener('pointermove', (event) => {
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancelPress()
    })
    button.addEventListener('pointerup', cancelPress)
    button.addEventListener('pointercancel', cancelPress)
    button.addEventListener('pointerleave', cancelPress)
    button.addEventListener('contextmenu', (event) => event.preventDefault())
    button.addEventListener('click', () => {
      if (longPressed) {
        longPressed = false
        return
      }
      plannerSelectedDate = button.dataset.planDate
      plannerStatusMessage = ''
      renderPlanner()
    })
  })
  document.querySelectorAll('[data-schedule-folder]').forEach((button) => {
    button.addEventListener('click', () => toggleScheduledWorkout(plannerSelectedDate, button.dataset.scheduleFolder))
  })
  document.querySelectorAll('[data-done-folder]').forEach((button) => {
    button.addEventListener('click', () => {
      const folderId = button.dataset.doneFolder
      setWorkoutDone(plannerSelectedDate, folderId, !wasWorkoutCompleted(plannerSelectedDate, folderId))
    })
  })
  document.querySelector('#clear-plan')?.addEventListener('click', () => clearScheduledWorkout(plannerSelectedDate))
  document.querySelector('#reset-weekly')?.addEventListener('click', () => resetScheduledWorkoutToWeekly(plannerSelectedDate))
  document.querySelector('#move-plan-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    moveScheduledWorkout(plannerSelectedDate, document.querySelector('#move-plan-date').value, document.querySelector('#move-plan-folder').value)
  })
}

function renderWeeklyPlan(errorMessage = '') {
  if (!planningUpgradeAvailable || !weeklyPlanAvailable) {
    plannerStatusMessage = 'Run the planning upgrade SQL first.'
    renderPlanner()
    return
  }
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const rows = labels.map((label, weekday) => {
    const selected = new Set(weeklyPlanEntries.filter((entry) => Number(entry.weekday) === weekday).map((entry) => entry.folder_id))
    const buttons = folders.map((folder) => `<button type="button" class="weekly-muscle-button ${selected.has(folder.id) ? 'selected' : ''}" data-weekly-day="${weekday}" data-weekly-folder="${folder.id}">${escapeHtml(folder.name)}</button>`).join('')
    return `<section class="weekly-row"><div class="weekly-day-label">${label}</div><div class="weekly-muscle-grid">${buttons}</div></section>`
  }).join('')

  renderShell(`
    <button type="button" class="back-button" id="weekly-back">Back</button>
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    <div class="weekly-plan-list">${rows}</div>
    <div id="weekly-status" class="status-line planner-status" aria-live="polite"></div>`, { title: 'Weekly plan', showAccount: false, showTimer: false })
  document.querySelector('#weekly-back').addEventListener('click', renderPlanner)
  document.querySelectorAll('[data-weekly-day][data-weekly-folder]').forEach((button) => {
    button.addEventListener('click', () => toggleWeeklyPlanDay(Number(button.dataset.weeklyDay), button.dataset.weeklyFolder))
  })
}

async function saveDateOverride(dateKey, folderIds) {
  const uniqueIds = [...new Set((folderIds || []).filter(Boolean))]
  const { error: deleteError } = await supabase.from('workout_schedule').delete().eq('workout_date', dateKey)
  if (deleteError) throw deleteError

  if (uniqueIds.length) {
    const rows = uniqueIds.map((folderId) => ({
      user_id: currentUser.id,
      workout_date: dateKey,
      folder_id: folderId,
      is_skipped: false,
      updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('workout_schedule').insert(rows)
    if (error) throw error
    return
  }

  if (planningUpgradeAvailable && getWeeklyFolders(dateKey).length) {
    const { error } = await supabase.from('workout_schedule').insert({
      user_id: currentUser.id,
      workout_date: dateKey,
      folder_id: null,
      is_skipped: true,
      updated_at: new Date().toISOString()
    })
    if (error) throw error
  }
}

async function toggleScheduledWorkout(dateKey, folderId) {
  if (!scheduleAvailable || !dateKey || !folderId) return
  const currentIds = new Set(getScheduledFolders(dateKey).map((folder) => folder.id))
  if (currentIds.has(folderId)) currentIds.delete(folderId)
  else currentIds.add(folderId)
  try {
    await saveDateOverride(dateKey, [...currentIds])
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
    await saveDateOverride(dateKey, [])
    await loadSchedule()
    plannerStatusMessage = ''
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

async function resetScheduledWorkoutToWeekly(dateKey) {
  try {
    const { error } = await supabase.from('workout_schedule').delete().eq('workout_date', dateKey)
    if (error) throw error
    await loadSchedule()
    plannerStatusMessage = ''
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

async function moveScheduledWorkout(fromDate, toDate, folderId) {
  if (!scheduleAvailable || !fromDate || !toDate || fromDate === toDate || !folderId) return
  const sourceIds = getScheduledFolders(fromDate).map((folder) => folder.id)
  if (!sourceIds.includes(folderId)) return
  const targetIds = getScheduledFolders(toDate).map((folder) => folder.id)
  const nextSource = sourceIds.filter((id) => id !== folderId)
  const nextTarget = [...new Set([...targetIds, folderId])]

  try {
    await saveDateOverride(fromDate, nextSource)
    await saveDateOverride(toDate, nextTarget)
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
  const hasPlans = Array.from({ length: 7 }, (_, i) => getScheduledFolders(addDaysKey(weekStart, i)).length > 0).some(Boolean)
  if (hasPlans && !confirm('Replace this week with last week?')) return
  try {
    for (let i = 0; i < 7; i += 1) {
      const target = addDaysKey(weekStart, i)
      const source = addDaysKey(target, -7)
      const sourceIds = getScheduledFolders(source).map((folder) => folder.id)
      await saveDateOverride(target, sourceIds)
    }
    await loadSchedule()
    plannerStatusMessage = 'Last week copied.'
    renderPlanner()
  } catch (error) {
    renderPlanner(error.message)
  }
}

async function toggleWeeklyPlanDay(weekday, folderId) {
  const status = document.querySelector('#weekly-status')
  const exists = weeklyPlanEntries.some((entry) => Number(entry.weekday) === weekday && entry.folder_id === folderId)
  if (status) status.textContent = 'Saving...'
  try {
    if (exists) {
      const { error } = await supabase.from('workout_weekly_plan').delete().eq('weekday', weekday).eq('folder_id', folderId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('workout_weekly_plan').upsert({
        user_id: currentUser.id,
        weekday,
        folder_id: folderId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,weekday,folder_id' })
      if (error) throw error
    }
    await loadSchedule()
    renderWeeklyPlan()
  } catch (error) {
    renderWeeklyPlan(error.message)
  }
}

async function moveMissedToToday() {
  const yesterday = addDaysKey(todayDateKey(), -1)
  const missed = getMissedYesterdayFolders()
  if (!missed.length) return
  try {
    const todayIds = getScheduledFolders(todayDateKey()).map((folder) => folder.id)
    await saveDateOverride(todayDateKey(), [...new Set([...todayIds, ...missed.map((folder) => folder.id)])])
    const remainingYesterday = getScheduledFolders(yesterday).filter((folder) => wasWorkoutCompleted(yesterday, folder.id)).map((folder) => folder.id)
    await saveDateOverride(yesterday, remainingYesterday)
    await loadSchedule()
    renderHome()
  } catch (error) {
    renderHome(error.message)
  }
}

// Updates this phone right away and queues the cloud write, so it works offline too.
function applyDoneLocally(dateKey, folderId, done) {
  const match = (entry) => entry.workout_date === dateKey && entry.folder_id === folderId
  const pending = readPending()
  pending.completions = pending.completions.filter((entry) => !match(entry))
  pending.uncompletions = pending.uncompletions.filter((entry) => !match(entry))
  if (done) {
    const completedAt = new Date().toISOString()
    if (!wasWorkoutCompleted(dateKey, folderId)) {
      workoutHistory = [{ id: `local-${folderId}-${dateKey}`, workout_date: dateKey, folder_id: folderId, completed_at: completedAt }, ...workoutHistory]
    }
    pending.completions.push({ workout_date: dateKey, folder_id: folderId, completed_at: completedAt })
  } else {
    workoutHistory = workoutHistory.filter((entry) => !match(entry))
    pending.uncompletions.push({ workout_date: dateKey, folder_id: folderId })
  }
  writePending(pending)
}

function canMarkDone() {
  return historyAvailable && planningUpgradeAvailable
}

async function setWorkoutDone(dateKey, folderId, done) {
  if (!currentUser || !dateKey || !folderId || dateKey > todayDateKey() || !canMarkDone()) return
  applyDoneLocally(dateKey, folderId, done)
  saveSnapshot()
  renderPlanner()
  await flushPendingWrites()
}

// Long-press a day on the calendar: marks every workout on that day done, or undoes them if all are done.
async function quickToggleDayDone(dateKey) {
  plannerSelectedDate = dateKey
  if (dateKey > todayDateKey()) {
    plannerStatusMessage = "Future days can't be marked done yet."
    renderPlanner()
    return
  }
  if (!canMarkDone()) {
    plannerStatusMessage = 'Run schema.sql in Supabase to turn on marking days done.'
    renderPlanner()
    return
  }
  const dayFolders = getDayFolders(dateKey)
  if (!dayFolders.length) {
    plannerStatusMessage = 'Pick the muscles you trained below, then hold the day again.'
    renderPlanner()
    return
  }
  const allDone = dayFolders.every((folder) => wasWorkoutCompleted(dateKey, folder.id))
  dayFolders.forEach((folder) => applyDoneLocally(dateKey, folder.id, !allDone))
  saveSnapshot()
  const names = dayFolders.map((folder) => folder.name).join(' + ')
  plannerStatusMessage = allDone ? `${names} on ${formatPlanDate(dateKey, { short: true })}: undone.` : `${names} on ${formatPlanDate(dateKey, { short: true })}: done.`
  renderPlanner()
  await flushPendingWrites()
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

async function preloadScheduledVideos(folderList) {
  const button = document.querySelector('#preload-today')
  const status = document.querySelector('#preload-status')
  if (!button || !status || !folderList?.length) return
  button.disabled = true
  requestPersistentStorage()
  try {
    for (let i = 0; i < folderList.length; i += 1) {
      status.textContent = `Saving ${i + 1}/${folderList.length} workouts...`
      await preloadFolderVideos(folderList[i].id, { sharedButton: button, sharedStatus: status, quietFinish: true })
    }
    if (motivationVideos.length) {
      status.textContent = 'Saving motivation...'
      await saveRowsOffline(motivationVideos, status, 'motivation')
      motivationVideos = await hydrateMotivationRows(stripVideoUrls(motivationVideos))
    }
    status.textContent = 'Videos ready. This phone can train offline.'
    button.textContent = 'Videos ready'
  } catch (error) {
    status.textContent = error.message || 'Could not save videos.'
    button.disabled = false
  }
}

async function saveRowsOffline(rows, status, label = 'videos') {
  const list = rows.filter((row) => row.video_path)
  const missing = []
  for (const row of list) {
    if (!(await getOfflineVideo(row.video_path))) missing.push(row)
  }
  if (!missing.length) return
  const signed = await signVideoPaths(missing.map((row) => row.video_path))
  for (let i = 0; i < missing.length; i += 1) {
    const row = missing[i]
    if (status) status.textContent = `Saving ${label} ${i + 1}/${missing.length}`
    const url = signed[row.video_path]
    if (!url) throw new Error(`Could not save ${row.name}.`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not save ${row.name}.`)
    const blob = await response.blob()
    await putOfflineVideo(row.video_path, blob, row.name)
  }
}

async function preloadFolderVideos(folderId, options = {}) {
  const button = options.sharedButton || document.querySelector('#preload-today')
  const status = options.sharedStatus || document.querySelector('#preload-status')
  if (!folderId || !button || !status) return
  button.disabled = true
  if (!options.quietFinish) status.textContent = 'Preparing...'
  const { rows } = await fetchFolderRows(folderId)
  if (!rows?.length) {
    if (!options.quietFinish) status.textContent = 'No videos yet.'
    return
  }
  await saveRowsOffline(rows, status)
  if (!options.quietFinish) {
    status.textContent = 'Videos ready.'
    button.textContent = 'Videos ready'
  }
}

// ---------- weight history ----------
// One entry per exercise per day (the last weight you used that day).

function weightLogKey(folderId) {
  return `battle-angel-weightlog-${currentUser?.id || 'anon'}-${folderId}`
}

function mergePendingWeightLogs(rows, folderId) {
  const pending = Object.values(readPending().weightLogs).filter((item) => item.folder_id === folderId)
  const byKey = new Map(rows.map((row) => [`${row.exercise_group}|${row.workout_date}`, row]))
  pending.forEach((item) => byKey.set(`${item.exercise_group}|${item.workout_date}`, item))
  return [...byKey.values()].sort((a, b) => String(b.workout_date).localeCompare(String(a.workout_date)))
}

async function loadWeightLog(folderId) {
  const cached = readJson(weightLogKey(folderId), [])
  weightLogRows = mergePendingWeightLogs(Array.isArray(cached) ? cached : [], folderId)
  if (!weightLogAvailable || navigator.onLine === false) return
  try {
    const { data, error } = await raceTimeout(supabase
      .from('exercise_weight_log')
      .select('exercise_group,folder_id,workout_date,weight')
      .eq('folder_id', folderId)
      .order('workout_date', { ascending: false })
      .limit(400), NETWORK_FALLBACK_MS)
    if (error) {
      if (isMissingWeightLogError(error)) weightLogAvailable = false
      return
    }
    writeJson(weightLogKey(folderId), data || [])
    if (activeFolder?.id === folderId) weightLogRows = mergePendingWeightLogs(data || [], folderId)
  } catch {
    // Offline: the cached copy is enough.
  }
}

function getWeightHistory(groupId) {
  return weightLogRows.filter((row) => row.exercise_group === groupId)
}

function logWeight(group, dateKey = todayDateKey()) {
  const weight = String(group?.last_weight || '').trim().slice(0, 40)
  if (!currentUser || !activeFolder || !group || !weight || !weightLogAvailable) return
  const entry = { exercise_group: group.id, folder_id: activeFolder.id, workout_date: dateKey, weight }
  const existing = weightLogRows.find((row) => row.exercise_group === group.id && row.workout_date === dateKey)
  if (existing?.weight === weight) return
  weightLogRows = mergePendingWeightLogs(weightLogRows.filter((row) => !(row.exercise_group === group.id && row.workout_date === dateKey)).concat(entry), activeFolder.id)
  const pending = readPending()
  pending.weightLogs[`${group.id}|${dateKey}`] = entry
  writePending(pending)
  const cached = readJson(weightLogKey(activeFolder.id), [])
  writeJson(weightLogKey(activeFolder.id), [entry, ...(Array.isArray(cached) ? cached : []).filter((row) => !(row.exercise_group === group.id && row.workout_date === dateKey))])
  flushPendingWrites()
}

function renderWeightHistory(group) {
  if (!weightLogAvailable) return '<div class="weight-history-empty">Weight history is off. Run schema.sql in Supabase to turn it on.</div>'
  const history = getWeightHistory(group.id)
  if (!history.length) return '<div class="weight-history-empty">Weight history: enter a weight and finish a set to start it.</div>'
  const rows = history.slice(0, 8).map((row) => `
    <li><span>${escapeHtml(formatPlanDate(row.workout_date, { short: true }))}</span><strong>${escapeHtml(row.weight)}</strong></li>`).join('')
  return `
    <details class="weight-history">
      <summary>Weight history <span class="weight-history-count">${history.length}</span></summary>
      <ol class="weight-history-list">${rows}</ol>
    </details>`
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
  const version = viewVersion

  let result
  try {
    result = await fetchFolderRows(folder.id)
  } catch (error) {
    if (viewVersion !== version) return
    renderFolderError(folder.id, options, error)
    return
  }
  if (viewVersion !== version) return

  revokeOfflineObjectUrls()
  const [hydratedRows] = await Promise.all([hydrateVideoRows(result.rows), loadWeightLog(folder.id)])
  if (viewVersion !== version) return
  activeExerciseGroups = groupExerciseRows(hydratedRows)

  if (options.mode === 'workout' && activeExerciseGroups.length) {
    startOrResumeWorkout()
    return
  }

  renderFolder(activeExerciseGroups, '', result.fromCache ? 'Offline · showing the saved copy of this workout.' : '')
}

function renderFolderError(folderId, options, error) {
  const offline = navigator.onLine === false || /fetch|network|abort|timeout/i.test(String(error?.message || error))
  renderShell(`
    <section class="load-error-card">
      <div class="load-error-title">${offline ? 'No connection' : 'Could not load this workout'}</div>
      <p>${offline ? 'This workout has not been opened on this phone yet, so there is no saved copy. Tap Save videos on Today while you have signal.' : escapeHtml(error?.message || 'Please try again.')}</p>
      <div class="load-error-actions">
        <button type="button" class="primary-button" id="retry-folder">Try again</button>
        <button type="button" class="secondary-button" id="error-back">Back</button>
      </div>
    </section>`, { showAccount: false, showTimer: false })
  document.querySelector('#retry-folder').addEventListener('click', () => openFolder(folderId, options))
  document.querySelector('#error-back').addEventListener('click', () => {
    activeFolder = null
    renderHome()
  })
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

function renderFolder(groups, errorMessage = '', infoMessage = '') {
  workoutMode = false
  releaseWakeLock()
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
    ${infoMessage ? `<div class="offline-note">${escapeHtml(infoMessage)}</div>` : ''}
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

  document.querySelector('#back-home').addEventListener('click', () => {
    folderEditMode = false
    renderWorkouts()
    refreshInBackground()
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
  if (file.size > VIDEO_COMPRESS_OVER_BYTES && status) {
    status.textContent = `${cleanFileName(file.name)} will be compressed before uploading.`
  } else if (status) {
    const selected = [1, 2, 3].map((index) => document.querySelector(`#exercise-video-${index}`)?.files?.[0]).filter(isVideoFile)
    status.textContent = `${selected.length} video${selected.length === 1 ? '' : 's'} ready.`
  }
}

async function uploadMotivationVideos(event) {
  const input = event.currentTarget
  const status = document.querySelector('#motivation-status')
  const files = [...(input.files || [])].filter(isMotivationFile)
  input.value = ''

  if (!files.length) {
    if (status) status.textContent = 'Choose a video (MP4, MOV, M4V, WebM) or a photo (JPG, PNG, WebP, GIF, HEIC).'
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
      const original = files[index]
      if (status) status.textContent = `Preparing ${index + 1} of ${files.length}: ${cleanFileName(original.name)}...`
      const file = await prepareUploadFile(original, (percent) => {
        if (status) status.textContent = `Compressing ${index + 1} of ${files.length}: ${cleanFileName(original.name)} · ${Math.round(percent)}%`
      })
      const objectName = isVideoFile(file) ? safeObjectName(file.name) : safeImageObjectName(file)
      const objectPath = `${currentUser.id}/${motivationFolder.id}/${objectName}`
      if (status) status.textContent = `Uploading ${index + 1} of ${files.length}: ${cleanFileName(file.name)}...`

      await uploadVideoFile(file, objectPath, (percent) => {
        if (status) status.textContent = `Uploading ${index + 1} of ${files.length}: ${cleanFileName(file.name)} · ${Math.round(percent)}%`
      }, { allowImages: true })
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
    if (nextStatus) nextStatus.textContent = `${uploaded} item${uploaded === 1 ? '' : 's'} saved. They play in random order during rest.`
  } catch (error) {
    for (let index = insertedIds.length; index < uploadedPaths.length; index += 1) {
      await supabase.storage.from(VIDEO_BUCKET).remove([uploadedPaths[index]])
    }
    await loadMotivationVideos().catch(() => {})
    renderMore()
    const nextStatus = document.querySelector('#motivation-status')
    if (nextStatus) nextStatus.textContent = fileUploadErrorMessage(error)
  }
}

async function removeMotivationVideo(rowId, videoPath) {
  if (!rowId || !videoPath) return
  if (!confirm('Remove this from motivation?')) return

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

  deleteOfflineVideos([videoPath])
  if (restMotivationId === rowId) restMotivationId = null
  restQueue = restQueue.filter((id) => id !== rowId)
  restQueueIndex = clamp(restQueueIndex, 0, Math.max(0, restQueue.length - 1))
  await loadMotivationVideos()
  saveSnapshot()
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

// ---------- upload compression ----------

class UploadPrepError extends Error {}

function evenSize(value) {
  return Math.max(2, Math.round(value / 2) * 2)
}

function renameWithExtension(name, extension) {
  return `${String(name || 'upload').replace(/\.[^/.]+$/, '') || 'upload'}.${extension}`
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Fall back to <img> below (older Safari, HEIC on some versions).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function compressImageFile(file) {
  // Animated GIFs would lose their animation; keep them as they are.
  if (fileExtension(file.name) === 'gif' || String(file.type).toLowerCase() === 'image/gif') return file
  const source = await decodeImage(file)
  const width = source.width || source.naturalWidth
  const height = source.height || source.naturalHeight
  if (!width || !height) return file
  const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY))
  canvas.width = 0
  canvas.height = 0
  if (!blob || blob.size >= file.size) return file
  return new File([blob], renameWithExtension(file.name, 'jpg'), { type: 'image/jpeg' })
}

async function compressVideoFile(file, onProgress, { keepAudio = true } = {}) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') {
    throw new UploadPrepError('This browser cannot compress video. Update iOS, or export the clip smaller than 50 MB.')
  }
  // Loaded only when needed so the app itself stays small.
  const { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, Quality, canEncodeVideo } = await import('mediabunny')
  if (!(await canEncodeVideo('avc'))) {
    throw new UploadPrepError('This phone cannot compress video in the browser. Export the clip smaller than 50 MB.')
  }
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const track = await input.getPrimaryVideoTrack()
    if (!track) throw new UploadPrepError(`${cleanFileName(file.name)} has no video track.`)
    const duration = await input.computeDuration()
    const audioBits = keepAudio ? VIDEO_AUDIO_BITRATE : 0
    const budget = duration > 0 ? Math.floor((VIDEO_TARGET_BYTES * 8) / duration) - audioBits : VIDEO_MAX_BITRATE
    const bitrate = clamp(budget, VIDEO_MIN_BITRATE, VIDEO_MAX_BITRATE)
    const displayWidth = track.displayWidth || 1280
    const displayHeight = track.displayHeight || 720
    const scale = Math.min(1, VIDEO_MAX_EDGE / Math.max(displayWidth, displayHeight))

    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() })
    const conversion = await Conversion.init({
      input,
      output,
      video: {
        width: evenSize(displayWidth * scale),
        height: evenSize(displayHeight * scale),
        fit: 'contain',
        codec: 'avc',
        quality: new Quality(bitrate),
        forceTranscode: true
      },
      audio: keepAudio ? {} : { discard: true },
      showWarnings: false
    })
    if (!conversion.isValid) throw new UploadPrepError(`${cleanFileName(file.name)} could not be compressed on this phone.`)
    conversion.onProgress = (progress) => onProgress?.(clamp(progress * 100, 0, 100))
    await conversion.execute()
    const buffer = output.target.buffer
    if (!buffer) throw new UploadPrepError(`${cleanFileName(file.name)} could not be compressed.`)
    return new File([buffer], renameWithExtension(file.name, 'mp4'), { type: 'video/mp4' })
  } finally {
    input.dispose?.()
  }
}

// Returns a file that is ready to upload: photos are resized, big videos are re-encoded.
// Throws an UploadPrepError with a clear message if the result still can't fit the 50 MB limit.
async function prepareUploadFile(file, onProgress, { keepAudio = true } = {}) {
  if (isImageFile(file) && !isVideoFile(file)) {
    let result = file
    try {
      result = await compressImageFile(file)
    } catch (error) {
      console.warn('Photo compression skipped:', error)
    }
    if (result.size > SUPABASE_FREE_MAX_BYTES) throw new UploadPrepError(`${cleanFileName(file.name)} is too large (${formatFileSize(result.size)}).`)
    return result
  }

  if (file.size <= VIDEO_COMPRESS_OVER_BYTES) return file

  let compressed = null
  // Compressing takes a while on a phone; keep the screen on so iOS doesn't suspend it.
  keepAwake()
  try {
    compressed = await compressVideoFile(file, onProgress, { keepAudio })
  } catch (error) {
    console.warn('Video compression failed:', error)
    if (!workoutMode && !timerEndAt) releaseWakeLock()
    if (file.size <= SUPABASE_FREE_MAX_BYTES) return file
    if (error instanceof UploadPrepError) throw error
    throw new UploadPrepError(`${cleanFileName(file.name)} (${formatFileSize(file.size)}) could not be compressed on this phone. Trim it or export it smaller than 50 MB.`)
  }
  if (!workoutMode && !timerEndAt) releaseWakeLock()
  const best = compressed.size < file.size ? compressed : file
  if (best.size > SUPABASE_FREE_MAX_BYTES) {
    throw new UploadPrepError(`${cleanFileName(file.name)} is still ${formatFileSize(best.size)} after compressing. Trim it shorter and try again.`)
  }
  return best
}

function fileUploadErrorMessage(error, file = null) {
  if (error instanceof UploadPrepError) return error.message
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
      const original = files[i]
      setUploadStatus(`Preparing reference ${i + 1} of ${files.length}: ${cleanFileName(original.name)}`, 0)
      const file = await prepareUploadFile(original, (percent) => {
        setUploadStatus(`Compressing reference ${i + 1} of ${files.length}: ${cleanFileName(original.name)} · ${Math.round(percent)}%`, percent)
      }, { keepAudio: false })
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
    setUploadStatus(fileUploadErrorMessage(error), 0)
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
  const original = getVideoFiles(input.files, 1)[0]
  input.value = ''
  if (!original || !activeFolder) return

  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group || group.videos.length >= MAX_VIDEOS_PER_EXERCISE) return

  const videoOrder = group.videos.length + 1
  const metadata = normalizeMetadata(group)
  let file = original

  try {
    setUploadStatus(`Preparing reference ${videoOrder}: ${cleanFileName(original.name)}`, 0)
    file = await prepareUploadFile(original, (percent) => {
      setUploadStatus(`Compressing reference ${videoOrder}: ${cleanFileName(original.name)} · ${Math.round(percent)}%`, percent)
    }, { keepAudio: false })
    const objectPath = `${currentUser.id}/${activeFolder.id}/${safeObjectName(file.name)}`
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

async function uploadVideoFile(file, objectPath, onProgress, { allowImages = false } = {}) {
  if (!(allowImages ? isMotivationFile(file) : isVideoFile(file))) throw new Error('Choose an MP4, MOV, M4V, or WebM video.')
  const contentType = inferMediaMime(file)

  // Supabase recommends normal uploads for small files and TUS resumable uploads
  // for files over 6 MB. This keeps quick clips simple while making larger
  // iPhone/TikTok videos much more reliable on mobile connections.
  if (file.size <= STANDARD_UPLOAD_MAX_BYTES) {
    onProgress(5)
    const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(objectPath, file, {
      cacheControl: '31536000',
      contentType,
      upsert: false
    })
    if (error) throw error
    onProgress(100)
  } else {
    await uploadResumable(file, objectPath, onProgress, contentType)
  }

  // The phone that uploads a clip never needs to download it again.
  putOfflineVideo(objectPath, file, cleanFileName(file.name)).then(requestPersistentStorage).catch(() => {})
}

async function uploadResumable(file, objectPath, onProgress, contentType = inferVideoMime(file)) {
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
      storeFingerprintForResuming: false,
      metadata: {
        bucketName: VIDEO_BUCKET,
        objectName: objectPath,
        contentType,
        cacheControl: '31536000'
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (uploaded, total) => onProgress(total ? (uploaded / total) * 100 : 0),
      onSuccess: resolve
    })

    // Never resume an earlier attempt: it was created for a different object path, so the
    // finished file would land somewhere other than the path saved in the database.
    // Retries inside this attempt are still handled by retryDelays.
    upload.start()
  })
}

async function moveExercise(groupId, direction) {
  const index = activeExerciseGroups.findIndex((group) => group.id === groupId)
  if (index < 0) return
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= activeExerciseGroups.length) return

  const ordered = [...activeExerciseGroups]
  const [moved] = ordered.splice(index, 1)
  ordered.splice(targetIndex, 0, moved)

  for (let i = 0; i < ordered.length; i += 1) {
    const nextOrder = i + 1
    if (ordered[i].sort_order === nextOrder) continue
    const { error } = await supabase
      .from('exercises')
      .update({ sort_order: nextOrder })
      .eq('exercise_group', ordered[i].id)
    if (error) {
      alert(error.message)
      break
    }
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
  deleteOfflineVideos([videoPath])

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
  deleteOfflineVideos(paths)
  if (weightLogAvailable) supabase.from('exercise_weight_log').delete().eq('exercise_group', groupId).then(() => {}, () => {})

  const saved = workoutState || readWorkoutState()
  if (saved?.folderId === activeFolder.id) {
    const remainingGroups = activeExerciseGroups.filter((item) => item.id !== groupId)
    if (!remainingGroups.length) {
      clearWorkoutState()
    } else {
      const setsDone = { ...(saved.setsDone || {}) }
      delete setsDone[groupId]
      const nextState = {
        ...saved,
        setsDone,
        completedGroupIds: (saved.completedGroupIds || []).filter((id) => id !== groupId),
        backupGroupIds: (saved.backupGroupIds || []).filter((id) => id !== groupId)
      }
      if (nextState.currentGroupId === groupId) {
        const removedIndex = activeExerciseGroups.findIndex((item) => item.id === groupId)
        const fallback = remainingGroups[Math.min(Math.max(removedIndex, 0), remainingGroups.length - 1)]
        nextState.currentGroupId = fallback.id
        nextState.currentIndex = remainingGroups.indexOf(fallback)
      }
      saveWorkoutState(nextState)
    }
  }
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
    deleteOfflineVideos(videos.map((item) => item.video_path))
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
    currentGroupId: activeExerciseGroups[0]?.id || null,
    setsDone: {},
    completedGroupIds: [],
    backupGroupIds: [],
    status: 'active',
    updatedAt: Date.now()
  }
}

function startOrResumeWorkout() {
  if (!activeFolder || !activeExerciseGroups.length) return
  folderEditMode = false
  const saved = workoutState || readWorkoutState()
  if (saved?.folderId === activeFolder.id) {
    workoutState = saved
    workoutState.status = 'active'
  } else {
    workoutState = createFreshWorkoutState()
  }
  getCurrentWorkoutGroup()
  saveWorkoutState()
  workoutMode = true
  keepAwake()
  renderWorkout()
}

function setWorkoutIndex(index) {
  if (!workoutState || !activeExerciseGroups.length) return
  workoutState.currentIndex = clamp(index, 0, activeExerciseGroups.length - 1)
  workoutState.currentGroupId = activeExerciseGroups[workoutState.currentIndex].id
}

function getCurrentWorkoutGroup() {
  if (!workoutState || !activeExerciseGroups.length) return null
  const byId = workoutState.currentGroupId
    ? activeExerciseGroups.findIndex((group) => group.id === workoutState.currentGroupId)
    : -1
  setWorkoutIndex(byId >= 0 ? byId : workoutState.currentIndex)
  return activeExerciseGroups[workoutState.currentIndex]
}

function isGroupComplete(groupId) {
  return Boolean(workoutState?.completedGroupIds?.includes(groupId))
}

function nextUnfinishedIndex(fromIndex) {
  const total = activeExerciseGroups.length
  for (let step = 1; step <= total; step += 1) {
    const index = (fromIndex + step) % total
    if (!isGroupComplete(activeExerciseGroups[index].id)) return index
  }
  return -1
}

function renderWorkoutVideoSwitcher(group) {
  const videos = group.videos.filter((video) => video.signedUrl)
  if (!videos.length) return ''
  const videoTag = (video, index, active) => `<video controls playsinline webkit-playsinline muted loop ${active ? 'autoplay preload="auto"' : 'preload="none"'} src="${escapeHtml(video.signedUrl)}" aria-label="${escapeHtml(group.name)} reference video ${index + 1}"></video>`
  if (videos.length === 1) {
    return `
      <div class="workout-video-frame">${videoTag(videos[0], 0, true)}</div>`
  }

  const tabs = videos.map((video, index) => `
    <button type="button" class="video-tab ${index === 0 ? 'active' : ''}" data-video-tab="${index}">Video ${index + 1}</button>`).join('')
  const panels = videos.map((video, index) => `
    <div class="workout-video-frame ${index === 0 ? '' : 'hidden'}" data-video-panel="${index}">${videoTag(video, index, index === 0)}</div>`).join('')

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
    const label = done ? `Set ${index + 1} done. Tap to undo.` : `Mark set ${index + 1} done`
    return `<button type="button" class="set-dot ${done ? 'done' : ''} ${current ? 'current' : ''}" data-set-dot="${index}" aria-label="${label}">${done ? '&#10003;' : index + 1}</button>`
  }).join('')
}

function setSetCount(groupId, count) {
  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (!group || !workoutState) return
  const next = clamp(count, 0, group.sets_target)
  workoutState.setsDone[groupId] = next
  const done = new Set(workoutState.completedGroupIds)
  if (next >= group.sets_target) done.add(groupId)
  else done.delete(groupId)
  workoutState.completedGroupIds = [...done]
  saveWorkoutState()
  renderWorkout()
}

function renderWorkout() {
  workoutMode = true
  const group = getCurrentWorkoutGroup()
  if (!group) {
    renderFolder(activeExerciseGroups)
    return
  }
  if (timerEndAt) {
    showRestLockScreen()
    return
  }

  const completed = isGroupComplete(group.id)
  const setsDone = clamp(Number(workoutState.setsDone[group.id] || 0), 0, group.sets_target)
  const setNumber = Math.min(setsDone + 1, group.sets_target)
  const completedCount = activeExerciseGroups.filter((item) => isGroupComplete(item.id)).length
  const allDone = completedCount === activeExerciseGroups.length
  const progress = activeExerciseGroups.length ? (completedCount / activeExerciseGroups.length) * 100 : 0
  const isLastExercise = activeExerciseGroups.every((item) => item.id === group.id || isGroupComplete(item.id))
  const isLastSet = setNumber >= group.sets_target
  let actionLabel = `Set ${setNumber} done - rest 2:30`
  if (isLastSet && !isLastExercise) actionLabel = 'Finish exercise - rest 2:30'
  if (isLastSet && isLastExercise) actionLabel = 'Finish workout'
  if (completed) actionLabel = allDone ? 'Finish workout' : 'Exercise complete'
  const actionDisabled = completed && !allDone

  const cues = [group.cue_1, group.cue_2, group.cue_3].filter(Boolean)
  const canSkip = !completed && nextUnfinishedIndex(workoutState.currentIndex) !== -1
  const notice = workoutNotice
  workoutNotice = ''
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
      <h2>${escapeHtml(displayName)}</h2>
      <div class="focus-prescription">${group.sets_target} sets x ${escapeHtml(group.reps_target)} reps${group.last_weight ? ` &middot; ${escapeHtml(group.last_weight)}` : ''}</div>

      ${cues.length ? renderCueChips(group) : ''}

      ${renderWorkoutVideoSwitcher(group)}

      ${notice ? `<div class="skip-notice" role="status">${escapeHtml(notice)}</div>` : ''}

      ${group.backup_exercise ? `<button type="button" class="backup-toggle ${usingBackup ? 'active' : ''}" id="toggle-backup">${usingBackup ? `Using backup · ${escapeHtml(group.backup_exercise)}` : `Use backup · ${escapeHtml(group.backup_exercise)}`}</button>` : ''}
      ${canSkip ? '<button type="button" class="skip-exercise" id="skip-exercise">Machine busy? Skip for now</button>' : ''}

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
        ${renderWeightHistory(group)}
      </div>

      <button type="button" id="complete-set" class="big-action" ${actionDisabled ? 'disabled' : ''}>${escapeHtml(actionLabel)}</button>

      <div class="workout-nav">
        <button type="button" class="secondary-button" id="previous-exercise" ${workoutState.currentIndex === 0 ? 'disabled' : ''}>&larr; Previous</button>
        ${completed ? '<button type="button" class="secondary-button" id="reopen-exercise">Reopen</button>' : ''}
        <button type="button" class="secondary-button" id="next-exercise" ${workoutState.currentIndex === activeExerciseGroups.length - 1 ? 'disabled' : ''}>Next &rarr;</button>
      </div>
    </article>`, { title: `${activeFolder.name} workout`, showAccount: false })

  document.querySelector('#exit-workout').addEventListener('click', pauseAndExitWorkout)
  document.querySelector('#cancel-workout').addEventListener('click', cancelWorkout)
  document.querySelector('#toggle-backup')?.addEventListener('click', () => toggleWorkoutBackup(group.id))
  document.querySelector('#skip-exercise')?.addEventListener('click', skipCurrentExercise)
  document.querySelector('#complete-set').addEventListener('click', () => {
    if (allDone) {
      unlockAudio()
      finishWorkout()
      return
    }
    completeCurrentSet()
  })
  document.querySelectorAll('[data-set-dot]').forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.setDot)
      const doneNow = completed ? group.sets_target : setsDone
      setSetCount(group.id, index < doneNow ? index : index + 1)
    })
  })
  document.querySelector('#previous-exercise').addEventListener('click', () => jumpWorkout(-1))
  document.querySelector('#next-exercise').addEventListener('click', () => jumpWorkout(1))
  const reopen = document.querySelector('#reopen-exercise')
  if (reopen) reopen.addEventListener('click', reopenCurrentExercise)
  const weight = document.querySelector('#workout-weight')
  weight.addEventListener('input', () => { group.last_weight = weight.value })
  weight.addEventListener('change', () => saveWorkoutWeight(group.id, weight.value))
  weight.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      weight.blur()
    }
  })
  bindVideoSwitcher()
  keepAwake()
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
        const video = panel.querySelector('video')
        if (!shouldShow) video?.pause()
        else video?.play()?.catch?.(() => {})
      })
    })
  })
}

async function saveWorkoutWeight(groupId, value) {
  const nextValue = String(value || '').trim().slice(0, 40)
  const status = document.querySelector('#weight-status')
  const group = activeExerciseGroups.find((item) => item.id === groupId)
  if (group) {
    group.last_weight = nextValue
    group.videos.forEach((video) => { video.last_weight = nextValue })
    if (activeFolder) cacheFolderRows(activeFolder.id, activeExerciseGroups.flatMap((item) => item.videos))
  }
  const pending = readPending()
  pending.weights[groupId] = nextValue
  writePending(pending)
  if (group && workoutMode && Number(workoutState?.setsDone?.[groupId] || 0) > 0) logWeight(group)

  if (navigator.onLine === false) {
    if (status) status.textContent = 'Saved on this phone · syncs later'
    return
  }
  if (status) status.textContent = 'Saving...'
  let error = null
  try {
    const result = await raceTimeout(supabase.from('exercises').update({ last_weight: nextValue }).eq('exercise_group', groupId), NETWORK_FALLBACK_MS * 2)
    error = result.error
  } catch (timeoutError) {
    error = timeoutError
  }
  const liveStatus = document.querySelector('#weight-status')
  if (error) {
    if (liveStatus) liveStatus.textContent = 'Saved on this phone · syncs later'
    return
  }
  const next = readPending()
  if (next.weights[groupId] === nextValue) delete next.weights[groupId]
  writePending(next)
  if (liveStatus) liveStatus.textContent = 'Saved'
}

function completeCurrentSet() {
  const now = Date.now()
  if (now - lastSetTapAt < SET_TAP_GUARD_MS) return
  lastSetTapAt = now
  unlockAudio()
  const group = getCurrentWorkoutGroup()
  if (!group || isGroupComplete(group.id)) return

  const previousDone = clamp(Number(workoutState.setsDone[group.id] || 0), 0, group.sets_target)
  const nextDone = Math.min(group.sets_target, previousDone + 1)
  workoutState.setsDone[group.id] = nextDone
  logWeight(group)

  if (nextDone >= group.sets_target) {
    if (!isGroupComplete(group.id)) workoutState.completedGroupIds.push(group.id)

    const nextIndex = nextUnfinishedIndex(workoutState.currentIndex)
    if (nextIndex === -1) {
      saveWorkoutState()
      finishWorkout()
      return
    }

    setWorkoutIndex(nextIndex)
    saveWorkoutState()
    startTimer(true)
    return
  }

  saveWorkoutState()
  startTimer(true)
}

// Leave the current exercise unfinished and go to the next unfinished one. Because
// "finish exercise" always moves to the next unfinished exercise (wrapping around), the
// skipped one comes back after the others are done, and the workout can't end without it.
function skipCurrentExercise() {
  const group = getCurrentWorkoutGroup()
  if (!group || isGroupComplete(group.id)) return
  const nextIndex = nextUnfinishedIndex(workoutState.currentIndex)
  if (nextIndex === -1) return
  const skippedName = workoutState.backupGroupIds?.includes(group.id) && group.backup_exercise ? group.backup_exercise : group.name
  setWorkoutIndex(nextIndex)
  saveWorkoutState()
  workoutNotice = `${skippedName} skipped. It comes back before the workout ends.`
  renderWorkout()
}

function jumpWorkout(delta) {
  if (!workoutState) return
  setWorkoutIndex(workoutState.currentIndex + delta)
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
  releaseWakeLock()
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
  if (!currentUser || !canMarkDone() || !folderId) return
  applyDoneLocally(dateKey, folderId, true)
  saveSnapshot()
  await flushPendingWrites()
}

function finishWorkout() {
  const completedFolderId = activeFolder?.id
  if (completedFolderId) recordWorkoutCompletion(completedFolderId, todayDateKey())
  const returnToDailyFlow = maybeCompleteDailyGymStepAfterWorkout()
  clearWorkoutState()
  resetTimer()
  workoutMode = false
  releaseWakeLock()

  // A Gym step inside the daily system is a bridge, not a dead end: finish the workout
  // and battle angel immediately serves the next gym module or the next daily action.
  if (returnToDailyFlow) {
    activeFolder = null
    activeExerciseGroups = []
    renderDayRunner()
    refreshInBackground()
    return
  }

  renderShell(`
    <section class="finish-card">
      <div class="finish-check">&#10003;</div>
      <h2>${escapeHtml(activeFolder.name)} done.</h2>
      <button type="button" class="start-workout-button" id="finish-home">Done</button>
    </section>`, { title: 'Workout complete', showAccount: false, showTimer: false })

  document.querySelector('#finish-home').addEventListener('click', () => {
    renderHome()
    refreshInBackground()
  })
}

function bindTimerControls() {
  document.querySelector('#timer-toggle')?.addEventListener('click', () => {
    unlockAudio()
    startTimer(true)
  })
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

  if (startingNewRest || !restQueue.length) chooseMotivationForNewRest()

  if (timerPausedSeconds <= 0) timerPausedSeconds = REST_SECONDS
  timerEndAt = Date.now() + timerPausedSeconds * 1000
  clearTimerInterval()
  timerInterval = window.setInterval(tickTimer, 250)
  persistTimerState()
  showRestLockScreen()
}

function pauseTimer() {
  timerPausedSeconds = getRemainingSeconds()
  timerEndAt = null
  clearTimerInterval()
  persistTimerState()
  stopRestMotivationPlayback(false)
}

function resetTimer() {
  timerEndAt = null
  timerPausedSeconds = REST_SECONDS
  clearTimerInterval()
  persistTimerState()
  stopRestMotivationPlayback(true)
}

function tickTimer() {
  const remaining = getRemainingSeconds()
  if (remaining <= 0) {
    timerEndAt = null
    timerPausedSeconds = REST_SECONDS
    clearTimerInterval()
    persistTimerState()
    stopRestMotivationPlayback(true)
    tryBeep()
    window.setTimeout(returnFromRestScreen, 180)
    return
  }
  updateTimerUI()
}

function clearTimerInterval() {
  if (timerInterval) window.clearInterval(timerInterval)
  timerInterval = null
}

function updateTimerUI() {
  const remaining = getRemainingSeconds()
  const text = formatTime(remaining)
  const mini = document.querySelector('#timer-mini')
  const value = document.querySelector('#timer-value')
  if (mini) mini.textContent = timerEndAt ? text : '2:30'
  if (value) value.textContent = text
}

// iPhone only lets Web Audio start inside a tap, so one context is created/resumed on "Set done"
// and reused for the end-of-rest beep.
function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    audioCtx = audioCtx || new AudioContextClass()
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  } catch {
    // Timer still works without sound.
  }
}

function tryBeep() {
  try {
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
    const start = audioCtx.currentTime + 0.02
    ;[0, 0.22, 0.44].forEach((offset, index) => {
      const oscillator = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      oscillator.connect(gain)
      gain.connect(audioCtx.destination)
      oscillator.frequency.value = index === 2 ? 988 : 740
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18)
      oscillator.start(start + offset)
      oscillator.stop(start + offset + 0.2)
    })
  } catch {
    // Timer still works if audio is blocked.
  }
}

// Keep the screen on while training so the rest timer stays visible and the beep can fire.
let wantWakeLock = false
let wakeLockRequesting = false
async function keepAwake() {
  wantWakeLock = true
  if (wakeLock || wakeLockRequesting || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return
  wakeLockRequesting = true
  try {
    const lock = await navigator.wakeLock.request('screen')
    if (!wantWakeLock) {
      lock.release().catch(() => {})
      return
    }
    wakeLock = lock
    lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null })
  } catch {
    wakeLock = null
  } finally {
    wakeLockRequesting = false
  }
}

function releaseWakeLock() {
  wantWakeLock = false
  const lock = wakeLock
  wakeLock = null
  lock?.release?.().catch?.(() => {})
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return
  if (workoutMode || timerEndAt) keepAwake()
  // Signed video links last 12 h; refresh them if the app sat in the background that long.
  if (currentUser && lastVideoSignAt && Date.now() - lastVideoSignAt > 11 * 60 * 60 * 1000) {
    lastVideoSignAt = Date.now()
    if (workoutMode && activeFolder && !timerEndAt) openFolder(activeFolder.id, { mode: 'workout' })
    else loadMotivationVideos().catch(() => {})
  }
})

// iPhone can still begin a text selection on long press; block it on the calendar and rest screen,
// where holding / double-tapping is a control, not a way to copy text.
document.addEventListener('selectstart', (event) => {
  const node = event.target?.nodeType === Node.TEXT_NODE ? event.target.parentElement : event.target
  if (node?.closest?.('.calendar-grid, .rest-lock-screen')) event.preventDefault()
})

window.addEventListener('online', () => {
  flushPendingWrites()
  if (usingCachedData) refreshInBackground()
})

function renderBootLoading() {
  viewVersion += 1
  currentView = 'boot'
  app.innerHTML = `
    <main class="shell boot-shell">
      <div class="brand-name">battle angel</div>
      <div class="boot-pulse" aria-label="Loading"></div>
    </main>`
}

function shouldAutoResume(saved) {
  const resumableFolder = saved && folders.find((folder) => folder.id === saved.folderId)
  return resumableFolder && saved.status === 'active' && (Date.now() - saved.updatedAt) < AUTO_RESUME_WINDOW_MS ? resumableFolder : null
}

async function routeAfterLoad(saved) {
  const resumableFolder = shouldAutoResume(saved)
  if (resumableFolder) {
    await openFolder(resumableFolder.id, { mode: 'workout' })
    return
  }
  if (saved?.status === 'active') {
    saved.status = 'paused'
    saveWorkoutState(saved)
  }
  renderDay()
}

function readStoredAuthUser() {
  try {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
    const stored = JSON.parse(window.localStorage.getItem(`sb-${projectRef}-auth-token`) || 'null')
    return stored?.user?.id ? stored.user : null
  } catch {
    return null
  }
}

async function boot() {
  const storedUser = readStoredAuthUser()
  const canStartFromSnapshot = Boolean(storedUser && readJson(`battle-angel-snapshot-${storedUser.id}`, null))
  let sessionCheck = null

  if (canStartFromSnapshot) {
    // Signed in before on this phone: open instantly, verify the session in the background.
    currentUser = storedUser
    sessionCheck = supabase.auth.getSession()
  } else {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
  }

  if (!currentUser) {
    renderLogin()
  } else {
    restoreTimerState()
    const hasSnapshot = await restoreSnapshot()
    usingCachedData = hasSnapshot && navigator.onLine === false
    if (hasSnapshot) {
      // Open instantly from what this phone already knows; the network catches up behind the scenes.
      workoutState = readWorkoutState()
      try {
        await routeAfterLoad(workoutState)
      } catch (error) {
        renderDay(error.message)
      }
      const version = viewVersion
      const before = dataSignature()
      const localUpdatedAt = workoutState?.updatedAt || 0
      try {
        if (sessionCheck) {
          const { data: { session }, error } = await sessionCheck
          if (!session) {
            if (error && isNetworkError(error)) throw error
            currentUser = null
            renderLogin(error ? 'Please sign in again.' : '')
            supabase.auth.onAuthStateChange((_event, nextSession) => {
              window.setTimeout(() => handleSessionChange(nextSession), 0)
            })
            return
          }
          currentUser = session.user
        }
        await loadFolders()
        const saved = await syncWorkoutStateFromCloud()
        const cloudChangedWorkout = (saved?.updatedAt || 0) > localUpdatedAt
        if (viewVersion === version && ['day', 'home'].includes(currentView) && (dataSignature() !== before || cloudChangedWorkout)) {
          if (cloudChangedWorkout && shouldAutoResume(saved)) await routeAfterLoad(saved)
          else if (currentView === 'day') renderDay()
          else renderHome()
        }
      } catch (error) {
        console.warn('Working offline:', error)
        usingCachedData = true
        if (viewVersion === version && currentView === 'day') renderDay()
        else if (viewVersion === version && currentView === 'home') renderHome()
      }
    } else {
      renderBootLoading()
      try {
        await loadFolders()
        const saved = await syncWorkoutStateFromCloud()
        await routeAfterLoad(saved)
      } catch (error) {
        renderDay(error.message)
      }
    }
  }

  supabase.auth.onAuthStateChange((event, nextSession) => {
    // A failed refresh while offline reports "no session" without signing out; only a real sign-out ends the session.
    if (!nextSession && event !== 'SIGNED_OUT' && currentUser) return
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
  weightLogAvailable = true
  weightLogRows = []
  dailySteps = []
  dailyProgress = null
  dailySystemAvailable = true
  plannerSelectedDate = null
  signedUrlCache = new Map()
  usingCachedData = false
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
    renderDay()
  } catch (error) {
    renderDay(error.message)
  }
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Offline shell unavailable:', error))
  })
}

boot()
