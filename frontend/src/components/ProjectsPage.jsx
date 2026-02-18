import {
  FilePenLine,
  FilePlus2,
  FolderCog,
  FolderOpen,
  FolderPlus,
  ListTodo,
  NotebookText,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import IconButton from './IconButton'

function ProjectsPage({
  t,
  isContextualControls,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedProject,
  openCreateProjectModal,
  openEditProjectModal,
  removeSelectedProject,
  openCreateNoteModal,
  openEditNoteModal,
  removeNote,
  updateProjectStep,
  moveProjectStep,
  removeProjectStep,
  showStepCreate,
  setShowStepCreate,
  newProjectStep,
  setNewProjectStep,
  addProjectStep,
}) {
  return (
    <div className="layout">
      <aside className="panel sidebar">
        <div className="section-head">
          <h2>
            <FolderOpen size={19} />
            <span>{t('projects')}</span>
          </h2>
          {isContextualControls ? (
            <IconButton title={t('createProject')} icon={<FolderPlus size={18} />} onClick={openCreateProjectModal} />
          ) : null}
        </div>
        <div className="project-list">
          {projects.map((project, index) => (
            <button key={project.id} className={`project-item ${selectedProjectId === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)} style={{ animationDelay: `${index * 40}ms` }}>
              <span className="project-name wrap-anywhere">{project.name}</span>
              <span className="project-count">
                <NotebookText size={12} />
                <span>{project.notes.length} {t('noteCount')} • {(project.steps || []).length} {t('stepCount')}</span>
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
              <div className="notes-head-top">
                <h2>
                  <FolderOpen size={20} />
                  <span className="wrap-anywhere">{selectedProject.name}</span>
                </h2>
                {isContextualControls ? (
                  <div className="inline-actions">
                    <IconButton title={t('editProject')} icon={<FolderCog size={18} />} onClick={openEditProjectModal} />
                    <IconButton title={t('deleteProject')} icon={<Trash2 size={18} />} onClick={removeSelectedProject} danger />
                  </div>
                ) : null}
              </div>
              {selectedProject.description ? <p className="project-description wrap-anywhere">{selectedProject.description}</p> : null}
            </div>
            <div className="content-separator" />

            <div className="section-head">
              <h3 className="section-title">
                <NotebookText size={18} />
                <span>{t('projectNotes')}</span>
              </h3>
              {isContextualControls ? (
                <IconButton title={t('createNote')} icon={<FilePlus2 size={18} />} onClick={openCreateNoteModal} />
              ) : null}
            </div>

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
            <div className="content-separator" />

            <div className="section-head">
              <h3 className="section-title">
                <ListTodo size={18} />
                <span>{t('projectSteps')}</span>
              </h3>
              <button className="mode-btn" onClick={() => setShowStepCreate((prev) => !prev)}>
                <Plus size={15} />
                <span>{showStepCreate ? t('close') : t('addStep')}</span>
              </button>
            </div>

            {(selectedProject.steps || []).length > 0 || showStepCreate ? (
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

                {showStepCreate ? (
                  <div className="step-create-row">
                    <input value={newProjectStep} onChange={(event) => setNewProjectStep(event.target.value)} placeholder={t('newProjectStep')} />
                    <button className="wide-btn" onClick={addProjectStep}>
                      <Plus size={15} />
                      <span>{t('addStep')}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  )
}

export default ProjectsPage
