import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      alert: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  },
  defaultVariants: {
    status: "normal",
  },
})

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string
  status: "normal" | "warning" | "alert"
}

export function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {status === "normal" && "Normal"}
      {status === "warning" && "Warning"}
      {status === "alert" && "Alert"}
    </div>
  )
}
