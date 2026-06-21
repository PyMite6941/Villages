import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  Lock,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setPageMeta } from '../lib/pageMeta'

const pathCards = [
  {
    title: 'For organizers',
    subtitle: 'Start a clearer home for a cohort, club, or local learning group.',
    icon: ClipboardList,
    points: [
      'Show people where the right circle lives.',
      'Use private codes for closed groups.',
      'Keep topic context beside the discussion.',
    ],
    links: [
      {
        label: 'Read the scattered-chat guide',
        to: '/guides/learning-groups-scattered-chat',
      },
      {
        label: 'Compare with Slack',
        to: '/compare/slack-vs-villages',
      },
    ],
  },
  {
    title: 'For learners',
    subtitle: 'Find people working on the same topic and keep moving after the first question.',
    icon: BookOpen,
    points: [
      'Build a profile around what you are learning.',
      'Join a Village by topic, invitation, or private code.',
      'Use AI help for summaries, practice, and next steps.',
    ],
    links: [
      {
        label: 'Start with email',
        to: '#join-form',
      },
    ],
  },
]

const joinSteps = [
  'Enter your email and open the magic link.',
  'Choose whether you are organizing a group or joining as a learner.',
  'Find a public Village, use a private code, or create the first circle for your group.',
]

export default function Join() {
  useEffect(() => {
    setPageMeta({
      title: 'Join Villages | Organize or join a learning community',
      description:
        'Join Villages as a learning organizer or learner, then find a focused circle, create a private group, and use AI to turn topics into clear next steps.',
      canonicalPath: '/join',
    })
    track('join_page_viewed', { surface: 'join_page' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
              Choose your path
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Join Villages as an organizer or a learner.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Villages is for people who want learning groups to feel easier to find and easier to
              keep going. Pick the route that matches what you are trying to do, then use the same
              email link to start.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#paths" className="btn-primary inline-flex items-center gap-2">
                See both paths <ArrowRight size={16} />
              </a>
              <a href="#join-form" className="btn-secondary inline-flex items-center gap-2">
                Start with email <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {pathCards.map((path) => {
              const Icon = path.icon
              return (
                <article
                  key={path.title}
                  className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-village-700 text-white">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold">{path.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {path.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {path.points.map((point) => (
                      <div
                        key={point}
                        className="flex gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle2
                          className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                          size={17}
                        />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {path.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                      >
                        {link.label} <ArrowRight size={14} />
                      </Link>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section
          id="paths"
          className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">Good fits for each path</h2>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  'Choose organizer if you are starting a cohort, running a study club, or moving a group out of scattered chat.',
                  'Choose learner if you want people studying the same subject, a private group code, or clearer next steps after a hard topic.',
                  'Both paths use the same email link and lead into the same Villages account.',
                ].map((fit) => (
                  <div
                    key={fit}
                    className="flex items-start gap-2 rounded-md bg-amber-50 p-4 dark:bg-gray-800"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                      size={17}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{fit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                <MapPin className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Browse by topic and community</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                <Lock className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Use private codes for closed groups</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                <Sparkles className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Get AI help with hard topics</p>
              </div>
            </div>
          </div>
        </section>

        <section id="join-form" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">What happens after you join</h2>
              </div>
              <div className="mt-5 space-y-3">
                {joinSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-md bg-white p-3 dark:bg-gray-900">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-village-700 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-semibold">Start with one email link</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                No password needed. The same link works whether you are organizing a group or
                joining one as a learner.
              </p>
              <div className="mt-5">
                <MagicLinkSignup source="join_page" buttonLabel="Send my join link" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
