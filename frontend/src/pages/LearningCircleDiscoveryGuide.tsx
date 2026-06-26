import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const discoverySignals = [
  {
    title: 'Interested members keep asking where to start',
    text: 'A broad chat or announcement thread tells people the community exists, but not which circle fits their topic, level, or weekly rhythm.',
    icon: Search,
  },
  {
    title: 'Organizers match people by hand',
    text: 'The same routing work repeats every time a new person joins, and the group only scales if the organizer remembers who belongs where.',
    icon: Users,
  },
  {
    title: 'Good circles stay invisible',
    text: 'A strong study group may already exist, but new members cannot see its focus, owner, current blocker, or next meeting from chat alone.',
    icon: Compass,
  },
]

const circleFields = [
  [
    'Topic',
    'Name the subject in plain language. "Beginner Python projects" is clearer than a channel called #coding.',
  ],
  [
    'Level',
    'Say who should join now: first-timers, returning learners, advanced readers, or mixed-level helpers.',
  ],
  ['Rhythm', 'Show when the group meets or checks in, even if the cadence is lightweight.'],
  ['Owner', 'Name the person or team responsible for keeping the circle current.'],
  [
    'Next action',
    'Give members one thing to do after joining, such as introduce themselves, read a chapter, or bring a blocker.',
  ],
]

const tableRows = [
  [
    'Member question',
    'Where should I start?',
    'Choose a circle by topic, level, rhythm, and owner.',
  ],
  [
    'Organizer work',
    'Reply by hand and point people to old messages.',
    'Keep a visible list of active circles and next actions.',
  ],
  [
    'Group health',
    'Activity looks busy, but the right path is unclear.',
    'Members can see where to join and what happens next.',
  ],
]

const faqItems = [
  {
    question: 'How can organizers help members find the right learning group?',
    answer:
      'Make each circle visible with a topic, level, rhythm, owner, and next action. Members should not have to infer the right place from a chat thread.',
  },
  {
    question: 'Does this replace Slack or Discord?',
    answer:
      'No. Chat can still handle conversation. Villages gives the learning circles a clearer home so members can find the right place before the discussion starts.',
  },
  {
    question: 'What should a new learning circle include first?',
    answer:
      'Start with the topic, who it is for, when it meets or checks in, who owns it, and the one next step members should take.',
  },
]

export default function LearningCircleDiscoveryGuide() {
  useEffect(() => {
    setPageMeta({
      title: 'Help members find the right learning circle | Villages',
      description:
        'A practical guide for learning-community organizers who need members to find the right study group, cohort, or skill circle without manual routing.',
      canonicalPath: '/guides/find-right-learning-circle',
    })
    setFAQJsonLd('learning-circle-discovery-faq-schema', faqItems)
    track('pain_page_viewed', { surface: 'learning_circle_discovery_guide' })
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
                Help members find the right learning circle.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Interest is not the same as discovery. A member can want to learn, join the chat,
                and still miss the circle that fits their level, schedule, and next step.
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
                  <MapPin size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">The discovery test</h2>
                    <p className="mt-1 text-sm text-white/80">
                      Can a new member find the right circle without asking you first?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {circleFields.slice(0, 3).map(([title, text]) => (
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
            <h2 className="text-2xl font-bold">Why member discovery breaks</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Most communities have enough interest before they have enough structure. The work is
              turning that interest into clear, joinable circles without making the organizer answer
              every routing question.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {discoverySignals.map((item) => {
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
                <h2 className="text-2xl font-bold">Make each circle easy to choose</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                Before you invite more people, make the current choices visible. A member should be
                able to compare circles without searching the archive or waiting for a reply.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {circleFields.map(([title, text]) => (
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
            <h2 className="text-2xl font-bold">What changes when circles are visible</h2>
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
                <h2 className="text-2xl font-bold">Use Villages when matching matters</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                Chat can stay useful once members are talking. Villages helps before that moment,
                when people need a clear way to find the right group and understand what joining
                means.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/guides/keep-learning-group-active"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  Keep groups active after week one <ArrowRight size={14} />
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
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                >
                  See the organizer path <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold">Start from this discovery guide</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Use an email link to start a Villages account, then create the first circle around
                the topic and member path you want people to find.
              </p>
              <div className="mt-5">
                <MagicLinkSignup
                  source="learning_circle_discovery_guide"
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
