import { useCallback, useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FilePenLine,
  FilePlus2,
  FolderCog,
  FolderOpen,
  FolderPlus,
  Languages,
  LayoutGrid,
  ListTodo,
  MoonStar,
  NotebookText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Square,
  SquareStack,
  Trash2,
  Tv,
} from 'lucide-react'
import IconButton from './components/IconButton'
import Modal from './components/Modal'
import { DEFAULT_SETTINGS, GITHUB_REPO, SETTINGS_KEY, STORAGE_KEY } from './constants'
import { I18N } from './i18n'
import {
  compareVersions,
  createId,
  isTauriRuntime,
  loadProjectsLocal,
  loadSettingsLocal,
  normalizeProjects,
  normalizeSettings,
  normalizeVersionTag,
} from './utils/state'
import './App.css'
function App() {
  const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'

  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS })
  const [settingsDraft, setSettingsDraft] = useState({ ...DEFAULT_SETTINGS })
  const [loaded, setLoaded] = useState(false)

  const [activePage, setActivePage] = useState('projects')
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [createNoteOpen, setCreateNoteOpen] = useState(false)
  const [editNoteOpen, setEditNoteOpen] = useState(false)

  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [projectEditForm, setProjectEditForm] = useState({ name: '', description: '' })
  const [noteCreateForm, setNoteCreateForm] = useState({ title: '', body: '' })
  const [noteEditForm, setNoteEditForm] = useState(null)
  const [newProjectStep, setNewProjectStep] = useState('')
  const [updateInfo, setUpdateInfo] = useState({
    loading: false,
    error: '',
    hasUpdate: false,
    latestVersion: '',
    releaseUrl: '',
    downloadUrl: '',
  })
  const [toasts, setToasts] = useState([])
  const [didAutoUpdateCheck, setDidAutoUpdateCheck] = useState(false)

  const t = useMemo(() => {
    const table = I18N[settings.language] || I18N.ru
    return (key) => table[key] || I18N.ru[key] || key
  }, [settings.language])

  useEffect(() => {
    async function bootstrap() {
      try {
        if (isTauriRuntime()) {
          const state = await invoke('load_app_state')
          if (state && typeof state === 'object') {
            const loadedProjects = normalizeProjects(state.projects)
            const loadedSettings = normalizeSettings(state.settings)
            setProjects(loadedProjects)
            setSettings(loadedSettings)
            setSettingsDraft(loadedSettings)
            setSelectedProjectId(loadedProjects[0]?.id ?? null)

            await invoke('apply_window_settings', {
              windowMode: loadedSettings.windowMode,
              alwaysOnTop: loadedSettings.alwaysOnTop,
            })

            setLoaded(true)
            return
          }
        }
      } catch {
        // fallback below
      }

      const localProjects = loadProjectsLocal()
      const localSettings = loadSettingsLocal()
      setProjects(localProjects)
      setSettings(localSettings)
      setSettingsDraft(localSettings)
      setSelectedProjectId(localProjects[0]?.id ?? null)
      setLoaded(true)
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!loaded) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

    if (isTauriRuntime()) {
      invoke('save_app_state', {
        state: {
          projects,
          settings,
        },
      }).catch(() => {
        // localStorage is already updated as backup
      })
    }
  }, [projects, settings, loaded])

  useEffect(() => {
    if (loaded && !didAutoUpdateCheck) {
      setDidAutoUpdateCheck(true)
      checkForUpdates({ silent: true })
    }
  }, [loaded, didAutoUpdateCheck, checkForUpdates])

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null)
      return
    }

    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const progress = useMemo(() => {
    if (!selectedProject) return { done: 0, total: 0, value: 0 }
    const steps = selectedProject.steps || []
    const done = steps.filter((step) => step.done).length
    const total = steps.length
    return { done, total, value: total ? done / total : 0 }
  }, [selectedProject])

  function openCreateProjectModal() {
    setProjectForm({ name: '', description: '' })
    setCreateProjectOpen(true)
  }

  function openEditProjectModal() {
    if (!selectedProject) return
    setProjectEditForm({
      name: selectedProject.name,
      description: selectedProject.description,
    })
    setEditProjectOpen(true)
  }

  function openCreateNoteModal() {
    if (!selectedProject) return
    setNoteCreateForm({ title: '', body: '' })
    setCreateNoteOpen(true)
  }

  function openEditNoteModal(note) {
    setNoteEditForm({
      id: note.id,
      title: note.title,
      body: note.body,
    })
    setEditNoteOpen(true)
  }

  function openSettingsPage() {
    setSettingsDraft(settings)
    setActivePage('settings')
  }

  function pushToast(message, type = 'info') {
    const id = createId()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2600)
  }

  const checkForUpdates = useCallback(async (options = {}) => {
    const silent = !!options.silent
    if (!silent) {
      pushToast(t('updateCheckStarted'), 'info')
    }
    setUpdateInfo((prev) => ({
      ...prev,
      loading: true,
      error: '',
    }))

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) {
        throw new Error(`GitHub API ${response.status}`)
      }

      const release = await response.json()
      const latestVersion = normalizeVersionTag(release.tag_name || release.name || '')
      const currentVersion = normalizeVersionTag(APP_VERSION)
      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

      let downloadUrl = release.html_url || ''
      if (Array.isArray(release.assets) && release.assets.length > 0) {
        const preferred = release.assets.find((asset) =>
          String(asset.name || '').toLowerCase().includes('-setup.exe'),
        )
        downloadUrl = (preferred || release.assets[0]).browser_download_url || downloadUrl
      }

      setUpdateInfo({
        loading: false,
        error: '',
        hasUpdate,
        latestVersion,
        releaseUrl: release.html_url || '',
        downloadUrl,
      })
      if (!silent) {
        if (hasUpdate) {
          pushToast(`${t('updateAvailable')}: ${latestVersion}`, 'success')
        } else {
          pushToast(t('noUpdates'), 'success')
        }
      }
    } catch {
      setUpdateInfo((prev) => ({
        ...prev,
        loading: false,
        error: t('updateCheckError'),
      }))
      if (!silent) {
        pushToast(t('updateCheckError'), 'error')
      }
    }
  }, [APP_VERSION, t])

  async function openUpdateDownload() {
    const target = updateInfo.downloadUrl || updateInfo.releaseUrl
    if (!target) return
    try {
      if (isTauriRuntime()) {
        const { open } = await import('@tauri-apps/plugin-opener')
        await open(target)
      } else {
        window.open(target, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  }

  async function saveAllSettings() {
    const next = { ...settingsDraft }
    setSettings(next)

    if (isTauriRuntime()) {
      try {
        await invoke('apply_window_settings', {
          windowMode: next.windowMode,
          alwaysOnTop: next.alwaysOnTop,
        })
      } catch {
        // noop
      }
    }
    pushToast(t('settingsSaved'), 'success')
  }

  function saveNewProject() {
    const name = projectForm.name.trim()
    if (!name) return

    const project = {
      id: createId(),
      name,
      description: projectForm.description.trim(),
      notes: [],
      steps: [],
    }

    setProjects((prev) => [...prev, project])
    setSelectedProjectId(project.id)
    setCreateProjectOpen(false)
  }

  function saveProjectChanges() {
    if (!selectedProject) return
    const name = projectEditForm.name.trim()
    if (!name) return

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          name,
          description: projectEditForm.description.trim(),
        }
      }),
    )

    setEditProjectOpen(false)
  }

  function removeSelectedProject() {
    if (!selectedProject) return
    setProjects((prev) => prev.filter((project) => project.id !== selectedProject.id))
  }

  function saveNewNote() {
    if (!selectedProject) return
    const title = noteCreateForm.title.trim()
    if (!title) return

    const note = {
      id: createId(),
      title,
      body: noteCreateForm.body.trim(),
    }

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          notes: [...project.notes, note],
        }
      }),
    )

    setCreateNoteOpen(false)
  }

  function saveEditedNote() {
    if (!selectedProject || !noteEditForm) return
    const title = noteEditForm.title.trim()
    if (!title) return

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          notes: project.notes.map((note) => {
            if (note.id !== noteEditForm.id) return note
            return {
              ...note,
              title,
              body: noteEditForm.body.trim(),
            }
          }),
        }
      }),
    )

    setEditNoteOpen(false)
    setNoteEditForm(null)
  }

  function removeNote(noteId) {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          notes: project.notes.filter((note) => note.id !== noteId),
        }
      }),
    )
  }

  function addProjectStep() {
    if (!selectedProject) return
    const text = newProjectStep.trim()
    if (!text) return

    const step = {
      id: createId(),
      text,
      done: false,
    }

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          steps: [...project.steps, step],
        }
      }),
    )
    setNewProjectStep('')
  }

  function updateProjectStep(stepId, patch) {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          steps: project.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
        }
      }),
    )
  }

  function removeProjectStep(stepId) {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        return {
          ...project,
          steps: project.steps.filter((step) => step.id !== stepId),
        }
      }),
    )
  }

  function moveProjectStep(from, to) {
    if (!selectedProject) return
    if (to < 0 || to >= selectedProject.steps.length) return

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProject.id) return project
        const next = [...project.steps]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return {
          ...project,
          steps: next,
        }
      }),
    )
  }

  return (
    <div
      className="app-shell"
      data-theme={settings.theme}
      data-anim={settings.animations ? 'on' : 'off'}
    >
      <div className="backdrop wave-one" />
      <div className="backdrop wave-two" />
      <div className="noise" />

      <header className="topbar panel">
        <div className="title-block">
          <h1>
            <NotebookText size={24} />
            <span>{t('appTitle')}</span>
          </h1>
        </div>

        <div className={`toolbar ${!selectedProject ? 'toolbar-right' : ''}`}>
          <IconButton title={t('createProject')} icon={<FolderPlus size={18} />} onClick={openCreateProjectModal} />
          <IconButton title={t('editProject')} icon={<FolderCog size={18} />} onClick={openEditProjectModal} disabled={!selectedProject} />
          <IconButton title={t('deleteProject')} icon={<Trash2 size={18} />} onClick={removeSelectedProject} danger disabled={!selectedProject} />
          <IconButton title={t('createNote')} icon={<FilePlus2 size={18} />} onClick={openCreateNoteModal} disabled={!selectedProject} />
          <IconButton title={t('settings')} icon={<Settings size={18} />} onClick={openSettingsPage} />
          {updateInfo.hasUpdate ? <span className="update-nav-flag">({t('updateAvailableNav')})</span> : null}
          <IconButton title={t('projects')} icon={<LayoutGrid size={18} />} onClick={() => setActivePage('projects')} />
        </div>

        {selectedProject ? (
          <div className="progress-wrap">
            <div className="progress-top">
              <span>
                <ListTodo size={14} />
                <span>{t('progressShort')} ({selectedProject.name})</span>
              </span>
              <strong>
                {progress.done}/{progress.total}
              </strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress.value * 100}%` }} />
            </div>
          </div>
        ) : null}
      </header>

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : null}
            {toast.type === 'error' ? <AlertCircle size={15} /> : null}
            {toast.type === 'info' ? <RefreshCw size={15} /> : null}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {activePage === 'settings' ? (
        <main className="panel settings-page">
          <h2>
            <Settings size={20} />
            <span>{t('settingsTitle')}</span>
          </h2>
          <section className="setting-card">
            <h3>
              <MoonStar size={17} />
              <span>{t('appearance')}</span>
            </h3>
            <div className="setting-actions">
              <button className={`mode-btn ${settingsDraft.theme === 'midnight' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, theme: 'midnight' }))}>
                <SquareStack size={15} />
                <span>Midnight</span>
              </button>
              <button className={`mode-btn ${settingsDraft.theme === 'deep' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, theme: 'deep' }))}>
                <Square size={15} />
                <span>Deep Dark</span>
              </button>
              <button className={`mode-btn ${settingsDraft.animations ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, animations: !prev.animations }))}>
                <Tv size={15} />
                <span>{settingsDraft.animations ? t('animationsOn') : t('animationsOff')}</span>
              </button>
            </div>
          </section>

          <section className="setting-card">
            <h3>
              <FolderOpen size={17} />
              <span>{t('windowMode')}</span>
            </h3>
            <div className="setting-actions">
              <button className={`mode-btn ${settingsDraft.windowMode === 'fullscreen_framed' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, windowMode: 'fullscreen_framed' }))}>
                <Tv size={15} />
                <span>{t('fullscreenFramed')}</span>
              </button>
              <button className={`mode-btn ${settingsDraft.windowMode === 'fullscreen_borderless' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, windowMode: 'fullscreen_borderless' }))}>
                <SquareStack size={15} />
                <span>{t('fullscreenBorderless')}</span>
              </button>
              <button className={`mode-btn ${settingsDraft.windowMode === 'windowed' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, windowMode: 'windowed' }))}>
                <Square size={15} />
                <span>{t('windowed')}</span>
              </button>
              <button className={`mode-btn ${settingsDraft.windowMode === 'borderless' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, windowMode: 'borderless' }))}>
                <SquareStack size={15} />
                <span>{t('borderless')}</span>
              </button>
              <button className={`mode-btn ${settingsDraft.alwaysOnTop ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, alwaysOnTop: !prev.alwaysOnTop }))}>
                <Check size={15} />
                <span>{settingsDraft.alwaysOnTop ? t('alwaysOnTopYes') : t('alwaysOnTopNo')}</span>
              </button>
            </div>
          </section>

          <section className="setting-card">
            <h3>
              <Languages size={17} />
              <span>{t('language')}</span>
            </h3>
            <div className="setting-actions">
              <button className={`mode-btn ${settingsDraft.language === 'ru' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, language: 'ru' }))}>{t('langRu')}</button>
              <button className={`mode-btn ${settingsDraft.language === 'en' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, language: 'en' }))}>{t('langEn')}</button>
              <button className={`mode-btn ${settingsDraft.language === 'uk' ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, language: 'uk' }))}>{t('langUk')}</button>
            </div>
          </section>

          <section className="setting-card">
            <h3>
              <Download size={17} />
              <span>{t('updates')}</span>
            </h3>
            <div className="setting-actions">
              <button className="wide-btn" onClick={checkForUpdates} disabled={updateInfo.loading}>
                <RefreshCw size={16} />
                <span>{updateInfo.loading ? t('checking') : t('checkUpdates')}</span>
              </button>
              {updateInfo.hasUpdate ? (
                <button className="wide-btn" onClick={openUpdateDownload}>
                  <ExternalLink size={16} />
                  <span>{t('downloadUpdate')}</span>
                </button>
              ) : null}
            </div>
            <div className="version-line">
              {updateInfo.error
                ? updateInfo.error
                : updateInfo.latestVersion
                  ? `${t('latestVersion')}: ${updateInfo.latestVersion} - ${
                      updateInfo.hasUpdate ? t('updateAvailable') : t('noUpdates')
                    }`
                  : ''}
            </div>
          </section>

          <div className="settings-version-inline">
            {t('version')}: {APP_VERSION}
          </div>

          <div className="settings-save-row">
            <button className="wide-btn" onClick={saveAllSettings}>
              <Save size={16} />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </main>
      ) : (
        <div className="layout">
          <aside className="panel sidebar">
            <h2>
              <FolderOpen size={19} />
              <span>{t('projects')}</span>
            </h2>
            <div className="project-list">
              {projects.map((project, index) => (
                <button key={project.id} className={`project-item ${selectedProjectId === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)} style={{ animationDelay: `${index * 40}ms` }}>
                  <span className="project-name wrap-anywhere">{project.name}</span>
                  <span className="project-count">
                    <NotebookText size={12} />
                    <span>{project.notes.length} {t('noteCount')}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="panel content">
            {!selectedProject ? (
              <section className="empty-state">
                <h2>{t('chooseProject')}</h2>
                <p>{t('clickCreate')}</p>
              </section>
            ) : (
              <section className="notes-section">
                <div className="notes-head">
                  <h2>
                    <FolderOpen size={20} />
                    <span className="wrap-anywhere">{selectedProject.name}</span>
                  </h2>
                  {selectedProject.description ? <p className="project-description wrap-anywhere">{selectedProject.description}</p> : null}
                </div>

                <h3 className="section-title">
                  <NotebookText size={18} />
                  <span>{t('projectNotes')}</span>
                </h3>

                {selectedProject.notes.length === 0 ? (
                  <p className="empty-notes">{t('noNotes')}</p>
                ) : (
                  <div className="notes-grid">
                    {selectedProject.notes.map((note, index) => (
                      <article key={note.id} className="note-card" style={{ animationDelay: `${index * 60}ms` }}>
                        <div className="note-header">
                          <h3>
                            <FilePenLine size={15} />
                            <span className="wrap-anywhere">{note.title}</span>
                          </h3>
                          <div className="note-actions">
                            <IconButton title={t('editNote')} icon={<Pencil size={16} />} onClick={() => openEditNoteModal(note)} />
                            <IconButton title={t('deleteNote')} icon={<Trash2 size={16} />} onClick={() => removeNote(note.id)} danger />
                          </div>
                        </div>

                        {note.body ? <p className="note-body wrap-anywhere">{note.body}</p> : null}
                      </article>
                    ))}
                  </div>
                )}

                <h3 className="section-title">
                  <ListTodo size={18} />
                  <span>{t('projectSteps')}</span>
                </h3>

                <div className="project-steps">
                  {(selectedProject.steps || []).map((step, index) => (
                    <div className="step-row" key={step.id}>
                      <input type="checkbox" checked={step.done} onChange={(event) => updateProjectStep(step.id, { done: event.target.checked })} />
                      <input className={step.done ? 'done' : ''} value={step.text} onChange={(event) => updateProjectStep(step.id, { text: event.target.value })} />
                      <button className="mini-btn" onClick={() => moveProjectStep(index, index - 1)} disabled={index === 0} title={t('up')}>↑</button>
                      <button className="mini-btn" onClick={() => moveProjectStep(index, index + 1)} disabled={index === selectedProject.steps.length - 1} title={t('down')}>↓</button>
                      <button className="mini-btn danger" onClick={() => removeProjectStep(step.id)} title={t('deleteStep')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="step-create-row">
                    <input value={newProjectStep} onChange={(event) => setNewProjectStep(event.target.value)} placeholder={t('newProjectStep')} />
                    <button className="wide-btn" onClick={addProjectStep}>
                      <Plus size={15} />
                      <span>{t('addStep')}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      {createProjectOpen ? (
        <Modal title={t('newProjectModal')} icon={<FolderPlus size={17} />} closeText={t('close')} onClose={() => setCreateProjectOpen(false)}>
          <div className="modal-body">
            <label>
              {t('titleField')}
              <input value={projectForm.name} onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              {t('descriptionField')}
              <textarea rows={3} value={projectForm.description} onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="wide-btn" onClick={saveNewProject}>
              <Plus size={16} />
              <span>{t('add')}</span>
            </button>
          </div>
        </Modal>
      ) : null}

      {editProjectOpen && selectedProject ? (
        <Modal title={t('projectEditorModal')} icon={<FolderCog size={17} />} closeText={t('close')} onClose={() => setEditProjectOpen(false)}>
          <div className="modal-body">
            <label>
              {t('titleField')}
              <input value={projectEditForm.name} onChange={(event) => setProjectEditForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              {t('descriptionField')}
              <textarea rows={3} value={projectEditForm.description} onChange={(event) => setProjectEditForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="wide-btn" onClick={saveProjectChanges}>
              <Save size={16} />
              <span>{t('save')}</span>
            </button>
          </div>
        </Modal>
      ) : null}

      {createNoteOpen ? (
        <Modal title={t('newNoteModal')} icon={<FilePlus2 size={17} />} closeText={t('close')} onClose={() => setCreateNoteOpen(false)}>
          <div className="modal-body">
            <label>
              {t('noteTitleField')}
              <input value={noteCreateForm.title} onChange={(event) => setNoteCreateForm((prev) => ({ ...prev, title: event.target.value }))} />
            </label>
            <label>
              {t('noteTextField')}
              <textarea rows={4} value={noteCreateForm.body} onChange={(event) => setNoteCreateForm((prev) => ({ ...prev, body: event.target.value }))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="wide-btn" onClick={saveNewNote}>
              <FilePlus2 size={16} />
              <span>{t('add')}</span>
            </button>
          </div>
        </Modal>
      ) : null}

      {editNoteOpen && noteEditForm ? (
        <Modal title={t('editNoteModal')} icon={<Pencil size={17} />} closeText={t('close')} onClose={() => setEditNoteOpen(false)}>
          <div className="modal-body">
            <label>
              {t('noteTitleField')}
              <input value={noteEditForm.title} onChange={(event) => setNoteEditForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))} />
            </label>
            <label>
              {t('noteTextField')}
              <textarea rows={4} value={noteEditForm.body} onChange={(event) => setNoteEditForm((prev) => (prev ? { ...prev, body: event.target.value } : prev))} />
            </label>
          </div>
          <div className="modal-actions">
            <button className="wide-btn" onClick={saveEditedNote}>
              <Check size={16} />
              <span>{t('apply')}</span>
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default App

