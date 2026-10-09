import { createClient } from '@supabase/supabase-js'
import * as tus from 'tus-js-client'
import { Zip, ZipPassThrough, strToU8 } from 'fflate'
import './styles.css'

const APP_VERSION = '1.23.2'
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
// A golden week is 4 days with at least one workout done (two workouts on one day is still one day).
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
const DAILY_MED_NAME_MAX = 120
const POWER_TODO_TITLE_MAX = 160
// v1.18 Action Engine
// Up to five power actions a day, ranked by importance.
const TODAY_TODO_TARGET = 5
const SPRINT_MINUTES = 5
const DEFER_NUDGE_AT = 2
const SNOOZE_STEPS_DAYS = [1, 3, 7]
const STALE_SNOOZE_COUNT = 3
const UNDO_MS = 5000
const STUCK_REVEAL_MS = 30000
const DONE_SOUND_KEY = 'battle-angel-done-sound'
const BADGE_KEY = 'battle-angel-app-badge'
const V118_COLUMNS = ['is_core', 'energy_mode', 'defer_counts', 'closed_at', 'snoozed_until', 'snooze_count', 'parent_id', 'size']
const DAILY_STEP_COLUMNS_LEGACY = 'id,title,note,substeps,sort_order,created_at,updated_at'
const DAILY_PROGRESS_COLUMNS_LEGACY = 'progress_date,completed_step_ids,skipped_step_ids,later_step_ids,stack_order,substep_positions,is_complete,started_at,updated_at'
const DAILY_PROGRESS_COLUMNS = `${DAILY_PROGRESS_COLUMNS_LEGACY},energy_mode,defer_counts,closed_at`
const POWER_TODO_COLUMNS_LEGACY = 'id,title,sort_order,completed_at,created_at,updated_at'
const POWER_TODO_COLUMNS = `${POWER_TODO_COLUMNS_LEGACY},size,snoozed_until,snooze_count,parent_id`
const POWER_PLAN_COLUMNS = 'id,todo_id,action_date,status,sort_order,started_at,created_at,updated_at'
const DAY_VIEWS = ['day', 'day-overview', 'day-runner', 'triage', 'day-prompt', 'day-routine', 'day-boosters']
// v1.19: the morning question, and how much of Inbox and Today's order the overview shows before "Show all"
const POWER_PROMPT_QUESTION = 'What power actions are you getting done today to get to another place?'
const INBOX_PREVIEW_COUNT = 5
const ORDER_PREVIEW_COUNT = 5
// v1.20: a routine step can run on chosen weekdays only. daily_steps.weekdays holds getDay() numbers
// (0 = Sunday ... 6 = Saturday); null means every day. Shown Monday first, like the rest of the app.
// daily_steps.opens_workout links a step to the Gym tab: true/false when set in Edit routine,
// null = decided by the name (gym, workout or training in it).
const V120_COLUMNS = ['weekdays', 'opens_workout']
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
let dailyMeds = []
let dailyMedTakenIds = []
let dailyMedsDate = todayDateKey()
let dailyMedsAvailable = true
let powerTodos = []
let powerPlans = []
let powerDoneToday = []
let powerActionsDate = todayDateKey()
let powerActionsAvailable = true
// v1.18 Action Engine state
let actionEngineAvailable = true
// v1.20: false until supabase/routine_upgrade.sql has run
let routineDaysAvailable = true
let undoState = null
let toastTimer = null
let triageSession = null
let sprintTicker = null
let lastRunnerKey = ''
let stuckRevealTimer = null
const revealedStuckKeys = new Set()
// v1.19 Day tab state: the morning picker, and the overview's edit modes
let powerPrompt = null
let dayUi = { reorder: false, orderAll: false, inboxEdit: false, inboxAll: false }
// v1.21: what to do when you close a sheet yourself, and the eye view's memory for exact undo
let sheetOnDismiss = null
let glanceSession = null

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

