import { useEffect, useMemo, useState } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import {
  Check,
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
  Save,
  Settings,
  Square,
  SquareStack,
  Trash2,
  Tv,
  X,
} from 'lucide-react'
import './App.css'

const STORAGE_KEY = 'proekty-zametki-v3'
const SETTINGS_KEY = 'proekty-zametki-settings-v1'
const DEFAULT_SETTINGS = {
  theme: 'midnight',
  animations: true,
  windowMode: 'fullscreen_framed',
  alwaysOnTop: false,
  language: 'ru',
}

const I18N = {
  ru: {
    appTitle: 'Студия проектов и заметок',
    createProject: 'Создать проект',
    editProject: 'Редактировать проект',
    deleteProject: 'Удалить проект',
    createNote: 'Создать заметку',
    settings: 'Настройки',
    projects: 'Проекты',
    progressLabel: 'Прогресс шагов проекта',
    chooseProject: 'Выберите или создайте проект',
    clickCreate: 'Нажмите на иконку папки с плюсом вверху.',
    projectNotes: 'Заметки проекта',
    noNotes: 'В проекте пока нет заметок.',
    projectSteps: 'Шаги проекта',
    newProjectStep: 'Новый шаг проекта',
    addStep: 'Добавить шаг',
    noteCount: 'заметок',
    editNote: 'Редактировать заметку',
    deleteNote: 'Удалить заметку',
    up: 'Выше',
    down: 'Ниже',
    deleteStep: 'Удалить шаг',
    settingsTitle: 'Настройки приложения',
    appearance: 'Вид интерфейса',
    windowMode: 'Режим окна',
    language: 'Язык',
    fullscreenFramed: 'Полный экран (с рамками)',
    fullscreenBorderless: 'Полный экран (без рамок)',
    windowed: 'Оконный',
    borderless: 'Без рамок',
    version: 'Версия приложения',
    alwaysOnTopYes: 'Поверх окон: Да',
    alwaysOnTopNo: 'Поверх окон: Нет',
    animationsOn: 'Анимации: Вкл',
    animationsOff: 'Анимации: Выкл',
    saveSettings: 'Сохранить настройки',
    newProjectModal: 'Новый проект',
    projectEditorModal: 'Редактор проекта',
    newNoteModal: 'Новая заметка',
    editNoteModal: 'Редактирование заметки',
    titleField: 'Название',
    descriptionField: 'Описание',
    noteTitleField: 'Заголовок',
    noteTextField: 'Текст',
    apply: 'Применить',
    save: 'Сохранить',
    add: 'Добавить',
    close: 'Закрыть',
    langRu: 'Русский',
    langEn: 'English',
    langUk: 'Українська',
  },
  en: {
    appTitle: 'Project Notes Studio',
    createProject: 'Create project',
    editProject: 'Edit project',
    deleteProject: 'Delete project',
    createNote: 'Create note',
    settings: 'Settings',
    projects: 'Projects',
    progressLabel: 'Project steps progress',
    chooseProject: 'Select or create a project',
    clickCreate: 'Click the folder-plus icon at the top.',
    projectNotes: 'Project notes',
    noNotes: 'No notes in this project yet.',
    projectSteps: 'Project steps',
    newProjectStep: 'New project step',
    addStep: 'Add step',
    noteCount: 'notes',
    editNote: 'Edit note',
    deleteNote: 'Delete note',
    up: 'Up',
    down: 'Down',
    deleteStep: 'Delete step',
    settingsTitle: 'Application settings',
    appearance: 'Appearance',
    windowMode: 'Window mode',
    language: 'Language',
    fullscreenFramed: 'Fullscreen (framed)',
    fullscreenBorderless: 'Fullscreen (borderless)',
    windowed: 'Windowed',
    borderless: 'Borderless',
    version: 'Application version',
    alwaysOnTopYes: 'Always on top: Yes',
    alwaysOnTopNo: 'Always on top: No',
    animationsOn: 'Animations: On',
    animationsOff: 'Animations: Off',
    saveSettings: 'Save settings',
    newProjectModal: 'New project',
    projectEditorModal: 'Project editor',
    newNoteModal: 'New note',
    editNoteModal: 'Edit note',
    titleField: 'Title',
    descriptionField: 'Description',
    noteTitleField: 'Title',
    noteTextField: 'Text',
    apply: 'Apply',
    save: 'Save',
    add: 'Add',
    close: 'Close',
    langRu: 'Русский',
    langEn: 'English',
    langUk: 'Українська',
  },
  uk: {
    appTitle: 'Студія проєктів і нотаток',
    createProject: 'Створити проєкт',
    editProject: 'Редагувати проєкт',
    deleteProject: 'Видалити проєкт',
    createNote: 'Створити нотатку',
    settings: 'Налаштування',
    projects: 'Проєкти',
    progressLabel: 'Прогрес кроків проєкту',
    chooseProject: 'Оберіть або створіть проєкт',
    clickCreate: 'Натисніть іконку папки з плюсом угорі.',
    projectNotes: 'Нотатки проєкту',
    noNotes: 'У цьому проєкті поки немає нотаток.',
    projectSteps: 'Кроки проєкту',
    newProjectStep: 'Новий крок проєкту',
    addStep: 'Додати крок',
    noteCount: 'нотаток',
    editNote: 'Редагувати нотатку',
    deleteNote: 'Видалити нотатку',
    up: 'Вище',
    down: 'Нижче',
    deleteStep: 'Видалити крок',
    settingsTitle: 'Налаштування застосунку',
    appearance: 'Вигляд інтерфейсу',
    windowMode: 'Режим вікна',
    language: 'Мова',
    fullscreenFramed: 'Повний екран (з рамками)',
    fullscreenBorderless: 'Повний екран (без рамок)',
    windowed: 'Віконний',
    borderless: 'Без рамок',
    version: 'Версія застосунку',
    alwaysOnTopYes: 'Поверх вікон: Так',
    alwaysOnTopNo: 'Поверх вікон: Ні',
    animationsOn: 'Анімації: Увімк',
    animationsOff: 'Анімації: Вимк',
    saveSettings: 'Зберегти налаштування',
    newProjectModal: 'Новий проєкт',
    projectEditorModal: 'Редактор проєкту',
    newNoteModal: 'Нова нотатка',
    editNoteModal: 'Редагування нотатки',
    titleField: 'Назва',
    descriptionField: 'Опис',
    noteTitleField: 'Заголовок',
    noteTextField: 'Текст',
    apply: 'Застосувати',
    save: 'Зберегти',
    add: 'Додати',
    close: 'Закрити',
    langRu: 'Русский',
    langEn: 'English',
    langUk: 'Українська',
  },
}

