"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { useAddHealthReading, useMatches } from "@/lib/react-query-hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { getBrowserClient } from "@/lib/supabase"

const formSchema = z.object({
  temperature: z.coerce.number().min(35).max(42),
  heart_rate: z.coerce.number().min(40).max(200),
  blood_oxygen: z.coerce.number().min(80).max(100),
  hydration: z.coerce.number().min(0).max(100),
  respiration: z.coerce.number().min(8).max(30),
  fatigue: z.coerce.number().min(0).max(100),
  half_id: z.string().optional(),
})

type AddReadingFormProps = {
  playerId: string
}

export function AddReadingForm({ playerId }: AddReadingFormProps) {
  const addHealthReadingMutation = useAddHealthReading()
  const { data: matches } = useMatches()
  const [activeHalves, setActiveHalves] = useState<Array<{ id: string; match_name: string; half_number: number }>>([])
  const [isLoadingHalves, setIsLoadingHalves] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: 37,
      heart_rate: 75,
      blood_oxygen: 98,
      hydration: 85,
      respiration: 16,
      fatigue: 20,
      half_id: undefined,
    },
  })

  // Fetch active halves (from matches in progress)
  useEffect(() => {
    const fetchActiveHalves = async () => {
      try {
        setIsLoadingHalves(true)
        const supabase = getBrowserClient()

        // Get matches that are in progress
        const { data: inProgressMatches } = await supabase
          .from("matches")
          .select("id, name")
          .eq("status", "in_progress")

        if (!inProgressMatches || inProgressMatches.length === 0) {
          setActiveHalves([])
          setIsLoadingHalves(false)
          return
        }

        // Get halves for these matches
        const matchIds = inProgressMatches.map((match) => match.id)
        const { data: halves } = await supabase
          .from("halves")
          .select("id, match_id, half_number")
          .in("match_id", matchIds)
          .is("end_time", null) // Only get halves that haven't ended

        if (!halves || halves.length === 0) {
          setActiveHalves([])
          setIsLoadingHalves(false)
          return
        }

        // Format the halves with match names
        const formattedHalves = halves.map((half) => {
          const match = inProgressMatches.find((m) => m.id === half.match_id)
          return {
            id: half.id,
            match_name: match ? match.name : "Unknown Match",
            half_number: half.half_number,
          }
        })

        setActiveHalves(formattedHalves)
      } catch (error) {
        console.error("Error fetching active halves:", error)
      } finally {
        setIsLoadingHalves(false)
      }
    }

    fetchActiveHalves()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addHealthReadingMutation.mutateAsync({
        playerId,
        reading: {
          temperature: values.temperature,
          heart_rate: values.heart_rate,
          blood_oxygen: values.blood_oxygen,
          hydration: values.hydration,
          respiration: values.respiration,
          fatigue: values.fatigue,
        },
        halfId: values.half_id,
      })

      toast({
        title: "Reading added",
        description: "The health reading has been added successfully.",
      })

      // Reset form
      form.reset({
        temperature: 37,
        heart_rate: 75,
        blood_oxygen: 98,
        hydration: 85,
        respiration: 16,
        fatigue: 20,
        half_id: undefined,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add health reading.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Health Reading</CardTitle>
        <CardDescription>Enter the latest health metrics for this player</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Match Half Selection */}
            <FormField
              control={form.control}
              name="half_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Half</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a match half (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No match half (general reading)</SelectItem>
                      {activeHalves.map((half) => (
                        <SelectItem key={half.id} value={half.id}>
                          {half.match_name} - Half {half.half_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {activeHalves.length > 0
                      ? "Select which match half this reading is for"
                      : "No active match halves available"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={35}
                        max={42}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" step={0.1} />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 36.5-37.5°C</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heart_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heart Rate (BPM)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={40}
                        max={200}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 60-100 BPM</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="blood_oxygen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Oxygen (%)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={80}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 95-100%</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hydration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hydration (%)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 70-100%</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="respiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respiration (breaths/min)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={8}
                        max={30}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 12-20 breaths/min</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fatigue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fatigue (0-100)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <Input type="number" {...field} className="w-20" />
                    </div>
                  </FormControl>
                  <FormDescription>Normal range: 0-30</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={addHealthReadingMutation.isPending}>
              {addHealthReadingMutation.isPending ? "Submitting..." : "Add Reading"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
