import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Check, FilePlus2, FolderCog, FolderPlus, Pencil, Plus, Save } from 'lucide-react'
import Modal from './components/Modal'
import ProjectsPage from './components/ProjectsPage'
import SettingsPage from './components/SettingsPage'
import TopBar from './components/TopBar'
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
  const appVersion = import.meta.env.VITE_APP_VERSION || 'dev'
  const importFileRef = useRef(null)

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
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: '' })
  const [projectEditForm, setProjectEditForm] = useState({ name: '', description: '', status: '' })
  const [noteCreateForm, setNoteCreateForm] = useState({ title: '', body: '' })
  const [noteEditForm, setNoteEditForm] = useState(null)
  const [newProjectStep, setNewProjectStep] = useState('')
  const [showStepCreate, setShowStepCreate] = useState(false)
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

  const isContextualControls = settings.controlsLayout === 'contextual'
  const statusesEnabled = settings.statusesEnabled
  const defaultProjectStatus = settings.projectStatuses[0] || ''

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      return String(a.name || '').localeCompare(String(b.name || ''), settings.language)
    })
  }, [projects, settings.language])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const selectedProjectStatusOptions = useMemo(() => {
    const base = Array.isArray(settings.projectStatuses) ? settings.projectStatuses : []
    if (!selectedProject?.status || base.includes(selectedProject.status)) return base
    return [...base, selectedProject.status]
  }, [settings.projectStatuses, selectedProject])

  const progress = useMemo(() => {
    if (!selectedProject) return { done: 0, total: 0, value: 0 }
    const steps = selectedProject.steps || []
    const done = steps.filter((step) => step.done).length
    const total = steps.length
    return { done, total, value: total ? done / total : 0 }
  }, [selectedProject])

  function pushToast(message, type = 'info') {
    const id = createId()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2600)
  }

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
            await invoke('apply_window_settings', { payload: { windowMode: loadedSettings.windowMode, alwaysOnTop: loadedSettings.alwaysOnTop } })
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
    const saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      if (isTauriRuntime()) {
        invoke('save_app_state', { state: { projects, settings } }).catch(() => {
          // localStorage is already updated as backup
        })
      }
    }, 500)

    return () => clearTimeout(saveTimer)
  }, [projects, settings, loaded])

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null)
      return
    }
    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(sortedProjects[0].id)
    }
  }, [projects, sortedProjects, selectedProjectId])

  useEffect(() => {
    setShowStepCreate(false)
  }, [selectedProjectId])

  const checkForUpdates = useCallback(async (options = {}) => {
    const silent = !!options.silent
    if (!silent) pushToast(t('updateCheckStarted'), 'info')
    setUpdateInfo((prev) => ({ ...prev, loading: true, error: '' }))

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) throw new Error(`GitHub API ${response.status}`)

      const release = await response.json()
      const latestVersion = normalizeVersionTag(release.tag_name || release.name || '')
      const currentVersion = normalizeVersionTag(appVersion)
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
        pushToast(hasUpdate ? `${t('updateAvailable')}: ${latestVersion}` : t('noUpdates'), 'success')
      }
    } catch {
      setUpdateInfo((prev) => ({ ...prev, loading: false, error: t('updateCheckError') }))
      if (!silent) pushToast(t('updateCheckError'), 'error')
    }
  }, [appVersion, t])

  useEffect(() => {
    if (loaded && !didAutoUpdateCheck) {
      setDidAutoUpdateCheck(true)
      checkForUpdates({ silent: true })
    }
  }, [loaded, didAutoUpdateCheck, checkForUpdates])

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
    const next = normalizeSettings({ ...settingsDraft })
    setSettings(next)
    setSettingsDraft(next)
    if (isTauriRuntime()) {
      try {
        await invoke('apply_window_settings', { payload: { windowMode: next.windowMode, alwaysOnTop: next.alwaysOnTop } })
      } catch {
        // noop
      }
    }
    pushToast(t('settingsSaved'), 'success')
  }

  function openCreateProjectModal() {
    setProjectForm({ name: '', description: '', status: defaultProjectStatus })
    setCreateProjectOpen(true)
  }

  function openEditProjectModal() {
    if (!selectedProject) return
    setProjectEditForm({
      name: selectedProject.name,
      description: selectedProject.description,
      status: selectedProject.status || defaultProjectStatus,
    })
    setEditProjectOpen(true)
  }

  function openCreateNoteModal() {
    if (!selectedProject) return
    setNoteCreateForm({ title: '', body: '' })
    setCreateNoteOpen(true)
  }

  function openEditNoteModal(note) {
    setNoteEditForm({ id: note.id, title: note.title, body: note.body })
    setEditNoteOpen(true)
  }

  function openSettingsPage() {
    setSettingsDraft(settings)
    setActivePage('settings')
  }

  function saveNewProject() {
    const name = projectForm.name.trim()
    if (!name) return
    const project = {
      id: createId(),
      name,
      description: projectForm.description.trim(),
      status: statusesEnabled ? String(projectForm.status || '').trim() : '',
      pinned: false,
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
      prev.map((project) =>
        project.id !== selectedProject.id
          ? project
          : {
              ...project,
              name,
              description: projectEditForm.description.trim(),
              status: statusesEnabled ? String(projectEditForm.status || '').trim() : project.status,
            }),
    )
    setEditProjectOpen(false)
  }

  function removeSelectedProject() {
    if (!selectedProject) return
    setProjects((prev) => prev.filter((project) => project.id !== selectedProject.id))
  }

  function updateSelectedProjectStatus(status) {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== selectedProject.id ? project : { ...project, status: String(status || '').trim() }),
    )
  }

  function toggleSelectedProjectPinned() {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== selectedProject.id ? project : { ...project, pinned: !project.pinned }),
    )
  }

  function exportSelectedProject() {
    if (!selectedProject) return
    const payload = {
      format: 'project-notes-studio-project',
      version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        name: selectedProject.name,
        description: selectedProject.description,
        status: selectedProject.status || '',
        pinned: !!selectedProject.pinned,
        notes: selectedProject.notes || [],
        steps: selectedProject.steps || [],
      },
    }

    const safeName = String(selectedProject.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё_-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'project'

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}.pns-project.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    pushToast(t('projectExported'), 'success')
  }

  function askImportProject() {
    importFileRef.current?.click()
  }

  async function onProjectFilePicked(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const sourceProject = parsed?.project ?? parsed
      const normalized = normalizeProjects([sourceProject])[0]
      if (!normalized) throw new Error('invalid payload')

      const importedProject = {
        ...normalized,
        id: createId(),
        notes: (normalized.notes || []).map((note) => ({ ...note, id: createId() })),
        steps: (normalized.steps || []).map((step) => ({ ...step, id: createId() })),
      }

      setProjects((prev) => [...prev, importedProject])
      setSelectedProjectId(importedProject.id)
      setActivePage('projects')
      pushToast(t('projectImported'), 'success')
    } catch {
      pushToast(t('projectImportError'), 'error')
    }
  }

  function saveNewNote() {
    if (!selectedProject) return
    const title = noteCreateForm.title.trim()
    if (!title) return
    const note = { id: createId(), title, body: noteCreateForm.body.trim() }
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== selectedProject.id ? project : { ...project, notes: [...project.notes, note] }),
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
          notes: project.notes.map((note) =>
            note.id !== noteEditForm.id ? note : { ...note, title, body: noteEditForm.body.trim() }),
        }
      }),
    )
    setEditNoteOpen(false)
    setNoteEditForm(null)
  }

  function removeNote(noteId) {
    if (!selectedProject) return
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== selectedProject.id
          ? project
          : { ...project, notes: project.notes.filter((note) => note.id !== noteId) }),
    )
  }

  function addProjectStep() {
    if (!selectedProject) return
    const text = newProjectStep.trim()
    if (!text) return
    const step = { id: createId(), text, done: false }
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== selectedProject.id ? project : { ...project, steps: [...project.steps, step] }),
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
      prev.map((project) =>
        project.id !== selectedProject.id
          ? project
          : { ...project, steps: project.steps.filter((step) => step.id !== stepId) }),
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
        return { ...project, steps: next }
      }),
    )
  }

  return (
    <div className="app-shell" data-anim={settings.animations ? 'on' : 'off'}>
      <div className="backdrop wave-one" />
      <div className="backdrop wave-two" />
      <div className="noise" />

      <TopBar
        t={t}
        selectedProject={selectedProject}
        progress={progress}
        isContextualControls={isContextualControls}
        updateInfo={updateInfo}
        openCreateProjectModal={openCreateProjectModal}
        openEditProjectModal={openEditProjectModal}
        removeSelectedProject={removeSelectedProject}
        openCreateNoteModal={openCreateNoteModal}
        openSettingsPage={openSettingsPage}
        onOpenProjects={() => setActivePage('projects')}
        toasts={toasts}
      />

      {activePage === 'settings' ? (
        <SettingsPage
          t={t}
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          updateInfo={updateInfo}
          checkForUpdates={checkForUpdates}
          openUpdateDownload={openUpdateDownload}
          appVersion={appVersion}
          saveAllSettings={saveAllSettings}
        />
      ) : (
        <ProjectsPage
          t={t}
          isContextualControls={isContextualControls}
          statusesEnabled={statusesEnabled}
          statusOptions={selectedProjectStatusOptions}
          projects={sortedProjects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          selectedProject={selectedProject}
          openCreateProjectModal={openCreateProjectModal}
          openEditProjectModal={openEditProjectModal}
          removeSelectedProject={removeSelectedProject}
          toggleSelectedProjectPinned={toggleSelectedProjectPinned}
          updateSelectedProjectStatus={updateSelectedProjectStatus}
          exportSelectedProject={exportSelectedProject}
          askImportProject={askImportProject}
          openCreateNoteModal={openCreateNoteModal}
          openEditNoteModal={openEditNoteModal}
          removeNote={removeNote}
          updateProjectStep={updateProjectStep}
          moveProjectStep={moveProjectStep}
          removeProjectStep={removeProjectStep}
          showStepCreate={showStepCreate}
          setShowStepCreate={setShowStepCreate}
          newProjectStep={newProjectStep}
          setNewProjectStep={setNewProjectStep}
          addProjectStep={addProjectStep}
        />
      )}

      <input
        ref={importFileRef}
        type="file"
        accept="application/json,.json,.pns-project.json"
        className="hidden-file-input"
        onChange={onProjectFilePicked}
      />

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
            {statusesEnabled && settings.projectStatuses.length > 0 ? (
              <label>
                {t('projectStatus')}
                <select value={projectForm.status} onChange={(event) => setProjectForm((prev) => ({ ...prev, status: event.target.value }))}>
                  {settings.projectStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            ) : null}
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
            {statusesEnabled && selectedProjectStatusOptions.length > 0 ? (
              <label>
                {t('projectStatus')}
                <select value={projectEditForm.status} onChange={(event) => setProjectEditForm((prev) => ({ ...prev, status: event.target.value }))}>
                  {selectedProjectStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            ) : null}
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
