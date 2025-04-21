"use client"

import { useState, useEffect } from "react"
import { SelectItem } from "@/components/ui/select"
import { getBrowserClient } from "@/lib/supabase"

export function PlayerOptions() {
  const [players, setPlayers] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const supabase = getBrowserClient()
        const { data } = await supabase.from("players").select("id, name").order("name")

        if (data) {
          setPlayers(data)
        }
      } catch (error) {
        console.error("Error fetching players:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  if (loading) {
    return <SelectItem value="loading">Loading players...</SelectItem>
  }

  if (players.length === 0) {
    return <SelectItem value="none">No players found</SelectItem>
  }

  return (
    <>
      {players.map((player) => (
        <SelectItem key={player.id} value={player.id}>
          {player.name}
        </SelectItem>
      ))}
    </>
  )
}