function errorText(error) {
  return `${error?.code || ''} ${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
}

// v1.18 columns are optional. If schema.sql has not been re-run yet, battle angel keeps working
// without them instead of switching the whole Day tab off.
function isMissingColumnError(error, columns) {
  if (!error) return false
  const text = errorText(error)
  const missingColumn = text.includes('42703') || text.includes('pgrst204') || (text.includes('column') && (text.includes('does not exist') || text.includes('could not find')))
  return missingColumn && columns.some((column) => text.includes(column))
}

function isMissingV118ColumnError(error) {
  return isMissingColumnError(error, V118_COLUMNS)
}

// v1.20 works the same way: without the weekdays column every step simply runs every day.
function isMissingV120ColumnError(error) {
  return isMissingColumnError(error, V120_COLUMNS)
}

// Only a genuinely missing table/column turns a feature off. Any other error (no signal, a policy,
// a foreign key) is temporary and must never hide the day.
function isMissingSchemaError(error, names) {
  if (!error || isMissingV118ColumnError(error) || isMissingV120ColumnError(error)) return false
  const text = errorText(error)
  const missing = text.includes('42p01') || text.includes('pgrst205') || text.includes('42703') || text.includes('pgrst204') || text.includes('does not exist') || text.includes('could not find')
  return missing && names.some((name) => text.includes(name))
}

function isMissingDailySystemError(error) {
  return isMissingSchemaError(error, ['daily_steps', 'daily_progress', 'substeps', 'skipped_step_ids', 'substep_positions', 'later_step_ids', 'stack_order'])
}

function isMissingDailyMedsError(error) {
  return isMissingSchemaError(error, ['daily_meds', 'daily_med_log'])
}

function isMissingPowerActionsError(error) {
  return isMissingSchemaError(error, ['power_todos', 'power_action_plan'])
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
    stack_order: [],
    substep_positions: {},
    is_complete: false,
    started_at: null,
    updated_at: null,
    energy_mode: 'normal',
    defer_counts: {},
    closed_at: null
  }
}

function uniqueStrings(value) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === 'string'))] : []
}

function normalizeCountMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value)
    .filter(([key, count]) => typeof key === 'string' && Number(count) > 0)
    .map(([key, count]) => [key, Math.min(99, Math.floor(Number(count)))]))
}

function normalizeDailyProgressValue(value, dateKey = todayDateKey()) {
  if (!value || value.progress_date !== dateKey) return emptyDailyProgress(dateKey)
  const positions = value.substep_positions && typeof value.substep_positions === 'object' && !Array.isArray(value.substep_positions)
    ? Object.fromEntries(Object.entries(value.substep_positions).filter(([id, position]) => typeof id === 'string' && Number.isFinite(Number(position))).map(([id, position]) => [id, Math.max(0, Number.parseInt(position, 10) || 0)]))
    : {}
  return {
    progress_date: dateKey,
    completed_step_ids: uniqueStrings(value.completed_step_ids),
    skipped_step_ids: uniqueStrings(value.skipped_step_ids),
    later_step_ids: uniqueStrings(value.later_step_ids),
    stack_order: uniqueStrings(value.stack_order).filter((key) => /^(routine|todo|system):/.test(key)),
    substep_positions: positions,
    is_complete: Boolean(value.is_complete),
    started_at: value.started_at || null,
    updated_at: value.updated_at || null,
    energy_mode: value.energy_mode === 'low' ? 'low' : 'normal',
    defer_counts: normalizeCountMap(value.defer_counts),
    closed_at: value.closed_at || null
  }
}

function pendingDailyProgressFor(dateKey = todayDateKey()) {
  const value = readPending().dailyProgress
  return value?.progress_date === dateKey ? normalizeDailyProgressValue(value, dateKey) : null
}

function dailyStepColumns(v118 = actionEngineAvailable, v120 = routineDaysAvailable) {
  return [DAILY_STEP_COLUMNS_LEGACY, v118 ? 'is_core' : '', v120 ? 'weekdays,opens_workout' : ''].filter(Boolean).join(',')
}

// Days a step runs on, as getDay() numbers. null = every day (also when all seven are picked).
function normalizeWeekdays(value) {
  if (!Array.isArray(value)) return null
  const days = [...new Set(value.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b)
  return days.length && days.length < 7 ? days : null
}

function normalizeDailyStepRow(step) {
  return {
    ...step,
    substeps: normalizeDailySubsteps(step.substeps),
    is_core: Boolean(step.is_core),
    weekdays: normalizeWeekdays(step.weekdays),
    opens_workout: typeof step.opens_workout === 'boolean' ? step.opens_workout : null
  }
}

function weekdayOf(dateKey = todayDateKey()) {
  return dateFromKey(dateKey).getDay()
}

function stepScheduledOn(step, dateKey = todayDateKey()) {
  return !Array.isArray(step?.weekdays) || step.weekdays.includes(weekdayOf(dateKey))
}

// "Every day", "Weekdays", "Weekends", or "Mon, Wed, Fri" (Monday first).
function weekdaysLabel(weekdays) {
  const days = normalizeWeekdays(weekdays)
  if (!days) return 'Every day'
  const key = days.join(',')
  if (key === '1,2,3,4,5') return 'Weekdays'
  if (key === '0,6') return 'Weekends'
  return WEEKDAY_ORDER.filter((day) => days.includes(day)).map((day) => WEEKDAY_NAMES[day].slice(0, 3)).join(', ')
}

async function loadDailySystem() {
  const dateKey = todayDateKey()
  if (!currentUser || !dailySystemAvailable) {
    dailySteps = []
    dailyProgress = emptyDailyProgress(dateKey)
    return
  }

  const fetchDay = (stepColumns, progressColumns) => Promise.all([
    supabase
      .from('daily_steps')
      .select(stepColumns)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_progress')
      .select(progressColumns)
      .eq('progress_date', dateKey)
      .maybeSingle()
  ])

  // Loaders run in parallel, so each one remembers which column set it actually asked for.
  // The database reports one missing column at a time, so an older one can take two retries.
  let askedV118 = actionEngineAvailable
  let askedV120 = routineDaysAvailable
  const fetchFor = () => fetchDay(dailyStepColumns(askedV118, askedV120), askedV118 ? DAILY_PROGRESS_COLUMNS : DAILY_PROGRESS_COLUMNS_LEGACY)
  let [stepsResult, progressResult] = await fetchFor()
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const v120Missing = askedV120 && isMissingV120ColumnError(stepsResult.error)
    const v118Missing = askedV118 && (isMissingV118ColumnError(stepsResult.error) || isMissingV118ColumnError(progressResult.error))
    if (!v120Missing && !v118Missing) break
    if (v120Missing) {
      routineDaysAvailable = false
      askedV120 = false
    }
    if (v118Missing) {
      actionEngineAvailable = false
      askedV118 = false
    }
    ;[stepsResult, progressResult] = await fetchFor()
  }

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

  dailySteps = (stepsResult.data || []).map(normalizeDailyStepRow)
  const cloud = normalizeDailyProgressValue(progressResult.data, dateKey)
  const pending = pendingDailyProgressFor(dateKey)
  const cloudTime = Date.parse(cloud.updated_at || '') || 0
  const pendingTime = Date.parse(pending?.updated_at || '') || 0
  dailyProgress = pending && pendingTime >= cloudTime ? pending : cloud
}

function pendingDailyMedToggles(dateKey = todayDateKey()) {
  const toggles = readPending().medToggles
  return Object.values(toggles).filter((item) => item?.taken_date === dateKey && typeof item?.med_id === 'string')
}

function mergeDailyMedTakenIds(cloudIds = [], dateKey = todayDateKey()) {
  const taken = new Set(cloudIds.filter((id) => typeof id === 'string'))
  pendingDailyMedToggles(dateKey).forEach((item) => {
    if (item.is_taken) taken.add(item.med_id)
    else taken.delete(item.med_id)
  })
  const valid = new Set(dailyMeds.map((med) => med.id))
  return [...taken].filter((id) => valid.has(id))
}

async function loadDailyMeds() {
  const dateKey = todayDateKey()
  if (!currentUser || !dailyMedsAvailable) {
    dailyMeds = []
    dailyMedTakenIds = []
    dailyMedsDate = dateKey
    return
  }

  const [medsResult, logResult] = await Promise.all([
    supabase
      .from('daily_meds')
      .select('id,name,sort_order,created_at,updated_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_med_log')
      .select('med_id,taken_date,taken_at')
      .eq('taken_date', dateKey)
  ])

  const firstError = medsResult.error || logResult.error
  if (firstError) {
    if (isMissingDailyMedsError(firstError)) {
      dailyMedsAvailable = false
      dailyMeds = []
      dailyMedTakenIds = []
      dailyMedsDate = dateKey
      return
    }
    throw firstError
  }

  dailyMeds = medsResult.data || []
  dailyMedsDate = dateKey
  dailyMedTakenIds = mergeDailyMedTakenIds((logResult.data || []).map((row) => row.med_id), dateKey)
}


// ---------- v1.18 todos: local-first ----------
// Capturing, planning, finishing, and dropping a todo all land on this phone instantly (even with no
// signal) and sync in the background. Today's plan rows are matched by todo + date, so ids created
// offline never have to agree with the server's.

function nowIso() {
  return new Date().toISOString()
}

function sortBySortOrder(list) {
  return list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.created_at || '').localeCompare(String(b.created_at || '')))
}

function normalizeTodoRow(row = {}) {
  const snoozedUntil = typeof row.snoozed_until === 'string' ? row.snoozed_until.slice(0, 10) : ''
  return {
    id: row.id,
    title: String(row.title || '').trim().slice(0, POWER_TODO_TITLE_MAX),
    sort_order: Number(row.sort_order) || 0,
    completed_at: row.completed_at || null,
    created_at: row.created_at || row.updated_at || nowIso(),
    updated_at: row.updated_at || row.created_at || null,
    size: row.size === 'quick' || row.size === 'big' ? row.size : null,
    snoozed_until: /^\d{4}-\d{2}-\d{2}$/.test(snoozedUntil) ? snoozedUntil : null,
    snooze_count: Math.max(0, Number.parseInt(row.snooze_count, 10) || 0),
    parent_id: typeof row.parent_id === 'string' && row.parent_id ? row.parent_id : null
  }
}

// Server rows + everything this phone changed that has not synced yet.
function applyPendingPowerState(todoRows = [], planRows = [], doneRows = [], dateKey = todayDateKey()) {
  const pending = readPending()
  const todos = new Map()
  ;[...todoRows, ...doneRows].forEach((row) => {
    if (row?.id) todos.set(row.id, normalizeTodoRow(row))
  })
  Object.values(pending.todoCreates).forEach((item) => {
    if (item?.id && !todos.has(item.id)) todos.set(item.id, normalizeTodoRow(item))
  })
  Object.entries(pending.todoWrites).forEach(([id, item]) => {
    const todo = todos.get(id)
    if (todo && item?.patch) todos.set(id, normalizeTodoRow({ ...todo, ...item.patch }))
  })
  // v1.17 queue items carried the todo completion on the plan write.
  Object.values(pending.powerPlanWrites).forEach((item) => {
    if (!item || !Object.prototype.hasOwnProperty.call(item, 'todo_completed_at')) return
    const todo = todos.get(item.todo_id)
    if (todo) todos.set(todo.id, { ...todo, completed_at: item.todo_completed_at || null })
    else if (!item.todo_completed_at && item.todo_title) {
      todos.set(item.todo_id, normalizeTodoRow({ id: item.todo_id, title: item.todo_title, sort_order: item.todo_sort_order, created_at: item.todo_created_at }))
    }
  })
  Object.keys(pending.todoDeletes).forEach((id) => todos.delete(id))

  const dayStart = dateFromKey(dateKey).getTime()
  const active = []
  const doneToday = []
  todos.forEach((todo) => {
    if (!todo.completed_at) active.push(todo)
    else if ((Date.parse(todo.completed_at) || 0) >= dayStart) doneToday.push(todo)
  })

  const plans = new Map()
  planRows.forEach((plan) => {
    if (plan?.action_date === dateKey && todos.has(plan.todo_id)) plans.set(plan.todo_id, { ...plan })
  })
  Object.values(pending.powerPlanWrites).forEach((item) => {
    if (!item || item.action_date !== dateKey) return
    if (item.status === 'removed' || !todos.has(item.todo_id)) {
      plans.delete(item.todo_id)
      return
    }
    const existing = plans.get(item.todo_id)
    plans.set(item.todo_id, {
      id: existing?.id || item.plan_id || `local-${item.todo_id}-${dateKey}`,
      todo_id: item.todo_id,
      action_date: dateKey,
      status: ['pending', 'done', 'skipped'].includes(item.status) ? item.status : 'pending',
      sort_order: Number(item.sort_order) || 0,
      started_at: item.started_at || null,
      created_at: existing?.created_at || item.created_at || item.updated_at || nowIso(),
      updated_at: item.updated_at || null
    })
  })

  return {
    todos: sortBySortOrder(active),
    doneToday: doneToday.sort((a, b) => String(a.completed_at).localeCompare(String(b.completed_at))),
    plans: sortBySortOrder([...plans.values()])
  }
}

async function loadPowerActions() {
  const dateKey = todayDateKey()
  powerActionsDate = dateKey
  if (!currentUser || !powerActionsAvailable) {
    powerTodos = []
    powerPlans = []
    powerDoneToday = []
    return
  }

  const dayStartIso = dateFromKey(dateKey).toISOString()
  const fetchTodos = (todoColumns) => Promise.all([
    supabase
      .from('power_todos')
      .select(todoColumns)
      .is('completed_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('power_action_plan')
      .select(POWER_PLAN_COLUMNS)
      .eq('action_date', dateKey)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    // Todos finished today, for the wins list.
    supabase
      .from('power_todos')
      .select(todoColumns)
      .gte('completed_at', dayStartIso)
      .order('completed_at', { ascending: true })
  ])

  const askedV118 = actionEngineAvailable
  let results = await fetchTodos(askedV118 ? POWER_TODO_COLUMNS : POWER_TODO_COLUMNS_LEGACY)
  if (askedV118 && results.some((result) => isMissingV118ColumnError(result.error))) {
    actionEngineAvailable = false
    results = await fetchTodos(POWER_TODO_COLUMNS_LEGACY)
  }
  const [todosResult, planResult, doneResult] = results
  const firstError = todosResult.error || planResult.error || doneResult.error
  if (firstError) {
    if (isMissingPowerActionsError(firstError)) {
      powerActionsAvailable = false
      powerTodos = []
      powerPlans = []
      powerDoneToday = []
      return
    }
    throw firstError
  }

  const merged = applyPendingPowerState(todosResult.data || [], planResult.data || [], doneResult.data || [], dateKey)
  powerTodos = merged.todos
  powerPlans = merged.plans
  powerDoneToday = merged.doneToday
}

function getPowerTodo(todoId) {
  return powerTodos.find((todo) => todo.id === todoId) || null
}

function getAnyTodo(todoId) {
  return getPowerTodo(todoId) || powerDoneToday.find((todo) => todo.id === todoId) || null
}

function ensurePowerDate() {
  const dateKey = todayDateKey()
  if (powerActionsDate !== dateKey) {
    powerActionsDate = dateKey
    powerPlans = []
    powerDoneToday = []
  }
  return dateKey
}

function getTodayPowerPlans() {
  const dateKey = ensurePowerDate()
  return powerPlans.filter((plan) => plan.action_date === dateKey)
}

function getTodayPlanForTodo(todoId) {
  return getTodayPowerPlans().find((plan) => plan.todo_id === todoId) || null
}

function getPendingPowerPlans() {
  return sortBySortOrder(getTodayPowerPlans().filter((plan) => plan.status === 'pending' && getPowerTodo(plan.todo_id)))
}

function isTodoSnoozed(todo, dateKey = todayDateKey()) {
  return Boolean(todo?.snoozed_until && todo.snoozed_until > dateKey)
}

// Inbox items that still need a decision today: not already in today, not snoozed, not passed in this sort.
// Oldest first, so nothing rots at the bottom.
function getTriageQueue() {
  const dateKey = todayDateKey()
  const planned = new Set(getTodayPowerPlans().map((plan) => plan.todo_id))
  const passed = triageSession?.passedIds || new Set()
  return powerTodos
    .filter((todo) => !planned.has(todo.id) && !isTodoSnoozed(todo, dateKey) && !passed.has(todo.id))
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
}

function dueInboxCount() {
  const dateKey = todayDateKey()
  const planned = new Set(getTodayPowerPlans().map((plan) => plan.todo_id))
  return powerTodos.filter((todo) => !planned.has(todo.id) && !isTodoSnoozed(todo, dateKey)).length
}

// ---------- sync queue for todos ----------

function queueTodoCreate(todo) {
  const pending = readPending()
  pending.todoCreates[todo.id] = { ...normalizeTodoRow(todo), updated_at: nowIso(), attempts: 0 }
  delete pending.todoDeletes[todo.id]
  writePending(pending)
  flushPendingWrites()
}

function queueTodoPatch(todoId, patch) {
  const pending = readPending()
  const stamp = nowIso()
  if (pending.todoCreates[todoId]) {
    pending.todoCreates[todoId] = { ...pending.todoCreates[todoId], ...patch, updated_at: stamp, attempts: 0 }
  } else {
    pending.todoWrites[todoId] = { patch: { ...(pending.todoWrites[todoId]?.patch || {}), ...patch }, updated_at: stamp, attempts: 0 }
  }
  writePending(pending)
  flushPendingWrites()
}

function queueTodoDelete(todoId) {
  const pending = readPending()
  delete pending.todoCreates[todoId]
  delete pending.todoWrites[todoId]
  Object.keys(pending.powerPlanWrites).forEach((key) => {
    if (pending.powerPlanWrites[key]?.todo_id === todoId) delete pending.powerPlanWrites[key]
  })
  // Always queue the delete, even for a todo that may never have reached the server: a create that
  // was mid-flight when the todo was dropped would otherwise come back as a ghost.
  pending.todoDeletes[todoId] = { updated_at: nowIso(), attempts: 0 }
  writePending(pending)
  flushPendingWrites()
}

function queuePlanWrite(plan) {
  if (!plan?.todo_id || !plan?.action_date) return
  const pending = readPending()
  Object.keys(pending.powerPlanWrites).forEach((key) => {
    const item = pending.powerPlanWrites[key]
    if (item?.todo_id !== plan.todo_id || item?.action_date !== plan.action_date) return
    // Keep a not-yet-synced v1.17 completion before replacing its queue entry.
    if (Object.prototype.hasOwnProperty.call(item, 'todo_completed_at') && !pending.todoCreates[item.todo_id]) {
      pending.todoWrites[item.todo_id] = {
        patch: { completed_at: item.todo_completed_at || null, ...(pending.todoWrites[item.todo_id]?.patch || {}) },
        updated_at: nowIso(),
        attempts: 0
      }
    }
    delete pending.powerPlanWrites[key]
  })
  pending.powerPlanWrites[`${plan.todo_id}|${plan.action_date}`] = {
    todo_id: plan.todo_id,
    action_date: plan.action_date,
    status: plan.status,
    sort_order: Number(plan.sort_order) || 0,
    started_at: plan.started_at || null,
    created_at: plan.created_at || nowIso(),
    updated_at: nowIso(),
    attempts: 0
  }
  writePending(pending)
  flushPendingWrites()
}

// ---------- local todo changes ----------

function createLocalTodo(title, extra = {}) {
  const clean = String(title || '').trim().slice(0, POWER_TODO_TITLE_MAX)
  if (!clean || !currentUser || !powerActionsAvailable) return null
  const stamp = nowIso()
  const todo = normalizeTodoRow({
    id: crypto.randomUUID(),
    title: clean,
    sort_order: Math.max(0, ...powerTodos.map((item) => Number(item.sort_order) || 0)) + 1,
    created_at: stamp,
    updated_at: stamp,
    size: extra.size || null,
    parent_id: extra.parent_id || null
  })
  powerTodos = sortBySortOrder([...powerTodos, todo])
  queueTodoCreate(todo)
  saveSnapshot()
  return todo
}

function patchLocalTodo(todoId, patch) {
  let found = false
  powerTodos = powerTodos.map((todo) => {
    if (todo.id !== todoId) return todo
    found = true
    return normalizeTodoRow({ ...todo, ...patch, updated_at: nowIso() })
  })
  if (!found) return false
  queueTodoPatch(todoId, patch)
  saveSnapshot()
  return true
}

function setLocalPowerPlan(todoId, patch) {
  const dateKey = todayDateKey()
  powerPlans = powerPlans.map((plan) => plan.todo_id === todoId && plan.action_date === dateKey ? { ...plan, ...patch } : plan)
  return powerPlans.find((plan) => plan.todo_id === todoId && plan.action_date === dateKey) || null
}

// Put a todo into today's stack, or change its status for today.
// position: 'end' (default) | 'next' (right after the current card) | 'before' (in front of the current card).
function setTodoTodayStatus(todoId, status, options = {}) {
  const todo = getPowerTodo(todoId)
  if (!todo || !powerActionsAvailable) return null
  const dateKey = ensurePowerDate()
  const progress = currentDailyProgress()
  const anchorKey = getCurrentStackAction(progress)?.key || null
  const stamp = nowIso()
  const plans = getTodayPowerPlans()
  const nextOrder = Math.max(0, ...plans.map((plan) => Number(plan.sort_order) || 0)) + 1
  let plan = plans.find((item) => item.todo_id === todoId) || null
  if (!plan) {
    plan = { id: `local-${todoId}-${dateKey}`, todo_id: todoId, action_date: dateKey, status, sort_order: nextOrder, started_at: null, created_at: stamp, updated_at: stamp }
    powerPlans = [...powerPlans, plan]
  } else {
    const reopening = status === 'pending' && plan.status !== 'pending'
    plan = setLocalPowerPlan(todoId, { status, sort_order: reopening ? nextOrder : plan.sort_order, started_at: null, updated_at: stamp })
  }
  queuePlanWrite(plan)

  const key = todoStackKey(todoId)
  const order = normalizeTodayStackOrder(progress).filter((item) => item !== key)
  if (status === 'pending') {
    const anchorIndex = anchorKey && anchorKey !== key ? order.indexOf(anchorKey) : -1
    if (options.position === 'before' && anchorIndex >= 0) order.splice(anchorIndex, 0, key)
    else if (options.position === 'next') order.splice(anchorIndex + 1, 0, key)
    else order.push(key)
    // Adding work to today reopens a wrapped-up day.
    progress.is_complete = false
    progress.closed_at = null
  }
  progress.stack_order = order
  saveDailyProgress(progress)
  saveSnapshot()
  return plan
}

function removeTodayPlan(todoId) {
  const dateKey = ensurePowerDate()
  powerPlans = powerPlans.filter((plan) => !(plan.todo_id === todoId && plan.action_date === dateKey))
  queuePlanWrite({ todo_id: todoId, action_date: dateKey, status: 'removed', sort_order: 0 })
  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  saveDailyProgress(progress)
  saveSnapshot()
}

// Finishing a todo moves it to today's wins. Returns a function that puts everything back.
function markTodoDone(todoId) {
  const todo = getPowerTodo(todoId)
  if (!todo) return null
  const planBefore = getTodayPlanForTodo(todoId)
  const stamp = nowIso()
  powerTodos = powerTodos.filter((item) => item.id !== todoId)
  powerDoneToday = [...powerDoneToday.filter((item) => item.id !== todoId), { ...todo, completed_at: stamp }]
  queueTodoPatch(todoId, { completed_at: stamp })
  if (planBefore) queuePlanWrite(setLocalPowerPlan(todoId, { status: 'done', updated_at: stamp }))
  saveSnapshot()
  return () => {
    powerDoneToday = powerDoneToday.filter((item) => item.id !== todoId)
    powerTodos = sortBySortOrder([...powerTodos.filter((item) => item.id !== todoId), { ...todo, completed_at: null }])
    queueTodoPatch(todoId, { completed_at: null })
    if (planBefore) queuePlanWrite(setLocalPowerPlan(todoId, { status: planBefore.status, sort_order: planBefore.sort_order, updated_at: nowIso() }))
    saveSnapshot()
  }
}

// Removes a todo for good (with a short undo window). Returns a function that restores it.
function dropTodo(todoId) {
  const todo = getPowerTodo(todoId)
  if (!todo) return null
  const plansBefore = powerPlans.filter((plan) => plan.todo_id === todoId)
  powerTodos = powerTodos.filter((item) => item.id !== todoId)
  powerPlans = powerPlans.filter((plan) => plan.todo_id !== todoId)
  queueTodoDelete(todoId)
  saveSnapshot()
  return () => {
    powerTodos = sortBySortOrder([...powerTodos.filter((item) => item.id !== todoId), todo])
    queueTodoCreate(todo)
    plansBefore.forEach((plan) => {
      powerPlans = [...powerPlans.filter((item) => !(item.todo_id === plan.todo_id && item.action_date === plan.action_date)), plan]
      if (plan.action_date === todayDateKey()) queuePlanWrite(plan)
    })
    saveSnapshot()
  }
}

// ---------- Day Stack ----------
// Routine steps and today's power actions share one ordered queue.

function routineStackKey(stepId) {
  return `routine:${stepId}`
}

function todoStackKey(todoId) {
  return `todo:${todoId}`
}

function isLowEnergy(progress = currentDailyProgress()) {
  return progress?.energy_mode === 'low'
}

function hasCoreSteps() {
  return actionEngineAvailable && dailySteps.some((step) => step.is_core)
}

// A step runs today when today is one of its days. On a low-energy day only core steps run.
// Nothing is skipped or lost: switch back and they return.
function stepRunsToday(step, progress) {
  if (!stepScheduledOn(step, progress?.progress_date || todayDateKey())) return false
  return !isLowEnergy(progress) || !hasCoreSteps() || Boolean(step.is_core)
}

function normalizeTodayStackOrder(progress = currentDailyProgress()) {
  const existing = Array.isArray(progress?.stack_order) ? progress.stack_order : []
  const routineKeys = dailySteps.map((step) => routineStackKey(step.id))
  const todoKeys = getPendingPowerPlans().map((plan) => todoStackKey(plan.todo_id))
  const valid = new Set([...routineKeys, ...todoKeys])
  const normalized = []

  existing.forEach((key) => {
    if (valid.has(key) && !normalized.includes(key)) normalized.push(key)
  })
  routineKeys.forEach((key) => {
    if (!normalized.includes(key)) normalized.push(key)
  })
  todoKeys.forEach((key) => {
    if (!normalized.includes(key)) normalized.push(key)
  })
  return normalized
}

function getTodayStackEntries(progress = currentDailyProgress()) {
  const order = normalizeTodayStackOrder(progress)
  const stepById = new Map(dailySteps.map((step) => [step.id, step]))
  const planByTodoId = new Map(getPendingPowerPlans().map((plan) => [plan.todo_id, plan]))
  const entries = []

  order.forEach((key) => {
    const [type, id] = String(key).split(':', 2)
    if (!id) return
    if (type === 'routine') {
      const step = stepById.get(id)
      if (step && stepRunsToday(step, progress)) entries.push({ type: 'routine', id, key, title: step.title, step })
      return
    }
    if (type === 'todo') {
      const plan = planByTodoId.get(id)
      const todo = plan ? getPowerTodo(id) : null
      if (plan && todo) entries.push({ type: 'todo', id, key, title: todo.title, todo, plan })
    }
  })
  return entries
}

function getCurrentStackAction(progress = currentDailyProgress()) {
  const resolvedRoutine = dailyResolvedStepIds(progress)
  for (const entry of getTodayStackEntries(progress)) {
    if (entry.type === 'todo') {
      if (entry.plan?.status === 'pending') return entry
      continue
    }
    if (resolvedRoutine.has(entry.id)) continue
    const step = entry.step
    const substeps = normalizeDailySubsteps(step.substeps)
    if (!substeps.length) {
      return { ...entry, step, substeps, substepIndex: -1, title: step.title, isSubstep: false }
    }
    const substepIndex = clamp(Number.parseInt(progress.substep_positions?.[step.id], 10) || 0, 0, Math.max(0, substeps.length - 1))
    return { ...entry, step, substeps, substepIndex, title: substeps[substepIndex], isSubstep: true }
  }
  return null
}

function remainingTodayActionCount(progress = currentDailyProgress()) {
  const resolvedRoutine = dailyResolvedStepIds(progress)
  let total = 0
  getTodayStackEntries(progress).forEach((entry) => {
    if (entry.type === 'todo') {
      if (entry.plan?.status === 'pending') total += 1
      return
    }
    if (resolvedRoutine.has(entry.id)) return
    const substeps = normalizeDailySubsteps(entry.step.substeps)
    if (!substeps.length) {
      total += 1
      return
    }
    const position = clamp(Number.parseInt(progress.substep_positions?.[entry.id], 10) || 0, 0, substeps.length)
    total += Math.max(0, substeps.length - position)
  })
  return total
}

// Routine actions finished today (each substep counts once).
function routineDoneCount(progress = currentDailyProgress()) {
  const completed = new Set(progress.completed_step_ids || [])
  return dailySteps.reduce((total, step) => {
    const substeps = normalizeDailySubsteps(step.substeps)
    const count = Math.max(1, substeps.length)
    if (completed.has(step.id)) return total + count
    if (!substeps.length) return total
    return total + clamp(Number.parseInt(progress.substep_positions?.[step.id], 10) || 0, 0, count)
  }, 0)
}

// The running score: it only ever goes up as you act, so it rewards doing, not planning.
function todayScore(progress = currentDailyProgress()) {
  const done = routineDoneCount(progress) + powerDoneToday.length
  const remaining = remainingTodayActionCount(progress)
  const total = done + remaining
  return { done, remaining, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

function moveTodayStackItem(key, direction) {
  const progress = currentDailyProgress()
  const order = normalizeTodayStackOrder(progress)
  // Move among the rows you can see (what's left today), so a tap never looks like it did nothing.
  const resolved = dailyResolvedStepIds(progress)
  const visible = getTodayStackEntries(progress)
    .filter((entry) => entry.type === 'todo' || !resolved.has(entry.id))
    .map((entry) => entry.key)
  const visibleIndex = visible.indexOf(key)
  const targetKey = visibleIndex < 0 ? null : visible[direction === 'up' ? visibleIndex - 1 : visibleIndex + 1]
  if (!targetKey) return
  order.splice(order.indexOf(key), 1)
  order.splice(order.indexOf(targetKey) + (direction === 'up' ? 0 : 1), 0, key)
  progress.stack_order = order
  progress.is_complete = false
  saveDailyProgress(progress)
  rerenderOverview()
}

// "Later today": send a card to the back of today's stack and count how often that happened.
function deferStackKey(key) {
  const progress = currentDailyProgress()
  const order = normalizeTodayStackOrder(progress)
  const index = order.indexOf(key)
  if (index < 0 || index === order.length - 1) return false
  order.splice(index, 1)
  order.push(key)
  progress.stack_order = order
  progress.defer_counts = { ...(progress.defer_counts || {}), [key]: (Number(progress.defer_counts?.[key]) || 0) + 1 }
  progress.is_complete = false
  saveDailyProgress(progress)
  return true
}

function currentDailyMedTakenSet() {
  const dateKey = todayDateKey()
  if (dailyMedsDate !== dateKey) {
    dailyMedsDate = dateKey
    dailyMedTakenIds = mergeDailyMedTakenIds([], dateKey)
  }
  return new Set(dailyMedTakenIds)
}

function toggleDailyMed(medId, options = {}) {
  const med = dailyMeds.find((item) => item.id === medId)
  if (!med || !dailyMedsAvailable) return
  const dateKey = todayDateKey()
  const taken = currentDailyMedTakenSet()
  const nextTaken = !taken.has(medId)
  if (nextTaken) taken.add(medId)
  else taken.delete(medId)
  dailyMedsDate = dateKey
  dailyMedTakenIds = [...taken]

  const pending = readPending()
  pending.medToggles[`${dateKey}|${medId}`] = {
    med_id: medId,
    taken_date: dateKey,
    is_taken: nextTaken,
    updated_at: new Date().toISOString()
  }
  writePending(pending)
  saveSnapshot()
  flushPendingWrites()
  if (options.render !== false) rerenderOverview()
}

function currentDailyProgress() {
  const dateKey = todayDateKey()
  if (!dailyProgress || dailyProgress.progress_date !== dateKey) dailyProgress = pendingDailyProgressFor(dateKey) || emptyDailyProgress(dateKey)
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

function cloneDailyProgress(progress = currentDailyProgress()) {
  return normalizeDailyProgressValue(JSON.parse(JSON.stringify(progress)), todayDateKey())
}

// The routine step that is your workout: START on its card goes straight into today's Gym plan.
// Linked in Edit routine, or by its name ("Gym", "battle angel workout", "Leg training").
// A workout has its own steps, so a step with substeps stays a normal step.
function stepNameSaysWorkout(title) {
  return /\b(gym|workouts?|training)\b/i.test(String(title || ''))
}

function isGymDailyStep(step) {
  if (!step || normalizeDailySubsteps(step.substeps).length) return false
  return typeof step.opens_workout === 'boolean' ? step.opens_workout : stepNameSaysWorkout(step.title)
}

function lastTrainedDateKey(folderId) {
  let latest = ''
  workoutHistory.forEach((entry) => {
    if (entry.folder_id === folderId && String(entry.workout_date) > latest) latest = String(entry.workout_date)
  })
  return latest || null
}

// "Decide for me": when nothing is planned, suggest the muscle you trained least recently
// (never-trained first), so starting the gym is one tap instead of a choice.
function suggestWorkoutFolder() {
  const today = todayDateKey()
  const candidates = folders.filter((folder) => (Number(folder.count) || 0) > 0 && !wasWorkoutCompleted(today, folder.id))
  if (!candidates.length) return null
  return candidates
    .map((folder) => ({ folder, last: lastTrainedDateKey(folder.id) }))
    .sort((a, b) => {
      if (!a.last && b.last) return -1
      if (a.last && !b.last) return 1
      if (a.last !== b.last) return String(a.last).localeCompare(String(b.last))
      return (Number(a.folder.sort_order) || 0) - (Number(b.folder.sort_order) || 0)
    })[0]
}

function daysAgoLabel(dateKey) {
  if (!dateKey) return 'not trained yet'
  const days = Math.round((dateFromKey(todayDateKey()).getTime() - dateFromKey(dateKey).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function getDailyGymState(step) {
  if (!isGymDailyStep(step)) return null
  const today = todayDateKey()
  const planned = getScheduledFolders(today)
  const remaining = planned.filter((folder) => !wasWorkoutCompleted(today, folder.id))
  const doneToday = getCompletedFolders(today)
  const suggestion = planned.length ? null : suggestWorkoutFolder()
  return { planned, remaining, doneToday, suggestion }
}

// The Gym card is satisfied by finishing every planned module, or any workout on an unplanned day.
function gymStepSatisfied(gym) {
  return Boolean(gym && (gym.planned.length ? gym.remaining.length === 0 : gym.doneToday.length > 0))
}

function startDailySystem() {
  const progress = currentDailyProgress()
  const order = normalizeTodayStackOrder(progress)
  if (!order.length || remainingTodayActionCount(progress) <= 0) return false
  progress.stack_order = order
  if (!progress.started_at) progress.started_at = new Date().toISOString()
  progress.is_complete = false
  progress.closed_at = null
  saveDailyProgress(progress)
  renderDayRunner()
  return true
}

// v1.18.1 kept a "picked for you" marker per day; picking is yours now, so the markers can go.
function clearLegacyAutoPickMarkers() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('battle-angel-autopick-'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nothing to tidy.
  }
}

function advanceDailyAction(stepId, skip = false) {
  const progress = currentDailyProgress()
  const step = dailySteps.find((item) => item.id === stepId)
  if (!step) return false

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
  if (!progress.started_at) progress.started_at = new Date().toISOString()
  progress.is_complete = remainingTodayActionCount(progress) === 0
  saveDailyProgress(progress)
  return true
}

// Ignores the accidental second tap of a double tap.
function guardActionTap(ms = 800) {
  const now = Date.now()
  if (now - lastDailyTapAt < ms) return false
  lastDailyTapAt = now
  return true
}

// A finished workout checks off today's workout step, wherever you started it (the card or the Gym tab),
// so you never do it twice. Returns true when that card was the one you were on, so the day picks up
// right where you left it (the next planned module, or the next card).
function maybeCompleteDailyGymStepAfterWorkout() {
  const progress = currentDailyProgress()
  if (progress.closed_at) return false
  const action = getCurrentStackAction(progress)
  const wasCurrent = Boolean(progress.started_at && action && action.type === 'routine' && !action.isSubstep && isGymDailyStep(action.step))
  const resolved = dailyResolvedStepIds(progress)
  getTodayStackEntries(progress).forEach((entry) => {
    if (entry.type !== 'routine' || resolved.has(entry.id) || !isGymDailyStep(entry.step)) return
    if (gymStepSatisfied(getDailyGymState(entry.step))) advanceDailyAction(entry.id, false)
  })
  return wasCurrent
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
    let dailyMedBackupRows = []
    let dailyMedLogBackupRows = []
    let powerTodoBackupRows = []
    let powerPlanBackupRows = []
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
      // '*' so the backup always carries every column the database has (v1.18 core steps, energy mode, wrap-up...).
      const [dailyStepsResult, dailyProgressResult] = await Promise.all([
        supabase.from('daily_steps').select('*').order('sort_order', { ascending: true }),
        supabase.from('daily_progress').select('*').order('progress_date', { ascending: true })
      ])
      if (!dailyStepsResult.error) dailyStepBackupRows = dailyStepsResult.data || []
      if (!dailyProgressResult.error) dailyProgressBackupRows = dailyProgressResult.data || []
    }

    if (dailyMedsAvailable) {
      const [medsResult, medLogResult] = await Promise.all([
        supabase.from('daily_meds').select('id,name,sort_order,created_at,updated_at').order('sort_order', { ascending: true }),
        supabase.from('daily_med_log').select('med_id,taken_date,taken_at').order('taken_date', { ascending: true })
      ])
      if (!medsResult.error) dailyMedBackupRows = medsResult.data || []
      if (!medLogResult.error) dailyMedLogBackupRows = medLogResult.data || []
    }

    if (powerActionsAvailable) {
      const [powerTodosResult, powerPlanResult] = await Promise.all([
        supabase.from('power_todos').select('*').order('created_at', { ascending: true }),
        supabase.from('power_action_plan').select('*').order('action_date', { ascending: true }).order('sort_order', { ascending: true })
      ])
      if (!powerTodosResult.error) powerTodoBackupRows = powerTodosResult.data || []
      if (!powerPlanResult.error) powerPlanBackupRows = powerPlanResult.data || []
    }

    const manifest = {
      format: 'battle-angel-backup',
      version: 11,
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
      daily_progress: dailyProgressBackupRows,
      daily_meds: dailyMedBackupRows,
      daily_med_log: dailyMedLogBackupRows,
      power_todos: powerTodoBackupRows,
      power_action_plan: powerPlanBackupRows
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
  closeSheet()
  clearUndo()
  hideToast(true)
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
    loadDailySystem(),
    loadDailyMeds(),
    loadPowerActions()
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
    dailyProgress,
    dailyMeds,
    dailyMedTakenIds,
    dailyMedsDate,
    powerTodos,
    powerPlans,
    powerDoneToday,
    powerActionsDate
  })
  updateAppBadge()
}

async function restoreSnapshot() {
  const snapshot = readJson(snapshotKey(), null)
  if (!snapshot || !Array.isArray(snapshot.folders)) return false
  const today = todayDateKey()
  folders = snapshot.folders
  motivationFolder = snapshot.motivationFolder || null
  scheduleEntries = snapshot.scheduleEntries || []
  weeklyPlanEntries = snapshot.weeklyPlanEntries || []
  workoutHistory = mergePendingCompletions(snapshot.workoutHistory || [])
  dailySteps = Array.isArray(snapshot.dailySteps) ? snapshot.dailySteps.map(normalizeDailyStepRow) : []
  dailyProgress = normalizeDailyProgressValue(snapshot.dailyProgress, today)
  const pendingDaily = pendingDailyProgressFor(today)
  if (pendingDaily) dailyProgress = pendingDaily
  dailyMeds = Array.isArray(snapshot.dailyMeds) ? snapshot.dailyMeds : []
  dailyMedsDate = today
  dailyMedTakenIds = snapshot.dailyMedsDate === today && Array.isArray(snapshot.dailyMedTakenIds) ? snapshot.dailyMedTakenIds : []
  dailyMedTakenIds = mergeDailyMedTakenIds(dailyMedTakenIds, today)
  const sameDay = snapshot.powerActionsDate === today
  powerActionsDate = today
  const merged = applyPendingPowerState(
    Array.isArray(snapshot.powerTodos) ? snapshot.powerTodos : [],
    sameDay && Array.isArray(snapshot.powerPlans) ? snapshot.powerPlans : [],
    sameDay && Array.isArray(snapshot.powerDoneToday) ? snapshot.powerDoneToday : [],
    today
  )
  powerTodos = merged.todos
  powerPlans = merged.plans
  powerDoneToday = merged.doneToday
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

function pendingBucket(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function readPending() {
  const pending = readJson(pendingKey(), {})
  return {
    weights: pendingBucket(pending.weights),
    completions: Array.isArray(pending.completions) ? pending.completions : [],
    uncompletions: Array.isArray(pending.uncompletions) ? pending.uncompletions : [],
    weightLogs: pendingBucket(pending.weightLogs),
    dailyProgress: pending.dailyProgress && typeof pending.dailyProgress === 'object' ? pending.dailyProgress : null,
    medToggles: pendingBucket(pending.medToggles),
    powerPlanWrites: pendingBucket(pending.powerPlanWrites),
    todoCreates: pendingBucket(pending.todoCreates),
    todoWrites: pendingBucket(pending.todoWrites),
    todoDeletes: pendingBucket(pending.todoDeletes)
  }
}

function writePending(pending) {
  writeJson(pendingKey(), pending)
}

function hasPendingWrites(pending = readPending()) {
  return Boolean(
    Object.keys(pending.weights).length || pending.completions.length || pending.uncompletions.length ||
    Object.keys(pending.weightLogs).length || pending.dailyProgress || Object.keys(pending.medToggles).length ||
    Object.keys(pending.powerPlanWrites).length || Object.keys(pending.todoCreates).length ||
    Object.keys(pending.todoWrites).length || Object.keys(pending.todoDeletes).length
  )
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

const TODO_V118_FIELDS = ['size', 'snoozed_until', 'snooze_count', 'parent_id']
const PROGRESS_V118_FIELDS = ['energy_mode', 'defer_counts', 'closed_at']

function withoutFields(row, fields) {
  const next = { ...row }
  fields.forEach((field) => delete next[field])
  return next
}

// No signal: stop and retry later. Any other failure: retry a few times, then drop that one write,
// so a single impossible row can never block everything queued behind it.
function noteQueueFailure(bucket, key, error) {
  if (isNetworkError(error)) return 'stop'
  console.warn(`battle angel sync (${bucket}) failed:`, error)
  const pending = readPending()
  const item = pending[bucket]?.[key]
  if (item) {
    item.attempts = (Number(item.attempts) || 0) + 1
    if (item.attempts >= 5) delete pending[bucket][key]
    writePending(pending)
  }
  return 'continue'
}

function removeQueued(bucket, key, stamp) {
  const next = readPending()
  if (next[bucket]?.[key] && next[bucket][key].updated_at === stamp) {
    delete next[bucket][key]
    writePending(next)
  }
}

async function upsertTodoRow(row) {
  let sendV118 = actionEngineAvailable
  let result = await supabase.from('power_todos').upsert(sendV118 ? row : withoutFields(row, TODO_V118_FIELDS), { onConflict: 'id' })
  if (result.error && sendV118 && isMissingV118ColumnError(result.error)) {
    actionEngineAvailable = false
    sendV118 = false
    result = await supabase.from('power_todos').upsert(withoutFields(row, TODO_V118_FIELDS), { onConflict: 'id' })
  }
  // A first step whose parent never reached the server: keep the step, lose only the link.
  // (Foreign key 23503, or the v1.18 policy that only allows linking to your own todos, 42501.)
  if (result.error && sendV118 && row.parent_id && ['23503', '42501'].includes(String(result.error.code || ''))) {
    result = await supabase.from('power_todos').upsert({ ...row, parent_id: null }, { onConflict: 'id' })
  }
  return result
}

async function flushTodoQueue() {
  // 1. Todos created on this phone (inserted first: plans and edits depend on them).
  for (const [id, item] of Object.entries(readPending().todoCreates)) {
    const row = {
      id,
      user_id: currentUser.id,
      title: String(item.title || '').slice(0, POWER_TODO_TITLE_MAX) || 'Todo',
      sort_order: Number(item.sort_order) || 0,
      completed_at: item.completed_at || null,
      created_at: item.created_at || item.updated_at || nowIso(),
      updated_at: item.updated_at || nowIso(),
      size: item.size === 'quick' || item.size === 'big' ? item.size : null,
      snoozed_until: item.snoozed_until || null,
      snooze_count: Math.max(0, Number(item.snooze_count) || 0),
      parent_id: item.parent_id || null
    }
    const { error } = await upsertTodoRow(row)
    if (error) {
      if (isMissingPowerActionsError(error)) {
        powerActionsAvailable = false
        return
      }
      if (noteQueueFailure('todoCreates', id, error) === 'stop') return
      continue
    }
    removeQueued('todoCreates', id, item.updated_at)
  }

  // 2. Edits (title, size, snooze, completion).
  for (const [id, item] of Object.entries(readPending().todoWrites)) {
    const sendV118 = actionEngineAvailable
    let patch = { ...(item.patch || {}) }
    if (!sendV118) patch = withoutFields(patch, TODO_V118_FIELDS)
    let error = null
    if (Object.keys(patch).length) {
      ;({ error } = await supabase.from('power_todos').update({ ...patch, updated_at: item.updated_at || nowIso() }).eq('id', id))
      if (error && sendV118 && isMissingV118ColumnError(error)) {
        actionEngineAvailable = false
        const legacyPatch = withoutFields(patch, TODO_V118_FIELDS)
        error = Object.keys(legacyPatch).length
          ? (await supabase.from('power_todos').update({ ...legacyPatch, updated_at: item.updated_at || nowIso() }).eq('id', id)).error
          : null
      }
    }
    if (error) {
      if (isMissingPowerActionsError(error)) {
        powerActionsAvailable = false
        return
      }
      if (noteQueueFailure('todoWrites', id, error) === 'stop') return
      continue
    }
    removeQueued('todoWrites', id, item.updated_at)
  }

  // 3. Today's choices, matched by todo + date (works for rows made offline or on another device).
  for (const [key, item] of Object.entries(readPending().powerPlanWrites)) {
    if (!item?.todo_id || !item?.action_date) {
      removeQueued('powerPlanWrites', key, item?.updated_at)
      continue
    }
    let error = null
    if (item.status === 'removed') {
      ;({ error } = await supabase.from('power_action_plan').delete().eq('todo_id', item.todo_id).eq('action_date', item.action_date))
    } else {
      ;({ error } = await supabase.from('power_action_plan').upsert({
        user_id: currentUser.id,
        todo_id: item.todo_id,
        action_date: item.action_date,
        status: ['pending', 'done', 'skipped'].includes(item.status) ? item.status : 'pending',
        sort_order: Number(item.sort_order) || 0,
        started_at: item.started_at || null,
        updated_at: item.updated_at || nowIso()
      }, { onConflict: 'user_id,todo_id,action_date' }))
    }
    // v1.17 queue items also carried the todo completion.
    if (!error && Object.prototype.hasOwnProperty.call(item, 'todo_completed_at')) {
      ;({ error } = await supabase.from('power_todos').update({ completed_at: item.todo_completed_at || null, updated_at: item.updated_at || nowIso() }).eq('id', item.todo_id))
    }
    if (error) {
      if (isMissingPowerActionsError(error)) {
        powerActionsAvailable = false
        return
      }
      if (noteQueueFailure('powerPlanWrites', key, error) === 'stop') return
      continue
    }
    removeQueued('powerPlanWrites', key, item.updated_at)
  }

  // 4. Dropped todos (their plan rows go with them).
  for (const [id, item] of Object.entries(readPending().todoDeletes)) {
    const { error } = await supabase.from('power_todos').delete().eq('id', id)
    if (error) {
      if (isMissingPowerActionsError(error)) {
        powerActionsAvailable = false
        return
      }
      if (noteQueueFailure('todoDeletes', id, error) === 'stop') return
      continue
    }
    removeQueued('todoDeletes', id, item.updated_at)
  }
}

async function flushDailyProgressQueue() {
  const dailyItem = readPending().dailyProgress
  if (!dailyItem || !dailySystemAvailable) return
  const payload = {
    user_id: currentUser.id,
    progress_date: dailyItem.progress_date,
    completed_step_ids: dailyItem.completed_step_ids || [],
    skipped_step_ids: dailyItem.skipped_step_ids || [],
    later_step_ids: dailyItem.later_step_ids || [],
    stack_order: dailyItem.stack_order || [],
    substep_positions: dailyItem.substep_positions || {},
    is_complete: Boolean(dailyItem.is_complete),
    started_at: dailyItem.started_at || null,
    updated_at: dailyItem.updated_at || new Date().toISOString(),
    energy_mode: dailyItem.energy_mode === 'low' ? 'low' : 'normal',
    defer_counts: normalizeCountMap(dailyItem.defer_counts),
    closed_at: dailyItem.closed_at || null
  }
  const upsert = (row) => supabase.from('daily_progress').upsert(row, { onConflict: 'user_id,progress_date' })
  const sendV118 = actionEngineAvailable
  let { error } = await upsert(sendV118 ? payload : withoutFields(payload, PROGRESS_V118_FIELDS))
  if (error && sendV118 && isMissingV118ColumnError(error)) {
    actionEngineAvailable = false
    ;({ error } = await upsert(withoutFields(payload, PROGRESS_V118_FIELDS)))
  }
  if (error) {
    if (isMissingDailySystemError(error)) dailySystemAvailable = false
    return
  }
  const next = readPending()
  if (next.dailyProgress?.updated_at === dailyItem.updated_at) next.dailyProgress = null
  writePending(next)
}

let flushingPending = false
let flushRequested = false
async function flushPendingWrites() {
  if (!currentUser || navigator.onLine === false) return
  if (flushingPending) {
    flushRequested = true
    return
  }
  if (!hasPendingWrites()) return
  flushingPending = true
  try {
    do {
      flushRequested = false
      await flushPendingOnce()
    } while (flushRequested && currentUser && navigator.onLine !== false)
  } catch (error) {
    console.warn('battle angel sync paused:', error)
  } finally {
    flushingPending = false
  }
}

async function flushPendingOnce() {
  const pending = readPending()
  if (!hasPendingWrites(pending)) return
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
  await flushDailyProgressQueue()
  if (dailyMedsAvailable) {
    for (const [key, item] of Object.entries(readPending().medToggles)) {
      let error = null
      if (item.is_taken) {
        ;({ error } = await supabase.from('daily_med_log').upsert({
          user_id: currentUser.id,
          med_id: item.med_id,
          taken_date: item.taken_date,
          taken_at: item.updated_at || new Date().toISOString()
        }, { onConflict: 'user_id,med_id,taken_date' }))
      } else {
        ;({ error } = await supabase.from('daily_med_log').delete().eq('med_id', item.med_id).eq('taken_date', item.taken_date))
      }
      if (error) {
        if (isMissingDailyMedsError(error)) dailyMedsAvailable = false
        break
      }
      const next = readPending()
      if (next.medToggles[key]?.updated_at === item.updated_at) delete next.medToggles[key]
      writePending(next)
    }
  }
  if (powerActionsAvailable) await flushTodoQueue()
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
}

function dataSignature() {
  return JSON.stringify([
    folders,
    scheduleEntries,
    weeklyPlanEntries,
    workoutHistory.map((entry) => [entry.workout_date, entry.folder_id]),
    motivationVideos.map((video) => video.id),
    dailySteps.map((step) => [step.id, step.title, step.note, step.substeps, step.sort_order, Boolean(step.is_core), step.weekdays, step.opens_workout]),
    dailyProgress,
    dailyMeds.map((med) => [med.id, med.name, med.sort_order]),
    dailyMedsDate,
    dailyMedTakenIds,
    powerTodos.map((todo) => [todo.id, todo.title, todo.sort_order, todo.size, todo.snoozed_until, todo.snooze_count]),
    powerPlans.map((plan) => [plan.todo_id, plan.action_date, plan.status, plan.sort_order]),
    powerDoneToday.map((todo) => todo.id)
  ])
}

// The runner only redraws when the card itself changed (for example, finished on another device),
// so a background sync never yanks the screen out from under you.
function refreshRunnerIfChanged() {
  if (currentView !== 'day-runner' || document.querySelector('.sheet-backdrop')) return
  if (runnerKeyFor(getCurrentStackAction()) !== lastRunnerKey) renderDayRunner()
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
  else if (currentView === 'day-runner') refreshRunnerIfChanged()
  else if (currentView === 'day-prompt') refreshPowerPromptIfIdle()
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
    // The day is a gift, the body is forged, and the calendar is where you write your destiny.
    ['day', 'Gifts'],
    ['gym', 'Forge'],
    ['plan', 'Destiny'],
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
  closeSheet()
  // Undo toasts belong to the Day tab; leaving it ends the undo window.
  if (!DAY_VIEWS.includes(currentView)) {
    clearUndo()
    hideToast(true)
  }
  const lockDayRunner = currentView === 'day-runner' || currentView === 'triage'
  document.documentElement.classList.toggle('day-runner-active', lockDayRunner)
  document.body.classList.toggle('day-runner-active', lockDayRunner)
  app.innerHTML = `
    <main class="shell ${workoutMode ? 'workout-shell' : ''} ${options.navTab ? 'has-bottom-nav' : ''} ${showHeader ? '' : 'shell-no-header'} ${options.shellClass || ''}">
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

// ---------- small helpers for the Day tab ----------

function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`
}

function shorten(text, max = 34) {
  const value = String(text || '')
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function ageInDays(iso) {
  const created = Date.parse(iso || '')
  if (!created) return 0
  const createdDay = dateFromKey(formatLocalDateKey(new Date(created))).getTime()
  return Math.max(0, Math.round((dateFromKey(todayDateKey()).getTime() - createdDay) / 86400000))
}

// Inbox lists run newest first. powerTodos itself stays oldest first (new ones are appended).
function newestFirst(todos) {
  return [...todos].reverse()
}

function ageShortLabel(iso) {
  const days = ageInDays(iso)
  if (days <= 0) return 'new'
  if (days < 14) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

function ageLongLabel(iso) {
  const days = ageInDays(iso)
  if (days <= 0) return 'added today'
  if (days === 1) return 'since yesterday'
  return `waiting ${days} days`
}

function returnDayLabel(dateKey) {
  const days = Math.round((dateFromKey(dateKey).getTime() - dateFromKey(todayDateKey()).getTime()) / 86400000)
  if (days <= 1) return 'tomorrow'
  if (days < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(dateFromKey(dateKey))
  return formatPlanDate(dateKey, { short: true })
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// ---------- toasts + undo ----------
// Undo instead of "Are you sure?": acting stays one tap, and a slip costs one more tap, not a lost item.

function toastHost() {
  let host = document.querySelector('#toast-host')
  if (!host) {
    host = document.createElement('div')
    host.id = 'toast-host'
    host.setAttribute('aria-live', 'polite')
    document.body.appendChild(host)
  }
  return host
}

function showToast(message, options = {}) {
  const host = toastHost()
  if (toastTimer) window.clearTimeout(toastTimer)
  host.innerHTML = `
    <div class="day-undo-toast" role="status">
      <span>${escapeHtml(message)}</span>
      ${options.actionLabel ? `<button type="button">${escapeHtml(options.actionLabel)}</button>` : ''}
    </div>`
  host.querySelector('button')?.addEventListener('click', () => {
    hideToast(true)
    options.onAction?.()
  })
  toastTimer = window.setTimeout(() => hideToast(), options.ms || (options.actionLabel ? UNDO_MS : 2600))
}

function hideToast(immediate = false) {
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = null
  const host = document.querySelector('#toast-host')
  const toast = host?.firstElementChild
  if (!toast) return
  if (immediate) {
    host.innerHTML = ''
    return
  }
  toast.classList.add('is-hiding')
  window.setTimeout(() => {
    if (host.firstElementChild === toast) host.innerHTML = ''
  }, 180)
}

function rememberUndo(label, restore, rerender) {
  const state = { restore, rerender, expiresAt: Date.now() + UNDO_MS }
  undoState = state
  showToast(label, {
    actionLabel: 'Undo',
    onAction: () => {
      if (undoState !== state) return
      undoState = null
      state.restore()
      state.rerender?.()
    }
  })
}

function clearUndo() {
  undoState = null
}

// ---------- bottom sheets ----------

function openSheet(innerHtml, options = {}) {
  closeSheet()
  const backdrop = document.createElement('div')
  backdrop.className = 'sheet-backdrop'
  backdrop.innerHTML = `<div class="sheet ${options.sheetClass || ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(options.label || 'Options')}">${innerHtml}</div>`
  document.body.appendChild(backdrop)
  sheetOnDismiss = options.onDismiss || null
  backdrop.addEventListener('click', (event) => {
    if (event.target.closest('[data-sheet-close]')) {
      dismissSheet()
      return
    }
    // A stray tap outside never throws away something you were typing.
    if (event.target === backdrop && ![...backdrop.querySelectorAll('input')].some((input) => input.value.trim())) dismissSheet()
  })
  return backdrop
}

// You closed it (× or a tap outside): run the sheet's follow-up, like putting the runner on the next card.
function dismissSheet() {
  const onDismiss = sheetOnDismiss
  closeSheet()
  onDismiss?.()
}

function closeSheet() {
  sheetOnDismiss = null
  document.querySelectorAll('.sheet-backdrop').forEach((element) => element.remove())
}

// ---------- re-render helpers ----------

function currentOpenDetailIds() {
  return [...document.querySelectorAll('#main-content details[open][id]')].map((element) => element.id)
}

// Redraw the Day screen you're on with fresh data, keeping your place: scroll position and open items.
function rerenderDayView(extra = {}) {
  const openIds = extra.openIds || currentOpenDetailIds()
  const y = window.scrollY
  if (currentView === 'day-routine') renderRoutineEditor()
  else if (currentView === 'day-boosters') renderBoostersEditor()
  else if (currentView === 'day-prompt') renderPowerPrompt()
  else renderDay('', { forceOverview: true, ...extra })
  openIds.forEach((id) => document.getElementById(id)?.setAttribute('open', ''))
  window.scrollTo(0, y)
}

function rerenderOverview(extra = {}) {
  if (currentView === 'day-routine' || currentView === 'day-boosters' || currentView === 'day-prompt') {
    rerenderDayView(extra)
    return
  }
  const y = window.scrollY
  renderDay('', { forceOverview: true, ...extra })
  window.scrollTo(0, y)
}

function rerenderCurrentDayView() {
  if (currentView === 'triage') renderTriage()
  else if (currentView === 'day-runner') renderDayRunner()
  else if (DAY_VIEWS.includes(currentView)) rerenderDayView()
}

// ---------- feedback: sound, haptics, celebration ----------

function doneSoundOn() {
  try {
    return window.localStorage.getItem(DONE_SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

function playTones(notes, volume = 0.1) {
  try {
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
    const start = audioCtx.currentTime + 0.01
    notes.forEach(([offset, frequency, duration]) => {
      const oscillator = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      oscillator.type = 'sine'
      oscillator.connect(gain)
      gain.connect(audioCtx.destination)
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(volume, start + offset + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration)
      oscillator.start(start + offset)
      oscillator.stop(start + offset + duration + 0.03)
    })
  } catch {
    // Feedback is a bonus; the action already counted.
  }
}

function playDoneTick() {
  if (doneSoundOn()) playTones([[0, 880, 0.08], [0.07, 1320, 0.12]], 0.08)
}

function playDayCompleteChime() {
  if (doneSoundOn()) playTones([[0, 523, 0.16], [0.13, 659, 0.16], [0.26, 784, 0.16], [0.39, 1047, 0.32]], 0.1)
}

function playSprintChime() {
  playTones([[0, 660, 0.2], [0.22, 880, 0.28]], 0.14)
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // iPhone Safari has no vibration API; the visual check still lands.
  }
}

// A quick visible + audible "done" before the next card: the reward has to land in the same second as the action.
function celebrateDone() {
  playDoneTick()
  vibrate(14)
  const card = document.querySelector('#day-step-card')
  if (!card || prefersReducedMotion()) return Promise.resolve()
  card.classList.add('is-done')
  document.querySelectorAll('.day-action-controls button, .card-tools button').forEach((button) => { button.disabled = true })
  return new Promise((resolve) => window.setTimeout(resolve, 340))
}

// ---------- 5-minute sprint ----------
// "Just 5 minutes" lowers the cost of starting to almost nothing. Most of the time, once started, you keep going.

function runnerKeyFor(action) {
  if (!action) return ''
  return `${action.key}#${Number.isInteger(action.substepIndex) && action.substepIndex >= 0 ? action.substepIndex : ''}`
}

