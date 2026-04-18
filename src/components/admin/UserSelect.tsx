import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, User, X, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Profile {
  id: string
  email: string
  full_name: string | null
}

interface UserSelectProps {
  onSelect: (userId: string | null) => void
  selectedUserId: string | null
  label?: string
}

export default function UserSelect({ onSelect, selectedUserId, label = "Assign to User" }: UserSelectProps) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch initial selected user if exists
  useEffect(() => {
    if (selectedUserId && !selectedUser) {
      supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', selectedUserId)
        .single()
        .then(({ data }) => {
          if (data) setSelectedUser(data)
        })
    }
  }, [selectedUserId])

  // Search logic
  useEffect(() => {
    if (search.length < 2) {
      setUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(5)
      
      setUsers(data ?? [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (user: Profile) => {
    setSelectedUser(user)
    onSelect(user.id)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    setSelectedUser(null)
    onSelect(null)
    setSearch('')
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-[11px] font-black uppercase tracking-widest text-muted">
        {label}
      </label>
      
      <div className="relative">
        {selectedUser ? (
          <div className="flex items-center justify-between px-4 py-2.5 bg-navy/5 border border-navy/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                <User className="w-4 h-4 text-navy" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">
                  {selectedUser.full_name || 'Unnamed User'}
                </p>
                <p className="text-[11px] text-muted">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1 hover:bg-navy/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search user by email or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-overlay rounded-xl text-sm focus:border-navy/30 focus:outline-none transition-all"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy animate-spin" />
            )}
          </div>
        )}

        <AnimatePresence>
          {isOpen && search.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white border border-overlay rounded-2xl shadow-xl overflow-hidden"
            >
              {users.length > 0 ? (
                <div className="p-1">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelect(user)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-low transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center">
                          <User className="w-4 h-4 text-muted" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-[11px] text-muted">{user.email}</p>
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <Check className="w-4 h-4 text-navy" />
                      )}
                    </button>
                  ))}
                </div>
              ) : !loading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted italic">No users found</p>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