function createId() {
  return crypto.randomUUID()
}

function normalizeProjects(source) {
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
      notes,
      steps,
    }
  })
}

function normalizeSettings(source) {
  const windowMode = source?.windowMode
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
    theme: source?.theme === 'deep' ? 'deep' : 'midnight',
    animations: source?.animations !== false,
    windowMode: normalizedWindowMode,
    alwaysOnTop: !!source?.alwaysOnTop,
    language: source?.language === 'en' || source?.language === 'uk' ? source.language : 'ru',
  }
}

function loadProjectsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeProjects(JSON.parse(raw))
  } catch {
    return []
  }
}

function loadSettingsLocal() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function isTauriRuntime() {
  return isTauri()
}

function Modal({ title, icon, closeText, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>
            {icon}
            <span>{title}</span>
          </h3>
          <button className="icon-btn" onClick={onClose} title={closeText} aria-label={closeText}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function IconButton({ title, icon, onClick, danger = false, disabled = false }) {
  return (
    <button
      className={`icon-btn ${danger ? 'danger' : ''}`}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  )
}

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

        <div className="toolbar">
          <IconButton title={t('createProject')} icon={<FolderPlus size={18} />} onClick={openCreateProjectModal} />
          <IconButton title={t('editProject')} icon={<FolderCog size={18} />} onClick={openEditProjectModal} disabled={!selectedProject} />
          <IconButton title={t('deleteProject')} icon={<Trash2 size={18} />} onClick={removeSelectedProject} danger disabled={!selectedProject} />
          <IconButton title={t('createNote')} icon={<FilePlus2 size={18} />} onClick={openCreateNoteModal} disabled={!selectedProject} />
          <IconButton title={t('settings')} icon={<Settings size={18} />} onClick={openSettingsPage} />
          <IconButton title={t('projects')} icon={<LayoutGrid size={18} />} onClick={() => setActivePage('projects')} />
        </div>

        {selectedProject ? (
          <div className="progress-wrap">
            <div className="progress-top">
              <span>
                <ListTodo size={14} />
                <span>{t('progressLabel')}</span>
              </span>
              <strong>
                {progress.done}/{progress.total}
              </strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress.value * 100}%` }} />
            </div>
          </div>
        ) : (
          <div />
        )}
      </header>

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
              <NotebookText size={17} />
              <span>{t('version')}</span>
            </h3>
            <div className="version-line">{APP_VERSION}</div>
          </section>

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
                  <span className="project-name">{project.name}</span>
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
                    <span>{selectedProject.name}</span>
                  </h2>
                  {selectedProject.description ? <p>{selectedProject.description}</p> : null}
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
                            <span>{note.title}</span>
                          </h3>
                          <div className="note-actions">
                            <IconButton title={t('editNote')} icon={<Pencil size={16} />} onClick={() => openEditNoteModal(note)} />
                            <IconButton title={t('deleteNote')} icon={<Trash2 size={16} />} onClick={() => removeNote(note.id)} danger />
                          </div>
                        </div>

                        {note.body ? <p className="note-body">{note.body}</p> : null}
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