function sprintStorageKey() {
  return `battle-angel-sprint-${currentUser?.id || 'anon'}`
}

function readSprint() {
  const value = readJson(sprintStorageKey(), null)
  if (!value || typeof value.key !== 'string') return null
  const endsAt = Number(value.endsAt)
  const startedAt = Number(value.startedAt)
  if (!Number.isFinite(endsAt) || !Number.isFinite(startedAt) || Date.now() - endsAt > 6 * 60 * 60 * 1000) return null
  return { key: value.key, startedAt, endsAt, chimed: Boolean(value.chimed) }
}

function writeSprint(value) {
  if (value) {
    writeJson(sprintStorageKey(), value)
    return
  }
  try {
    window.localStorage.removeItem(sprintStorageKey())
  } catch {
    // Nothing stored.
  }
}

function sprintIsRunning() {
  const sprint = readSprint()
  return Boolean(sprint && sprint.endsAt > Date.now())
}

function stopSprintTicker() {
  if (sprintTicker) window.clearInterval(sprintTicker)
  sprintTicker = null
}

function clearSprint() {
  const had = Boolean(readSprint())
  writeSprint(null)
  stopSprintTicker()
  if (had && !workoutMode && !timerEndAt) releaseWakeLock()
}

function clearSprintFor(stackKey) {
  const sprint = readSprint()
  if (sprint && sprint.key.startsWith(`${stackKey}#`)) clearSprint()
}

function syncSprintWithAction(action) {
  const sprint = readSprint()
  if (!sprint) return
  if (sprint.key !== runnerKeyFor(action)) {
    clearSprint()
    return
  }
  if (sprint.endsAt > Date.now()) {
    keepAwake()
    startSprintTicker()
  }
}

function startSprint(action) {
  if (!action) return
  unlockAudio()
  const key = runnerKeyFor(action)
  const now = Date.now()
  const existing = readSprint()
  const running = existing && existing.key === key && existing.endsAt > now
  writeSprint({
    key,
    startedAt: running ? existing.startedAt : now,
    endsAt: (running ? existing.endsAt : now) + SPRINT_MINUTES * 60 * 1000,
    chimed: false
  })
  keepAwake()
  updateSprintPill()
  startSprintTicker()
}

function sprintPillState(sprint) {
  if (!sprint) return 'idle'
  return sprint.endsAt > Date.now() ? 'running' : 'ended'
}

function sprintPillInner(sprint) {
  if (!sprint) return `<span class="sprint-label">&#9654; Just ${SPRINT_MINUTES} minutes</span>`
  const now = Date.now()
  if (sprint.endsAt > now) {
    const left = Math.ceil((sprint.endsAt - now) / 1000)
    const percent = clamp(((now - sprint.startedAt) / Math.max(1, sprint.endsAt - sprint.startedAt)) * 100, 0, 100)
    return `<span class="sprint-fill" style="width:${percent.toFixed(1)}%"></span><span class="sprint-time">${formatTime(left)}</span><span class="sprint-label">you're in · +${SPRINT_MINUTES}</span>`
  }
  return `<span class="sprint-label">Time's up. You started. +${SPRINT_MINUTES} more?</span>`
}

function renderSprintPill(action) {
  const sprint = readSprint()
  const mine = sprint && sprint.key === runnerKeyFor(action) ? sprint : null
  return `<button type="button" class="sprint-pill" id="sprint-pill" data-state="${sprintPillState(mine)}" aria-label="Start a ${SPRINT_MINUTES}-minute sprint">${sprintPillInner(mine)}</button>`
}

function updateSprintPill() {
  const pill = document.querySelector('#sprint-pill')
  if (!pill) return
  const sprint = readSprint()
  const mine = sprint && sprint.key === lastRunnerKey ? sprint : null
  pill.dataset.state = sprintPillState(mine)
  pill.innerHTML = sprintPillInner(mine)
}

function startSprintTicker() {
  if (sprintTicker) return
  sprintTicker = window.setInterval(() => {
    const sprint = readSprint()
    if (!sprint) {
      stopSprintTicker()
      return
    }
    if (sprint.endsAt <= Date.now()) {
      if (!sprint.chimed) {
        writeSprint({ ...sprint, chimed: true })
        // Only chime right at the end, not when you come back to the app long after.
        if (document.visibilityState === 'visible' && Date.now() - sprint.endsAt < 15000) {
          playSprintChime()
          vibrate([40, 60, 40])
        }
        if (!workoutMode && !timerEndAt) releaseWakeLock()
      }
      updateSprintPill()
      stopSprintTicker()
      return
    }
    updateSprintPill()
  }, 500)
}

// ---------- setup screens: routine and boosters ----------
// Both work the same way: a numbered list you open item by item, and an add form at the bottom.
// They live on their own screens, so the Day overview stays about today.

function openDayEditor(kind) {
  if (kind === 'routine') renderRoutineEditor()
  else renderBoostersEditor()
  window.scrollTo(0, 0)
}

function renderCoreCheckbox(checked, id = '') {
  if (!actionEngineAvailable) return ''
  return `
    <label class="core-check">
      <input type="checkbox" name="is_core" ${id ? `id="${id}"` : ''} ${checked ? 'checked' : ''} />
      <span><strong>Core step</strong>, still runs on low-energy days</span>
    </label>`
}

