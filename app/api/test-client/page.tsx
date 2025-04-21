"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from "@/app/dashboard-layout";
import { PlayerOptions } from "@/components/player-options";

export default function TestClientPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    player_id: "",
    temperature: 37.0,
    heart_rate: 75,
    blood_oxygen: 98,
    hydration: 85,
    respiration: 16,
    fatigue: 15,
    half_id: "e50b32a4-9fc2-444c-a7df-4aa3f7217dea",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "player_id" ? value : Number.parseFloat(value),
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      player_id: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Reading sent successfully",
          description: "The health reading has been added to the database.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send reading",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Test API Client</h2>
      </div>

      <div className="mt-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send Health Reading</CardTitle>
            <CardDescription>
              Use this form to simulate sending health readings via the API
              endpoint
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player_id">Player ID</Label>
                <Select
                  onValueChange={handleSelectChange}
                  value={formData.player_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                  <SelectContent>
                    <PlayerOptions />
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  step="0.1"
                  min="35"
                  max="42"
                  value={formData.temperature}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (BPM)</Label>
                <Input
                  id="heart_rate"
                  name="heart_rate"
                  type="number"
                  min="40"
                  max="200"
                  value={formData.heart_rate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_oxygen">Blood Oxygen (%)</Label>
                <Input
                  id="blood_oxygen"
                  name="blood_oxygen"
                  type="number"
                  min="80"
                  max="100"
                  value={formData.blood_oxygen}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hydration">Hydration (%)</Label>
                <Input
                  id="hydration"
                  name="hydration"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.hydration}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respiration">Respiration (breaths/min)</Label>
                <Input
                  id="respiration"
                  name="respiration"
                  type="number"
                  min="8"
                  max="30"
                  value={formData.respiration}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatigue">Fatigue (0-100)</Label>
                <Input
                  id="fatigue"
                  name="fatigue"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fatigue}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !formData.player_id}>
                {loading ? "Sending..." : "Send Reading"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
