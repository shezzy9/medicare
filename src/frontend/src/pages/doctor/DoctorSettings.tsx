import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Check,
  Laptop,
  Moon,
  Palette,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const themeOptions: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Bright, clinical look",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes at night",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device setting",
    icon: Laptop,
  },
];

export function DoctorSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [compact, setCompact] = useState(false);
  const [showUnreadBadge, setShowUnreadBadge] = useState(true);

  const activeMode: ThemeMode =
    theme === "system" || theme === "light" || theme === "dark"
      ? theme
      : "system";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your appearance and preferences."
      />

      <Card className={cn(compact && "gap-4 py-4")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display">Appearance</CardTitle>
              <CardDescription>
                Choose how MediCare+ looks on your device.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = activeMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-ocid={`theme_option.${option.value}`}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-smooth",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {selected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
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

      <Card className={cn(compact && "gap-4 py-4")}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display">Preferences</CardTitle>
              <CardDescription>
                Tune how the portal behaves for you.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-3">
            <div>
              <Label htmlFor="compact" className="text-sm font-medium">
                Compact density
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reduce spacing to fit more on screen.
              </p>
            </div>
            <Switch
              id="compact"
              data-ocid="preference.compact"
              checked={compact}
              onCheckedChange={setCompact}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-3">
            <div>
              <Label htmlFor="unread" className="text-sm font-medium">
                Show unread badge
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Display an unread count next to Notifications.
              </p>
            </div>
            <Switch
              id="unread"
              data-ocid="preference.unread_badge"
              checked={showUnreadBadge}
              onCheckedChange={setShowUnreadBadge}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          data-ocid="reset_button"
          onClick={() => {
            setTheme("system");
            setCompact(false);
            setShowUnreadBadge(true);
          }}
        >
          Reset preferences
        </Button>
      </div>
    </div>
  );
}
