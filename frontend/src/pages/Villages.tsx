import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Village } from '../types'
import VillageCard from '../components/VillageCard'
import { Plus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function Villages() {
  const navigate = useNavigate()
  const [villages, setVillages] = useState<Village[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentVillageId, setCurrentVillageId] = useState<string | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newVillage, setNewVillage] = useState({ name: '', description: '', focus_area: '', resources: '', is_private: false })
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joiningCode, setJoiningCode] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profile = await api.users.getProfile(user.id).catch(() => null)
        setCurrentVillageId(profile?.village_id)
      }
      const data = await api.villages.list(undefined, search || undefined)
      setVillages(data)
      setLoading(false)
    }
    load()
  }, [search])

  const handleJoin = async (villageId: string) => {
    try {
      const result = await api.villages.join(villageId)
      toast.success(result.message)
      navigate(`/villages/${villageId}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not join village')
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const v = await api.villages.create({
        ...newVillage,
        resources: newVillage.resources.split(',').map((r) => r.trim()).filter(Boolean),
      })
      setVillages((prev) => [...prev, v])
      setShowCreate(false)
      setNewVillage({ name: '', description: '', focus_area: '', resources: '', is_private: false })
      if (v.is_private && v.invite_code) {
        toast.success(`Village "${v.name}" created! Invite code: ${v.invite_code}`)
      } else {
        toast.success(`Village "${v.name}" created!`)
      }
      navigate(`/villages/${v.id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not create village')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    setJoiningCode(true)
    try {
      const result = await api.villages.joinByCode(joinCode.trim())
      setShowJoinCode(false)
      setJoinCode('')
      toast.success(result.message)
      navigate(`/villages/${result.village_id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Invalid code')
    } finally {
      setJoiningCode(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Villages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find your study community</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowJoinCode(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <span className="text-xs">🔑</span> Join with Code
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Village
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card mb-6 border-village-200">
          <h2 className="font-semibold mb-4">Create a new Village</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Village name</label>
              <input value={newVillage.name} onChange={(e) => setNewVillage((p) => ({ ...p, name: e.target.value }))} className="input" placeholder="AP Calc Warriors" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Focus area</label>
              <input value={newVillage.focus_area} onChange={(e) => setNewVillage((p) => ({ ...p, focus_area: e.target.value }))} className="input" placeholder="AP Calculus AB" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea value={newVillage.description} onChange={(e) => setNewVillage((p) => ({ ...p, description: e.target.value }))} className="input resize-none" rows={2} placeholder="What's this village about?" />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Resources (comma-separated)</label>
            <input value={newVillage.resources} onChange={(e) => setNewVillage((p) => ({ ...p, resources: e.target.value }))} className="input" placeholder="Limits, Derivatives, Integrals" />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newVillage.is_private}
                onChange={(e) => setNewVillage((p) => ({ ...p, is_private: e.target.checked }))}
                className="rounded border-gray-300 text-village-600 focus:ring-village-400"
              />
              <span className="text-sm text-gray-700">Private village (invite only)</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !newVillage.name || !newVillage.focus_area} className="btn-primary flex-1">
              {creating ? 'Creating...' : 'Create Village'}
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Search villages by name or subject..." />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading villages...</p>
      ) : villages.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No villages found. Create the first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map((v) => <VillageCard key={v.id} village={v} onJoin={handleJoin} currentVillageId={currentVillageId} />)}
        </div>
      )}

      {/* Join by code modal */}
      {showJoinCode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm dark:bg-gray-900">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Join a Private Village</h2>
              <button onClick={() => setShowJoinCode(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Enter the invite code shared by the village chief.</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12345"
                className="input text-center text-lg tracking-widest font-mono"
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowJoinCode(false)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button onClick={handleJoinByCode} disabled={joiningCode || joinCode.trim().length < 4} className="btn-primary flex-1 text-sm">
                  {joiningCode ? 'Joining...' : 'Join Village'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
