import { Link } from 'react-router-dom'
import { BookOpen, Users, Sparkles, Brain, MessageSquare, Shield, Mic, Settings as SettingsIcon, HelpCircle } from 'lucide-react'

const sections = [
  {
    icon: Users,
    title: 'Villages & Groups',
    items: [
      { q: 'What is a Village?', a: 'A Village is a small cohort (2–10 people) matched by AI based on your goals, academic level, and interests. Each Village has a focus area — it could be academic ("SAT Math"), skill-based ("Guitar Basics"), a hobby ("Gardening Tips"), or anything a group wants to learn or discuss together.' },
      { q: 'How do I get matched to a Village?', a: 'Complete your profile on the Onboarding page (especially goals, academic level, and interests). Then visit the Villages page and click "Match Me" — the AI will find the best fit. You can also browse and join villages manually.' },
      { q: 'Can I create my own Village?', a: 'Yes! Click "Create Village" on the Villages page. You become the chief and can set the name, focus area, max members, and whether it\'s private (invite-only) or public.' },
      { q: 'What happens at 100 members?', a: 'Once a Village reaches 100 members, it automatically becomes public (invite code is cleared), so anyone can find and join it.' },
      { q: 'What is the member capacity?', a: 'Each Village has a max_members cap (default 10). The chief can change this in Village Settings (up or down, but not below the current member count).' },
    ],
  },
  {
    icon: Sparkles,
    title: 'Village Elder (AI)',
    items: [
      { q: 'What is the Village Elder?', a: 'The Village Elder is an AI that can generate discussion prompts, create study challenges, explain topics, and generate learning paths for your Village. Click "Ask Village Elder" on any Village page.' },
      { q: 'How do I get a study challenge?', a: 'On a Village page, type a subject into the Challenge input and click "Challenge". The AI generates a collaborative challenge your group can work on together. Mark it done when you complete it.' },
      { q: 'How do Topic Explanations work?', a: 'Go to Home → Topic Explorer. Type any confusing topic (e.g. "quantum entanglement" or "how interest rates work") and click Explain. The AI breaks it into plain language, key points, a checklist, and next steps.' },
      { q: 'What are Learning Paths?', a: 'A Learning Path is an AI-generated study roadmap for your Village. Go to a Village and click the "Learning Path" tab. The AI considers your Village\'s focus area, resources, and members\' interests to create a step-by-step plan.' },
    ],
  },
  {
    icon: Brain,
    title: 'Study Hub',
    items: [
      { q: 'What tools are in the Study Hub?', a: 'Study Hub has 4 tools: Study Buddy (Socratic tutor), Essay Coach (feedback on writing), Study Planner (weekly study schedule), and College Prep (college admissions guidance). Some tools are gated by academic level.' },
      { q: 'Why is a Study Hub tab locked?', a: 'Essay Coach requires a school academic level (6th Grade through University). College Prep requires 11th/12th grade or "High Schooler" enabled in your profile. Update your academic level in Profile to unlock them.' },
      { q: 'How do I use Study Buddy?', a: 'Select a subject and type a question or concept you\'re stuck on. The AI responds Socratically — asking guiding questions instead of just giving answers, to help you learn deeply.' },
      { q: 'How does GPA Planner work?', a: 'List your current courses and grades, set a target GPA, and the AI calculates what grades you need and gives weekly study recommendations. Only available for school-level users.' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Courses',
    items: [
      { q: 'What kinds of courses are available?', a: 'Courses cover many subjects (Math, Science, Language, History, Test Prep, etc.) across 3 difficulty levels (beginner, intermediate, advanced). Some are taught by verified teachers.' },
      { q: 'How do I enroll in a course?', a: 'Click on any course card, then click "Enroll". You can track your progress through lessons. Completed lessons are marked automatically.' },
      { q: 'Can I become a teacher?', a: 'Yes! Go to your Profile and click "Apply to Teach". Fill in your degree and subject area. Once verified (manual review), you can create courses with lessons, quizzes, and office hours.' },
      { q: 'What are Office Hours?', a: 'Teachers can set weekly office hours (day, time, location/meeting link). Enrolled students can see them on the course detail page.' },
    ],
  },
  {
    icon: MessageSquare,
    title: 'Discussion & Chat',
    items: [
      { q: 'What is the difference between Discussion and Chat?', a: 'Discussion is the forum-style tab — longer posts with upvotes and threaded comments. Chat is a real-time message feed for quick questions, code sharing, and links.' },
      { q: 'How do I upvote a post?', a: 'Click the upvote button (▲) on any post in the Discussion tab. Upvotes help surface the most helpful content.' },
      { q: 'What does "Live" mean?', a: 'The green "Live" badge means real-time subscriptions are active — new posts and messages appear instantly without refreshing.' },
    ],
  },
  {
    icon: Shield,
    title: 'Moderation & Safety',
    items: [
      { q: 'Who moderates content?', a: 'The platform has automated AI content moderation that flags inappropriate posts and comments. Village chiefs (creators) can also mute/kick/ban members and manage settings.' },
      { q: 'What can a Village chief do?', a: 'Chiefs can: change village name/description/capacity, toggle AI moderation on/off, mute members for 24 hours, kick members from the village, and ban users permanently.' },
      { q: 'What happens when I\'m muted?', a: 'You can still view the village but cannot post or chat for 24 hours. The chief can unmute you early.' },
      { q: 'What is AI auto-moderation?', a: 'Every post and comment is checked by an AI content moderator. Flagged content is rejected with an explanation. Chiefs can disable this in Village Settings (not recommended).' },
    ],
  },
  {
    icon: Mic,
    title: 'Voice & Accessibility',
    items: [
      { q: 'How do I use voice chat?', a: 'On any Village page, click "Join Voice" to enter the real-time voice channel. Your browser will ask for microphone access. Click "Leave Voice" to disconnect.' },
      { q: 'How does Text-to-Speech work?', a: 'Go to Settings → Accessibility → Text-to-Speech. You can choose a voice (varies by browser) and click the speaker icon next to any post or explanation to hear it read aloud.' },
      { q: 'What accessibility features exist?', a: 'Settings provides: Dark Mode toggle, Reduced Motion (disables animations), Dyslexic Font (Lexend), and Text-to-Speech with voice selection.' },
    ],
  },
  {
    icon: SettingsIcon,
    title: 'Account & Profile',
    items: [
      { q: 'How do I edit my profile?', a: 'Go to Profile and click "Edit Profile". You can change your display name, academic level, goals, interests, and learning style. Custom goals can be added via the text input.' },
      { q: 'How does the AI match me?', a: 'The matching AI considers your academic level, goals, interests, learning style, and study tags to find the best-fit Village. The more complete your profile, the better the match.' },
      { q: 'I\'m an adult learner — is this platform for me?', a: 'Yes! Villages supports all learners. Set your academic level to "Adult Learner", choose your learning style, and add your interests. The AI will match you to appropriate villages and learning content.' },
      { q: 'How do I sign out?', a: 'Click the Log Out icon (top-right corner of the header) or go to Settings → Sign Out.' },
    ],
  },
]

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle size={24} className="text-village-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help & FAQ</h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Everything you need to know about using Villages. If you don't find your answer here, reach out through the community.
      </p>
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={18} className="text-village-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <details key={item.q} className="card py-3 px-4 group">
                  <summary className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer list-none flex items-center gap-2">
                    <span className="text-village-500 group-open:rotate-90 transition-transform text-xs">▶</span>
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-5">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        )
      })}
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        Still have questions? Ask in the <Link to="/forum" className="text-village-600 dark:text-village-300 hover:underline">Forum</Link> or visit your <Link to="/profile" className="text-village-600 dark:text-village-300 hover:underline">Profile</Link> to update your settings.
      </div>
    </div>
  )
}
