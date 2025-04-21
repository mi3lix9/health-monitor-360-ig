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
import { useAddHealthReading, useHalvesForMatch } from "@/lib/react-query-hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  temperature: z.coerce.number().min(35).max(42),
  heart_rate: z.coerce.number().min(40).max(200),
  blood_oxygen: z.coerce.number().min(80).max(100),
  hydration: z.coerce.number().min(0).max(100),
  respiration: z.coerce.number().min(8).max(30),
  fatigue: z.coerce.number().min(0).max(100),
  half_id: z.string().optional(),
})

type AddReadingWithHalfFormProps = {
  playerId: string
  matchId?: string
}

export function AddReadingWithHalfForm({ playerId, matchId }: AddReadingWithHalfFormProps) {
  const addHealthReadingMutation = useAddHealthReading()
  const { data: halves, isLoading: isLoadingHalves } = useHalvesForMatch(matchId || "")

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { half_id, ...readingValues } = values

      await addHealthReadingMutation.mutateAsync({
        playerId,
        reading: readingValues,
        halfId: half_id,
      })

      toast({
        title: "Reading added",
        description: "The health reading has been added successfully.",
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
            {matchId && (
              <FormField
                control={form.control}
                name="half_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Half</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a half" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (General Reading)</SelectItem>
                        {halves?.map((half) => (
                          <SelectItem key={half.id} value={half.id}>
                            Half {half.half_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select which half of the match this reading is for</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
