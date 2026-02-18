import { useState } from 'react'
import {
  Check,
  Download,
  ExternalLink,
  FolderOpen,
  Languages,
  LayoutGrid,
  MoonStar,
  RefreshCw,
  Save,
  Square,
  SquareStack,
  Tv,
  X,
} from 'lucide-react'

function SettingsPage({
  t,
  settingsDraft,
  setSettingsDraft,
  updateInfo,
  checkForUpdates,
  openUpdateDownload,
  appVersion,
  saveAllSettings,
}) {
  const [newStatus, setNewStatus] = useState('')

  function addStatus() {
    const value = newStatus.trim()
    if (!value) return
    setSettingsDraft((prev) => {
      if ((prev.projectStatuses || []).includes(value)) return prev
      return { ...prev, projectStatuses: [...(prev.projectStatuses || []), value] }
    })
    setNewStatus('')
  }

  function removeStatus(value) {
    setSettingsDraft((prev) => ({
      ...prev,
      projectStatuses: (prev.projectStatuses || []).filter((status) => status !== value),
    }))
  }

  return (
    <main className="panel settings-page">
      <h2>
        <LayoutGrid size={20} />
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
          <button className={`mode-btn ${settingsDraft.animations ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, animations: !prev.animations }))}>
            <Tv size={15} />
            <span>{settingsDraft.animations ? t('animationsOn') : t('animationsOff')}</span>
          </button>
        </div>
      </section>

      <section className="setting-card">
        <h3>
          <LayoutGrid size={17} />
          <span>{t('controlsLayout')}</span>
        </h3>
        <div className="setting-actions">
          <button
            className={`mode-btn ${settingsDraft.controlsLayout === 'topbar' ? 'active' : ''}`}
            onClick={() => setSettingsDraft((prev) => ({ ...prev, controlsLayout: 'topbar' }))}
          >
            <span>{t('controlsTopbar')}</span>
          </button>
          <button
            className={`mode-btn ${settingsDraft.controlsLayout === 'contextual' ? 'active' : ''}`}
            onClick={() => setSettingsDraft((prev) => ({ ...prev, controlsLayout: 'contextual' }))}
          >
            <span>{t('controlsContextual')}</span>
          </button>
        </div>
      </section>

      <section className="setting-card">
        <h3>
          <Check size={17} />
          <span>{t('statusesSection')}</span>
        </h3>
        <div className="setting-actions">
          <button className={`mode-btn ${settingsDraft.statusesEnabled ? 'active' : ''}`} onClick={() => setSettingsDraft((prev) => ({ ...prev, statusesEnabled: !prev.statusesEnabled }))}>
            <span>{settingsDraft.statusesEnabled ? t('statusesEnabled') : t('statusesDisabled')}</span>
          </button>
        </div>

        {settingsDraft.statusesEnabled ? (
          <>
            <div className="status-list">
              {(settingsDraft.projectStatuses || []).map((status) => (
                <span key={status} className="status-chip">
                  {status}
                  <button title={t('deleteStatus')} aria-label={t('deleteStatus')} onClick={() => removeStatus(status)}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            {(settingsDraft.projectStatuses || []).length === 0 ? <p className="empty-notes">{t('noStatuses')}</p> : null}
            <div className="status-create-row">
              <input value={newStatus} onChange={(event) => setNewStatus(event.target.value)} placeholder={t('statusesPlaceholder')} />
              <button className="wide-btn" onClick={addStatus}>
                <Check size={15} />
                <span>{t('addStatus')}</span>
              </button>
            </div>
          </>
        ) : null}
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
        {t('version')}: {appVersion}
      </div>

      <div className="settings-save-row">
        <button className="wide-btn" onClick={saveAllSettings}>
          <Save size={16} />
          <span>{t('saveSettings')}</span>
        </button>
      </div>
    </main>
  )
}

export default SettingsPage
