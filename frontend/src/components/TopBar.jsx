import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  FolderCog,
  FolderPlus,
  LayoutGrid,
  ListTodo,
  NotebookText,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react'
import IconButton from './IconButton'

function TopBar({
  t,
  selectedProject,
  progress,
  isContextualControls,
  updateInfo,
  openCreateProjectModal,
  openEditProjectModal,
  removeSelectedProject,
  openCreateNoteModal,
  openSettingsPage,
  onOpenProjects,
  toasts,
}) {
  return (
    <>
      <header className="topbar panel">
        <div className="title-block">
          <h1>
            <NotebookText size={24} />
            <span>{t('appTitle')}</span>
          </h1>
        </div>

        <div className={`toolbar ${!selectedProject ? 'toolbar-right' : ''}`}>
          {!isContextualControls ? (
            <>
              <IconButton title={t('createProject')} icon={<FolderPlus size={18} />} onClick={openCreateProjectModal} />
              <IconButton title={t('editProject')} icon={<FolderCog size={18} />} onClick={openEditProjectModal} disabled={!selectedProject} />
              <IconButton title={t('deleteProject')} icon={<Trash2 size={18} />} onClick={removeSelectedProject} danger disabled={!selectedProject} />
              <IconButton title={t('createNote')} icon={<FilePlus2 size={18} />} onClick={openCreateNoteModal} disabled={!selectedProject} />
            </>
          ) : null}
          <IconButton title={t('settings')} icon={<Settings size={18} />} onClick={openSettingsPage} />
          {updateInfo.hasUpdate ? <span className="update-nav-flag">({t('updateAvailableNav')})</span> : null}
          <IconButton title={t('projects')} icon={<LayoutGrid size={18} />} onClick={onOpenProjects} />
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
    </>
  )
}

export default TopBar
