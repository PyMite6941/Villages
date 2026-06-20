import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, CheckCircle2, MapPin, MessageCircle, Search, Sparkles, Users } from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { setJsonLd, setPageMeta } from '../lib/pageMeta'
import { track } from '../lib/analytics'

const steps = [
  { title: 'Show the local learning map', text: 'Members see active groups by subject, goal, and community instead of hunting through old chat threads.', icon: MapPin },
  { title: 'Match people into the right circle', text: 'Profiles, interests, and learning style help people find a Village where they can actually participate.', icon: Users },
  { title: 'Turn confusion into next steps', text: 'The Topic Explorer turns hard subjects into plain language, checklists, and group-friendly prompts.', icon: Sparkles },
]

const proofPoints = [
  'Built for student communities and adult learners',
  'Magic-link signup, no password to remember',
  'Villages can be public, private, or invite-only',
  'AI support stays human-in-the-loop',
]

export default function PublicHome() {
  useEffect(() => {
    setPageMeta({
      title: 'Villages | AI-powered community learning groups',
      description: 'Villages helps students, adult learners, and organizers form focused learning communities with AI matching, plain-language topic help, and group discussion.',
      canonicalPath: '/',
    })
    setJsonLd('villages-product-schema', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Villages',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'A community learning platform for forming focused learning groups, explaining hard topics, and coordinating study communities.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    })
    track('landing_viewed', { surface: 'public_home' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />

      <main>
        <section className="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
                Community learning, without the chat sprawl
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
                Help learners find the right group, understand hard topics, and keep going together.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Villages gives organizers a focused place for learning groups: member discovery, private or public circles, discussion, voice rooms, and AI that turns confusing material into clear next steps.
              </p>
              <div className="mt-8 max-w-xl rounded-lg border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <MagicLinkSignup source="public_home" buttonLabel="Join Villages" compact />
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Link to="/join" className="inline-flex items-center gap-1 font-medium text-village-700 hover:underline dark:text-village-300">
                  See how joining works <ArrowRight size={14} />
                </Link>
                <Link to="/compare/slack-vs-villages" className="inline-flex items-center gap-1 font-medium text-village-700 hover:underline dark:text-village-300">
                  Compare with Slack <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">AP Calculus Village</span>
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs">18 members</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-white/12 p-3">
                    <BookOpenCheck size={18} />
                    <p className="mt-2 text-sm font-medium">Topic Explorer</p>
                    <p className="mt-1 text-xs text-white/75">Limits explained as a checklist.</p>
                  </div>
                  <div className="rounded-md bg-white/12 p-3">
                    <MessageCircle size={18} />
                    <p className="mt-2 text-sm font-medium">Group discussion</p>
                    <p className="mt-1 text-xs text-white/75">Members share worked examples.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-md bg-amber-50 p-3 dark:bg-gray-800">
                  <Search className="text-village-700 dark:text-village-300" size={18} />
                  <div>
                    <p className="text-sm font-medium">Find people by goal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SAT Math, AP Biology, career change, language learning.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-amber-50 p-3 dark:bg-gray-800">
                  <Sparkles className="text-village-700 dark:text-village-300" size={18} />
                  <div>
                    <p className="text-sm font-medium">Use AI to make action clear</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Plain language, key points, checklists, next steps.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <article key={step.title} className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <Icon className="text-village-700 dark:text-village-300" size={24} />
                  <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{step.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-bold">A better fit for learning communities than another noisy feed.</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Slack and Discord are good at conversation. Villages is built around the work learning groups need after the conversation starts: matching, shared context, guided topic help, and a visible path into the right circle.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-gray-800">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-village-700 dark:text-village-300" size={16} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