// Seven day buttons, Monday first. All on means every day. The last one on can't be turned off.
function renderDayPicker(weekdays) {
  if (!routineDaysAvailable) return ''
  const days = normalizeWeekdays(weekdays)
  return `
    <fieldset class="day-picker" data-day-picker>
      <legend class="field-label">Days</legend>
      <div class="day-picker-row">
        ${WEEKDAY_ORDER.map((day) => `<button type="button" class="day-toggle" data-day-toggle="${day}" aria-pressed="${!days || days.includes(day) ? 'true' : 'false'}" aria-label="${WEEKDAY_NAMES[day]}">${WEEKDAY_NAMES[day][0]}</button>`).join('')}
      </div>
      <p class="day-picker-summary" data-day-summary aria-live="polite">${escapeHtml(weekdaysLabel(days))}</p>
    </fieldset>`
}

function pickedDays(picker) {
  return [...picker.querySelectorAll('[data-day-toggle][aria-pressed="true"]')].map((button) => Number(button.dataset.dayToggle))
}

// undefined = this form has no day picker (the database step hasn't run), so the days aren't sent.
function readDayPicker(scope) {
  const picker = scope?.querySelector('[data-day-picker]')
  return picker ? normalizeWeekdays(pickedDays(picker)) : undefined
}

function bindDayPickers() {
  document.querySelectorAll('[data-day-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const picker = button.closest('[data-day-picker]')
      const summary = picker?.querySelector('[data-day-summary]')
      if (!picker) return
      const on = button.getAttribute('aria-pressed') === 'true'
      if (on && pickedDays(picker).length === 1) {
        if (summary) {
          summary.textContent = 'Keep at least one day.'
          summary.classList.remove('is-flash')
          void summary.offsetWidth
          summary.classList.add('is-flash')
        }
        return
      }
      button.setAttribute('aria-pressed', on ? 'false' : 'true')
      if (summary) {
        summary.classList.remove('is-flash')
        summary.textContent = weekdaysLabel(pickedDays(picker))
      }
    })
  })
}

// Links a step to the Gym tab. Shown once the v1.20 database step has run; before that, the name decides.
function renderWorkoutLinkCheckbox(checked, id = '') {
  if (!routineDaysAvailable) return ''
  return `
    <label class="core-check workout-link-check">
      <input type="checkbox" name="opens_workout" ${id ? `id="${id}"` : ''} ${checked ? 'checked' : ''} />
      <span><strong>Opens today's workout</strong>, START goes straight into today's workout in Forge</span>
    </label>`
}

function renderEditorItem({ id, number, title, meta, form }) {
  return `
    <details class="editor-item" id="${id}">
      <summary>
        <span class="editor-item-num" aria-hidden="true">${number}</span>
        <span class="editor-item-copy"><strong>${escapeHtml(title)}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ''}</span>
        <span class="editor-item-open" aria-hidden="true">Edit</span>
      </summary>
      ${form}
    </details>`
}

function renderEditorActions({ moveAttr, idAttr, id, index, count, deleteAttr }) {
  return `
    <div class="editor-actions">
      <button type="submit" class="primary-button">Save</button>
      <button type="button" class="secondary-button" ${moveAttr}="up" ${idAttr}="${id}" ${index === 0 ? 'disabled' : ''} aria-label="Move up">&uarr;</button>
      <button type="button" class="secondary-button" ${moveAttr}="down" ${idAttr}="${id}" ${index === count - 1 ? 'disabled' : ''} aria-label="Move down">&darr;</button>
      <button type="button" class="ghost-danger" ${deleteAttr}="${id}">Delete</button>
    </div>`
}

function renderRoutineEditor() {
  if (!dailySystemAvailable) {
    renderDay()
    return
  }
  const progress = currentDailyProgress()
  const rows = dailySteps.map((step, index) => {
    const substeps = normalizeDailySubsteps(step.substeps)
    const meta = [step.weekdays ? weekdaysLabel(step.weekdays) : '', isGymDailyStep(step) ? 'opens workout' : '', substeps.length ? plural(substeps.length, 'substep') : '', step.is_core && actionEngineAvailable ? 'core' : ''].filter(Boolean).join(', ')
    return renderEditorItem({
      id: `routine-step-${step.id}`,
      number: index + 1,
      title: step.title,
      meta,
      form: `
        <form class="editor-form" data-daily-edit="${step.id}">
          <label>
            <span class="field-label">Step</span>
            <input name="title" type="text" maxlength="${DAILY_STEP_TITLE_MAX}" required value="${escapeHtml(step.title)}" />
          </label>
          ${renderDayPicker(step.weekdays)}
          <label>
            <span class="field-label">Short note, optional</span>
            <textarea name="note" maxlength="${DAILY_STEP_NOTE_MAX}" rows="2" placeholder="Only what you need to remember">${escapeHtml(step.note || '')}</textarea>
          </label>
          <label>
            <span class="field-label">Substeps, one per line, optional</span>
            <textarea name="substeps" rows="${Math.min(6, Math.max(2, substeps.length + 1))}" placeholder="Brush teeth&#10;Skincare&#10;Get dressed">${escapeHtml(dailySubstepsText(step))}</textarea>
          </label>
          ${renderWorkoutLinkCheckbox(isGymDailyStep(step))}
          ${renderCoreCheckbox(step.is_core)}
          ${renderEditorActions({ moveAttr: 'data-daily-move', idAttr: 'data-daily-step-id', id: step.id, index, count: dailySteps.length, deleteAttr: 'data-daily-delete' })}
        </form>`
    })
  }).join('')

  const coreTip = actionEngineAvailable && dailySteps.length >= 4 && !dailySteps.some((step) => step.is_core)
    ? '<p class="editor-tip">Tip: mark 3 to 5 steps as <strong>core</strong>. On a rough day you run only those, and a minimum day still counts.</p>'
    : ''

  renderShell(`
    <button type="button" class="back-button editor-back" id="editor-back"><span aria-hidden="true">&lsaquo;</span> Gifts</button>
    <p class="editor-intro">Runs top to bottom${routineDaysAvailable ? ', on the days you pick for each step' : ', every day'}. A step with <strong>workout</strong> or <strong>gym</strong> in its name opens today's workout${routineDaysAvailable ? ', or switch on <strong>Opens today\'s workout</strong> for any step' : ''}.</p>
    ${routineDaysAvailable ? '' : '<p class="editor-tip editor-db-note">To pick the days a step runs, run <strong>supabase/routine_upgrade.sql</strong> once in Supabase. Until then every step runs every day.</p>'}
    ${rows ? `<div class="editor-list">${rows}</div>` : '<div class="day-panel"><p class="day-empty">No steps yet. Start with the first thing you do after waking up.</p></div>'}
    ${coreTip}
    <form id="add-daily-step" class="editor-add">
      <h3 class="editor-add-title">Add a step</h3>
      <input id="daily-step-title" type="text" maxlength="${DAILY_STEP_TITLE_MAX}" required placeholder="e.g. Get ready" aria-label="New step" />
      ${renderDayPicker(null)}
      <details class="editor-add-more" id="routine-add-more">
        <summary>Note, substeps${routineDaysAvailable ? ', workout link' : ''}${actionEngineAvailable ? ', core' : ''}</summary>
        <textarea id="daily-step-note" maxlength="${DAILY_STEP_NOTE_MAX}" rows="2" placeholder="Short note, optional" aria-label="Short note"></textarea>
        <textarea id="daily-step-substeps" rows="3" placeholder="Substeps, one per line" aria-label="Substeps, one per line"></textarea>
        ${renderWorkoutLinkCheckbox(false, 'daily-step-workout')}
        ${renderCoreCheckbox(false, 'daily-step-core')}
      </details>
      <button type="submit" class="primary-button">Add step</button>
      <div id="daily-editor-status" class="status-line" aria-live="polite"></div>
    </form>
    ${progress.started_at ? '<button type="button" class="text-button danger-text editor-reset" id="reset-day-progress">Restart today from the first step</button>' : ''}`,
    { title: 'Routine', showAccount: false, showTimer: false, navTab: 'day', view: 'day-routine' })

  document.querySelector('#editor-back')?.addEventListener('click', openDayOverview)
  document.querySelector('#add-daily-step')?.addEventListener('submit', addDailyStep)
  bindDayPickers()
  document.querySelectorAll('[data-daily-edit]').forEach((form) => form.addEventListener('submit', updateDailyStep))
  document.querySelectorAll('[data-daily-move]').forEach((button) => {
    button.addEventListener('click', () => moveDailyStep(button.dataset.dailyStepId, button.dataset.dailyMove))
  })
  document.querySelectorAll('[data-daily-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteDailyStep(button.dataset.dailyDelete))
  })
  document.querySelector('#reset-day-progress')?.addEventListener('click', resetTodayDailyProgress)
}

function renderBoostersEditor() {
  if (!dailyMedsAvailable) {
    openDayOverview()
    return
  }
  const rows = dailyMeds.map((med, index) => renderEditorItem({
    id: `booster-${med.id}`,
    number: index + 1,
    title: med.name,
    meta: '',
    form: `
      <form class="editor-form" data-daily-med-edit="${med.id}">
        <label>
          <span class="field-label">Name</span>
          <input name="name" type="text" maxlength="${DAILY_MED_NAME_MAX}" required value="${escapeHtml(med.name)}" />
        </label>
        ${renderEditorActions({ moveAttr: 'data-daily-med-move', idAttr: 'data-daily-med-id', id: med.id, index, count: dailyMeds.length, deleteAttr: 'data-daily-med-delete' })}
      </form>`
  })).join('')

  renderShell(`
    <button type="button" class="back-button editor-back" id="editor-back"><span aria-hidden="true">&lsaquo;</span> Gifts</button>
    <p class="editor-intro">Your daily boosters. Check them off on Gifts, or with the Boosters button while you work.</p>
    ${rows ? `<div class="editor-list">${rows}</div>` : '<div class="day-panel"><p class="day-empty">No boosters yet. Add the first one below.</p></div>'}
    <form id="add-daily-med" class="editor-add">
      <h3 class="editor-add-title">Add a booster</h3>
      <input id="daily-med-name" type="text" maxlength="${DAILY_MED_NAME_MAX}" required placeholder="e.g. Vitamin D" aria-label="New booster" />
      <button type="submit" class="primary-button">Add booster</button>
      <div id="daily-meds-status" class="status-line" aria-live="polite"></div>
    </form>`,
    { title: 'Boosters', showAccount: false, showTimer: false, navTab: 'day', view: 'day-boosters' })

  document.querySelector('#editor-back')?.addEventListener('click', openDayOverview)
  document.querySelector('#add-daily-med')?.addEventListener('submit', addDailyMed)
  document.querySelectorAll('[data-daily-med-edit]').forEach((form) => form.addEventListener('submit', updateDailyMed))
  document.querySelectorAll('[data-daily-med-move]').forEach((button) => {
    button.addEventListener('click', () => moveDailyMed(button.dataset.dailyMedId, button.dataset.dailyMedMove))
  })
  document.querySelectorAll('[data-daily-med-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteDailyMed(button.dataset.dailyMedDelete))
  })
}

async function insertOrUpdateDailyStep(row, id = null) {
  const run = (payload) => id
    ? supabase.from('daily_steps').update(payload).eq('id', id)
    : supabase.from('daily_steps').insert(payload)
  let sendV118 = actionEngineAvailable
  let sendV120 = routineDaysAvailable
  const payload = () => withoutFields(row, [...(sendV118 ? [] : ['is_core']), ...(sendV120 ? [] : V120_COLUMNS)])
  let { error } = await run(payload())
  for (let attempt = 0; attempt < 2 && error; attempt += 1) {
    if (sendV120 && isMissingV120ColumnError(error)) {
      routineDaysAvailable = false
      sendV120 = false
    } else if (sendV118 && isMissingV118ColumnError(error)) {
      actionEngineAvailable = false
      sendV118 = false
    } else break
    ;({ error } = await run(payload()))
  }
  return error
}

// Days picked before the database step ran can't be saved; say so instead of dropping them silently.
function daysNotSaved(row) {
  return !routineDaysAvailable && (('weekdays' in row && row.weekdays !== null) || row.opens_workout === true)
}

async function addDailyStep(event) {
  event.preventDefault()
  if (!currentUser || !dailySystemAvailable) return
  const title = document.querySelector('#daily-step-title')?.value.trim().slice(0, DAILY_STEP_TITLE_MAX)
  const note = document.querySelector('#daily-step-note')?.value.trim().slice(0, DAILY_STEP_NOTE_MAX) || ''
  const substeps = parseDailySubstepsText(document.querySelector('#daily-step-substeps')?.value || '')
  const isCore = Boolean(document.querySelector('#daily-step-core')?.checked)
  const weekdays = readDayPicker(document.querySelector('#add-daily-step'))
  const workoutBox = document.querySelector('#daily-step-workout')
  // Unticked on a new step means "decide by the name", so "battle angel workout" still links itself.
  const opensWorkout = workoutBox?.checked ? true : undefined
  const status = document.querySelector('#daily-editor-status')
  if (!title) return
  if (status) status.textContent = 'Saving...'
  const nextOrder = Math.max(0, ...dailySteps.map((step) => Number(step.sort_order) || 0)) + 1
  const row = {
    user_id: currentUser.id,
    title,
    note,
    substeps,
    sort_order: nextOrder,
    is_core: isCore,
    ...(weekdays === undefined ? {} : { weekdays }),
    ...(opensWorkout ? { opens_workout: true, substeps: [] } : {}),
    updated_at: new Date().toISOString()
  }
  const error = await insertOrUpdateDailyStep(row)
  if (error) {
    if (status) status.textContent = isNetworkError(error) ? 'Connect to edit your routine.' : error.message
    return
  }
  await loadDailySystem()
  saveSnapshot()
  rerenderDayView()
  document.querySelector('#daily-step-title')?.focus()
  showToast(daysNotSaved(row) ? 'Added. Days need the database step first.' : `Added: ${shorten(title, 28)}${weekdays ? ` · ${weekdaysLabel(weekdays)}` : ''}`)
}

async function updateDailyStep(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.dailyEdit
  const title = form.elements.title.value.trim().slice(0, DAILY_STEP_TITLE_MAX)
  const note = form.elements.note.value.trim().slice(0, DAILY_STEP_NOTE_MAX)
  const substeps = parseDailySubstepsText(form.elements.substeps?.value || '')
  const isCore = Boolean(form.elements.is_core?.checked)
  const weekdays = readDayPicker(form)
  const workoutBox = form.elements.opens_workout
  const opensWorkout = workoutBox ? Boolean(workoutBox.checked) : undefined
  if (!title) return
  const row = {
    title,
    note,
    substeps: opensWorkout ? [] : substeps,
    is_core: isCore,
    ...(weekdays === undefined ? {} : { weekdays }),
    ...(opensWorkout === undefined ? {} : { opens_workout: opensWorkout }),
    updated_at: new Date().toISOString()
  }
  const error = await insertOrUpdateDailyStep(row, id)
  if (error) {
    alert(isNetworkError(error) ? 'Connect to edit your routine.' : error.message)
    return
  }
  await loadDailySystem()
  saveSnapshot()
  rerenderDayView({ openIds: currentOpenDetailIds().filter((openId) => openId !== `routine-step-${id}`) })
  showToast(daysNotSaved(row) ? 'Saved. Days need the database step first.' : opensWorkout && substeps.length ? 'Saved. Linked to your workout, which has its own steps, so the substeps were removed.' : 'Step saved')
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
    if (Number(ordered[i].sort_order) === i + 1) continue
    const { error } = await supabase.from('daily_steps').update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq('id', ordered[i].id)
    if (error) {
      alert(isNetworkError(error) ? 'Connect to reorder your routine.' : error.message)
      return
    }
  }
  await loadDailySystem()
  saveSnapshot()
  rerenderDayView()
}

async function deleteDailyStep(stepId) {
  const step = dailySteps.find((item) => item.id === stepId)
  if (!step || !confirm(`Delete "${step.title}" from your routine?`)) return
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
  rerenderDayView()
}

// Starting over brings back this morning's question, with today's power actions still picked.
function resetTodayDailyProgress() {
  if (!confirm('Restart today from the first step? Finished power actions stay finished.')) return
  clearSprint()
  saveDailyProgress(emptyDailyProgress(todayDateKey()))
  renderDay()
}

// ---------- boosters ----------
// Shown as Boosters; stored in the daily_meds tables, so nothing in the database changes.
async function addDailyMed(event) {
  event.preventDefault()
  if (!currentUser || !dailyMedsAvailable) return
  const input = document.querySelector('#daily-med-name')
  const status = document.querySelector('#daily-meds-status')
  const name = input?.value.trim().slice(0, DAILY_MED_NAME_MAX)
  if (!name) return
  if (status) status.textContent = 'Saving...'
  const nextOrder = Math.max(0, ...dailyMeds.map((med) => Number(med.sort_order) || 0)) + 1
  const { error } = await supabase.from('daily_meds').insert({
    user_id: currentUser.id,
    name,
    sort_order: nextOrder,
    updated_at: new Date().toISOString()
  })
  if (error) {
    if (status) status.textContent = isNetworkError(error) ? 'Connect to edit boosters.' : error.message
    return
  }
  await loadDailyMeds()
  saveSnapshot()
  rerenderDayView()
  document.querySelector('#daily-med-name')?.focus()
  showToast(`Added: ${shorten(name, 28)}`)
}

async function updateDailyMed(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.dailyMedEdit
  const name = form.elements.name.value.trim().slice(0, DAILY_MED_NAME_MAX)
  if (!name) return
  const { error } = await supabase.from('daily_meds').update({ name, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) {
    alert(isNetworkError(error) ? 'Connect to edit boosters.' : error.message)
    return
  }
  await loadDailyMeds()
  saveSnapshot()
  rerenderDayView({ openIds: currentOpenDetailIds().filter((openId) => openId !== `booster-${id}`) })
  showToast('Booster saved')
}

async function moveDailyMed(medId, direction) {
  const index = dailyMeds.findIndex((med) => med.id === medId)
  if (index < 0) return
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= dailyMeds.length) return
  const ordered = [...dailyMeds]
  const [moved] = ordered.splice(index, 1)
  ordered.splice(target, 0, moved)
  for (let i = 0; i < ordered.length; i += 1) {
    const { error } = await supabase.from('daily_meds').update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq('id', ordered[i].id)
    if (error) {
      alert(isNetworkError(error) ? 'Connect to reorder boosters.' : error.message)
      return
    }
  }
  await loadDailyMeds()
  saveSnapshot()
  rerenderDayView()
}

async function deleteDailyMed(medId) {
  const med = dailyMeds.find((item) => item.id === medId)
  if (!med || !confirm(`Delete "${med.name}" from your boosters?`)) return
  const { error } = await supabase.from('daily_meds').delete().eq('id', medId)
  if (error) {
    alert(isNetworkError(error) ? 'Connect to edit boosters.' : error.message)
    return
  }
  dailyMedTakenIds = dailyMedTakenIds.filter((id) => id !== medId)
  const pending = readPending()
  Object.keys(pending.medToggles).forEach((key) => {
    if (pending.medToggles[key]?.med_id === medId) delete pending.medToggles[key]
  })
  writePending(pending)
  await loadDailyMeds()
  saveSnapshot()
  rerenderDayView()
}

// Boosters live where you are: a small pill in the runner until they're all checked.
function renderRunnerMedsPill() {
  if (!dailyMedsAvailable || !dailyMeds.length) return ''
  const taken = currentDailyMedTakenSet().size
  if (taken >= dailyMeds.length) return ''
  return `<button type="button" class="runner-meds-pill" id="runner-meds" aria-label="Boosters: ${taken} of ${dailyMeds.length} done">Boosters ${taken}/${dailyMeds.length}</button>`
}

function renderMedsSheetBody() {
  const taken = currentDailyMedTakenSet()
  return `
    <div class="sheet-head"><strong>Boosters today</strong><button type="button" class="sheet-close" data-sheet-close aria-label="Close">&times;</button></div>
    <div class="daily-meds-list meds-sheet-list">
      ${dailyMeds.map((med) => {
        const isTaken = taken.has(med.id)
        return `
          <button type="button" class="daily-med-row booster-row ${isTaken ? 'is-taken' : ''}" data-sheet-med="${med.id}" aria-pressed="${isTaken ? 'true' : 'false'}">
            <span class="daily-med-check" aria-hidden="true">${isTaken ? '&#10003;' : ''}</span>
            <span class="daily-med-name">${escapeHtml(med.name)}</span>
          </button>`
      }).join('')}
    </div>`
}

function showMedsSheet() {
  const backdrop = openSheet(renderMedsSheetBody(), { label: 'Boosters today' })
  const bind = () => {
    backdrop.querySelectorAll('[data-sheet-med]').forEach((button) => {
      button.addEventListener('click', () => {
        toggleDailyMed(button.dataset.sheetMed, { render: false })
        const sheet = backdrop.querySelector('.sheet')
        if (sheet) sheet.innerHTML = renderMedsSheetBody()
        bind()
        updateRunnerMedsPill()
      })
    })
  }
  bind()
}

function updateRunnerMedsPill() {
  const pill = document.querySelector('#runner-meds')
  if (!pill) return
  const html = renderRunnerMedsPill()
  if (!html) {
    pill.remove()
    return
  }
  pill.outerHTML = html
  document.querySelector('#runner-meds')?.addEventListener('click', showMedsSheet)
}

// ---------- capture ----------
// Capture never needs signal and never asks you to decide anything. Brain-dump mode: the field stays focused.

function handleCaptureSubmit(event) {
  event.preventDefault()
  const input = document.querySelector('#capture-input')
  const todo = createLocalTodo(input?.value || '')
  if (!todo) return
  rerenderOverview({ focusCapture: true })
  showToast(`In Inbox: ${shorten(todo.title, 26)}`, {
    actionLabel: 'Do today',
    onAction: () => {
      setTodoTodayStatus(todo.id, 'pending')
      rerenderCurrentDayView()
      showToast('Added to today')
    }
  })
}

// Capture is one action: type, Enter, back to the card. Deciding when to do it is for later.
function showRunnerCapture() {
  if (!powerActionsAvailable) return
  const backdrop = openSheet(`
    <form class="runner-capture-form" id="runner-capture-form" autocomplete="off">
      <div class="sheet-head"><strong>Dump it. Keep moving.</strong><button type="button" class="sheet-close" data-sheet-close aria-label="Close">&times;</button></div>
      <input id="runner-capture-input" type="text" maxlength="${POWER_TODO_TITLE_MAX}" required placeholder="What just popped into your head?" enterkeyhint="done" />
      <button type="submit" class="primary-button">Save to Inbox</button>
    </form>`, { label: 'Capture a thought' })
  const input = backdrop.querySelector('#runner-capture-input')
  input?.focus()
  backdrop.querySelector('#runner-capture-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const todo = createLocalTodo(input?.value || '')
    if (!todo) {
      input?.focus()
      return
    }
    closeSheet()
    renderDayRunner()
    showToast('Saved to Inbox', {
      actionLabel: 'Do next',
      onAction: () => {
        setTodoTodayStatus(todo.id, 'pending', { position: 'next' })
        rerenderCurrentDayView()
        showToast('Up next')
      }
    })
  })
}

// ---------- inbox edits ----------

function updatePowerTodo(event) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.dataset.powerTodoEdit
  const title = form.elements.title.value.trim().slice(0, POWER_TODO_TITLE_MAX)
  if (!title) return
  patchLocalTodo(id, { title })
  rerenderOverview()
  showToast('Saved')
}

