import { Heart, Users, Sparkles, Shield } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center">
        <span className="text-6xl">🏘️</span>
        <h1 className="text-3xl font-bold text-village-800 mt-4">About Villages</h1>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          AI-powered community learning for students and adult learners — together.
        </p>
      </div>

      {/* Purpose */}
      <div className="card bg-gradient-to-br from-village-50 to-amber-50 border-village-200">
        <h2 className="font-semibold text-lg text-village-800 mb-3">Our Purpose</h2>
        <p className="text-gray-700 leading-relaxed">
          Villages was built for an AI competition under <strong>Brief 1 — Community Support & Understanding</strong>.
          The goal is to help people find support and understand complex information together, not alone.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          Whether you're a student preparing for exams, an adult navigating a career change, or a parent
          trying to understand new education standards — Villages brings together people with shared
          learning goals and uses AI to turn confusing information into clear, actionable steps.
        </p>
      </div>

      {/* How it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <Users size={28} className="text-village-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">Connect</h3>
          <p className="text-sm text-gray-500 mt-1">Join or create Villages with people who share your learning goals.</p>
        </div>
        <div className="card text-center">
          <Sparkles size={28} className="text-amber-500 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">Understand</h3>
          <p className="text-sm text-gray-500 mt-1">Use the Topic Explorer to turn any confusing topic into plain language, a checklist, and next steps.</p>
        </div>
        <div className="card text-center">
          <Heart size={28} className="text-red-400 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-800">Grow Together</h3>
          <p className="text-sm text-gray-500 mt-1">Learn collaboratively with AI-generated challenges, learning paths, and discussion prompts.</p>
        </div>
      </div>

      {/* AI & Ethics */}
      <div className="card border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} className="text-amber-600" />
          <h2 className="font-semibold text-lg">Responsible AI</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Villages uses AI as a <strong>tool to augment, not replace</strong> human connection. All AI-generated content
          is moderated for safety, accuracy, and inclusivity. The AI suggests — but humans decide.
          We believe the best learning happens when technology empowers communities, not isolates them.
        </p>
      </div>

      {/* Edit me — add your own story here */}
      <div className="card border-dashed border-2 border-gray-200 bg-gray-50 text-center py-8">
        <p className="text-sm text-gray-400 italic">
          ✏️ Your story goes here — why you built this, who it's for, what you hope to achieve.
        </p>
      </div>
    </div>
  )
}
