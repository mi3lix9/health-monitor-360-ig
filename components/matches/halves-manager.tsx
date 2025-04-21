"use client"

import { useState } from "react"
import { useHalvesForMatch, useAddHalf, useUpdateHalf, useDeleteHalf } from "@/lib/react-query-hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, Clock, Save, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type HalvesManagerProps = {
  matchId: string
}

export function HalvesManager({ matchId }: HalvesManagerProps) {
  const { data: halves, isLoading } = useHalvesForMatch(matchId)
  const [isAddingHalf, setIsAddingHalf] = useState(false)
  const [editingHalfId, setEditingHalfId] = useState<string | null>(null)
  const [newHalfNumber, setNewHalfNumber] = useState(1)
  const [newHalfNotes, setNewHalfNotes] = useState("")
  const [editHalfNotes, setEditHalfNotes] = useState("")

  const addHalfMutation = useAddHalf()
  const updateHalfMutation = useUpdateHalf()
  const deleteHalfMutation = useDeleteHalf()

  // Handle adding a new half
  const handleAddHalf = async () => {
    try {
      await addHalfMutation.mutateAsync({
        match_id: matchId,
        half_number: newHalfNumber,
        notes: newHalfNotes || undefined,
      })

      toast({
        title: "Half added",
        description: `Half ${newHalfNumber} has been added successfully.`,
      })

      setIsAddingHalf(false)
      setNewHalfNumber(halves ? Math.max(...halves.map((h) => h.half_number)) + 1 : 1)
      setNewHalfNotes("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add half.",
        variant: "destructive",
      })
    }
  }

  // Handle updating a half
  const handleUpdateHalf = async (halfId: string) => {
    try {
      await updateHalfMutation.mutateAsync({
        halfId,
        updates: {
          notes: editHalfNotes,
        },
      })

      toast({
        title: "Half updated",
        description: "The half has been updated successfully.",
      })

      setEditingHalfId(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update half.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a half
  const handleDeleteHalf = async (halfId: string) => {
    try {
      await deleteHalfMutation.mutateAsync({ halfId, matchId })

      toast({
        title: "Half deleted",
        description: "The half has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete half.",
        variant: "destructive",
      })
    }
  }

  // Start editing a half
  const startEditing = (half: any) => {
    setEditingHalfId(half.id)
    setEditHalfNotes(half.notes || "")
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingHalfId(null)
  }

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Halves</CardTitle>
        <CardDescription>Manage the halves for this match</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {halves && halves.length > 0 ? (
            halves.map((half) => (
              <Card key={half.id}>
                <CardContent className="p-4">
                  {editingHalfId === half.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Half {half.half_number}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateHalf(half.id)}
                            disabled={updateHalfMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea
                          value={editHalfNotes}
                          onChange={(e) => setEditHalfNotes(e.target.value)}
                          placeholder="Enter notes for this half"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Half {half.half_number}</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(half)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete Half {half.half_number} and all associated readings. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteHalf(half.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {half.start_time && (
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Started: {format(new Date(half.start_time), "PPp")}
                              {half.end_time && ` - Ended: ${format(new Date(half.end_time), "PPp")}`}
                            </span>
                          </div>
                        )}
                        {half.notes && <p className="mt-2">{half.notes}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No halves have been added yet. Add a half to track player health during specific periods of the match.
            </div>
          )}

          {isAddingHalf ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Add New Half</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleAddHalf} disabled={addHalfMutation.isPending}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingHalf(false)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Half Number</label>
                    <Input
                      type="number"
                      value={newHalfNumber}
                      onChange={(e) => setNewHalfNumber(Number.parseInt(e.target.value))}
                      min={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={newHalfNotes}
                      onChange={(e) => setNewHalfNotes(e.target.value)}
                      placeholder="Enter notes for this half"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAddingHalf(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Half
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