function deletePowerTodo(todoId) {
  const todo = getPowerTodo(todoId)
  if (!todo) return
  const progressBefore = cloneDailyProgress()
  const restore = dropTodo(todoId)
  if (!restore) return
  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  saveDailyProgress(progress)
  rerenderOverview()
  rememberUndo(`Deleted "${shorten(todo.title, 22)}"`, () => {
    restore()
    saveDailyProgress(progressBefore)
  }, rerenderOverview)
}

// ---------- low energy + wrap up ----------

function toggleEnergyMode() {
  const progress = currentDailyProgress()
  progress.energy_mode = isLowEnergy(progress) ? 'normal' : 'low'
  progress.is_complete = false
  saveDailyProgress(progress)
  showToast(progress.energy_mode === 'low' ? 'Low-energy day: core steps only' : 'Full day back on')
}

// An explicit end to the day closes the open loops: what's done is done, the rest waits in Inbox, no guilt.
function wrapUpDay() {
  const progress = currentDailyProgress()
  const before = cloneDailyProgress(progress)
  const stamp = new Date().toISOString()
  progress.closed_at = stamp
  progress.is_complete = true
  if (!progress.started_at) progress.started_at = stamp
  saveDailyProgress(progress)
  clearSprint()
  closeSheet()
  renderDay('', { forceOverview: true, justCompleted: true })
  rememberUndo('Day wrapped', () => saveDailyProgress(before), () => renderDay())
}

function reopenDay() {
  const progress = currentDailyProgress()
  progress.closed_at = null
  progress.is_complete = remainingTodayActionCount(progress) === 0
  saveDailyProgress(progress)
  renderDay()
}

// ---------- wins ----------

function getTodayWins() {
  const progress = currentDailyProgress()
  const completed = new Set(progress.completed_step_ids || [])
  return {
    routine: dailySteps.filter((step) => completed.has(step.id)).map((step) => step.title),
    routineActions: routineDoneCount(progress),
    todos: powerDoneToday.map((todo) => todo.title),
    workouts: getCompletedFolders(todayDateKey()).map((folder) => folder.name)
  }
}

function renderDayCompleteCard({ closed, celebrate }) {
  const wins = getTodayWins()
  // A finished low-energy day is a win as it is; the rest of the routine stays an optional bonus.
  const progress = currentDailyProgress()
  const bonusAvailable = !closed && isLowEnergy(progress) && hasCoreSteps() && dailySteps.some((step) => !step.is_core && stepScheduledOn(step, progress.progress_date) && !dailyResolvedStepIds(progress).has(step.id))
  const parts = []
  if (wins.routineActions) parts.push(plural(wins.routineActions, 'routine action'))
  if (wins.todos.length) parts.push(plural(wins.todos.length, 'todo'))
  if (wins.workouts.length) parts.push(`${wins.workouts.join(' + ')} trained`)
  const summary = parts.length ? parts.join(' · ') : 'Rest is part of the system too.'
  const chips = [
    ...wins.workouts.map((name) => `<li class="win-chip is-workout">${escapeHtml(name)} &#10003;</li>`),
    ...wins.todos.map((title) => `<li class="win-chip">${escapeHtml(title)}</li>`)
  ].join('')
  const tomorrow = getScheduledFolders(addDaysKey(todayDateKey(), 1))
  return `
    <section class="day-complete-card ${celebrate ? 'is-celebrating' : ''}">
      <div class="day-complete-mark">${closed ? 'Wrapped' : 'Done'}</div>
      <h2>${closed ? 'Day wrapped.' : 'Day complete.'}</h2>
      <p class="wins-summary">${escapeHtml(summary)}</p>
      ${chips ? `<ul class="win-chips" aria-label="Today's wins">${chips}</ul>` : ''}
      <button type="button" class="day-hero-cta finish-day-cta" id="finish-my-day">Finish my day <span aria-hidden="true">&rarr;</span></button>
      <p class="wins-note finish-day-note">Five minutes of your motivation, then one question.</p>
      ${wins.routine.length ? `<details class="wins-list"><summary>Routine done · ${wins.routine.length}</summary><ul>${wins.routine.map((title) => `<li>${escapeHtml(title)}</li>`).join('')}</ul></details>` : ''}
      ${closed ? '<p class="wins-note">Anything unfinished is safe in Inbox. Tomorrow starts clean.</p>' : ''}
      ${tomorrow.length ? `<p class="wins-note">Tomorrow: ${escapeHtml(tomorrow.map((folder) => folder.name).join(' + '))}</p>` : ''}
      ${bonusAvailable ? '<p class="wins-note">Minimum day: done. That counts.</p><button type="button" class="quiet-link" id="bonus-full-day">Got energy left? Do the full day</button>' : ''}
      ${closed ? '<button type="button" class="quiet-link" id="reopen-day">Reopen day</button>' : ''}
      <button type="button" class="quiet-link" id="complete-glance">See today's cards</button>
    </section>`
}

// ---------- morning: today's power actions ----------
// The day opens with one deliberate choice: what moves you forward today, ranked by importance.
// Three numbered slots fill in the order you tap. Everything you don't pick waits in Inbox.

function newPowerPrompt(mode = 'start') {
  const ids = getPowerActionList().filter((item) => !item.done && getPowerTodo(item.todo.id)).map((item) => item.todo.id)
  return { mode, date: todayDateKey(), ids, lastPicked: null }
}

// Returns false when power actions aren't available, so the caller can fall back to the plain routine.
function openPowerPrompt(mode = 'start') {
  if (!powerActionsAvailable || !currentUser) return false
  if (mode === 'change' || !powerPrompt || powerPrompt.date !== todayDateKey() || powerPrompt.mode !== mode) {
    powerPrompt = newPowerPrompt(mode)
  }
  renderPowerPrompt()
  window.scrollTo(0, 0)
  return true
}

function openPowerPromptForToday() {
  return openPowerPrompt(currentDailyProgress().started_at ? 'change' : 'start')
}

function renderPromptSlot(todo, rank, canMoveUp) {
  return `
    <div class="slot is-filled ${powerPrompt.lastPicked === todo.id ? 'is-new' : ''}">
      <span class="slot-num" aria-hidden="true">${rank}</span>
      <span class="slot-title">${escapeHtml(todo.title)}</span>
      <span class="slot-tools">
        ${canMoveUp ? `<button type="button" class="slot-tool" data-prompt-up="${todo.id}" aria-label="Make ${escapeHtml(todo.title)} more important">&uarr;</button>` : ''}
        <button type="button" class="slot-tool" data-prompt-pick="${todo.id}" aria-label="Remove ${escapeHtml(todo.title)} from today">&times;</button>
      </span>
    </div>`
}

function renderPromptRow(todo, full) {
  const meta = isTodoSnoozed(todo) ? `back ${returnDayLabel(todo.snoozed_until)}` : ageShortLabel(todo.created_at)
  return `
    <button type="button" class="prompt-row ${full ? 'is-full' : ''}" data-prompt-pick="${todo.id}">
      <span class="prompt-ring" aria-hidden="true"></span>
      <span class="prompt-title">${escapeHtml(todo.title)}</span>
      <span class="prompt-meta">${escapeHtml(meta)}</span>
    </button>`
}

function renderPowerPrompt(options = {}) {
  if (!powerPrompt || powerPrompt.date !== todayDateKey()) powerPrompt = newPowerPrompt('start')
  powerPrompt.ids = powerPrompt.ids.filter((id, index, list) => getPowerTodo(id) && list.indexOf(id) === index)
  const picked = powerPrompt.ids.map((id) => getPowerTodo(id))
  const pickedIds = new Set(powerPrompt.ids)
  const doneToday = getPowerActionList().filter((item) => item.done)
  const offset = doneToday.length
  const count = picked.length
  const full = count >= TODAY_TODO_TARGET
  const change = powerPrompt.mode === 'change'
  const dateKey = todayDateKey()
  // Same order as Inbox on the Day tab (newest first), so the list looks familiar every morning.
  const ready = newestFirst(powerTodos.filter((todo) => !pickedIds.has(todo.id) && !isTodoSnoozed(todo, dateKey)))
  const resting = newestFirst(powerTodos.filter((todo) => !pickedIds.has(todo.id) && isTodoSnoozed(todo, dateKey)))

  const slots = picked.map((todo, index) => renderPromptSlot(todo, offset + index + 1, index > 0))
  for (let position = count + 1; position <= TODAY_TODO_TARGET; position += 1) {
    const rank = offset + position
    slots.push(position === count + 1
      ? `
        <form class="slot is-open" id="prompt-add" autocomplete="off">
          <span class="slot-num" aria-hidden="true">${rank}</span>
          <input id="prompt-add-input" type="text" maxlength="${POWER_TODO_TITLE_MAX}" placeholder="${ready.length || resting.length ? 'Type it, or tap one below' : 'Type it here'}" aria-label="Power action ${rank}" enterkeyhint="done" />
          <button type="submit" class="slot-add" aria-label="Add">+</button>
        </form>`
      : `<div class="slot is-empty" aria-hidden="true"><span class="slot-num">${rank}</span></div>`)
  }

  const status = full
    ? 'All set. To swap one, remove it first.'
    : count
      ? `Next: your #${offset + count + 1}, or lock in.`
      : `Tap in order of importance. Your #${offset + 1} first.`
  const primaryLabel = change ? 'Save power actions' : count ? 'Lock in and start' : `Pick your #${offset + 1} first`

  renderShell(`
    <div class="prompt-screen">
      <header class="prompt-head">
        <p class="prompt-date">${escapeHtml(formatPlanDate(dateKey))}</p>
        <h2 class="prompt-question">${escapeHtml(POWER_PROMPT_QUESTION)}</h2>
      </header>
      <section class="prompt-slots" aria-label="Today's power actions">
        ${doneToday.map((item) => `
          <div class="slot is-done"><span class="slot-num" aria-hidden="true">&#10003;</span><span class="slot-title"><span class="visually-hidden">Done: </span>${escapeHtml(item.todo.title)}</span></div>`).join('')}
        ${slots.join('')}
        <p class="prompt-status" id="prompt-status" aria-live="polite">${escapeHtml(status)}</p>
      </section>
      ${ready.length ? `
        <section class="prompt-inbox" aria-labelledby="prompt-inbox-title">
          <h3 class="prompt-section-title" id="prompt-inbox-title">From your Inbox</h3>
          <div class="prompt-list">${ready.map((todo) => renderPromptRow(todo, full)).join('')}</div>
        </section>` : ''}
      ${resting.length ? `
        <details class="prompt-resting" id="prompt-resting" ${powerPrompt.restingOpen ? 'open' : ''}>
          <summary>Resting until later <span>${resting.length}</span></summary>
          <div class="prompt-list">${resting.map((todo) => renderPromptRow(todo, full)).join('')}</div>
        </details>` : ''}
      <div class="prompt-actions">
        <button type="button" class="day-primary-action prompt-lock" id="prompt-lock" ${!change && !count ? 'disabled' : ''}>${escapeHtml(primaryLabel)} <span aria-hidden="true">&rarr;</span></button>
        <button type="button" class="quiet-link prompt-skip" id="prompt-skip">${change ? 'Cancel' : 'Skip and start with my routine'}</button>
      </div>
    </div>`,
    { title: 'Gifts', showAccount: false, showTimer: false, showHeader: false, navTab: 'day', view: 'day-prompt', shellClass: 'prompt-shell' })

  powerPrompt.lastPicked = null
  document.querySelectorAll('[data-prompt-pick]').forEach((button) => {
    button.addEventListener('click', () => togglePromptPick(button.dataset.promptPick))
  })
  document.querySelectorAll('[data-prompt-up]').forEach((button) => {
    button.addEventListener('click', () => movePromptPickUp(button.dataset.promptUp))
  })
  document.querySelector('#prompt-add')?.addEventListener('submit', addPromptTodo)
  document.querySelector('#prompt-lock')?.addEventListener('click', lockInPowerActions)
  document.querySelector('#prompt-skip')?.addEventListener('click', skipPowerPrompt)
  document.querySelector('#prompt-resting')?.addEventListener('toggle', (event) => {
    if (powerPrompt) powerPrompt.restingOpen = event.currentTarget.open
  })
  if (options.focusAdd) document.querySelector('#prompt-add-input')?.focus()
}

function rerenderPowerPrompt(options = {}) {
  const y = window.scrollY
  renderPowerPrompt(options)
  window.scrollTo(0, y)
}

// A background sync can bring new todos in; redraw only when you're not typing.
function refreshPowerPromptIfIdle() {
  const input = document.querySelector('#prompt-add-input')
  if (input && (input.value || document.activeElement === input)) return
  if (document.querySelector('.sheet-backdrop')) return
  rerenderPowerPrompt()
}

function flashPromptStatus(message) {
  const status = document.querySelector('#prompt-status')
  if (!status) return
  status.textContent = message
  status.classList.remove('is-flash')
  void status.offsetWidth
  status.classList.add('is-flash')
}

function togglePromptPick(todoId) {
  if (!powerPrompt) return
  const index = powerPrompt.ids.indexOf(todoId)
  if (index >= 0) {
    powerPrompt.ids.splice(index, 1)
  } else if (powerPrompt.ids.length >= TODAY_TODO_TARGET) {
    flashPromptStatus(`That's ${TODAY_TODO_TARGET}. Remove one above to swap it.`)
    vibrate(30)
    return
  } else {
    powerPrompt.ids.push(todoId)
    powerPrompt.lastPicked = todoId
    vibrate(12)
  }
  rerenderPowerPrompt()
}

function movePromptPickUp(todoId) {
  if (!powerPrompt) return
  const index = powerPrompt.ids.indexOf(todoId)
  if (index <= 0) return
  powerPrompt.ids.splice(index, 1)
  powerPrompt.ids.splice(index - 1, 0, todoId)
  powerPrompt.lastPicked = todoId
  rerenderPowerPrompt()
}

function addPromptTodo(event) {
  event.preventDefault()
  const input = document.querySelector('#prompt-add-input')
  const todo = createLocalTodo(input?.value || '')
  if (!todo || !powerPrompt) {
    input?.focus()
    return
  }
  powerPrompt.ids.push(todo.id)
  powerPrompt.lastPicked = todo.id
  rerenderPowerPrompt({ focusAdd: powerPrompt.ids.length < TODAY_TODO_TARGET })
}

// Your picks become today's power actions, in the order you ranked them. Anything you un-picked
// goes back to Inbox untouched.
function applyPowerActionPicks(ids) {
  const keep = new Set(ids)
  getPendingPowerPlans().forEach((plan) => {
    const todo = getPowerTodo(plan.todo_id)
    // A first step made with Shrink it stays as long as its power action does.
    if (keep.has(plan.todo_id) || (todo?.parent_id && keep.has(todo.parent_id))) return
    removeTodayPlan(plan.todo_id)
  })
  ids.forEach((id) => {
    const todo = getPowerTodo(id)
    if (!todo) return
    // Picking something that was resting means it matters now.
    if (actionEngineAvailable && isTodoSnoozed(todo)) patchLocalTodo(id, { snoozed_until: null })
    if (getTodayPlanForTodo(id)?.status !== 'pending') setTodoTodayStatus(id, 'pending')
  })

  // The picks run together, in rank order, where your todos already were (after the routine on a fresh day).
  const progress = currentDailyProgress()
  const order = normalizeTodayStackOrder(progress)
  const keys = ids.map(todoStackKey).filter((key) => order.includes(key))
  const firstIndex = order.findIndex((key) => keys.includes(key))
  const rest = order.filter((key) => !keys.includes(key))
  const insertAt = firstIndex < 0 ? rest.length : order.slice(0, firstIndex).filter((key) => !keys.includes(key)).length
  rest.splice(insertAt, 0, ...keys)
  progress.stack_order = rest
  saveDailyProgress(progress)

  // The plan rows carry the rank too (after anything already done today), so every device shows the same order.
  const base = Math.max(0, ...getTodayPowerPlans().filter((plan) => plan.status === 'done').map((plan) => Number(plan.sort_order) || 0))
  ids.forEach((id, index) => {
    const plan = getTodayPlanForTodo(id)
    if (plan && Number(plan.sort_order) !== base + index + 1) queuePlanWrite(setLocalPowerPlan(id, { sort_order: base + index + 1, updated_at: nowIso() }))
  })
  saveSnapshot()
}

// Starting the day always works, even with nothing queued: you land on your first card, or on the overview.
function beginDay() {
  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  if (!progress.started_at) progress.started_at = nowIso()
  progress.is_complete = false
  progress.closed_at = null
  saveDailyProgress(progress)
  if (remainingTodayActionCount(progress) > 0) renderDayRunner()
  else openDayOverview()
}

function lockInPowerActions() {
  if (!powerPrompt || !guardActionTap(500)) return
  const { mode } = powerPrompt
  const ids = powerPrompt.ids.filter((id) => getPowerTodo(id))
  if (mode === 'start' && !ids.length) {
    flashPromptStatus('Pick at least one, or skip to start with your routine.')
    return
  }
  unlockAudio()
  applyPowerActionPicks(ids)
  powerPrompt = null
  if (mode === 'change') {
    openDayOverview()
    showToast(ids.length ? `Power actions saved: ${ids.length}` : 'No power actions today')
    return
  }
  beginDay()
  showToast(`Locked in: ${plural(ids.length, 'power action')}`)
}

function skipPowerPrompt() {
  if (!powerPrompt) return
  const { mode } = powerPrompt
  powerPrompt = null
  if (mode === 'change') {
    openDayOverview()
    return
  }
  beginDay()
}

// Today's power actions in order of importance: the rank you gave them, which stays put when a card
// moves to Later. A "first step" made with Shrink it rides along with its power action instead of
// counting as one of its own.
function getPowerActionList() {
  const plans = sortBySortOrder(getTodayPowerPlans().filter((plan) => plan.status === 'pending' || plan.status === 'done'))
  const planned = new Set(plans.map((plan) => plan.todo_id))
  return plans
    .map((plan) => ({ plan, todo: getAnyTodo(plan.todo_id), done: plan.status === 'done' }))
    .filter((item) => item.todo && !(item.todo.parent_id && planned.has(item.todo.parent_id)))
    .map((item, index) => ({ ...item, number: index + 1 }))
}

// How a todo is named on its card and in Today's order: "Power action 2 of 3", or "First step of #2".
function powerActionLabel(todo, list = getPowerActionList()) {
  const parent = todo.parent_id ? list.find((item) => item.todo.id === todo.parent_id) : null
  if (parent) return { text: `First step of #${parent.number}`, number: parent.number, parentTitle: parent.todo.title }
  const item = list.find((entry) => entry.todo.id === todo.id)
  return item
    ? { text: `Power action ${item.number} of ${list.length}`, number: item.number, parentTitle: '' }
    : { text: 'Power action', number: 0, parentTitle: '' }
}

// ---------- Day overview ----------
// One page, one order: what's up now, your power actions, boosters, the rest of today, Inbox, setup.
// Every section has the same head (title, count, one action). Editing always opens its own screen.

function openDayOverview() {
  dayUi = { reorder: false, orderAll: false, inboxEdit: false, inboxAll: false }
  renderDay('', { forceOverview: true })
  window.scrollTo(0, 0)
}

function renderDayHero({ progress, entries, remaining, score, started, closed, complete, low, celebrate }) {
  if (complete) return renderDayCompleteCard({ closed, celebrate })
  const date = escapeHtml(formatPlanDate(todayDateKey()))
  if (!entries.length) {
    return `
      <section class="day-hero">
        <p class="day-hero-date">${date}</p>
        <h2 class="day-hero-title">Nothing queued yet.</h2>
        <p class="day-hero-copy">Set up your routine below${powerActionsAvailable ? ', or pick what you\'re getting done today' : ''}.</p>
        ${powerActionsAvailable ? '<button type="button" class="day-hero-cta" id="hero-pick">Pick power actions <span aria-hidden="true">&rarr;</span></button>' : ''}
      </section>`
  }
  if (!started) {
    return `
      <section class="day-hero">
        <p class="day-hero-date">${date}</p>
        <h2 class="day-hero-title">Ready when you are.</h2>
        <p class="day-hero-copy">${plural(remaining, 'action')} lined up.</p>
        <button type="button" class="day-hero-cta" id="hero-start">Start your day <span aria-hidden="true">&rarr;</span></button>
      </section>`
  }
  const action = getCurrentStackAction(progress)
  const tools = [
    `<button type="button" class="day-chip day-chip-eye" id="hero-glance" aria-label="See all of today's cards">${EYE_ICON}<span>All cards</span></button>`,
    hasCoreSteps() ? `<button type="button" class="day-chip" id="toggle-energy">${low ? 'Back to full day' : 'Low energy: core only'}</button>` : '',
    actionEngineAvailable ? '<button type="button" class="day-chip" id="wrap-up-day">Wrap up day</button>' : ''
  ].join('')
  return `
    <section class="day-hero ${low ? 'is-low-energy' : ''}">
      <div class="day-hero-row">
        <p class="day-hero-date">${date}${low ? ', core only' : ''}</p>
        <p class="day-hero-score"><strong>${score.done}</strong> of ${score.total} done</p>
      </div>
      <div class="day-hero-progress" aria-hidden="true"><span style="width:${score.percent}%"></span></div>
      <p class="day-hero-label">Up now</p>
      <p class="day-hero-now">${escapeHtml(action?.title || '')}</p>
      <button type="button" class="day-hero-cta" id="hero-continue">Continue <span aria-hidden="true">&rarr;</span></button>
      ${tools ? `<div class="day-hero-tools">${tools}</div>` : ''}
    </section>`
}

function renderSectionHead(id, title, count = '', actions = '') {
  return `
    <div class="day-section-head">
      <h3 id="${id}">${escapeHtml(title)}</h3>
      ${count !== '' ? `<span class="day-section-count">${escapeHtml(String(count))}</span>` : ''}
      ${actions ? `<span class="day-section-actions">${actions}</span>` : ''}
    </div>`
}

function renderPowerActionsSection() {
  if (!powerActionsAvailable) return ''
  const list = getPowerActionList()
  const doneCount = list.filter((item) => item.done).length
  const rows = list.map((item) => `
    <li class="pa-row ${item.done ? 'is-done' : ''}">
      <span class="pa-num" aria-hidden="true">${item.done ? '&#10003;' : item.number}</span>
      <span class="pa-title">${item.done ? '<span class="visually-hidden">Done: </span>' : ''}${escapeHtml(item.todo.title)}</span>
    </li>`).join('')
  return `
    <section class="day-section" id="power-actions" aria-labelledby="power-actions-title">
      ${renderSectionHead('power-actions-title', 'Power actions', list.length ? `${doneCount}/${list.length}` : '',
        `<button type="button" class="day-section-action" id="change-power-actions">${list.length ? 'Change' : 'Pick'}</button>`)}
      ${rows
        ? `<ol class="day-panel pa-list">${rows}</ol>`
        : '<div class="day-panel"><p class="day-empty">None picked for today. What would move you forward?</p></div>'}
    </section>`
}

