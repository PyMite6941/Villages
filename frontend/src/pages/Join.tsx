import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Lock, MapPin, Sparkles, Users } from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setPageMeta } from '../lib/pageMeta'

const joinSteps = [
  'Enter your email and open the magic link.',
  'Tell Villages what you are studying, teaching, or trying to learn.',
  'Find a public Village, join with a private code, or create the first circle for your group.',
]

export default function Join() {
  useEffect(() => {
    setPageMeta({
      title: 'Join Villages | Find or start a learning community',
      description: 'Join Villages to find focused study groups, create a private learning circle, and use AI to turn confusing topics into clear next steps.',
      canonicalPath: '/join',
    })
    track('join_page_viewed', { surface: 'join_page' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
              Join a Village
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Start with one email, then find the people learning the same thing.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Villages is for students, adult learners, and organizers who want a smaller, more focused place to learn together. Create a profile, choose your goals, and join a group that matches what you are working on.
            </p>
            <div className="mt-8 rounded-lg border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <MagicLinkSignup source="join_page" buttonLabel="Send my join link" />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-lg font-semibold">What happens after you join</h2>
              </div>
              <div className="space-y-3">
                {joinSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-md bg-amber-50 p-3 dark:bg-gray-800">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-village-700 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <MapPin className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Browse by topic and community</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Lock className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Use private codes for closed groups</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <Sparkles className="text-village-700 dark:text-village-300" size={20} />
                <p className="mt-3 text-sm font-medium">Get AI help with hard topics</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-bold">Good fits for Villages</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {['A teacher or tutor starting a study cohort', 'A student looking for people working on the same exam', 'An adult learner who wants practical next steps, not a noisy group chat'].map((fit) => (
                <div key={fit} className="flex items-start gap-2 rounded-md bg-amber-50 p-4 dark:bg-gray-800">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-village-700 dark:text-village-300" size={17} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{fit}</span>
                </div>
              ))}
            </div>
            <Link to="/compare/slack-vs-villages" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300">
              See why Villages is different from Slack <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
