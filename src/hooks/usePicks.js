import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePicks(userId) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPicks = useCallback(async () => {
    if (!userId) { setPicks([]); setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .order('picked_at', { ascending: false })
    if (!error) setPicks(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchPicks() }, [fetchPicks])

  const addPick = async (entry) => {
    const row = {
      user_id: userId,
      entry_id: entry.id,
      entry_name: entry.name,
      entry_type: entry.type,   // 'pokemon' | 'trainer'
      sprite_url: entry.sprite,
      picked_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('picks').insert(row).select().single()
    if (!error) setPicks(prev => [data, ...prev])
    return { data, error }
  }

  const removePick = async (pickId) => {
    const { error } = await supabase.from('picks').delete().eq('id', pickId)
    if (!error) setPicks(prev => prev.filter(p => p.id !== pickId))
    return { error }
  }

  const resetAllPicks = async () => {
    const { error } = await supabase.from('picks').delete().eq('user_id', userId)
    if (!error) setPicks([])
    return { error }
  }

  return { picks, loading, addPick, removePick, resetAllPicks, refetch: fetchPicks }
}
