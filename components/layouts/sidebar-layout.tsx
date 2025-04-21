"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserNav } from "@/components/user-nav";
import {
  Activity,
  BarChart3,
  Users,
  Beaker,
  RotateCcw,
  Menu,
  Home,
  AlertTriangle,
  Moon,
  Sun,
} from "lucide-react";
import { useTesting } from "@/lib/testing/testing-context";
import { TestingPanel } from "@/components/testing/testing-panel";
import { RetryQueueIndicator } from "@/components/retry-queue-indicator";
// Add import for theme toggle
import { useTheme } from "@/components/theme-provider";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// Add ThemeToggle component inside the component but before the return statement
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { mode } = useTesting();
  const [isMobile, setIsMobile] = useState(false);
  const [isTestingOpen, setIsTestingOpen] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      title: "Players",
      href: "/players",
      icon: Users,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Alerts",
      href: "/alerts",
      icon: AlertTriangle,
    },
    // {
    //   title: "Retry Queue",
    //   href: "/admin/retry-queue",
    //   icon: RotateCcw,
    // },
  ];

  const NavItems = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === item.href
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent w-full",
          isTestingOpen
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground"
        )}
        onClick={() => setIsTestingOpen(!isTestingOpen)}
      >
        <Beaker className="h-4 w-4" />
        Testing
        {mode === "testing" && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </Button>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="flex h-16 items-center border-b px-2">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Activity className="h-6 w-6" />
                <span>Health Monitor 360</span>
              </Link>
            </div>
            <ScrollArea className="my-4 h-[calc(100vh-8rem)]">
              <div className="flex flex-col gap-2 px-2">
                <NavItems />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Activity className="h-6 w-6" />
          <span>Health Monitor 360</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </header>

      <div className="flex flex-1 lg:grid lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop only) */}
        <aside className="hidden border-r bg-background lg:block">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Activity className="h-6 w-6" />
              <span>Health Monitor 360</span>
            </Link>
          </div>
          <div className="p-6 pt-4">
            <div className="flex flex-col gap-2">
              <NavItems />
            </div>
            <div className="mt-6">
              <RetryQueueIndicator />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col">
          {/* Desktop header */}
          <header className="hidden h-16 items-center border-b px-6 lg:flex">
            <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
              <UserNav />
            </div>
          </header>

          <div className="flex flex-1">
            <div className="flex-1 p-6">{children}</div>

            {/* Testing panel (desktop only) */}
            {isTestingOpen && !isMobile && (
              <div className="hidden lg:block w-80 border-l bg-background p-6 overflow-y-auto">
                <TestingPanel />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile testing panel */}
      {isTestingOpen && isMobile && (
        <Sheet open={isTestingOpen} onOpenChange={setIsTestingOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6">
                <TestingPanel />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
