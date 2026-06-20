import MagicLinkSignup from '../components/MagicLinkSignup'

export default function Login() {
  return (
    <div className="h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-6xl">🏘️</span>
          <h1 className="text-3xl font-bold text-village-800 mt-3">Villages</h1>
          <p className="text-gray-600 mt-2 dark:text-gray-300">AI-powered community learning</p>
        </div>

        <div className="card">
          <MagicLinkSignup source="login_page" buttonLabel="Continue with email" />
        </div>
      </div>
    </div>
  )
}