function renderBoostersSection() {
  if (!dailyMedsAvailable) {
    return `
      <section class="day-section" id="boosters" aria-labelledby="boosters-title">
        ${renderSectionHead('boosters-title', 'Boosters')}
        <div class="day-panel"><p class="day-empty">Boosters need the v1.15 database step once (see README).</p></div>
      </section>`
  }
  const taken = currentDailyMedTakenSet()
  const rows = dailyMeds.map((med) => {
    const isTaken = taken.has(med.id)
    return `
      <button type="button" class="daily-med-row booster-row ${isTaken ? 'is-taken' : ''}" data-daily-med-toggle="${med.id}" aria-pressed="${isTaken ? 'true' : 'false'}">
        <span class="daily-med-check" aria-hidden="true">${isTaken ? '&#10003;' : ''}</span>
        <span class="daily-med-name">${escapeHtml(med.name)}</span>
      </button>`
  }).join('')
  return `
    <section class="day-section" id="boosters" aria-labelledby="boosters-title">
      ${renderSectionHead('boosters-title', 'Boosters', dailyMeds.length ? `${taken.size}/${dailyMeds.length}` : '')}
      ${rows
        ? `<div class="day-panel booster-list">${rows}</div>`
        : '<div class="day-panel"><p class="day-empty">No boosters yet.</p><button type="button" class="day-panel-link" data-open-boosters-editor>Add boosters</button></div>'}
    </section>`
}

function orderKindLabel(entry, progress, list) {
  if (entry.type === 'todo') {
    const label = powerActionLabel(entry.todo, list)
    return label.parentTitle ? label.text : label.number ? `Power action ${label.number}` : 'Power action'
  }
  const substeps = normalizeDailySubsteps(entry.step.substeps)
  const parts = ['Routine']
  if (isGymDailyStep(entry.step)) parts.push('opens your workout')
  if (entry.step.is_core && hasCoreSteps()) parts.push('core')
  if (substeps.length) {
    const position = clamp(Number.parseInt(progress.substep_positions?.[entry.id], 10) || 0, 0, substeps.length)
    parts.push(`${position} of ${substeps.length} done`)
  }
  return parts.join(', ')
}

// What's left today, in the order it will come up. Power actions carry their number.
// The next few show by default; Reorder or "Show all" opens the whole list. (A "Show all" that
// would reveal a single row takes as much room as the row, so then the whole list shows.)
function renderDayOrderSection(progress, entries, low) {
  const resolved = dailyResolvedStepIds(progress)
  const upcoming = entries.filter((entry) => entry.type === 'todo' || !resolved.has(entry.id))
  const currentKey = getCurrentStackAction(progress)?.key || ''
  const list = getPowerActionList()
  const dateKey = progress.progress_date || todayDateKey()
  const offToday = dailySteps.filter((step) => !stepScheduledOn(step, dateKey))
  const restingCount = low ? dailySteps.filter((step) => stepScheduledOn(step, dateKey) && !step.is_core).length : 0
  // Steps that aren't on today's days rest quietly, but the list says so, so nothing looks lost.
  const offNote = offToday.length
    ? `Not on ${WEEKDAY_NAMES[weekdayOf(dateKey)]}s: ${offToday.length <= 3 ? offToday.map((step) => step.title).join(', ') : plural(offToday.length, 'step')}.`
    : ''
  const showAll = dayUi.reorder || dayUi.orderAll || upcoming.length <= ORDER_PREVIEW_COUNT + 1
  const shown = showAll ? upcoming : upcoming.slice(0, ORDER_PREVIEW_COUNT)
  const rows = shown.map((entry, index) => {
    const isNow = entry.key === currentKey
    const kind = orderKindLabel(entry, progress, list)
    const mark = entry.type === 'todo'
      ? `<span class="order-mark is-power" aria-hidden="true">${powerActionLabel(entry.todo, list).number || ''}</span>`
      : '<span class="order-mark" aria-hidden="true"></span>'
    return `
      <li class="order-row is-${entry.type} ${isNow ? 'is-now' : ''}">
        ${mark}
        <span class="order-copy"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(isNow ? `Up now. ${kind}` : kind)}</small></span>
        ${dayUi.reorder ? `
          <span class="order-move">
            <button type="button" class="order-move-button" data-order-move="up" data-stack-key="${escapeHtml(entry.key)}" ${index === 0 ? 'disabled' : ''} aria-label="Move ${escapeHtml(entry.title)} earlier">&uarr;</button>
            <button type="button" class="order-move-button" data-order-move="down" data-stack-key="${escapeHtml(entry.key)}" ${index === upcoming.length - 1 ? 'disabled' : ''} aria-label="Move ${escapeHtml(entry.title)} later">&darr;</button>
          </span>` : ''}
      </li>`
  }).join('')
  const more = !showAll && upcoming.length > shown.length
    ? `<button type="button" class="day-panel-link" id="order-show-all">Show all ${upcoming.length}</button>`
    : ''
  return `
    <section class="day-section" id="day-order" aria-labelledby="day-order-title">
      ${renderSectionHead('day-order-title', "Today's order", `${upcoming.length} left`,
        upcoming.length > 1 ? `<button type="button" class="day-section-action ${dayUi.reorder ? 'is-active' : ''}" id="toggle-reorder" aria-pressed="${dayUi.reorder}">${dayUi.reorder ? 'Done' : 'Reorder'}</button>` : '')}
      ${rows ? `<ol class="day-panel order-list">${rows}</ol>${more}` : '<div class="day-panel"><p class="day-empty">Nothing left for today.</p></div>'}
      ${restingCount ? `<p class="day-section-note">Low energy: ${plural(restingCount, 'non-core step')} resting today.</p>` : ''}
      ${offNote ? `<p class="day-section-note" id="day-off-note">${escapeHtml(offNote)}</p>` : ''}
    </section>`
}

// Inbox is your backlog: everything that isn't in today. Today's picks live under Power actions,
// so nothing shows up twice.
function renderInboxSection() {
  if (!powerActionsAvailable) return ''
  const dateKey = todayDateKey()
  const inToday = new Set(getTodayPowerPlans().filter((plan) => plan.status === 'pending').map((plan) => plan.todo_id))
  // Newest first: what you just dumped shows at the top, and the oldest wait for Sort.
  const backlog = newestFirst(powerTodos.filter((todo) => !inToday.has(todo.id)))
  const due = dueInboxCount()
  const showAll = dayUi.inboxAll || dayUi.inboxEdit || backlog.length <= INBOX_PREVIEW_COUNT + 1
  const shown = showAll ? backlog : backlog.slice(0, INBOX_PREVIEW_COUNT)
  const rows = shown.map((todo) => {
    if (dayUi.inboxEdit) {
      return `
        <li>
          <form class="inbox-edit-row" data-power-todo-edit="${todo.id}">
            <input name="title" type="text" maxlength="${POWER_TODO_TITLE_MAX}" required value="${escapeHtml(todo.title)}" aria-label="Rename ${escapeHtml(todo.title)}" />
            <button type="submit" class="small-button">Save</button>
            <button type="button" class="inbox-delete" data-power-todo-delete="${todo.id}" aria-label="Delete ${escapeHtml(todo.title)}">Delete</button>
          </form>
        </li>`
    }
    const meta = isTodoSnoozed(todo, dateKey) ? `back ${returnDayLabel(todo.snoozed_until)}` : ageShortLabel(todo.created_at)
    return `
      <li class="inbox-row">
        <span class="inbox-title">${escapeHtml(todo.title)}</span>
        <span class="inbox-meta">${escapeHtml(meta)}</span>
      </li>`
  }).join('')
  const actions = [
    due ? '<button type="button" class="day-section-action" data-open-triage>Sort</button>' : '',
    backlog.length ? `<button type="button" class="day-section-action ${dayUi.inboxEdit ? 'is-active' : ''}" id="toggle-inbox-edit" aria-pressed="${dayUi.inboxEdit}">${dayUi.inboxEdit ? 'Done' : 'Edit'}</button>` : ''
  ].join('')
  const more = !showAll && backlog.length > shown.length
    ? `<button type="button" class="day-panel-link" id="inbox-show-all">Show all ${backlog.length}</button>`
    : ''
  const empty = powerTodos.length
    ? 'Everything left is in today. Anything new you dump lands here.'
    : 'Empty. Anything you dump lands here.'
  return `
    <section class="day-section" id="inbox" aria-labelledby="inbox-title">
      ${renderSectionHead('inbox-title', 'Inbox', backlog.length || '', actions)}
      <form id="capture-form" class="day-capture-form" autocomplete="off">
        <input id="capture-input" type="text" maxlength="${POWER_TODO_TITLE_MAX}" required placeholder="Dump a thought" aria-label="Add to Inbox" enterkeyhint="done" />
        <button type="submit" class="day-capture-button" aria-label="Add to Inbox">+</button>
      </form>
      ${rows
        ? `<ul class="day-panel inbox-list ${dayUi.inboxEdit ? 'is-editing' : ''}">${rows}</ul>${more}`
        : `<div class="day-panel"><p class="day-empty">${empty}</p></div>`}
    </section>`
}

function renderDaySetup() {
  const coreCount = actionEngineAvailable ? dailySteps.filter((step) => step.is_core).length : 0
  const routineMeta = dailySteps.length ? `${plural(dailySteps.length, 'step')}${coreCount ? `, ${coreCount} core` : ''}` : 'Not set up yet'
  const boosterMeta = !dailyMedsAvailable ? 'Needs the database step' : dailyMeds.length ? plural(dailyMeds.length, 'booster') : 'None yet'
  return `
    <section class="day-section day-setup" aria-labelledby="setup-title">
      ${renderSectionHead('setup-title', 'Setup')}
      <div class="day-panel setup-list">
        <button type="button" class="setup-row" id="open-routine-editor">
          <span class="setup-copy"><strong>Edit routine</strong><small>${escapeHtml(routineMeta)}</small></span>
          <span class="setup-chevron" aria-hidden="true">&rsaquo;</span>
        </button>
        <button type="button" class="setup-row" id="open-boosters-editor" ${dailyMedsAvailable ? '' : 'disabled'}>
          <span class="setup-copy"><strong>Edit boosters</strong><small>${escapeHtml(boosterMeta)}</small></span>
          <span class="setup-chevron" aria-hidden="true">&rsaquo;</span>
        </button>
      </div>
    </section>`
}

