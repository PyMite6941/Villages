import { Link } from 'react-router-dom'
import { Users, BookOpen } from 'lucide-react'
import type { Village } from '../types'

interface Props {
  village: Village
  onJoin?: (id: string) => void
  currentVillageId?: string
}

export default function VillageCard({ village, onJoin, currentVillageId }: Props) {
  const isFull = village.member_count >= village.max_members
  const isCurrentVillage = currentVillageId === village.id

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{village.name}</h3>
          <span className="badge bg-village-100 text-village-700 mt-1">{village.focus_area}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users size={12} className="text-gray-400" />
          <span>{village.member_count}/{village.max_members}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{village.description}</p>

      {village.resources.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <BookOpen size={12} className="text-gray-400" />
          {village.resources.slice(0, 3).map((r) => (
            <span key={r} className="badge bg-amber-50 text-amber-700">{r}</span>
          ))}
          {village.resources.length > 3 && (
            <span className="text-xs text-gray-400">+{village.resources.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Link to={`/villages/${village.id}`} className="btn-secondary text-sm flex-1 text-center">
          View
        </Link>
        {!isCurrentVillage && onJoin && (
          <button
            onClick={() => onJoin(village.id)}
            disabled={isFull}
            className="btn-primary text-sm flex-1 disabled:opacity-50"
          >
            {isFull ? 'Full' : 'Join'}
          </button>
        )}
        {isCurrentVillage && (
          <span className="btn-secondary text-sm flex-1 text-center text-village-600 font-semibold">
            Your Village
          </span>
        )}
      </div>
    </div>
  )
}
