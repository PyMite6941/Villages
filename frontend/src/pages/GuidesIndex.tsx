import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  MessageSquareText,
  Sparkles,
  Users,
} from 'lucide-react'
import MagicLinkSignup from '../components/MagicLinkSignup'
import PublicNav from '../components/PublicNav'
import { track } from '../lib/analytics'
import { setFAQJsonLd, setPageMeta } from '../lib/pageMeta'

const guideCards = [
  {
    title: 'When learning groups outgrow scattered chat',
    audience:
      'For organizers whose learning community lives across Slack, Discord, Telegram, and old threads.',
    promise:
      'Find the point where chat stops being enough and the group needs a clearer learning home.',
    href: '/guides/learning-groups-scattered-chat',
    icon: MessageSquareText,
  },
  {
    title: 'Keep a learning group active after week one',
    audience:
      'For organizers whose group starts strong, then loses momentum after the first meeting.',
    promise:
      'Set a visible weekly rhythm around the next meeting, current blockers, and one shared action.',
    href: '/guides/keep-learning-group-active',
    icon: BookOpenCheck,
  },
  {
    title: 'Help members find the right learning circle',
    audience: 'For organizers whose members want to learn but cannot tell which circle fits them.',
    promise:
      'Turn broad interest into clear circles by naming topic, level, rhythm, owner, and next action.',
    href: '/guides/find-right-learning-circle',
    icon: Compass,
  },
  {
    title: 'Move a learning community out of chat',
    audience:
      'For organizers who want a clearer learning home without asking members to abandon chat overnight.',
    promise:
      'Move one active circle first, keep chat useful, and give members a simple first action.',
    href: '/guides/move-learning-community-out-of-chat',
    icon: Users,
  },
]

const chooserSteps = [
  [
    'Scattered discussion',
    'Start with the chat guide if members keep asking where resources, answers, or next steps live.',
  ],
  [
    'Weak discovery',
    'Start with the discovery guide if interested members still need an organizer to route them by hand.',
  ],
  [
    'Low follow-through',
    'Start with the follow-through guide if people join, attend once, and then quietly fade.',
  ],
  [
    'Migration risk',
    'Start with the migration guide if you already have chat activity but need a safer move into a learning home.',
  ],
]

const faqItems = [
  {
    question: 'Which Villages guide should organizers read first?',
    answer:
      'Start with the problem you see most often: scattered discussion, weak member discovery, or low follow-through after week one.',
  },
  {
    question: 'Do these guides require changing signup or pricing?',
    answer:
      'No. They are public guides that point organizers into the same Villages join path and current organizer pricing page.',
  },
  {
    question: 'Can organizers still use Slack or Discord?',
    answer:
      'Yes. The guides explain where chat can stay useful and where Villages gives learning groups a clearer home for circles, context, and next steps.',
  },
  {
    question: 'How should organizers move a group out of chat?',
    answer:
      'Start with one active learning circle, move durable context first, and keep chat available for quick conversation until the new habit is clear.',
  },
]

export default function GuidesIndex() {
  useEffect(() => {
    setPageMeta({
      title: 'Guides for learning-community organizers | Villages',
      description:
        'Villages guides for organizers working through scattered chat, weak member discovery, migration risk, and learning groups that lose momentum after week one.',
      canonicalPath: '/guides',
    })
    setFAQJsonLd('guides-index-faq-schema', faqItems)
    track('pain_page_viewed', { surface: 'guides_index' })
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicNav />
      <main>
        <section className="border-b border-amber-100 bg-gradient-to-b from-amber-50 to-white dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-village-700 dark:text-village-300">
                Guides for learning organizers
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 dark:text-white sm:text-5xl">
                Pick the guide for the learning-group problem in front of you.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                Villages is built for the moments when a learning community needs more than a busy
                chat feed: members need to find the right circle, keep context, and know what to do
                next.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/join" className="btn-primary inline-flex items-center gap-2">
                  Start through /join <ArrowRight size={16} />
                </Link>
                <Link to="/pricing" className="btn-secondary inline-flex items-center gap-2">
                  See the organizer path <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="rounded-md bg-village-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Sparkles size={24} />
                  <div>
                    <h2 className="text-lg font-semibold">Choose by the pain you see</h2>
                    <p className="mt-1 text-sm text-white/80">
                      One guide for the current blocker, not a pile of advice.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {chooserSteps.map(([title, text]) => (
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
            <h2 className="text-2xl font-bold">Four ways learning groups get stuck</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              Each guide focuses on a different organizer problem and points back to the same
              Villages path when the group needs a more durable home.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {guideCards.map((guide) => {
              const Icon = guide.icon
              return (
                <article
                  key={guide.href}
                  className="flex h-full flex-col rounded-lg border border-amber-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <Icon className="text-village-700 dark:text-village-300" size={24} />
                  <h3 className="mt-4 text-lg font-semibold">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {guide.audience}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-800 dark:text-gray-100">
                    {guide.promise}
                  </p>
                  <Link
                    to={guide.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
                  >
                    Read this guide <ArrowRight size={14} />
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Users className="text-village-700 dark:text-village-300" size={22} />
                <h2 className="text-2xl font-bold">Use the guides to choose the next promise</h2>
              </div>
              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                The current question is not whether organizers need another place to chat. It is
                which pain should lead first: scattered discussion, weak discovery, or low
                follow-through. These guides make each promise concrete enough to test.
              </p>
            </div>
            <div className="grid gap-3">
              {chooserSteps.map(([title, text]) => (
                <div key={title} className="rounded-md bg-amber-50 p-4 dark:bg-gray-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-village-700 dark:text-village-300"
                      size={16}
                    />
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h2 className="text-2xl font-bold">
              Start with one circle, then make the path visible
            </h2>
            <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
              If a guide matches what your group is feeling, start a Villages account and turn the
              current learning goal into one visible circle. Keep chat for quick conversation, and
              give the learning work a place members can return to.
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
                to="/compare/telegram-vs-villages"
                className="inline-flex items-center gap-1 text-sm font-medium text-village-700 hover:underline dark:text-village-300"
              >
                Compare with Telegram <ArrowRight size={14} />
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
            <h3 className="text-lg font-semibold">Start from the guide set</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Use an email link to start a Villages account, then create the first circle around the
              problem your organizer group is trying to solve.
            </p>
            <div className="mt-5">
              <MagicLinkSignup
                source="guides_index"
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