function renderDay(errorMessage = '', options = {}) {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false

  if (!dailySystemAvailable) {
    renderShell(`
      <div class="notice error">Day Stack needs the latest Supabase schema once. Your gym data is untouched.</div>`,
      { title: 'Gifts', showAccount: false, showTimer: false, navTab: 'day', view: 'day' })
    return
  }

  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  const entries = getTodayStackEntries(progress)
  const remaining = remainingTodayActionCount(progress)
  const score = todayScore(progress)
  const started = Boolean(progress.started_at)
  const closed = Boolean(progress.closed_at)
  const complete = closed || (started && remaining === 0 && (entries.length > 0 || score.done > 0))

  // The Day tab goes straight to what's next: first thing in the morning that's your power actions,
  // after that it's one card at a time. The overview is one tap away (Today).
  if (!options.forceOverview && !errorMessage && !complete) {
    if (started && remaining > 0) {
      renderDayRunner()
      return
    }
    if (!started) {
      if (openPowerPrompt('start')) return
      if (startDailySystem()) return
    }
  }

  const low = isLowEnergy(progress) && hasCoreSteps()
  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${usingCachedData ? '<div class="offline-note">Offline · saved day available</div>' : ''}
    ${renderDayHero({ progress, entries, remaining, score, started, closed, complete, low, celebrate: Boolean(options.justCompleted) })}
    ${renderPowerActionsSection()}
    ${renderBoostersSection()}
    ${complete ? '' : renderDayOrderSection(progress, entries, low)}
    ${renderInboxSection()}
    ${renderDaySetup()}`,
    { title: 'Gifts', showAccount: false, showTimer: false, navTab: 'day', view: options.forceOverview ? 'day-overview' : 'day' })

  bindDayOverview()
  if (options.focusCapture) document.querySelector('#capture-input')?.focus()
}

function bindDayOverview() {
  document.querySelector('#hero-continue')?.addEventListener('click', () => {
    if (!startDailySystem()) rerenderOverview()
  })
  document.querySelector('#hero-start')?.addEventListener('click', () => {
    if (openPowerPrompt('start')) return
    if (!startDailySystem()) rerenderOverview()
  })
  document.querySelector('#hero-pick')?.addEventListener('click', openPowerPromptForToday)
  document.querySelectorAll('#hero-glance, #complete-glance').forEach((button) => button.addEventListener('click', openGlanceSheet))
  document.querySelector('#finish-my-day')?.addEventListener('click', startFinishMyDay)
  document.querySelector('#toggle-energy')?.addEventListener('click', () => {
    toggleEnergyMode()
    rerenderOverview()
  })
  document.querySelector('#wrap-up-day')?.addEventListener('click', wrapUpDay)
  document.querySelector('#reopen-day')?.addEventListener('click', reopenDay)
  document.querySelector('#bonus-full-day')?.addEventListener('click', () => {
    toggleEnergyMode()
    if (!startDailySystem()) rerenderOverview()
  })
  document.querySelector('#change-power-actions')?.addEventListener('click', openPowerPromptForToday)
  document.querySelectorAll('[data-daily-med-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleDailyMed(button.dataset.dailyMedToggle))
  })
  document.querySelector('#toggle-reorder')?.addEventListener('click', () => {
    dayUi.reorder = !dayUi.reorder
    rerenderOverview()
  })
  document.querySelectorAll('[data-order-move]').forEach((button) => {
    button.addEventListener('click', () => moveTodayStackItem(button.dataset.stackKey, button.dataset.orderMove))
  })
  document.querySelector('#order-show-all')?.addEventListener('click', () => {
    dayUi.orderAll = true
    rerenderOverview()
  })
  document.querySelector('#capture-form')?.addEventListener('submit', handleCaptureSubmit)
  document.querySelectorAll('[data-open-triage]').forEach((button) => {
    button.addEventListener('click', () => openTriage())
  })
  document.querySelector('#toggle-inbox-edit')?.addEventListener('click', () => {
    dayUi.inboxEdit = !dayUi.inboxEdit
    rerenderOverview()
  })
  document.querySelector('#inbox-show-all')?.addEventListener('click', () => {
    dayUi.inboxAll = true
    rerenderOverview()
  })
  document.querySelectorAll('[data-power-todo-edit]').forEach((form) => form.addEventListener('submit', updatePowerTodo))
  document.querySelectorAll('[data-power-todo-delete]').forEach((button) => {
    button.addEventListener('click', () => deletePowerTodo(button.dataset.powerTodoDelete))
  })
  document.querySelector('#open-routine-editor')?.addEventListener('click', () => openDayEditor('routine'))
  document.querySelectorAll('#open-boosters-editor, [data-open-boosters-editor]').forEach((button) => {
    button.addEventListener('click', () => openDayEditor('boosters'))
  })
}

// ---------- finish my day: five minutes of your own motivation, then one question ----------
// The end of the day gets a ritual: your motivation clips and photos, full screen, for five minutes
// straight. Then black, one question, and back to Gifts.

const FINISH_REEL_MS = 5 * 60 * 1000
const FINISH_QUESTION = 'Are you living life like the person you want to be?'
const FINISH_QUESTION_MS = 12000
let finishReel = null

function startFinishMyDay() {
  if (!guardActionTap(600)) return
  // Finishing closes the day on purpose: what's done is done, anything left waits in Inbox.
  const progress = currentDailyProgress()
  if (!progress.closed_at) {
    const stamp = nowIso()
    progress.closed_at = stamp
    progress.is_complete = true
    if (!progress.started_at) progress.started_at = stamp
    saveDailyProgress(progress)
  }
  clearSprint()
  clearUndo()
  hideToast(true)
  closeSheet()
  unlockAudio()
  const queue = buildMotivationQueue(null)
  if (!queue.length) {
    showFinishQuestion({ empty: true })
    return
  }
  finishReel = { endsAt: Date.now() + FINISH_REEL_MS, queue, index: 0, errors: 0, imageTimer: null, tick: null }
  renderFinishReel()
}

function renderFinishReel() {
  viewVersion += 1
  currentView = 'finish'
  document.documentElement.classList.remove('day-runner-active')
  document.body.classList.remove('day-runner-active')
  keepAwake()
  const soundOn = motivationSoundOn()
  app.innerHTML = `
    <main class="rest-lock-screen finish-reel" aria-label="Finishing your day">
      <video id="finish-video" class="rest-lock-video hidden" playsinline webkit-playsinline preload="auto" ${soundOn ? '' : 'muted'} aria-label="Motivation video"></video>
      <img id="finish-image" class="rest-lock-image hidden" alt="" />
      <div class="finish-reel-top">
        <div class="finish-reel-bar" aria-hidden="true"><span id="finish-reel-progress"></span></div>
        <div class="finish-reel-tools">
          <button type="button" class="finish-reel-button" id="finish-sound">${soundOn ? 'Sound on' : 'Sound off'}</button>
          <span class="finish-reel-time" id="finish-reel-time" aria-live="off"></span>
          <button type="button" class="finish-reel-button" id="finish-skip">Skip</button>
        </div>
      </div>
    </main>`
  const video = document.querySelector('#finish-video')
  const image = document.querySelector('#finish-image')
  video.loop = false
  video.addEventListener('ended', () => {
    if (!finishReel) return
    finishReel.errors = 0
    advanceFinishReel()
  })
  const onError = () => {
    if (!finishReel) return
    finishReel.errors += 1
    // Nothing in the library will play (offline, deleted): go straight to the question.
    if (finishReel.errors >= Math.max(1, finishReel.queue.length)) {
      showFinishQuestion()
      return
    }
    advanceFinishReel()
  }
  video.addEventListener('error', onError)
  image.addEventListener('error', onError)
  image.addEventListener('load', () => { if (finishReel) finishReel.errors = 0 })
  document.querySelector('#finish-skip')?.addEventListener('click', () => showFinishQuestion())
  document.querySelector('#finish-sound')?.addEventListener('click', toggleFinishSound)
  if (finishReel.tick) window.clearInterval(finishReel.tick)
  finishReel.tick = window.setInterval(updateFinishReel, 500)
  updateFinishReel()
  playFinishItem()
}

function finishReelItem() {
  if (!finishReel?.queue.length) return null
  return motivationVideos.find((item) => item.id === finishReel.queue[finishReel.index] && item.signedUrl) || null
}

function playFinishItem() {
  if (!finishReel) return
  if (finishReel.imageTimer) window.clearTimeout(finishReel.imageTimer)
  finishReel.imageTimer = null
  const video = document.querySelector('#finish-video')
  const image = document.querySelector('#finish-image')
  if (!video || !image) return
  let item = finishReelItem()
  let guard = finishReel.queue.length
  while (!item && guard > 0) {
    finishReel.index = (finishReel.index + 1) % finishReel.queue.length
    item = finishReelItem()
    guard -= 1
  }
  if (!item) {
    showFinishQuestion()
    return
  }
  if (isImagePath(item.video_path)) {
    video.pause()
    video.classList.add('hidden')
    image.classList.remove('hidden')
    image.src = item.signedUrl
    finishReel.imageTimer = window.setTimeout(advanceFinishReel, MOTIVATION_IMAGE_SECONDS * 1000)
    return
  }
  image.classList.add('hidden')
  image.removeAttribute('src')
  video.classList.remove('hidden')
  // One <video> element for every clip keeps iPhone's sound permission between clips.
  if (video.getAttribute('src') !== item.signedUrl) video.src = item.signedUrl
  else {
    try {
      video.currentTime = 0
    } catch {
      // Not seekable yet: it starts from the top anyway.
    }
  }
  video.muted = !motivationSoundOn()
  const result = video.play()
  result?.catch?.((error) => {
    if (error?.name === 'NotAllowedError' && !video.muted) {
      video.muted = true
      updateFinishSoundButton(false)
      video.play()?.catch?.(() => {})
    }
  })
}

function advanceFinishReel() {
  if (!finishReel || currentView !== 'finish') return
  if (Date.now() >= finishReel.endsAt) {
    showFinishQuestion()
    return
  }
  finishReel.index += 1
  if (finishReel.index >= finishReel.queue.length) {
    // Went through everything: reshuffle and keep going until the five minutes are up.
    finishReel.queue = buildMotivationQueue(finishReel.queue[finishReel.queue.length - 1])
    finishReel.index = 0
  }
  playFinishItem()
}

function updateFinishReel() {
  if (!finishReel || currentView !== 'finish') return
  const left = Math.max(0, finishReel.endsAt - Date.now())
  if (left <= 0) {
    showFinishQuestion()
    return
  }
  const bar = document.querySelector('#finish-reel-progress')
  if (bar) bar.style.width = `${Math.min(100, (1 - left / FINISH_REEL_MS) * 100)}%`
  const time = document.querySelector('#finish-reel-time')
  if (time) time.textContent = formatTime(Math.ceil(left / 1000))
}

function toggleFinishSound() {
  const next = !motivationSoundOn()
  setMotivationSound(next)
  updateFinishSoundButton(next)
  const video = document.querySelector('#finish-video')
  if (video && !video.classList.contains('hidden')) {
    video.muted = !next
    video.play()?.catch?.(() => {})
  }
}

function updateFinishSoundButton(on) {
  const button = document.querySelector('#finish-sound')
  if (button) button.textContent = on ? 'Sound on' : 'Sound off'
}

function stopFinishReel() {
  if (!finishReel) return
  if (finishReel.tick) window.clearInterval(finishReel.tick)
  if (finishReel.imageTimer) window.clearTimeout(finishReel.imageTimer)
  document.querySelector('#finish-video')?.pause()
  finishReel = null
}

function showFinishQuestion({ empty = false } = {}) {
  stopFinishReel()
  viewVersion += 1
  currentView = 'finish-question'
  keepAwake()
  app.innerHTML = `
    <main class="finish-question" id="finish-question" aria-live="polite">
      <p class="finish-question-text">${escapeHtml(FINISH_QUESTION)}</p>
      <p class="finish-question-sign">battle angel.</p>
      ${empty ? '<p class="finish-question-hint">Add videos or photos in More &rarr; Edit motivation, and they play here first.</p>' : ''}
    </main>`
  playDayCompleteChime()
  const version = viewVersion
  const exit = () => {
    if (viewVersion === version) exitFinishMyDay()
  }
  window.setTimeout(exit, FINISH_QUESTION_MS)
  // A tap in the first moments was meant for the reel, not to leave the question.
  window.setTimeout(() => document.querySelector('#finish-question')?.addEventListener('click', exit), 1500)
}

function exitFinishMyDay() {
  releaseWakeLock()
  renderDay('', { forceOverview: true })
  window.scrollTo(0, 0)
}

// ---------- the eye: every card of today at a glance ----------
// Tap a card to mark it done, in any order. Tap it again to undo. Close the sheet and the
// autopilot picks up at the next card that isn't done.

const EYE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>'

function glanceRoutineMeta(step, progress) {
  const substeps = normalizeDailySubsteps(step.substeps)
  if (isGymDailyStep(step)) {
    const gym = getDailyGymState(step)
    const names = gym?.planned.map((folder) => folder.name).join(' + ') || gym?.suggestion?.folder.name || ''
    return names ? `Workout: ${names}` : 'Workout'
  }
  if (!substeps.length) return 'Routine'
  const position = clamp(Number.parseInt(progress.substep_positions?.[step.id], 10) || 0, 0, substeps.length)
  return position ? `${position} of ${substeps.length} done` : `${substeps.length} steps`
}

// What the eye shows: what's left in the order it comes up, then what's done or skipped today.
function glanceItems(progress = currentDailyProgress()) {
  const dateKey = progress.progress_date || todayDateKey()
  const completed = new Set(progress.completed_step_ids || [])
  const skipped = new Set(progress.skipped_step_ids || [])
  const list = getPowerActionList()
  const currentKey = getCurrentStackAction(progress)?.key || ''
  const todo = []
  getTodayStackEntries(progress).forEach((entry) => {
    if (entry.type === 'routine') {
      if (completed.has(entry.id) || skipped.has(entry.id)) return
      todo.push({ key: entry.key, kind: 'routine', id: entry.id, title: entry.title, meta: glanceRoutineMeta(entry.step, progress), now: entry.key === currentKey })
      return
    }
    if (entry.plan?.status !== 'pending') return
    const label = powerActionLabel(entry.todo, list)
    todo.push({ key: entry.key, kind: 'todo', id: entry.id, title: entry.title, meta: label.text, number: label.number, now: entry.key === currentKey })
  })

  const done = []
  dailySteps.forEach((step) => {
    if (!stepScheduledOn(step, dateKey)) return
    if (completed.has(step.id)) done.push({ key: routineStackKey(step.id), kind: 'routine', id: step.id, title: step.title, meta: isGymDailyStep(step) ? 'Workout' : 'Routine', state: 'done' })
    else if (skipped.has(step.id)) done.push({ key: routineStackKey(step.id), kind: 'routine', id: step.id, title: step.title, meta: 'Skipped today', state: 'skipped' })
  })
  powerDoneToday.forEach((item) => {
    const meta = getTodayPlanForTodo(item.id) ? powerActionLabel(item, list).text : 'From Inbox'
    done.push({ key: todoStackKey(item.id), kind: 'todo', id: item.id, title: item.title, meta, state: 'done' })
  })
  getTodayPowerPlans().filter((plan) => plan.status === 'skipped').forEach((plan) => {
    const item = getPowerTodo(plan.todo_id)
    if (item) done.push({ key: todoStackKey(item.id), kind: 'todo', id: item.id, title: item.title, meta: item.snoozed_until ? `Skipped · back ${returnDayLabel(item.snoozed_until)}` : 'Skipped today', state: 'skipped' })
  })
  return { todo, done }
}

function renderGlanceRow(item, state) {
  const mark = state === 'done'
    ? '&#10003;'
    : state === 'skipped'
      ? '&ndash;'
      : item.kind === 'todo' && item.number ? String(item.number) : ''
  const classes = ['glance-row', `is-${state}`, item.now ? 'is-now' : '', glanceSession?.lastKey === item.key ? 'is-changed' : ''].filter(Boolean).join(' ')
  const action = state === 'todo' ? 'Mark done' : 'Put back on today'
  return `
    <button type="button" class="${classes}" data-glance-key="${escapeHtml(item.key)}" aria-label="${escapeHtml(`${action}: ${item.title}`)}">
      <span class="glance-mark ${item.kind === 'todo' && state === 'todo' && item.number ? 'is-power' : ''}" aria-hidden="true">${mark}</span>
      <span class="glance-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.now ? `Up now · ${item.meta}` : item.meta)}</small></span>
    </button>`
}

function renderGlanceBody() {
  const progress = currentDailyProgress()
  const { todo, done } = glanceItems(progress)
  const dateKey = progress.progress_date || todayDateKey()
  const offToday = dailySteps.filter((step) => !stepScheduledOn(step, dateKey))
  const low = isLowEnergy(progress) && hasCoreSteps()
  const resting = low ? dailySteps.filter((step) => stepScheduledOn(step, dateKey) && !step.is_core && !dailyResolvedStepIds(progress).has(step.id)).length : 0
  const notes = [
    resting ? `Low energy: ${plural(resting, 'non-core step')} resting today.` : '',
    offToday.length ? `Not on ${WEEKDAY_NAMES[weekdayOf(dateKey)]}s: ${offToday.length <= 3 ? offToday.map((step) => step.title).join(', ') : plural(offToday.length, 'step')}.` : ''
  ].filter(Boolean)
  return `
    <div class="sheet-head"><strong>Today</strong><button type="button" class="sheet-close" data-sheet-close aria-label="Close">&times;</button></div>
    <p class="glance-hint">Tap a card to mark it done, in any order. Tap again to undo.</p>
    <h4 class="glance-group">To do <span>${todo.length}</span></h4>
    ${todo.length
      ? `<div class="glance-list" id="glance-todo">${todo.map((item) => renderGlanceRow(item, 'todo')).join('')}</div>`
      : '<p class="glance-empty">All done. Nothing left today.</p>'}
    ${done.length ? `
      <h4 class="glance-group">Done <span>${done.filter((item) => item.state === 'done').length}</span></h4>
      <div class="glance-list" id="glance-done">${done.map((item) => renderGlanceRow(item, item.state)).join('')}</div>` : ''}
    ${notes.map((note) => `<p class="glance-note">${escapeHtml(note)}</p>`).join('')}
    <button type="button" class="glance-open-day" id="glance-open-day">Open the full day <small>power actions, boosters, inbox, setup</small><span aria-hidden="true">&rsaquo;</span></button>`
}

function openGlanceSheet() {
  glanceSession = { routineBefore: new Map(), todoBefore: new Map(), lastKey: '' }
  const backdrop = openSheet(renderGlanceBody(), {
    label: "Today's cards",
    sheetClass: 'glance-sheet',
    onDismiss: () => {
      glanceSession = null
      if (currentView === 'day-runner') renderDayRunner()
      else if (currentView === 'day' || currentView === 'day-overview') rerenderOverview()
    }
  })
  bindGlanceSheet(backdrop)
}

function bindGlanceSheet(backdrop) {
  backdrop.querySelectorAll('[data-glance-key]').forEach((button) => {
    button.addEventListener('click', () => toggleGlanceItem(button.dataset.glanceKey))
  })
  backdrop.querySelector('#glance-open-day')?.addEventListener('click', () => {
    glanceSession = null
    closeSheet()
    openDayOverview()
  })
}

function refreshGlanceSheet() {
  const backdrop = document.querySelector('.sheet-backdrop')
  const sheet = backdrop?.querySelector('.glance-sheet')
  if (!sheet) return
  const y = sheet.scrollTop
  sheet.innerHTML = renderGlanceBody()
  sheet.scrollTop = y
  bindGlanceSheet(backdrop)
}

// Puts a key back at a position in today's order (a power action you un-did returns to its place).
function placeStackKey(key, index) {
  const progress = currentDailyProgress()
  const order = normalizeTodayStackOrder(progress).filter((item) => item !== key)
  if (!normalizeTodayStackOrder(progress).includes(key)) return
  order.splice(clamp(index, 0, order.length), 0, key)
  progress.stack_order = order
  saveDailyProgress(progress)
}

// A todo finished earlier (in the runner, or another day's session of this sheet) goes back to today.
function reopenTodoToday(todoId) {
  const done = powerDoneToday.find((item) => item.id === todoId)
  if (!done) return false
  const stamp = nowIso()
  powerDoneToday = powerDoneToday.filter((item) => item.id !== todoId)
  powerTodos = sortBySortOrder([...powerTodos.filter((item) => item.id !== todoId), normalizeTodoRow({ ...done, completed_at: null })])
  queueTodoPatch(todoId, { completed_at: null })
  if (getTodayPlanForTodo(todoId)) queuePlanWrite(setLocalPowerPlan(todoId, { status: 'pending', updated_at: stamp }))
  else setTodoTodayStatus(todoId, 'pending')
  saveSnapshot()
  return true
}

function toggleGlanceItem(key) {
  if (!glanceSession) return
  const [kind, id] = String(key).split(':', 2)
  const progress = currentDailyProgress()
  let markedDone = false

  if (kind === 'routine') {
    const step = dailySteps.find((item) => item.id === id)
    if (!step) return
    const completed = new Set(progress.completed_step_ids || [])
    const skipped = new Set(progress.skipped_step_ids || [])
    const positions = { ...(progress.substep_positions || {}) }
    const substeps = normalizeDailySubsteps(step.substeps)
    if (completed.has(id) || skipped.has(id)) {
      // Back on today: exactly as it was before this sheet touched it, or fresh.
      const before = glanceSession.routineBefore.get(id)
      completed.delete(id)
      skipped.delete(id)
      if (before && !before.completed && !before.skipped) {
        if (before.position) positions[id] = before.position
        else delete positions[id]
      } else delete positions[id]
    } else {
      if (!glanceSession.routineBefore.has(id)) glanceSession.routineBefore.set(id, { completed: false, skipped: false, position: Number.parseInt(positions[id], 10) || 0 })
      completed.add(id)
      skipped.delete(id)
      if (substeps.length) positions[id] = substeps.length
      markedDone = true
    }
    progress.completed_step_ids = [...completed]
    progress.skipped_step_ids = [...skipped]
    progress.later_step_ids = (progress.later_step_ids || []).filter((item) => item !== id)
    progress.substep_positions = positions
    progress.is_complete = false
    saveDailyProgress(progress)
  } else if (kind === 'todo') {
    const plan = getTodayPlanForTodo(id)
    const isOpen = Boolean(getPowerTodo(id))
    if (isOpen && plan?.status === 'skipped') {
      // Skipped earlier, wanted after all: back on today, no longer resting.
      queuePlanWrite(setLocalPowerPlan(id, { status: 'pending', updated_at: nowIso() }))
      if (actionEngineAvailable && getPowerTodo(id)?.snoozed_until) patchLocalTodo(id, { snoozed_until: null })
      saveSnapshot()
    } else if (isOpen) {
      const index = normalizeTodayStackOrder(progress).indexOf(key)
      const restore = markTodoDone(id)
      if (!restore) return
      glanceSession.todoBefore.set(id, { restore, index })
      clearSprintFor(key)
      markedDone = true
    } else {
      const before = glanceSession.todoBefore.get(id)
      if (before) {
        before.restore()
        glanceSession.todoBefore.delete(id)
        placeStackKey(key, before.index)
      } else if (!reopenTodoToday(id)) return
    }
  } else return

  glanceSession.lastKey = key
  if (markedDone) {
    unlockAudio()
    playDoneTick()
    vibrate(12)
  } else vibrate(8)
  refreshGlanceSheet()
}

// ---------- the runner: one card, one decision ----------

function renderDeferNudge(count, type) {
  const advice = type === 'todo'
    ? 'Usually that means too big or too vague. Shrink it, give it 5 minutes, or skip it today. No guilt.'
    : type === 'gym'
      ? 'Deal: just the first exercise. If you still want to stop after it, stop. Or skip today, no guilt.'
      : 'Give it 5 minutes, or skip it today. No guilt.'
  return `<div class="defer-nudge" role="note"><strong>Moved ${count}× today.</strong> ${advice}</div>`
}

// Paralysis tools stay out of sight until you need them: after 30 seconds on the same todo,
// or right away when it comes back after a Later. An easy card stays just DONE / Later / Skip.
function renderStuckTools(action) {
  return `
    <div class="card-tools stuck-tools" id="stuck-tools">
      <span class="stuck-label">Stuck?</span>
      ${renderSprintPill(action)}
      <button type="button" class="card-link" id="shrink-todo">Shrink it</button>
    </div>`
}

function bindStuckTools(action) {
  document.querySelector('#sprint-pill')?.addEventListener('click', () => startSprint(action))
  document.querySelector('#shrink-todo')?.addEventListener('click', () => showShrinkSheet(action.todo))
}

function scheduleStuckReveal(action) {
  if (stuckRevealTimer) window.clearTimeout(stuckRevealTimer)
  const key = runnerKeyFor(action)
  stuckRevealTimer = window.setTimeout(() => {
    stuckRevealTimer = null
    const slot = document.querySelector('#stuck-slot')
    if (currentView !== 'day-runner' || lastRunnerKey !== key || !slot || slot.childElementCount) return
    revealedStuckKeys.add(key)
    slot.innerHTML = renderStuckTools(action)
    bindStuckTools(action)
  }, STUCK_REVEAL_MS)
}

function renderDayRunner() {
  if (stuckRevealTimer) window.clearTimeout(stuckRevealTimer)
  stuckRevealTimer = null
  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  if (progress.closed_at) {
    renderDay('', { forceOverview: true })
    return
  }
  const action = getCurrentStackAction(progress)
  if (!action) {
    const firstFinish = !progress.is_complete
    progress.is_complete = true
    saveDailyProgress(progress)
    clearSprint()
    renderDay('', { forceOverview: true, justCompleted: firstFinish })
    if (firstFinish) playDayCompleteChime()
    return
  }

  let gymState = null
  if (action.type === 'routine' && !action.isSubstep) {
    gymState = getDailyGymState(action.step)
    if (gymStepSatisfied(gymState)) {
      advanceDailyAction(action.step.id, false)
      renderDayRunner()
      return
    }
  }

  const score = todayScore(progress)
  const low = isLowEnergy(progress) && hasCoreSteps()
  const deferCount = Number(progress.defer_counts?.[action.key]) || 0
  const key = runnerKeyFor(action)
  // The first card of the day is the moment to decide how big today is, so the option lives right there.
  const roughDayLink = score.done === 0 && hasCoreSteps() && !low
    ? '<div class="card-tools"><button type="button" class="card-link" id="rough-day">Rough day? Core only</button></div>'
    : ''
  let cardBody = ''
  let cardClass = ''
  let primaryLabel = 'DONE'
  let waitForStuck = false

  if (action.type === 'todo') {
    const todo = action.todo
    const parent = todo.parent_id ? getAnyTodo(todo.parent_id) : null
    const sprint = readSprint()
    const showStuck = deferCount >= 1 || revealedStuckKeys.has(key) || Boolean(sprint && sprint.key === key)
    const label = powerActionLabel(todo)
    const parentTitle = label.parentTitle || parent?.title || ''
    waitForStuck = !showStuck
    cardClass = 'day-step-card-todo'
    cardBody = `
      <div class="day-step-parent">${escapeHtml(label.text)}${parentTitle ? ` <span>${label.parentTitle ? '' : 'step of: '}${escapeHtml(shorten(parentTitle, 28))}</span>` : ''}</div>
      <h2>${escapeHtml(todo.title)}</h2>
      ${deferCount >= DEFER_NUDGE_AT ? renderDeferNudge(deferCount, 'todo') : ''}
      <div id="stuck-slot">${showStuck ? renderStuckTools(action) : ''}</div>
      ${roughDayLink}`
  } else if (gymState) {
    const { step } = action
    const nextFolder = gymState.remaining[0] || gymState.suggestion?.folder || null
    const plannedNames = gymState.planned.map((folder) => folder.name).join(' + ')
    const doneCount = gymState.planned.length - gymState.remaining.length
    const resumable = nextFolder && getSavedWorkoutForFolder(nextFolder.id)
    primaryLabel = nextFolder ? `${resumable ? 'RESUME' : 'START'} ${nextFolder.name.toUpperCase()}` : 'CHOOSE WORKOUT'
    cardClass = 'day-step-card-gym'
    cardBody = `
      <div class="day-step-parent">${escapeHtml(step.title.trim().toLowerCase() === 'gym' ? 'Routine · Forge' : `${step.title} · Forge`)}</div>
      <h2>${escapeHtml(plannedNames || gymState.suggestion?.folder.name || step.title)}</h2>
      ${step.note ? `<p>${escapeHtml(step.note)}</p>` : ''}
      ${deferCount >= DEFER_NUDGE_AT ? renderDeferNudge(deferCount, 'gym') : ''}
      ${gymState.planned.length > 1 && doneCount ? `<p class="day-gym-empty">${doneCount} of ${gymState.planned.length} done. Next: ${escapeHtml(gymState.remaining[0].name)}.</p>` : ''}
      ${!gymState.planned.length && gymState.suggestion ? `<p class="day-gym-empty">Nothing planned, so it's picked for you: last trained ${escapeHtml(daysAgoLabel(gymState.suggestion.last))}.</p><div class="card-tools"><button type="button" class="card-link" id="gym-choose-other">Choose another</button></div>` : ''}
      ${!gymState.planned.length && !gymState.suggestion ? '<p class="day-gym-empty">No workout planned today.</p>' : ''}
      ${roughDayLink}`
  } else {
    const { step, substeps, substepIndex, title, isSubstep } = action
    const substepMeta = isSubstep ? `${substepIndex + 1} of ${substeps.length}` : ''
    cardBody = `
      <div class="day-step-parent">${isSubstep ? `${escapeHtml(step.title)} <span>${escapeHtml(substepMeta)}</span>` : 'Routine'}${low && step.is_core ? ' <span>core</span>' : ''}</div>
      <h2>${escapeHtml(title)}</h2>
      ${step.note ? `<p>${escapeHtml(step.note)}</p>` : ''}
      ${deferCount >= DEFER_NUDGE_AT ? `${renderDeferNudge(deferCount, 'routine')}<div class="card-tools">${renderSprintPill(action)}</div>` : ''}
      ${roughDayLink}`
  }

  const resolvedRoutine = dailyResolvedStepIds(progress)
  const canLater = getTodayStackEntries(progress).some((entry) => entry.key !== action.key && (
    entry.type === 'todo' ? entry.plan?.status === 'pending' : !resolvedRoutine.has(entry.id)
  ))

  renderShell(`
    <div class="day-runner-screen">
      <header class="runner-head">
        <div class="day-runner-top">
          <div class="runner-left">
            <button type="button" class="runner-eye" id="runner-eye" aria-label="See all of today's cards">${EYE_ICON}</button>
            <div class="runner-score" aria-label="${score.done} done today"><strong>&#10003; ${score.done}</strong></div>
          </div>
          <div class="day-runner-tools">
            ${renderRunnerMedsPill()}
            <button type="button" class="day-runner-capture" id="runner-capture" aria-label="Capture a thought">+</button>
          </div>
        </div>
        <div class="runner-progress" aria-hidden="true"><span style="width:${score.percent}%"></span></div>
      </header>
      <section class="day-step-card ${cardClass}" id="day-step-card" aria-label="Current action: ${escapeHtml(action.title)}">
        ${cardBody}
      </section>
      <div class="day-action-controls" aria-label="Current action controls">
        <div class="day-secondary-actions">
          ${canLater ? '<button type="button" class="day-option-button" id="later-current-action">Later today</button>' : ''}
          <button type="button" class="day-option-button" id="skip-current-action">Skip today</button>
        </div>
        <button type="button" class="day-primary-action" id="primary-current-action">${escapeHtml(primaryLabel)} <span aria-hidden="true">&rarr;</span></button>
      </div>
    </div>`,
    { title: 'Gifts', showAccount: false, showTimer: false, showHeader: false, navTab: 'day', view: 'day-runner', shellClass: 'runner-shell' })

  lastRunnerKey = key
  syncSprintWithAction(action)
  if (action.type === 'todo') {
    if (waitForStuck) scheduleStuckReveal(action)
    else bindStuckTools(action)
  } else {
    document.querySelector('#sprint-pill')?.addEventListener('click', () => startSprint(action))
  }

  document.querySelector('#runner-capture')?.addEventListener('click', showRunnerCapture)
  document.querySelector('#runner-meds')?.addEventListener('click', showMedsSheet)
  document.querySelector('#runner-eye')?.addEventListener('click', openGlanceSheet)
  document.querySelector('#rough-day')?.addEventListener('click', () => {
    toggleEnergyMode()
    renderDayRunner()
  })
  document.querySelector('#gym-choose-other')?.addEventListener('click', () => renderWorkouts())

  const primary = document.querySelector('#primary-current-action')
  const later = document.querySelector('#later-current-action')
  const skip = document.querySelector('#skip-current-action')
  if (action.type === 'todo') {
    primary?.addEventListener('click', () => completeTodoFromRunner(action.todo.id))
    later?.addEventListener('click', () => deferTodoFromRunner(action.todo.id))
    skip?.addEventListener('click', () => skipTodoFromRunner(action.todo.id))
  } else {
    primary?.addEventListener('click', () => triggerDailyPrimaryAction(action.step))
    later?.addEventListener('click', () => deferRoutineFromRunner(action.step))
    skip?.addEventListener('click', () => skipRoutineFromRunner(action.step))
  }
}

function triggerDailyPrimaryAction(step) {
  const gymState = getDailyGymState(step)
  if (gymState) {
    if (!guardActionTap()) return
    const nextFolder = gymState.remaining[0] || gymState.suggestion?.folder || null
    if (nextFolder) openFolder(nextFolder.id, { mode: 'workout' })
    else renderWorkouts()
    return
  }
  completeRoutineFromRunner(step)
}

function completeRoutineFromRunner(step) {
  if (!guardActionTap()) return
  unlockAudio()
  const progressBefore = cloneDailyProgress()
  if (!advanceDailyAction(step.id, false)) return
  clearSprintFor(routineStackKey(step.id))
  celebrateDone().then(() => {
    renderDayRunner()
    rememberUndo('Done', () => saveDailyProgress(progressBefore), renderDayRunner)
  })
}

function skipRoutineFromRunner(step) {
  if (!guardActionTap()) return
  const progressBefore = cloneDailyProgress()
  if (!advanceDailyAction(step.id, true)) return
  clearSprintFor(routineStackKey(step.id))
  renderDayRunner()
  rememberUndo('Skipped today', () => saveDailyProgress(progressBefore), renderDayRunner)
}

function deferRoutineFromRunner(step) {
  if (!guardActionTap()) return
  const progressBefore = cloneDailyProgress()
  if (!deferStackKey(routineStackKey(step.id))) return
  clearSprintFor(routineStackKey(step.id))
  renderDayRunner()
  rememberUndo('Moved to later', () => saveDailyProgress(progressBefore), renderDayRunner)
}

function completeTodoFromRunner(todoId) {
  if (!guardActionTap()) return
  unlockAudio()
  const progressBefore = cloneDailyProgress()
  const restore = markTodoDone(todoId)
  if (!restore) return
  clearSprintFor(todoStackKey(todoId))
  const progress = currentDailyProgress()
  progress.stack_order = normalizeTodayStackOrder(progress)
  saveDailyProgress(progress)
  celebrateDone().then(() => {
    renderDayRunner()
    rememberUndo('Done', () => {
      restore()
      saveDailyProgress(progressBefore)
    }, renderDayRunner)
  })
}

// Skip on a todo means "not today": it stays in Inbox and comes back after a growing gap
// (tomorrow, then 3 days, then a week), so things you keep skipping fade out on their own.
function skipTodoFromRunner(todoId) {
  if (!guardActionTap()) return
  const planBefore = getTodayPlanForTodo(todoId)
  const todoBefore = getPowerTodo(todoId)
  if (!planBefore || !todoBefore) return
  const progressBefore = cloneDailyProgress()
  queuePlanWrite(setLocalPowerPlan(todoId, { status: 'skipped', updated_at: nowIso() }))
  let label = 'Skipped today · still in Inbox'
  if (actionEngineAvailable) {
    const days = SNOOZE_STEPS_DAYS[Math.min(todoBefore.snooze_count, SNOOZE_STEPS_DAYS.length - 1)]
    const until = addDaysKey(todayDateKey(), days)
    patchLocalTodo(todoId, { snoozed_until: until, snooze_count: todoBefore.snooze_count + 1 })
    label = `Skipped · back ${returnDayLabel(until)}`
  }
  clearSprintFor(todoStackKey(todoId))
  saveSnapshot()
  renderDayRunner()
  rememberUndo(label, () => {
    queuePlanWrite(setLocalPowerPlan(todoId, { status: planBefore.status, updated_at: nowIso() }))
    if (actionEngineAvailable) patchLocalTodo(todoId, { snoozed_until: todoBefore.snoozed_until, snooze_count: todoBefore.snooze_count })
    saveDailyProgress(progressBefore)
  }, renderDayRunner)
}

function deferTodoFromRunner(todoId) {
  if (!guardActionTap()) return
  const progressBefore = cloneDailyProgress()
  if (!deferStackKey(todoStackKey(todoId))) return
  clearSprintFor(todoStackKey(todoId))
  renderDayRunner()
  rememberUndo('Moved to later', () => saveDailyProgress(progressBefore), renderDayRunner)
}

// "Too big?" Turn the vague thing into one tiny physical first step and do that instead.
function showShrinkSheet(todo) {
  if (!todo) return
  const backdrop = openSheet(`
    <form class="runner-capture-form" id="shrink-form" autocomplete="off">
      <div class="sheet-head"><strong>Shrink it</strong><button type="button" class="sheet-close" data-sheet-close aria-label="Close">&times;</button></div>
      <p class="sheet-copy">What's the very first physical step for <strong>${escapeHtml(shorten(todo.title, 40))}</strong>? Make it so small it feels silly.</p>
      <input id="shrink-input" type="text" maxlength="${POWER_TODO_TITLE_MAX}" required placeholder="e.g. Open the folder" enterkeyhint="go" />
      <div class="sheet-hint">Open the email · Find the document · Write one sentence · Put on shoes</div>
      <button type="submit" class="primary-button">Do this first</button>
    </form>`, { label: 'Shrink it' })
  const input = backdrop.querySelector('#shrink-input')
  input?.focus()
  backdrop.querySelector('#shrink-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const step = createLocalTodo(input?.value || '', { size: 'quick', parent_id: todo.id })
    if (!step) return
    setTodoTodayStatus(step.id, 'pending', { position: 'before' })
    clearSprintFor(todoStackKey(todo.id))
    closeSheet()
    renderDayRunner()
    showToast('First step is up. Just that.')
  })
}

// ---------- triage: prioritizing without prioritizing ----------
// Ranking a whole list is the hard part. Deciding about one item at a time is easy, so the inbox
// is served like the runner: one card, three answers, and it stops when you have enough for today.

function openTriage() {
  if (!powerActionsAvailable) return
  closeSheet()
  triageSession = { passedIds: new Set(), picked: 0, decided: 0, keepGoing: getPendingPowerPlans().length >= TODAY_TODO_TARGET }
  renderTriage()
}

function renderTriage() {
  if (!triageSession) {
    renderDay('', { forceOverview: true })
    return
  }
  const queue = getTriageQueue()
  const pendingCount = getPendingPowerPlans().length
  const capReached = pendingCount >= TODAY_TODO_TARGET && !triageSession.keepGoing
  if (!queue.length || capReached) {
    renderTriageSummary(queue, capReached)
    return
  }

  const todo = queue[0]
  const position = triageSession.decided + 1
  const total = triageSession.decided + queue.length
  const stale = todo.snooze_count >= STALE_SNOOZE_COUNT
  const parent = todo.parent_id ? getAnyTodo(todo.parent_id) : null
  const countLine = pendingCount > TODAY_TODO_TARGET
    ? `Today: ${pendingCount} picked (more than ${TODAY_TODO_TARGET})`
    : `Today: ${pendingCount} of ${TODAY_TODO_TARGET} picked`

  renderShell(`
    <div class="day-runner-screen triage-screen">
      <header class="runner-head">
        <div class="day-runner-top">
          <div class="runner-score"><strong>Sort inbox</strong><span>${position} of ${total}</span></div>
          <button type="button" class="triage-exit" id="triage-exit">Done</button>
        </div>
        <div class="runner-progress" aria-hidden="true"><span style="width:${Math.round((triageSession.decided / Math.max(1, total)) * 100)}%"></span></div>
      </header>
      <section class="day-step-card triage-card" id="day-step-card" aria-label="Inbox item: ${escapeHtml(todo.title)}">
        <div class="day-step-parent">Inbox <span>${escapeHtml(ageLongLabel(todo.created_at))}</span>${todo.snooze_count ? ` <span>passed ${todo.snooze_count}×</span>` : ''}${parent ? ` <span>step of: ${escapeHtml(shorten(parent.title, 24))}</span>` : ''}</div>
        <h2>${escapeHtml(todo.title)}</h2>
        ${stale ? `<div class="defer-nudge"><strong>Passed on ${todo.snooze_count} times.</strong> Dropping it is a real decision, not a failure.</div>` : ''}
        <div class="card-tools"><button type="button" class="card-link" id="triage-already">Already done? Log it &#10003;</button></div>
      </section>
      <div class="day-action-controls">
        <div class="triage-count-line">${escapeHtml(countLine)}</div>
        <div class="day-secondary-actions">
          <button type="button" class="day-option-button" id="triage-not-today">Not today</button>
          <button type="button" class="day-option-button" id="triage-drop">Drop</button>
        </div>
        <button type="button" class="day-primary-action" id="triage-today">TODAY <span aria-hidden="true">&rarr;</span></button>
      </div>
    </div>`,
    { title: 'Sort inbox', showAccount: false, showTimer: false, showHeader: false, view: 'triage' })

  document.querySelector('#triage-exit')?.addEventListener('click', exitTriage)
  document.querySelector('#triage-today')?.addEventListener('click', () => triageToday(todo.id))
  document.querySelector('#triage-not-today')?.addEventListener('click', () => triageNotToday(todo.id))
  document.querySelector('#triage-drop')?.addEventListener('click', () => triageDrop(todo.id))
  document.querySelector('#triage-already')?.addEventListener('click', () => triageAlreadyDone(todo.id))
}

function renderTriageSummary(queue, capReached) {
  const picked = getPendingPowerPlans().map((plan) => getPowerTodo(plan.todo_id)).filter(Boolean)
  const title = capReached ? `That's your ${TODAY_TODO_TARGET}.` : 'Inbox sorted.'
  const copy = capReached
    ? 'A short list you finish beats a long list you avoid. Everything else is safe in Inbox.'
    : picked.length ? 'Decided. Now it only has to be done.' : 'Nothing picked for today. That is a valid plan.'
  renderShell(`
    <div class="day-runner-screen triage-screen">
      <header class="runner-head">
        <div class="day-runner-top"><div class="runner-score"><strong>Sort inbox</strong><span>${escapeHtml(plural(triageSession.decided, 'decision'))}</span></div></div>
        <div class="runner-progress" aria-hidden="true"><span style="width:100%"></span></div>
      </header>
      <section class="day-step-card triage-card is-summary" id="day-step-card">
        <div class="day-step-parent">Today</div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(copy)}</p>
        ${picked.length ? `<ol class="triage-picked">${picked.map((todo) => `<li>${escapeHtml(todo.title)}</li>`).join('')}</ol>` : ''}
      </section>
      <div class="day-action-controls">
        ${capReached && queue.length ? `<div class="day-secondary-actions"><button type="button" class="day-option-button" id="triage-keep-going">Keep sorting · ${queue.length} left</button></div>` : ''}
        <button type="button" class="day-primary-action" id="triage-finish">BACK TO YOUR DAY <span aria-hidden="true">&rarr;</span></button>
      </div>
    </div>`,
    { title: 'Sort inbox', showAccount: false, showTimer: false, showHeader: false, view: 'triage' })

  document.querySelector('#triage-keep-going')?.addEventListener('click', () => {
    if (!triageSession) return
    triageSession.keepGoing = true
    renderTriage()
  })
  document.querySelector('#triage-finish')?.addEventListener('click', exitTriage)
}

