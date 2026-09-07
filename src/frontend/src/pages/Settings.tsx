import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Laptop, Lock, Moon, Palette, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: {
  mode: ThemeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    mode: "light",
    label: "Light",
    description: "Bright and airy, ideal for daytime.",
    icon: <Sun className="h-5 w-5" />,
  },
  {
    mode: "dark",
    label: "Dark",
    description: "Easy on the eyes in low light.",
    icon: <Moon className="h-5 w-5" />,
  },
  {
    mode: "system",
    label: "System",
    description: "Follows your device's appearance.",
    icon: <Laptop className="h-5 w-5" />,
  },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const current = (theme ?? "system") as ThemeMode;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your appearance and preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how MediCare+ looks on your device. Your preference is saved
            locally and applied instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const active = current === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  data-ocid={`settings.theme.${option.mode}`}
                  onClick={() => setTheme(option.mode)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-smooth",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      active
                        ? "bg-gradient-primary text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Privacy & security
          </CardTitle>
          <CardDescription>
            Your health data is protected by design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Private by default
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile, vitals, and medical records are stored securely on
                the Internet Computer. Only you and your assigned care team can
                access them.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Role-based access
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Patients and doctors see only the information relevant to their
                role. Sensitive actions require your authenticated identity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            About MediCare+
          </CardTitle>
          <CardDescription>
            Your trusted companion for continuous health monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                MediCare+ Health Monitoring
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Version 1.0 · Built on the Internet Computer
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-ocid="settings.about_button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
