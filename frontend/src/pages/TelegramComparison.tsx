import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ListChecks,
  MessageCircle,
  Search,
  Sparkles,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const rows = [
  [
    'Finding the right circle',
    'Chats, channels, and forwarded links work when members already know what to follow',
    'Profiles, interests, and Village discovery help members choose by topic, level, and goal',
  ],
  [
    'Keeping learning context',
    'Useful answers can move quickly past announcements, replies, and media',
    'Discussions, challenges, courses, and AI help stay beside the Village',
  ],
  [
    'Turning confusion into next steps',
    'Depends on an organizer or active member replying in the moment',
    'Topic Explorer turns hard material into summaries, checklists, and prompts',
  ],
  [
    'Running focused cohorts',
    'Possible with groups and channels, but the learning structure is organizer-built',
    'Public, private, and invite-only Villages are part of the core flow',
  ],
]

const cards = [
  {
    title: 'Use Telegram when speed matters most.',
    text: 'Telegram is useful for quick announcements, broadcast-style updates, and lightweight conversation that members can follow from a phone.',
    icon: MessageCircle,
  },
  {
    title: 'Use Villages when discovery matters.',
    text: 'Villages gives organizers a clearer way to help members find the right learning circle by topic, level, interest, and goal.',
    icon: Search,
  },
  {
    title: 'Use Villages when context should last.',
    text: 'A Village keeps the group, the topic, the learning material, and AI-supported next steps in one focused home.',
    icon: Sparkles,
  },
]

const faqItems = [
  {
    question: 'What is Telegram best for?',
    answer:
      'Telegram is useful for quick announcements, broadcast-style updates, and lightweight conversation that members can follow from a phone.',
  },
  {
    question: 'When is Villages a better fit than Telegram?',
    answer:
      'Villages is a better fit when members need to discover the right learning circle, keep topic context, and turn hard material into next steps.',
  },
  {
    question: 'Can a learning community use Telegram and Villages together?',
    answer:
      'Yes. Telegram can stay useful for fast conversation while Villages holds the learning circle, context, blockers, and next steps.',
  },
]

export default function TelegramComparison() {
  useEffect(() => {
    setPageMeta({
      title: 'Telegram vs Villages | Learning community comparison',
      description:
        'Compare Telegram with Villages for learning communities that need quick chat plus clearer discovery, context, and next steps.',
      canonicalPath: '/compare/telegram-vs-villages',
    })
    setFAQJsonLd('telegram-comparison-faq-schema', faqItems)
    track('comparison_page_viewed', { page: 'telegram_vs_villages' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
              Telegram vs Villages
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Telegram is good for fast updates. Villages is built for focused learning groups.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Telegram works well when a group needs quick messages, announcements, or lightweight
              conversation. Villages fits when members need to find the right learning circle, keep
              topic context, and turn hard material into next steps.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                Join Villages <ArrowRight size={16} />
              </Link>
              <Link to="/compare/slack-vs-villages" className="btn-secondary">
                Compare with Slack
              </Link>
              <Link to="/compare/discord-vs-villages" className="btn-secondary">
                Compare with Discord
              </Link>
              <Link to="/guides/learning-groups-scattered-chat" className="btn-secondary">
                Read the guide
              </Link>
              <Link to="/guides/move-learning-community-out-of-chat" className="btn-secondary">
                Plan the migration
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-12 sm:px-6">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-amber-100 dark:border-gray-800">
                  <th className="py-3 pr-4 font-semibold">Need</th>
                  <th className="px-4 py-3 font-semibold">Telegram</th>
                  <th className="px-4 py-3 font-semibold">Villages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([need, telegram, villages]) => (
                  <tr
                    key={need}
                    className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-4 pr-4 font-medium">{need}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{telegram}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-100">{villages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <article
                key={card.title}
                className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Icon className="text-village-700 dark:text-village-300" size={24} />
                <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {card.text}
                </p>
              </article>
            )
          })}
        </section>

        <section className="border-t border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">The short version</h2>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  'Telegram is a strong tool for fast messages and lightweight community updates.',
                  'Villages is a learning community product with discovery, group context, and AI support built in.',
                  'A group can keep Telegram for quick conversation while using Villages for durable learning work.',
                ].map((point) => (
                  <div key={point} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                      size={17}
                    />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/guides/learning-groups-scattered-chat"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  See the scattered-chat pattern <ArrowRight size={14} />
                </Link>
                <Link
                  to="/guides/move-learning-community-out-of-chat"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Plan a safer move out of chat <ArrowRight size={14} />
                </Link>
                <Link
                  to="/compare/slack-vs-villages"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Read the Slack comparison <ArrowRight size={14} />
                </Link>
                <Link
                  to="/compare/discord-vs-villages"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Read the Discord comparison <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 dark:border-gray-800 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <ListChecks className="text-village-700 dark:text-village-300" size={20} />
                <h3 className="text-lg font-semibold">Try Villages for your learning group</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Start with an email link, then create or join a Village around the subject your
                group cares about.
              </p>
              <div className="mt-4">
                <MagicLinkSignup
                  source="telegram_comparison"
                  buttonLabel="Send my join link"
                  compact
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
