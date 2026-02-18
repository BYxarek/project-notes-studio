import { isTauri } from '@tauri-apps/api/core'
import { DEFAULT_SETTINGS, SETTINGS_KEY, STORAGE_KEY } from '../constants'

export function createId() {
  return crypto.randomUUID()
}

export function normalizeProjects(source) {
  if (!Array.isArray(source)) return []

  return source.map((project) => {
    const notes = Array.isArray(project.notes)
      ? project.notes.map((note) => ({
          id: note.id || createId(),
          title: note.title || 'No title',
          body: note.body || '',
        }))
      : []

    let steps = Array.isArray(project.steps)
      ? project.steps.map((step) => ({
          id: step.id || createId(),
          text: step.text || '',
          done: !!step.done,
        }))
      : []

    if (!steps.length && Array.isArray(project.notes)) {
      steps = project.notes
        .flatMap((note) => {
          if (!Array.isArray(note.steps)) return []
          return note.steps.map((step) => ({
            id: step.id || createId(),
            text: step.text || '',
            done: !!step.done,
          }))
        })
        .filter((step) => step.text.trim().length > 0)
    }

    return {
      id: project.id || createId(),
      name: project.name || 'Project',
      description: project.description || '',
      status: typeof project.status === 'string' ? project.status.trim() : '',
      pinned: !!project.pinned,
      notes,
      steps,
    }
  })
}

export function normalizeSettings(source) {
  const windowMode = source?.windowMode
  const controlsLayout = source?.controlsLayout === 'contextual' ? 'contextual' : 'topbar'
  const statusesEnabled = source?.statusesEnabled !== false
  const hasCustomStatuses = Array.isArray(source?.projectStatuses)
  const projectStatuses = hasCustomStatuses
    ? [...new Set(source.projectStatuses.map((value) => String(value || '').trim()).filter(Boolean))]
    : [...DEFAULT_SETTINGS.projectStatuses]
  const normalizedWindowMode =
    windowMode === 'windowed' ||
    windowMode === 'borderless' ||
    windowMode === 'fullscreen_borderless' ||
    windowMode === 'fullscreen_framed'
      ? windowMode
      : windowMode === 'fullscreen'
        ? 'fullscreen_framed'
        : 'fullscreen_framed'

  return {
    theme: 'midnight',
    animations: source?.animations !== false,
    controlsLayout,
    statusesEnabled,
    projectStatuses: hasCustomStatuses ? projectStatuses : [...DEFAULT_SETTINGS.projectStatuses],
    windowMode: normalizedWindowMode,
    alwaysOnTop: !!source?.alwaysOnTop,
    language: source?.language === 'en' || source?.language === 'uk' ? source.language : 'ru',
  }
}

export function loadProjectsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeProjects(JSON.parse(raw))
  } catch {
    return []
  }
}

export function loadSettingsLocal() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function isTauriRuntime() {
  return isTauri()
}

export function normalizeVersionTag(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
}

export function compareVersions(a, b) {
  const pa = normalizeVersionTag(a)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
  const pb = normalizeVersionTag(b)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i += 1) {
    const va = pa[i] || 0
    const vb = pb[i] || 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}
