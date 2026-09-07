import { Role } from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  CalendarDays,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  LogOut,
  type LucideIcon,
  Moon,
  Pill,
  Settings,
  Stethoscope,
  Sun,
  User,
  Users,
  Watch,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const patientNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Live Monitoring", to: "/live-monitoring", icon: Activity },
  { label: "My Vitals", to: "/my-vitals", icon: HeartPulse },
  { label: "Vitals History", to: "/vitals-history", icon: LineChart },
  { label: "Medical History", to: "/medical-history", icon: FileText },
  { label: "Consultations", to: "/consultations", icon: Stethoscope },
  { label: "Prescriptions", to: "/prescriptions", icon: Pill },
  { label: "Appointments", to: "/appointments", icon: CalendarDays },
  { label: "Device", to: "/device", icon: Watch },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

const doctorNav: NavItem[] = [
  { label: "Dashboard", to: "/doctor", icon: LayoutDashboard },
  { label: "Patients", to: "/doctor/patients", icon: Users },
  { label: "Consultations", to: "/doctor/consultations", icon: Stethoscope },
  { label: "Prescriptions", to: "/doctor/prescriptions", icon: Pill },
  { label: "Appointments", to: "/doctor/appointments", icon: CalendarDays },
  { label: "Notifications", to: "/doctor/notifications", icon: Bell },
  { label: "Profile", to: "/doctor/profile", icon: User },
  { label: "Settings", to: "/doctor/settings", icon: Settings },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-subtle">
        <HeartPulse className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight text-foreground">
          MediCare<span className="text-primary">+</span>
        </p>
        <p className="text-[11px] text-muted-foreground">Health Monitoring</p>
      </div>
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-ocid="theme_toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function NavList({
  items,
  onNavigate,
}: { items: NavItem[]; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {items.map((item) => {
        const active =
          item.to === "/doctor"
            ? pathname === "/doctor"
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            data-ocid={`nav.${item.to.replaceAll("/", "_")}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { logout, role } = useAuth();
  const profileTo = role === Role.doctor ? "/doctor/profile" : "/profile";
  const settingsTo = role === Role.doctor ? "/doctor/settings" : "/settings";
  const roleLabel = role === Role.doctor ? "Doctor" : "Patient";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-ocid="user_menu"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-smooth hover:bg-muted"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {roleLabel.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {roleLabel}
            </p>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={profileTo}>
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={settingsTo}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-ocid="logout_button"
          onClick={logout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const navItems = role === Role.doctor ? doctorNav : patientNav;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList items={navItems} />
        </div>
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-medium text-muted-foreground">
              Appearance
            </span>
            <ThemeToggle />
          </div>
          <UserMenu />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="hidden border-t border-border bg-card px-6 py-4 md:block">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      {/* Mobile bottom bar */}
      {isMobile ? (
        <nav
          data-ocid="bottom_bar"
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-card px-1 pb-[env(safe-area-inset-bottom)]"
        >
          {navItems.slice(0, 5).map((item) => {
            const active =
              pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={`nav.${item.to.replaceAll("/", "_")}`}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-smooth",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
