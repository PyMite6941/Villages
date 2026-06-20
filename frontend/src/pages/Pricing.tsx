import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardList, Lock, MapPin, MessageSquare, Sparkles, Users } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setPageMeta } from '../lib/pageMeta'

const organizerUses = [
  {
    title: 'Help people find the right circle',
    text: 'Members can discover Villages by topic, goal, and community instead of asking around in scattered chats.',
    icon: MapPin,
  },
  {
    title: 'Keep the learning context together',
    text: 'Discussions, challenges, course material, and shared next steps live beside the Village instead of across old threads.',
    icon: MessageSquare,
  },
  {
    title: 'Turn hard topics into next steps',
    text: 'The Topic Explorer gives organizers and members plain-language summaries, checklists, and prompts to keep the group moving.',
    icon: Sparkles,
  },
]

const fitSignals = [
  'You run a student group, local cohort, club, class, or interest community.',
  'Your members need a clearer way to find the right learning circle.',
  'You want private or invite-only spaces without losing public discovery.',
  'You need a focused learning home before a formal pricing setup.',
]

const notPromised = [
  'No public price list yet',
  'No checkout or billing terms on this page',
  'No discounts, plan names, or enterprise commitments',
]

export default function Pricing() {
  useEffect(() => {
    setPageMeta({
      title: 'Villages pricing for organizers | Start a learning community',
      description: 'See how learning-community organizers can start with Villages early access, create a focused group, and move interested members through the join path.',
      canonicalPath: '/pricing',
    })
    track('pricing_page_viewed', { surface: 'organizer_pricing' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
                Organizer pricing
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
                Start with your learning community, then shape the right Villages setup.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Villages does not have a public price list yet. For now, organizers can join, create the first Village for their group, and see whether the product fits the community they are trying to support.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                  Start through /join <ArrowRight size={16} />
                </Link>
                <Link to="/compare/slack-vs-villages" className="btn-secondary">
                  Compare with Slack
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Users size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">Early organizer path</h2>
                    <p className="mt-1 text-sm text-white/80">Join first, then build the Village your group needs.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ['Create or join a Village', 'Start with the group you already organize or the topic your members are asking for.'],
                  ['Use public or private access', 'Open discovery when it helps, or use private codes for a closed cohort.'],
                  ['Keep pricing flexible for now', 'No checkout step is required to evaluate the organizer fit.'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-md bg-amber-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold">What organizers can use Villages for today</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              The first organizer experience is about fit: a focused place for the people, topics, and learning loops your group already needs.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {organizerUses.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <Icon className="text-village-700 dark:text-village-300" size={24} />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{item.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">Good fit signals</h2>
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                If these sound familiar, the next step is to join Villages and set up the first circle around your community.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fitSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-gray-800">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-village-700 dark:text-village-300" size={16} />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">What this page is not promising</h2>
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Villages is keeping this early organizer path honest. There is no invented package or sales promise here.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {notPromised.map((item) => (
                  <div key={item} className="rounded-md border border-amber-100 bg-white p-4 text-sm font-medium shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold">Start with the join path</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Tell Villages what your group is learning, then create or join the Village that fits. That gives you a real organizer surface before a wider pricing system exists.
              </p>
              <Link to="/join" className="mt-5 inline-flex items-center gap-2 font-medium text-village-700 hover:underline dark:text-village-300">
                Go to /join <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
