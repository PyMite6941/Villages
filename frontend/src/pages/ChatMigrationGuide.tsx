import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Map,
  MessageSquareText,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const migrationRisks = [
  {
    title: 'Members do not know what moves',
    text: 'If every channel, thread, and habit changes at once, people hesitate because the new home feels like another place to check.',
    icon: Map,
  },
  {
    title: 'The first circle is too broad',
    text: 'A general community space is hard to follow. Migration works better when one active learning circle gets a clearer home first.',
    icon: Users,
  },
  {
    title: 'Chat loses its useful role',
    text: 'Quick conversation still belongs in chat. The durable learning work needs a place where context, blockers, and next steps can last.',
    icon: MessageSquareText,
  },
]

const migrationPlan = [
  [
    'Choose one active circle',
    'Start with a group that already has a topic, a few committed members, and a reason to meet again.',
  ],
  [
    'Move only durable context',
    'Put the topic, level, owner, current blocker, and next action in Villages. Leave quick announcements in chat.',
  ],
  [
    'Give members one first action',
    'Ask them to join the Village, introduce their goal, or add the blocker they want help with this week.',
  ],
  [
    'Keep both links visible',
    'Pin the Villages circle in chat and link back to chat from the organizer note until the new habit is clear.',
  ],
  [
    'Review after one week',
    'Check whether members returned, posted a blocker, or used the circle without asking the organizer where to go.',
  ],
]

const tableRows = [
  [
    'What moves first',
    'Every channel, file, and old thread',
    'One active learning circle with its topic, level, owner, and next action',
  ],
  [
    'What stays in chat',
    'Nothing, so members feel the move as a replacement',
    'Quick announcements, casual replies, and live coordination',
  ],
  [
    'How members start',
    'A broad request to join a new tool',
    'One clear action tied to the learning goal they already care about',
  ],
]

const faqItems = [
  {
    question: 'How do you move a learning community out of chat without losing members?',
    answer:
      'Start with one active learning circle, move durable context first, keep chat for quick conversation, and give members one clear action in the new home.',
  },
  {
    question: 'Does the whole community need to migrate at once?',
    answer:
      'No. A small pilot circle is safer because members can feel the benefit before the organizer changes every routine.',
  },
  {
    question: 'Should Slack or Discord be shut down during the move?',
    answer:
      'No. Slack, Discord, or Telegram can stay useful for fast conversation while Villages holds the learning circle, context, blockers, and next steps.',
  },
]

export default function ChatMigrationGuide() {
  useEffect(() => {
    setPageMeta({
      title: 'Move a learning community out of chat | Villages',
      description:
        'A practical guide for organizers moving a learning community from Slack, Discord, or Telegram into Villages without losing member momentum.',
      canonicalPath: '/guides/move-learning-community-out-of-chat',
    })
    setFAQJsonLd('chat-migration-guide-faq-schema', faqItems)
    track('pain_page_viewed', { surface: 'chat_migration_guide' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
                Guide for learning organizers
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
                Move a learning community out of chat without losing members.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Migration works when members can see what changes, what stays familiar, and why the
                new home helps them keep learning. Start with one circle, keep chat useful, and make
                the first Villages action obvious.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                  Start through /join <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guides/learning-groups-scattered-chat"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Read the scattered-chat guide <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guides/keep-learning-group-active"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Keep groups active <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <ListChecks size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">The safer migration test</h2>
                    <p className="mt-1 text-sm text-white/80">
                      Move one learning habit before moving the whole community.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {migrationPlan.slice(0, 3).map(([title, text]) => (
                  <div key={title} className="rounded-md bg-amber-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold">Why migrations lose people</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Members do not leave because a new learning space exists. They drift when the move
              feels vague, broad, or disconnected from the reason they joined the group.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {migrationRisks.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <Icon className="text-village-700 dark:text-village-300" size={24} />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {item.text}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">A migration plan members can follow</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                Treat migration like a behavior change, not a tool switch. The goal is to help
                members return to the right learning context without needing the organizer to route
                them by hand.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {migrationPlan.map(([title, text]) => (
                <div key={title} className="rounded-md bg-amber-50 p-4 dark:bg-gray-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                      size={16}
                    />
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl overflow-x-auto px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="text-village-700 dark:text-village-300" size={22} />
            <h2 className="text-2xl font-bold">What changes when migration starts small</h2>
          </div>
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-amber-100 dark:border-gray-800">
                <th className="py-3 pr-4 font-semibold">Need</th>
                <th className="px-4 py-3 font-semibold">Risky migration</th>
                <th className="px-4 py-3 font-semibold">Villages pilot</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(([need, risky, pilot]) => (
                <tr
                  key={need}
                  className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                >
                  <td className="py-4 pr-4 font-medium">{need}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{risky}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-100">{pilot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">Use Villages for the durable learning work</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                Chat can stay fast and familiar. Villages gives the learning circle a durable home
                where members can find the group, see the current blocker, and know the next action
                when they come back.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/guides/find-right-learning-circle"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Help members find the right circle <ArrowRight size={14} />
                </Link>
                <Link
                  to="/compare/slack-vs-villages"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Compare with Slack <ArrowRight size={14} />
                </Link>
                <Link
                  to="/compare/discord-vs-villages"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Compare with Discord <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <article className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                <h3 className="text-lg font-semibold">Try Villages from this guide</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  Start with an email link, then create the first Village for the circle you want to
                  move out of chat.
                </p>
                <div className="mt-4">
                  <MagicLinkSignup
                    source="chat_migration_guide"
                    buttonLabel="Send my join link"
                    compact
                  />
                </div>
              </article>
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <h3 className="text-base font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
