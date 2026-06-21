import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  MessageSquare,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const rows = [
  [
    'Finding the right circle',
    'Servers, channels, and roles work when members already know where to go',
    'Profiles, interests, and Village discovery help people choose a learning group by goal',
  ],
  [
    'Keeping topic context',
    'Useful posts can get buried between chat, events, voice rooms, and old threads',
    'Discussions, challenges, courses, and AI help stay beside the Village',
  ],
  [
    'Helping new learners start',
    'A new member has to read the room and ask for direction',
    'Topic Explorer turns confusing material into summaries, checklists, and prompts',
  ],
  [
    'Running private cohorts',
    'Possible with channels and roles, but it takes moderator setup',
    'Public, private, and invite-only Villages are part of the core flow',
  ],
]

const cards = [
  {
    title: 'Use Discord when conversation is the main job.',
    text: 'Discord is strong for active servers, live discussion, events, and groups that already know how the server is organized.',
    icon: MessageSquare,
  },
  {
    title: 'Use Villages when matching matters.',
    text: 'Villages helps organizers give each learner a clearer place to land by topic, level, interest, and learning goal.',
    icon: Users,
  },
  {
    title: 'Use Villages when context should last.',
    text: 'A Village keeps the group, the discussion, the learning material, and AI help in one focused home.',
    icon: Sparkles,
  },
]

const faqItems = [
  {
    question: 'What is Discord best for?',
    answer:
      'Discord is strong for active servers, live discussion, events, and groups that already know how the server is organized.',
  },
  {
    question: 'When is Villages a better fit than Discord?',
    answer:
      'Villages fits when people need to find the right learning circle, keep topic context, and turn hard material into next steps.',
  },
  {
    question: 'How does Villages help new learners start?',
    answer:
      'Topic Explorer turns confusing material into summaries, checklists, and prompts so new learners have clearer next steps.',
  },
]

export default function DiscordComparison() {
  useEffect(() => {
    setPageMeta({
      title: 'Discord vs Villages | Learning community comparison',
      description:
        'Compare Discord with Villages for study cohorts, clubs, and community organizers who need more than a busy server for learning.',
      canonicalPath: '/compare/discord-vs-villages',
    })
    setFAQJsonLd('discord-comparison-faq-schema', faqItems)
    track('comparison_page_viewed', { page: 'discord_vs_villages' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
              Discord vs Villages
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Discord is great for active communities. Villages is built for focused learning
              groups.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Discord works when a server already has clear channels, active moderators, and members
              who know where to ask. Villages fits when people need to find the right learning
              circle, keep topic context, and turn hard material into next steps.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                Join Villages <ArrowRight size={16} />
              </Link>
              <Link to="/compare/slack-vs-villages" className="btn-secondary">
                Compare with Slack
              </Link>
              <Link to="/guides/learning-groups-scattered-chat" className="btn-secondary">
                Read the guide
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
                  <th className="px-4 py-3 font-semibold">Discord</th>
                  <th className="px-4 py-3 font-semibold">Villages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([need, discord, villages]) => (
                  <tr
                    key={need}
                    className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-4 pr-4 font-medium">{need}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{discord}</td>
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
                  'Discord is a strong community chat product.',
                  'Villages is a learning community product with discovery, group context, and AI support built in.',
                  'If the goal is to help people choose a learning circle and keep going, Villages starts closer to the problem.',
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
                  to="/compare/slack-vs-villages"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Read the Slack comparison <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 dark:border-gray-800 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Search className="text-village-700 dark:text-village-300" size={20} />
                <h3 className="text-lg font-semibold">Try Villages for your learning group</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Start with an email link, then create or join a Village around the subject your
                group cares about.
              </p>
              <div className="mt-4">
                <MagicLinkSignup
                  source="discord_comparison"
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
