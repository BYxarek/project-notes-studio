import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import {
  BookText,
  CalendarClock,
  Github,
  Globe,
  Monitor,
  ShieldCheck,
  Smartphone,
  Star,
  Tag,
  Zap,
} from 'lucide-react'
import './App.css'

const REPO_OWNER = 'BYxarek'
const REPO_NAME = 'project-notes-studio'
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`
const SITE_VERSION = '1.0.0'
const REFRESH_MS = 10 * 1000

const I18N = {
  ru: {
    langLabel: 'RU',
    switchLabel: 'English',
    title: 'Project Notes Studio',
    subtitle:
      'Тёмный, динамичный и современный интерфейс для рабочего пространства заметок и идей.',
    repoButton: 'GitHub Repo',
    stars: 'GitHub Stars',
    lastRelease: 'Последний релиз',
    releaseDate: 'Дата релиза',
    noRelease: 'Ещё не было',
    noReleaseDate: 'Нет релиза',
    noData: 'Нет данных',
    repoLoadError: 'Не удалось загрузить данные GitHub',
    osTitle: 'Поддерживаемые ОС',
    osDescription:
      'Проект ориентирован на кроссплатформенность и поддерживает работу на десктопе и мобильных устройствах.',
    downloadTitle: 'Варианты команд для установки.',
    commandClone: 'Клонирование через Git',
    commandZip: 'Скачать ZIP-архив',
    footerBuilt: 'Built with React + Vite',
    footerVersion: 'Site Version',
    features: [
      {
        icon: BookText,
        title: 'Умные заметки',
        text: 'Структурируй идеи, списки задач и материалы в одном быстром интерфейсе.',
      },
      {
        icon: Zap,
        title: 'Быстрый поток',
        text: 'Мгновенные переходы и плавные анимации помогают держать фокус на работе.',
      },
      {
        icon: ShieldCheck,
        title: 'Надёжная база',
        text: 'Проект готов для роста: чистая архитектура, понятные секции и ясный UX.',
      },
    ],
  },
  en: {
    langLabel: 'EN',
    switchLabel: 'Русский',
    title: 'Project Notes Studio',
    subtitle:
      'A dark, dynamic, and modern interface for a focused notes and ideas workspace.',
    repoButton: 'GitHub Repo',
    stars: 'GitHub Stars',
    lastRelease: 'Latest release',
    releaseDate: 'Release date',
    noRelease: 'No release yet',
    noReleaseDate: 'No release',
    noData: 'No data',
    repoLoadError: 'Failed to load GitHub data',
    osTitle: 'Supported OS',
    osDescription:
      'The project is designed for cross-platform usage and works on desktop and mobile devices.',
    downloadTitle: 'Installation command options',
    commandClone: 'Clone with Git',
    commandZip: 'Download ZIP archive',
    footerBuilt: 'Built with React + Vite',
    footerVersion: 'Site Version',
    features: [
      {
        icon: BookText,
        title: 'Smart notes',
        text: 'Organize ideas, tasks, and materials in a fast and clean interface.',
      },
      {
        icon: Zap,
        title: 'Fast workflow',
        text: 'Instant transitions and smooth animations keep you focused.',
      },
      {
        icon: ShieldCheck,
        title: 'Solid foundation',
        text: 'Ready to scale with a clean structure and clear UX.',
      },
    ],
  },
}

function formatReleaseDate(dateString, locale, fallback) {
  if (!dateString) return fallback
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

function useGitHubRepoInfo() {
  const [state, setState] = useState({
    loading: true,
    stars: null,
    releaseTag: null,
    releaseDate: null,
    error: null,
  })

  useEffect(() => {
    let active = true

    const requestJson = (url) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.setRequestHeader('Accept', 'application/vnd.github+json')
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
            return
          }
          reject(new Error(`status_${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('network_error'))
        xhr.send()
      })

    const load = async () => {
      try {
        const [repo, latestRelease] = await Promise.all([
          requestJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`),
          requestJson(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`).catch(
            () => null
          ),
        ])

        if (!active) return

        setState({
          loading: false,
          stars: repo.stargazers_count ?? 0,
          releaseTag: latestRelease?.tag_name,
          releaseDate: latestRelease?.published_at ?? latestRelease?.created_at ?? null,
          error: null,
        })
      } catch {
        if (!active) return
        setState((prev) => ({
          ...prev,
          loading: false,
          error: true,
        }))
      }
    }

    load()
    const timer = window.setInterval(load, REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return state
}

function App() {
  const [locale, setLocale] = useState('ru')
  const t = I18N[locale]
  const repo = useGitHubRepoInfo()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const repoStats = useMemo(
    () => [
      {
        label: t.stars,
        value: repo.loading
          ? '...'
          : repo.stars?.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US') ?? '0',
        icon: Star,
      },
      {
        label: t.lastRelease,
        value: repo.loading ? '...' : repo.releaseTag ?? t.noRelease,
        icon: Tag,
      },
      {
        label: t.releaseDate,
        value: repo.loading
          ? '...'
          : formatReleaseDate(repo.releaseDate, locale, t.noReleaseDate),
        icon: CalendarClock,
      },
    ],
    [locale, repo.loading, repo.releaseDate, repo.releaseTag, repo.stars, t]
  )

  return (
    <div className="page">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <Motion.header
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="locale-row">
          <button
            type="button"
            className="btn btn-ghost locale-btn"
            onClick={() => setLocale((prev) => (prev === 'ru' ? 'en' : 'ru'))}
          >
            <Globe size={16} />
            {t.switchLabel}
          </button>
        </div>

        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <div className="hero-actions">
          <a className="btn btn-ghost" href={REPO_URL} target="_blank" rel="noreferrer">
            <Github size={18} />
            {t.repoButton}
          </a>
        </div>
      </Motion.header>

      <section className="stats-grid">
        {repoStats.map((item, index) => {
          const Icon = item.icon
          return (
            <Motion.article
              key={item.label}
              className="stat-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.08 * index, duration: 0.4 }}
            >
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <h3>{item.value}</h3>
              <p>{item.label}</p>
            </Motion.article>
          )
        })}
      </section>
      {repo.error && <p className="repo-error">{t.repoLoadError}</p>}

      <section className="os-grid">
        <Motion.article
          className="os-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
        >
          <h2>{t.osTitle}</h2>
          <p>{t.osDescription}</p>
          <div className="os-list">
            <span>
              <Monitor size={16} />
              Windows
            </span>
            <span>
              <Smartphone size={16} />
              Android
            </span>
            <span>Linux (soon...)</span>
          </div>
        </Motion.article>
      </section>

      <section className="download-grid">
        <Motion.article
          className="download-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
        >
          <h2>{t.downloadTitle}</h2>
          <div className="command-list">
            <p>{t.commandClone}</p>
            <code>git clone {REPO_URL}.git</code>
            <p>{t.commandZip}</p>
            <code>{REPO_URL}/archive/refs/heads/main.zip</code>
          </div>
        </Motion.article>
      </section>

      <section className="features-grid">
        {t.features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Motion.article
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: 0.1 * index, duration: 0.45 }}
            >
              <div className="feature-icon">
                <Icon size={20} />
              </div>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </Motion.article>
          )
        })}
      </section>

      <Motion.footer
        className="footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <span>{t.footerBuilt}</span>
        <span>
          {t.footerVersion} v{SITE_VERSION} ({t.langLabel})
        </span>
      </Motion.footer>
    </div>
  )
}

export default App
