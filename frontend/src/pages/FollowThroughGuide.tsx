import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  MessageSquareText,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const fadeSignals = [
  {
    title: 'The second meeting is vague',
    text: 'People joined with energy, but the next date, topic, or owner is not clear enough to pull them back.',
    icon: CalendarCheck,
  },
  {
    title: 'Blockers stay private',
    text: 'Members get stuck alone, so the organizer only hears about confusion after the group has already gone quiet.',
    icon: MessageSquareText,
  },
  {
    title: 'Progress gets mixed with chat',
    text: 'Announcements, side talk, links, and next steps all live in one stream, which makes follow-through feel optional.',
    icon: Users,
  },
]

const weeklyRhythm = [
  [
    'Name the next meeting',
    'Write the next date, focus, and expected preparation in one place before the first session ends.',
  ],
  [
    'Ask for the current blocker',
    'Have every member share the concept, habit, or setup step that is slowing them down this week.',
  ],
  [
    'Make one action visible',
    'Pick a single next action for the group, then keep it visible until the next check-in.',
  ],
  [
    'Keep chat for conversation',
    'Let casual discussion stay quick, but move durable learning context into a place members can return to.',
  ],
]

const tableRows = [
  [
    'Group promise',
    'A broad invitation to learn together',
    'A named circle with a topic, level, meeting rhythm, and next step',
  ],
  [
    'Member blocker',
    'Buried in replies or never shared',
    'Visible beside the group so others can help or learn from it',
  ],
  [
    'Weekly follow-up',
    'Depends on one organizer remembering to remind everyone',
    'Lives with the group so members can see what comes next',
  ],
]

const faqItems = [
  {
    question: 'What usually makes a learning group go quiet?',
    answer:
      'Many groups go quiet when the next meeting, blocker, or action is not visible after the first session. The issue is often rhythm, not lack of interest.',
  },
  {
    question: 'Do organizers need to stop using chat?',
    answer:
      'No. Chat can stay useful for quick conversation. Villages is meant to hold the learning circle, next steps, and context that should not disappear in the feed.',
  },
  {
    question: 'Who should use this playbook?',
    answer:
      'This is for organizers of study groups, cohorts, clubs, and skill circles that get initial interest but need a clearer way to keep members moving.',
  },
]

export default function FollowThroughGuide() {
  useEffect(() => {
    setPageMeta({
      title: 'Keep a learning group active after week one | Villages',
      description:
        'A practical guide for organizers whose learning groups start strong, then go quiet after the first meeting or signup wave.',
      canonicalPath: '/guides/keep-learning-group-active',
    })
    setFAQJsonLd('followthrough-guide-faq-schema', faqItems)
    track('pain_page_viewed', { surface: 'followthrough_guide' })
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
                Keep a learning group active after week one.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                A group can have a strong first session and still go quiet. The fix is not more
                reminders. It is a visible weekly rhythm that shows members what is next, where they
                are stuck, and how to keep moving together.
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
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <ListChecks size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">The week-two check</h2>
                    <p className="mt-1 text-sm text-white/80">
                      If members cannot see the next step, momentum becomes private.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {weeklyRhythm.slice(0, 3).map(([title, text]) => (
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
            <h2 className="text-2xl font-bold">Why good groups fade</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              A quiet group does not always mean members lost interest. Often, they cannot tell what
              to do next or where to share the thing blocking them.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {fadeSignals.map((item) => {
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
                <h2 className="text-2xl font-bold">A weekly rhythm that members can follow</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                This is the smallest playbook worth trying before adding more tools or sending more
                announcements. Make the next step visible, then repeat it every week.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {weeklyRhythm.map(([title, text]) => (
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
            <h2 className="text-2xl font-bold">What changes when progress has a home</h2>
          </div>
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-amber-100 dark:border-gray-800">
                <th className="py-3 pr-4 font-semibold">Need</th>
                <th className="px-4 py-3 font-semibold">In chat alone</th>
                <th className="px-4 py-3 font-semibold">In Villages</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(([need, chat, villages]) => (
                <tr
                  key={need}
                  className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                >
                  <td className="py-4 pr-4 font-medium">{need}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{chat}</td>
                  <td className="px-4 py-4 text-gray-800 dark:text-gray-100">{villages}</td>
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
                <h2 className="text-2xl font-bold">Use Villages when the group needs continuity</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                Chat can stay useful for quick conversation. Villages gives organizers a durable
                place for the learning circle, the weekly next step, and the shared context members
                need when they come back.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
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
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  See the organizer path <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold">Start from this follow-through guide</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Use an email link to start a Villages account, then create or join the Village that
                needs a clearer weekly rhythm.
              </p>
              <div className="mt-5">
                <MagicLinkSignup
                  source="followthrough_guide"
                  buttonLabel="Send my join link"
                  helperText="We only use this email to send your sign-in link and start your Villages account."
                  compact
                />
              </div>
              <Link
                to="/join"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Or open /join first <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-3">
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
        </section>
      </main>
    </div>
  )
}
