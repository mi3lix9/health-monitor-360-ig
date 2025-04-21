"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, Play, RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react"
import {
  getRetryQueueStats,
  getRetryQueueItems,
  resetRetryQueueItem,
  deleteRetryQueueItem,
  processRetryQueue,
} from "@/lib/retry-queue-service"
import type { RetryQueueItem, RetryQueueStats } from "@/types"

export function RetryQueueDashboard() {
  const [stats, setStats] = useState<RetryQueueStats | null>(null)
  const [items, setItems] = useState<RetryQueueItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [currentStatus, setCurrentStatus] = useState<"all" | "pending" | "processing" | "completed" | "failed">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Load initial data
  useEffect(() => {
    loadData()
  }, [currentStatus, currentPage])

  // Load data function
  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get stats
      try {
        const statsData = await getRetryQueueStats()
        setStats(statsData)
      } catch (statsError) {
        console.error("Error loading retry queue stats:", statsError)
        toast({
          title: "Error",
          description: "Failed to load retry queue statistics",
          variant: "destructive",
        })
        setStats({
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          total: 0,
        })
      }

      // Get items
      try {
        const { items: queueItems, count } = await getRetryQueueItems(currentStatus, currentPage, pageSize)
        setItems(queueItems)
        setTotalItems(count)
      } catch (itemsError) {
        console.error("Error loading retry queue items:", itemsError)
        toast({
          title: "Error",
          description: "Failed to load retry queue items",
          variant: "destructive",
        })
        setItems([])
        setTotalItems(0)
        setError(itemsError instanceof Error ? itemsError : new Error("Failed to load retry queue items"))
      }
    } catch (error) {
      console.error("Error loading retry queue data:", error)
      toast({
        title: "Error",
        description: "Failed to load retry queue data",
        variant: "destructive",
      })
      setError(error instanceof Error ? error : new Error("Failed to load retry queue data"))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      await loadData()
      toast({
        title: "Refreshed",
        description: "Retry queue data has been refreshed",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      })
      setError(error instanceof Error ? error : new Error("Failed to refresh data"))
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle process queue
  const handleProcessQueue = async () => {
    try {
      setIsProcessing(true)
      setError(null)
      const result = await processRetryQueue(5)

      toast({
        title: "Queue Processed",
        description: `Processed ${result.processed} items: ${result.succeeded} succeeded, ${result.failed} failed`,
      })

      // Refresh data
      await loadData()
    } catch (error) {
      console.error("Error processing queue:", error)
      toast({
        title: "Error",
        description: "Failed to process queue",
        variant: "destructive",
      })
      setError(error instanceof Error ? error : new Error("Failed to process queue"))
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle reset item
  const handleResetItem = async (id: number) => {
    try {
      setError(null)
      const success = await resetRetryQueueItem(id)

      if (success) {
        toast({
          title: "Item Reset",
          description: "The item has been reset and will be retried",
        })

        // Refresh data
        await loadData()
      } else {
        throw new Error("Failed to reset item")
      }
    } catch (error) {
      console.error("Error resetting item:", error)
      toast({
        title: "Error",
        description: "Failed to reset item",
        variant: "destructive",
      })
      setError(error instanceof Error ? error : new Error("Failed to reset item"))
    }
  }

  // Handle delete item
  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    try {
      setError(null)
      const success = await deleteRetryQueueItem(id)

      if (success) {
        toast({
          title: "Item Deleted",
          description: "The item has been deleted from the queue",
        })

        // Refresh data
        await loadData()
      } else {
        throw new Error("Failed to delete item")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
      setError(error instanceof Error ? error : new Error("Failed to delete item"))
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize)

  // Show error state if there's an error
  if (error && !isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600 mb-4">
          <XCircle className="h-8 w-8 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading Retry Queue</h3>
          <p className="text-sm">{error.message}</p>
        </div>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          <>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[100px] w-full" />
              ))}
          </>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All retry queue items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Waiting to be processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <p className="text-xs text-muted-foreground">Currently being processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Successfully processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">Failed after max attempts</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="md:col-span-5">
            <CardContent className="py-6">
              <div className="text-center text-muted-foreground">No data available</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleProcessQueue}
            disabled={isProcessing || (stats && stats.pending === 0)}
          >
            <Play className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {!isLoading && `Showing ${items.length} of ${totalItems} items`}
        </div>
      </div>

      {/* Tabs and Table */}
      <Tabs
        defaultValue="all"
        value={currentStatus}
        onValueChange={(value) => {
          setCurrentStatus(value as any)
          setCurrentPage(1)
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={currentStatus} className="mt-6">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : items.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reading ID</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last Error</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Next Retry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="font-mono text-xs">{item.reading_id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          {item.attempts} / {item.max_attempts}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.last_error ? (
                            <span title={item.last_error}>{item.last_error.substring(0, 30)}...</span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>{item.status === "pending" ? formatDate(item.next_retry_at) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetItem(item.id)}
                                title="Reset and retry"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-muted-foreground">
                  No {currentStatus !== "all" ? currentStatus : ""} items found in the retry queue
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
