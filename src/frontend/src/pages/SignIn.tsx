import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { HeartPulse, Loader2 } from "lucide-react";

export function SignInPage() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const disabled = isInitializing || isLoggingIn;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-subtle">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-elevated">
              <HeartPulse className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              MediCare<span className="text-primary">+</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your connected health monitoring platform for patients and
              doctors.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Sign in to continue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your Internet Identity to securely access your health portal.
            </p>
            <Button
              type="button"
              data-ocid="sign_in_button"
              onClick={() => login()}
              disabled={disabled}
              className="mt-6 w-full"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your health data stays private and protected on the Internet
              Computer.
            </p>
          </div>
        </div>
      </div>
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
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
  );
}
