import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TestingProvider } from "@/lib/testing/testing-context"
import { ReactQueryProvider } from "@/lib/react-query-provider"
import { BackgroundWorkerProvider } from "@/components/background-worker-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Health Monitor 360",
  description: "Real-time health monitoring for football players",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <TestingProvider>
              <BackgroundWorkerProvider>
                {children}
                <Toaster />
              </BackgroundWorkerProvider>
            </TestingProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
