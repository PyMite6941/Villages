import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'villages-eight@support.tin.computer'

export default function PublicNav() {
  return (
    <header className="border-b border-amber-100 bg-amber-50/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-village-800 dark:text-village-200"
        >
          <img src="/village-icon.svg" alt="" className="h-8 w-8" />
          Villages
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/join" className="hover:text-village-700 dark:hover:text-village-200">
            Join
          </Link>
          <Link to="/pricing" className="hover:text-village-700 dark:hover:text-village-200">
            Pricing
          </Link>
          <Link
            to="/guides/learning-groups-scattered-chat"
            className="hidden hover:text-village-700 dark:hover:text-village-200 md:inline"
          >
            Guide
          </Link>
          <Link
            to="/compare/slack-vs-villages"
            className="hidden hover:text-village-700 dark:hover:text-village-200 md:inline"
          >
            Slack
          </Link>
          <Link
            to="/compare/discord-vs-villages"
            className="hidden hover:text-village-700 dark:hover:text-village-200 md:inline"
          >
            Discord
          </Link>
          <Link to="/login" className="btn-secondary px-3 py-1.5 text-sm">
            Log in
          </Link>
        </nav>
      </div>
      <div className="border-t border-amber-100/70 px-4 py-2 text-center text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300 sm:px-6">
        Questions? Email support at{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-village-700 hover:underline dark:text-village-300"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </div>
    </header>
  )
}
