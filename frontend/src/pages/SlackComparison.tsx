import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, MessageSquare, Search, Sparkles, Users } from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const rows = [
  [
    'Finding the right group',
    'Manual channel browsing and invitations',
    'Profiles, interests, and Village discovery built around learning goals',
  ],
  [
    'Turning confusion into action',
    'Depends on whoever replies first',
    'Topic Explorer produces plain-language summaries, checklists, and next steps',
  ],
  [
    'Private cohorts',
    'Possible, but usually mixed with general chat',
    'Public, private, and invite-only Villages are part of the core flow',
  ],
  [
    'Learning context',
    'Files and threads scatter across channels',
    'Discussions, challenges, courses, and AI help sit beside the Village',
  ],
]

const faqItems = [
  {
    question: 'What is Slack best for?',
    answer: 'Slack is strong for teams that already share a company, project, or workflow.',
  },
  {
    question: 'When is Villages a better fit than Slack?',
    answer:
      'Villages is a better fit when people need to discover the right group, understand confusing material, and keep learning together after the first message.',
  },
  {
    question: 'How does Villages help learning groups keep context?',
    answer:
      'Villages keeps discussions, challenges, courses, and AI help beside the Village instead of scattering files and threads across channels.',
  },
]

export default function SlackComparison() {
  useEffect(() => {
    setPageMeta({
      title: 'Slack vs Villages | Learning community comparison',
      description:
        'Compare Slack with Villages for study cohorts, adult learning circles, and community organizers who need more than another chat feed.',
      canonicalPath: '/compare/slack-vs-villages',
    })
    setFAQJsonLd('slack-comparison-faq-schema', faqItems)
    track('comparison_page_viewed', { page: 'slack_vs_villages' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
              Slack vs Villages
            </p>
            <h1 className="text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
              Slack is for team chat. Villages is for focused learning communities.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Slack works when everyone already knows where to go and what to do. Villages is better
              when people need to discover the right group, understand confusing material, and keep
              learning together after the first message.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                Join Villages <ArrowRight size={16} />
              </Link>
              <Link to="/" className="btn-secondary">
                Back to overview
              </Link>
              <Link to="/guides/learning-groups-scattered-chat" className="btn-secondary">
                Read the guide
              </Link>
              <Link to="/compare/discord-vs-villages" className="btn-secondary">
                Compare with Discord
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
                  <th className="px-4 py-3 font-semibold">Slack</th>
                  <th className="px-4 py-3 font-semibold">Villages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([need, slack, villages]) => (
                  <tr
                    key={need}
                    className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-4 pr-4 font-medium">{need}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{slack}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-100">{villages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
          <article className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Search className="text-village-700 dark:text-village-300" size={24} />
            <h2 className="mt-4 text-lg font-semibold">
              Use Slack when the group is already organized.
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Slack is strong for teams that already share a company, project, or workflow.
            </p>
          </article>
          <article className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Users className="text-village-700 dark:text-village-300" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Use Villages when matching matters.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Villages helps learners find the right circle by goal, interest, level, and learning
              style.
            </p>
          </article>
          <article className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Sparkles className="text-village-700 dark:text-village-300" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Use Villages when the topic is hard.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Built-in AI turns confusing material into summaries, checklists, and next steps the
              group can discuss.
            </p>
          </article>
        </section>

        <section className="border-t border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">The short version</h2>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  'Slack is a general-purpose communication tool.',
                  'Villages is a learning community product with discovery, AI support, and group context built in.',
                  'If the goal is to help people learn together, Villages starts closer to the problem.',
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
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold">Try Villages for your learning group</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Start with an email link, then create or join a Village around the subject your
                group cares about.
              </p>
              <div className="mt-4">
                <MagicLinkSignup
                  source="slack_comparison"
                  buttonLabel="Send my join link"
                  compact
                />
              </div>
              <Link
                to="/compare/discord-vs-villages"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Compare Villages with Discord <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
