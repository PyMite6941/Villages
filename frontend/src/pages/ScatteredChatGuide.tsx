import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Map,
  MessageSquareText,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const painPoints = [
  {
    title: 'People ask where to start',
    text: 'A new member joins the chat, sees years of threads, and still has to ask which group fits their level and goal.',
    icon: Search,
  },
  {
    title: 'Good answers disappear',
    text: 'Helpful explanations, examples, and next steps get buried between announcements, side conversations, and old channel names.',
    icon: MessageSquareText,
  },
  {
    title: 'Organizers become the directory',
    text: 'The person running the group ends up matching people by hand, repeating context, and reminding members where things live.',
    icon: Users,
  },
]

const comparisonRows = [
  [
    'Discovery',
    'Pinned posts, channel names, or manual invites',
    'Villages organized around topics, goals, and learning circles',
  ],
  [
    'Context',
    'Threads, files, and decisions split across chat history',
    'Discussions, challenges, and AI help beside the Village',
  ],
  [
    'Next steps',
    'Depends on whoever replies in the moment',
    'Plain-language summaries, checklists, and prompts for the group',
  ],
]

const faqItems = [
  {
    question: 'Do learning groups need to leave Slack or Discord right away?',
    answer:
      'No. A group can use Villages for discovery, learning context, and focused circles while chat remains useful for announcements.',
  },
  {
    question: 'What makes Villages different from a channel list?',
    answer:
      'Villages starts with the learner goal, the circle, and the topic. Members do not have to infer the right place from channel names alone.',
  },
  {
    question: 'Who is this for first?',
    answer:
      'Organizers of student groups, local cohorts, clubs, and interest communities where members need help finding the right learning circle.',
  },
]

export default function ScatteredChatGuide() {
  useEffect(() => {
    setPageMeta({
      title: 'When learning groups outgrow scattered chat | Villages',
      description:
        'A guide for organizers whose learning communities are spread across Slack, Discord, Telegram, and old threads, with a focused Villages path forward.',
      canonicalPath: '/guides/learning-groups-scattered-chat',
    })
    setFAQJsonLd('scattered-chat-guide-faq-schema', faqItems)
    track('pain_page_viewed', { surface: 'scattered_chat_guide' })
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
                When learning groups outgrow scattered chat threads
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Slack, Discord, and Telegram are useful for quick conversation. Learning communities
                start to strain when members cannot tell which group fits, where the best
                explanations live, or what to do next.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                  Start through /join <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guides/find-right-learning-circle"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Help members find the right circle <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guides/keep-learning-group-active"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Keep groups active <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guides/move-learning-community-out-of-chat"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Plan the move out of chat <ArrowRight size={16} />
                </Link>
                <Link
                  to="/compare/slack-vs-villages"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Compare with Slack <ArrowRight size={16} />
                </Link>
                <Link
                  to="/compare/discord-vs-villages"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Compare with Discord <ArrowRight size={16} />
                </Link>
                <Link
                  to="/compare/telegram-vs-villages"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Compare with Telegram <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Map size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">The scattered-chat pattern</h2>
                    <p className="mt-1 text-sm text-white/80">
                      A community has activity, but no clear learning map.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  'A member asks the same beginner question for the third time.',
                  'The useful answer is somewhere in a thread from last month.',
                  'The organizer has to point people to the right channel by hand.',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                      size={16}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold">The problem is not that chat is bad.</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              The problem is that a learning community needs more structure than a fast feed. People
              need a visible place to find the right circle, understand the topic, and keep going
              after the first reply.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {painPoints.map((item) => {
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
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-12 sm:px-6">
            <div className="mb-6 flex items-center gap-2">
              <ClipboardList className="text-village-700 dark:text-village-300" size={22} />
              <h2 className="text-2xl font-bold">
                What changes when the group has a learning home
              </h2>
            </div>
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-amber-100 dark:border-gray-800">
                  <th className="py-3 pr-4 font-semibold">Need</th>
                  <th className="px-4 py-3 font-semibold">Scattered chat</th>
                  <th className="px-4 py-3 font-semibold">Villages</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([need, scattered, villages]) => (
                  <tr
                    key={need}
                    className="border-b border-amber-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-4 pr-4 font-medium">{need}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300">{scattered}</td>
                    <td className="px-4 py-4 text-gray-800 dark:text-gray-100">{villages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-village-700 dark:text-village-300" size={22} />
              <h2 className="text-2xl font-bold">Where Villages fits</h2>
            </div>
            <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
              Villages gives organizers a focused layer for learning: members find or create a
              Village by topic, use public or private access, and use AI help to turn confusing
              material into clear next steps.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                Join Villages <ArrowRight size={16} />
              </Link>
              <Link
                to="/guides/move-learning-community-out-of-chat"
                className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Plan the move out of chat <ArrowRight size={14} />
              </Link>
              <Link
                to="/guides/find-right-learning-circle"
                className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Help members find the right circle <ArrowRight size={14} />
              </Link>
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
                Read the Slack comparison <ArrowRight size={14} />
              </Link>
              <Link
                to="/compare/discord-vs-villages"
                className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Read the Discord comparison <ArrowRight size={14} />
              </Link>
              <Link
                to="/compare/telegram-vs-villages"
                className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Read the Telegram comparison <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <article className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
              <h3 className="text-lg font-semibold">Try Villages from this guide</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Start with an email link, then create or join a Village around the group you are
                trying to organize.
              </p>
              <div className="mt-4">
                <MagicLinkSignup
                  source="scattered_chat_guide"
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
        </section>
      </main>
    </div>
  )
}
