import { Role } from "@/backend";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { HeartPulse, Stethoscope } from "lucide-react";

export function RoleSelectionPage() {
  const { selectRole } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-subtle">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-elevated">
              <HeartPulse className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome to MediCare<span className="text-primary">+</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Choose how you'll use MediCare+. You can change this later in
              settings.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              data-ocid="role_patient"
              onClick={() => void selectRole(Role.patient)}
              className={cn(
                "group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-subtle transition-smooth",
                "hover:border-primary/40 hover:shadow-elevated",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-smooth group-hover:bg-primary group-hover:text-white">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  I'm a Patient
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track your vitals, view medical history, manage appointments
                  and prescriptions.
                </p>
              </div>
              <Button type="button" className="mt-2 w-full">
                Continue as Patient
              </Button>
            </button>

            <button
              type="button"
              data-ocid="role_doctor"
              onClick={() => void selectRole(Role.doctor)}
              className={cn(
                "group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-subtle transition-smooth",
                "hover:border-primary/40 hover:shadow-elevated",
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-smooth group-hover:bg-accent group-hover:text-white">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  I'm a Doctor
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your patients, consultations, prescriptions and
                  appointments.
                </p>
              </div>
              <Button type="button" className="mt-2 w-full">
                Continue as Doctor
              </Button>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