function exitTriage() {
  triageSession = null
  openDayOverview()
}

function rerenderTriage() {
  if (currentView === 'triage') renderTriage()
  else rerenderCurrentDayView()
}

function triageToday(todoId) {
  if (!triageSession || !guardActionTap(420)) return
  const progressBefore = cloneDailyProgress()
  if (!setTodoTodayStatus(todoId, 'pending')) return
  triageSession.picked += 1
  triageSession.decided += 1
  renderTriage()
  rememberUndo('Added to today', () => {
    removeTodayPlan(todoId)
    saveDailyProgress(progressBefore)
    if (triageSession) {
      triageSession.picked = Math.max(0, triageSession.picked - 1)
      triageSession.decided = Math.max(0, triageSession.decided - 1)
    }
  }, rerenderTriage)
}

// "Not today" snoozes with growing gaps (1, 3, then 7 days) so the same item isn't re-decided every morning.
function triageNotToday(todoId) {
  if (!triageSession || !guardActionTap(420)) return
  const todo = getPowerTodo(todoId)
  if (!todo) return
  const before = { snoozed_until: todo.snoozed_until, snooze_count: todo.snooze_count }
  triageSession.passedIds.add(todoId)
  triageSession.decided += 1
  let label = 'Not today'
  if (actionEngineAvailable) {
    const days = SNOOZE_STEPS_DAYS[Math.min(todo.snooze_count, SNOOZE_STEPS_DAYS.length - 1)]
    const until = addDaysKey(todayDateKey(), days)
    patchLocalTodo(todoId, { snoozed_until: until, snooze_count: todo.snooze_count + 1 })
    label = `Back ${returnDayLabel(until)}`
  }
  renderTriage()
  rememberUndo(label, () => {
    if (actionEngineAvailable) patchLocalTodo(todoId, before)
    if (triageSession) {
      triageSession.passedIds.delete(todoId)
      triageSession.decided = Math.max(0, triageSession.decided - 1)
    }
  }, rerenderTriage)
}

function triageDrop(todoId) {
  if (!triageSession || !guardActionTap(420)) return
  const todo = getPowerTodo(todoId)
  const restore = dropTodo(todoId)
  if (!restore) return
  triageSession.decided += 1
  renderTriage()
  rememberUndo(`Dropped "${shorten(todo?.title, 22)}"`, () => {
    restore()
    if (triageSession) triageSession.decided = Math.max(0, triageSession.decided - 1)
  }, rerenderTriage)
}

function triageAlreadyDone(todoId) {
  if (!triageSession || !guardActionTap(420)) return
  unlockAudio()
  const restore = markTodoDone(todoId)
  if (!restore) return
  triageSession.decided += 1
  playDoneTick()
  renderTriage()
  rememberUndo('Logged as done', () => {
    restore()
    if (triageSession) triageSession.decided = Math.max(0, triageSession.decided - 1)
  }, rerenderTriage)
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

  // Nothing planned: one suggested workout instead of a menu of choices.
  const doneToday = getCompletedFolders(todayKey)
  const suggestion = !todayFolders.length && !missedFolders.length && !doneToday.length ? suggestWorkoutFolder() : null
  const emptyBody = suggestion ? `
        <div class="gym-suggestion">
          <span>Nothing planned · suggested</span>
          <strong>${escapeHtml(suggestion.folder.name)}</strong>
          <small>last trained ${escapeHtml(daysAgoLabel(suggestion.last))}</small>
        </div>
        <button type="button" class="start-workout-button today-start" id="start-suggested" data-folder-id="${suggestion.folder.id}">Start ${escapeHtml(suggestion.folder.name)} <span aria-hidden="true">&rarr;</span></button>
        <button type="button" class="quiet-action gym-choose-other" id="choose-workout">Choose another</button>` : `
        <div class="today-empty">${doneToday.length ? `Done today: ${escapeHtml(doneToday.map((folder) => folder.name).join(' + '))} &#10003;` : 'No workout planned'}</div>
        <button type="button" class="secondary-button full-button today-choose" id="choose-workout">Choose workout</button>`

  const todayCard = `
    <section class="today-card">
      <div class="today-label">Today</div>
      ${todayFolders.length ? `
        <div class="today-workout-list">${todayRows}</div>
        <button type="button" class="quiet-action" id="preload-today">Save videos</button>
        <div id="preload-status" class="micro-status" aria-live="polite"></div>` : emptyBody}
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
    <button type="button" class="quiet-action gym-all-workouts" id="open-all-workouts">All workouts</button>`, { title: 'Forge', showAccount: false, showTimer: false, navTab: 'gym', view: 'home' })

  document.querySelectorAll('[data-start-today]').forEach((button) => {
    button.addEventListener('click', () => openFolder(button.dataset.startToday, { mode: 'workout' }))
  })
  document.querySelector('#resume-home')?.addEventListener('click', () => openFolder(savedFolder.id, { mode: 'workout' }))
  document.querySelector('#start-suggested')?.addEventListener('click', (event) => openFolder(event.currentTarget.dataset.folderId, { mode: 'workout' }))
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

// ---------- app icon badge ----------
// "Out of sight, out of mind": an optional count on the home-screen icon is a cue that doesn't need opening the app.

function badgeSupported() {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator
}

function badgeEnabled() {
  try {
    return window.localStorage.getItem(BADGE_KEY) === 'on'
  } catch {
    return false
  }
}

function updateAppBadge() {
  if (!badgeSupported() || !badgeEnabled() || !currentUser) return
  try {
    const progress = currentDailyProgress()
    const count = progress.closed_at ? 0 : remainingTodayActionCount(progress)
    const result = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()
    result?.catch?.(() => {})
  } catch {
    // Badges are a bonus.
  }
}

async function toggleAppBadge() {
  if (badgeEnabled()) {
    try {
      window.localStorage.setItem(BADGE_KEY, 'off')
      navigator.clearAppBadge?.()?.catch?.(() => {})
    } catch {
      // Ignore.
    }
    renderMore()
    return
  }
  // iPhone only shows badges for home-screen apps that have notification permission.
  // battle angel never sends notifications; the permission only unlocks the number on the icon.
  try {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission()
  } catch {
    // Permission prompt not available.
  }
  try {
    window.localStorage.setItem(BADGE_KEY, 'on')
  } catch {
    // Ignore.
  }
  updateAppBadge()
  renderMore()
}

function toggleDoneSound() {
  try {
    window.localStorage.setItem(DONE_SOUND_KEY, doneSoundOn() ? 'off' : 'on')
  } catch {
    // Ignore.
  }
  if (doneSoundOn()) {
    unlockAudio()
    playDoneTick()
  }
  renderMore()
}

function renderMore(errorMessage = '') {
  activeFolder = null
  activeExerciseGroups = []
  workoutMode = false
  folderEditMode = false
  const soundOn = doneSoundOn()
  const badgeOn = badgeEnabled()
  const permissionBlocked = badgeOn && 'Notification' in window && Notification.permission === 'denied'
  renderShell(`
    ${errorMessage ? `<div class="notice error">${escapeHtml(errorMessage)}</div>` : ''}
    ${renderMotivationLibrary()}
    <section class="more-card settings-card" aria-label="Feedback settings">
      <button type="button" class="settings-row ${soundOn ? 'is-on' : ''}" id="toggle-done-sound" aria-pressed="${soundOn}">
        <span><strong>Done sound</strong><small>a short tick each time you finish something</small></span>
        <span class="settings-state">${soundOn ? 'On' : 'Off'}</span>
      </button>
      ${badgeSupported() ? `
        <button type="button" class="settings-row ${badgeOn ? 'is-on' : ''}" id="toggle-app-badge" aria-pressed="${badgeOn}">
          <span><strong>App icon count</strong><small>${permissionBlocked ? 'allow notifications for battle angel in iPhone Settings to see it' : "actions left today, on the home-screen icon"}</small></span>
          <span class="settings-state">${badgeOn ? 'On' : 'Off'}</span>
        </button>` : ''}
    </section>
    <section class="more-card">
      <button type="button" class="secondary-button full-button" id="theme-toggle">${getTheme() === 'dark' ? 'Light mode' : 'Dark mode'}</button>
      <button type="button" class="secondary-button full-button" id="backup-library">Backup library</button>
      <button type="button" class="secondary-button full-button" id="sign-out">Sign out</button>
      <div id="backup-status" class="status-line backup-status" aria-live="polite"></div>
      <div class="app-version">battle angel v${APP_VERSION}</div>
      ${actionEngineAvailable ? '' : '<div class="db-upgrade-note">Database: run <strong>supabase/action_engine_upgrade.sql</strong> once to turn on core steps, snooze, and wrap-up.</div>'}
      ${routineDaysAvailable ? '' : '<div class="db-upgrade-note">Database: run <strong>supabase/routine_upgrade.sql</strong> once to pick the days each routine step runs and link any step to your workout.</div>'}
    </section>`, { title: 'More', showAccount: false, showTimer: false, navTab: 'more' })

  document.querySelector('#toggle-done-sound')?.addEventListener('click', toggleDoneSound)
  document.querySelector('#toggle-app-badge')?.addEventListener('click', toggleAppBadge)
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

// Days in the week with at least one workout done. Chest + Triceps on Monday = 1 day.
function weekDoneCount(weekStartKey) {
  let days = 0
  for (let i = 0; i < 7; i += 1) {
    if (getCompletedFolders(addDaysKey(weekStartKey, i)).length) days += 1
  }
  return days
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
    return `<div class="week-progress is-golden">Golden week · ${plural(done, 'day')} trained</div>${streak}`
  }
  const pips = Array.from({ length: GOLDEN_WEEK_TARGET }, (_, i) => `<span class="week-pip ${i < done ? 'filled' : ''}"></span>`).join('')
  return `<div class="week-progress"><span class="week-pips" aria-hidden="true">${pips}</span>${done} of ${GOLDEN_WEEK_TARGET} days trained this week</div>${streak}`
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
  // A past day is about what you did, not what you planned: one tap logs a workout as done.
  const logging = plannerSelectedDate < todayDateKey() && canMarkDone()
  const doneIds = new Set(getCompletedFolders(plannerSelectedDate).map((folder) => folder.id))
  const missedPlan = selectedFolders.some((folder) => !doneIds.has(folder.id))
  const folderButtons = folders.map((folder) => logging
    ? `
    <button type="button" class="plan-muscle-button log-button ${doneIds.has(folder.id) ? 'is-logged' : ''} ${selectedIds.has(folder.id) && !doneIds.has(folder.id) ? 'is-planned' : ''}" data-log-folder="${folder.id}" aria-pressed="${doneIds.has(folder.id)}">${doneIds.has(folder.id) ? '<span aria-hidden="true">&#10003;</span> ' : ''}${escapeHtml(folder.name)}</button>`
    : `
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
    ${canMarkDone() ? '<div class="calendar-hint">Tap a past day to log what you trained. Hold a day to mark its plan done.</div>' : ''}
    <section class="plan-day-editor">
      <div class="plan-day-title">${escapeHtml(formatPlanDate(plannerSelectedDate))}</div>
      ${renderWeekProgress(plannerSelectedDate, { streak: startOfWeekKey(plannerSelectedDate) === startOfWeekKey(todayDateKey()) })}
      ${logging ? `<div class="plan-log-head"><strong>What did you train?</strong><span>Tap to mark done, tap again to undo.${missedPlan ? ' Outlined: planned, not done yet.' : ''}</span></div>` : ''}
      <div class="plan-muscle-grid">${folderButtons}</div>
      ${logging ? '' : renderDoneControls(plannerSelectedDate)}
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
    </section>`, { title: 'Destiny', showAccount: false, showTimer: false, navTab: 'plan' })

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
  document.querySelectorAll('[data-log-folder]').forEach((button) => {
    button.addEventListener('click', () => logPastWorkout(plannerSelectedDate, button.dataset.logFolder))
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

// Past day in Destiny: one tap logs (or un-logs) a workout, no planning first.
async function logPastWorkout(dateKey, folderId) {
  const folder = folders.find((item) => item.id === folderId)
  if (!folder || !canMarkDone() || dateKey > todayDateKey()) return
  const done = !wasWorkoutCompleted(dateKey, folderId)
  plannerStatusMessage = `${folder.name} on ${formatPlanDate(dateKey, { short: true })}: ${done ? 'done ✓' : 'undone'}.`
  if (done) {
    unlockAudio()
    playDoneTick()
    vibrate(12)
  }
  await setWorkoutDone(dateKey, folderId, done)
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
    plannerStatusMessage = dateKey < todayDateKey() ? 'Tap what you trained below.' : 'Pick the muscles you trained below, then hold the day again.'
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
  const completedName = activeFolder?.name || 'Workout'
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
    playDoneTick()
    showToast(`${completedName} done ✓ Back to your day.`, { ms: 3200 })
    refreshInBackground()
    return
  }

  const showWeek = historyAvailable && planningUpgradeAvailable
  renderShell(`
    <section class="finish-card">
      <div class="finish-check">&#10003;</div>
      <h2>${escapeHtml(completedName)} done.</h2>
      ${showWeek ? `<div class="finish-week">${renderWeekProgress(todayDateKey(), { streak: true })}</div>` : ''}
      <button type="button" class="start-workout-button" id="finish-home">Done</button>
    </section>`, { title: 'Workout complete', showAccount: false, showTimer: false })
  playDayCompleteChime()

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

// A new calendar day always starts clean, even if battle angel stayed open overnight on a card.
function handleDayRollover() {
  const today = todayDateKey()
  const progressStale = Boolean(dailyProgress && dailyProgress.progress_date !== today)
  if (!progressStale && dailyMedsDate === today && powerActionsDate === today) return
  triageSession = null
  powerPrompt = null
  dayUi = { reorder: false, orderAll: false, inboxEdit: false, inboxAll: false }
  revealedStuckKeys.clear()
  clearUndo()
  hideToast(true)
  closeSheet()
  clearSprint()
  dailyMedsDate = today
  dailyMedTakenIds = mergeDailyMedTakenIds([], today)
  ensurePowerDate()
  currentDailyProgress()
  if (DAY_VIEWS.includes(currentView)) renderDay()
  if (!currentUser) return
  Promise.all([loadDailySystem(), loadDailyMeds(), loadPowerActions()]).then(() => {
    saveSnapshot()
    if (DAY_VIEWS.includes(currentView) && !document.querySelector('.sheet-backdrop')) renderDay()
  }).catch(() => {})
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    updateAppBadge()
    return
  }
  if (workoutMode || timerEndAt || sprintIsRunning() || finishReel || currentView === 'finish-question') keepAwake()
  if (finishReel && currentView === 'finish') {
    updateFinishReel()
    if (finishReel) document.querySelector('#finish-video:not(.hidden)')?.play()?.catch?.(() => {})
  }
  if (readSprint()) {
    if (sprintIsRunning()) startSprintTicker()
    else updateSprintPill()
  }
  handleDayRollover()
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
  clearLegacyAutoPickMarkers()
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
        if (viewVersion === version && ['day', 'home', 'day-runner', 'day-prompt'].includes(currentView) && (dataSignature() !== before || cloudChangedWorkout)) {
          if (cloudChangedWorkout && shouldAutoResume(saved)) await routeAfterLoad(saved)
          else if (currentView === 'day') renderDay()
          else if (currentView === 'day-runner') refreshRunnerIfChanged()
          else if (currentView === 'day-prompt') refreshPowerPromptIfIdle()
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
  dailyMeds = []
  dailyMedTakenIds = []
  dailyMedsDate = todayDateKey()
  dailyMedsAvailable = true
  powerTodos = []
  powerPlans = []
  powerDoneToday = []
  powerActionsDate = todayDateKey()
  powerActionsAvailable = true
  actionEngineAvailable = true
  routineDaysAvailable = true
  triageSession = null
  powerPrompt = null
  dayUi = { reorder: false, orderAll: false, inboxEdit: false, inboxAll: false }
  lastRunnerKey = ''
  stopSprintTicker()
  stopFinishReel()
  closeSheet()
  clearUndo()
  hideToast(true)
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

window.addEventListener('error', (event) => {
  if (!app || (app.textContent.trim() && currentView !== 'boot')) return
  app.innerHTML = `<main class="shell"><div class="notice error"><strong>battle angel could not open.</strong><br>${escapeHtml(event?.error?.message || event?.message || 'Refresh the app.')}</div></main>`
})

window.addEventListener('unhandledrejection', (event) => {
  if (!app || app.textContent.trim()) return
  const message = event?.reason?.message || String(event?.reason || 'Refresh the app.')
  app.innerHTML = `<main class="shell"><div class="notice error"><strong>battle angel could not open.</strong><br>${escapeHtml(message)}</div></main>`
})

boot()
