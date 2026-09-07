import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCallerPatientProfile,
  useSavePatientProfile,
} from "@/hooks/useQueries";
import { formatDate } from "@/lib/api";
import { BloodGroup, Gender } from "@/lib/types";
import type { PatientProfile } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Droplets,
  HeartPulse,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Save,
  User,
  UserRound,
  Weight,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const genderLabels: Record<Gender, string> = {
  [Gender.male]: "Male",
  [Gender.female]: "Female",
  [Gender.other]: "Other",
};

const bloodGroupLabels: Record<BloodGroup, string> = {
  [BloodGroup.aPositive]: "A+",
  [BloodGroup.aNegative]: "A−",
  [BloodGroup.bPositive]: "B+",
  [BloodGroup.bNegative]: "B−",
  [BloodGroup.abPositive]: "AB+",
  [BloodGroup.abNegative]: "AB−",
  [BloodGroup.oPositive]: "O+",
  [BloodGroup.oNegative]: "O−",
  [BloodGroup.notSpecified]: "Unknown",
};

interface ProfileFormValues {
  name: string;
  age: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  heightCm: string;
  weightKg: string;
  contact: string;
  address: string;
  emergencyContact: string;
}

function toFormValues(profile: PatientProfile): ProfileFormValues {
  return {
    name: profile.name,
    age: profile.age.toString(),
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    heightCm: profile.heightCm?.toString() ?? "",
    weightKg: profile.weightKg?.toString() ?? "",
    contact: profile.contact,
    address: profile.address,
    emergencyContact: profile.emergencyContact ?? "",
  };
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useCallerPatientProfile();
  const saveProfile = useSavePatientProfile();
  const [editing, setEditing] = useState(false);

  const principal: Principal | undefined = identity?.getPrincipal();

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      name: "",
      age: "",
      gender: Gender.other,
      bloodGroup: BloodGroup.notSpecified,
      heightCm: "",
      weightKg: "",
      contact: "",
      address: "",
      emergencyContact: "",
    },
  });

  useEffect(() => {
    if (editing && profile) {
      form.reset(toFormValues(profile));
    }
  }, [editing, profile, form]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          description="Manage your personal and health profile information."
        />
        <ProfileSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          description="Manage your personal and health profile information."
        />
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="Couldn't load your profile"
          description="Something went wrong while fetching your profile. Please try again."
          action={
            <Button
              type="button"
              data-ocid="profile.retry_button"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    if (!principal) return;
    const now = BigInt(Date.now()) * 1_000_000n;
    const payload: PatientProfile = {
      userId: principal,
      name: values.name.trim(),
      age: BigInt(values.age),
      gender: values.gender,
      bloodGroup: values.bloodGroup,
      heightCm: values.heightCm ? Number(values.heightCm) : undefined,
      weightKg: values.weightKg ? Number(values.weightKg) : undefined,
      contact: values.contact.trim(),
      address: values.address.trim(),
      emergencyContact: values.emergencyContact.trim() || undefined,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    saveProfile.mutate(payload, {
      onSuccess: () => setEditing(false),
    });
  });

  // No profile yet → show creation form
  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          description="Complete your profile so your care team can serve you better."
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Create your profile
            </CardTitle>
            <CardDescription>
              This information is private and only visible to you and your
              assigned care team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSubmit}
              className="grid gap-4 sm:grid-cols-2"
              data-ocid="profile.form"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  data-ocid="profile.input.name"
                  placeholder="e.g. Alex Morgan"
                  {...form.register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={130}
                  data-ocid="profile.input.age"
                  placeholder="e.g. 34"
                  {...form.register("age", {
                    required: "Age is required",
                    min: { value: 0, message: "Age can't be negative" },
                    max: { value: 130, message: "Enter a valid age" },
                  })}
                />
                {form.formState.errors.age ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.age.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(v) =>
                    form.setValue("gender", v as Gender, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="gender" data-ocid="profile.select.gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(genderLabels) as Gender[]).map((g) => (
                      <SelectItem key={g} value={g}>
                        {genderLabels[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bloodGroup">Blood group</Label>
                <Select
                  value={form.watch("bloodGroup")}
                  onValueChange={(v) =>
                    form.setValue("bloodGroup", v as BloodGroup, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    id="bloodGroup"
                    data-ocid="profile.select.blood_group"
                  >
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(bloodGroupLabels) as BloodGroup[]).map(
                      (b) => (
                        <SelectItem key={b} value={b}>
                          {bloodGroupLabels[b]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  min={0}
                  step="0.1"
                  data-ocid="profile.input.height"
                  placeholder="e.g. 172"
                  {...form.register("heightCm", {
                    min: { value: 0, message: "Height can't be negative" },
                  })}
                />
                {form.formState.errors.heightCm ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.heightCm.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min={0}
                  step="0.1"
                  data-ocid="profile.input.weight"
                  placeholder="e.g. 68"
                  {...form.register("weightKg", {
                    min: { value: 0, message: "Weight can't be negative" },
                  })}
                />
                {form.formState.errors.weightKg ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.weightKg.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact">Contact number</Label>
                <Input
                  id="contact"
                  data-ocid="profile.input.contact"
                  placeholder="e.g. +1 555 010 2030"
                  {...form.register("contact", {
                    required: "Contact number is required",
                    minLength: {
                      value: 7,
                      message: "Enter a valid contact number",
                    },
                  })}
                />
                {form.formState.errors.contact ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contact.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emergencyContact">Emergency contact</Label>
                <Input
                  id="emergencyContact"
                  data-ocid="profile.input.emergency_contact"
                  placeholder="e.g. +1 555 010 9090"
                  {...form.register("emergencyContact")}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  data-ocid="profile.input.address"
                  placeholder="Street, city, country"
                  {...form.register("address", {
                    required: "Address is required",
                  })}
                />
                {form.formState.errors.address ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                ) : null}
              </div>

              {saveProfile.isError ? (
                <p
                  className="text-sm text-destructive sm:col-span-2"
                  data-ocid="profile.error_state"
                >
                  Couldn't save your profile. Please try again.
                </p>
              ) : null}

              <div className="flex items-center gap-2 sm:col-span-2">
                <Button
                  type="submit"
                  data-ocid="profile.submit_button"
                  disabled={saveProfile.isPending}
                >
                  <Save className="h-4 w-4" />
                  {saveProfile.isPending ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View mode
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          description="Manage your personal and health profile information."
          actions={
            <Button
              type="button"
              data-ocid="profile.edit_button"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </Button>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white">
                  <UserRound className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold">
                    {profile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {genderLabels[profile.gender]} · {profile.age.toString()}{" "}
                    yrs
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<Droplets className="h-4 w-4" />}
                label="Blood group"
                value={bloodGroupLabels[profile.bloodGroup]}
              />
              <InfoRow
                icon={<Ruler className="h-4 w-4" />}
                label="Height"
                value={profile.heightCm ? `${profile.heightCm} cm` : "—"}
              />
              <InfoRow
                icon={<Weight className="h-4 w-4" />}
                label="Weight"
                value={profile.weightKg ? `${profile.weightKg} kg` : "—"}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Contact"
                value={profile.contact}
              />
              <InfoRow
                icon={<HeartPulse className="h-4 w-4" />}
                label="Emergency contact"
                value={profile.emergencyContact ?? "—"}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={profile.address}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile summary</CardTitle>
              <CardDescription>
                Your health profile helps your care team provide personalised
                care.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <p className="text-sm font-medium text-foreground">
                  Your data is private
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your profile and health information are stored securely on the
                  Internet Computer and are only accessible to you and your
                  assigned care team.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Profile created
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit profile"
        description="Update your personal and health information."
        actions={
          <Button
            type="button"
            variant="ghost"
            data-ocid="profile.cancel_button"
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            Personal details
          </CardTitle>
          <CardDescription>
            Fields marked with an asterisk are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="grid gap-4 sm:grid-cols-2"
            data-ocid="profile.form"
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                data-ocid="profile.input.name"
                {...form.register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={130}
                data-ocid="profile.input.age"
                {...form.register("age", {
                  required: "Age is required",
                  min: { value: 0, message: "Age can't be negative" },
                  max: { value: 130, message: "Enter a valid age" },
                })}
              />
              {form.formState.errors.age ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.age.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(v) =>
                  form.setValue("gender", v as Gender, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="gender" data-ocid="profile.select.gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(genderLabels) as Gender[]).map((g) => (
                    <SelectItem key={g} value={g}>
                      {genderLabels[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bloodGroup">Blood group</Label>
              <Select
                value={form.watch("bloodGroup")}
                onValueChange={(v) =>
                  form.setValue("bloodGroup", v as BloodGroup, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id="bloodGroup"
                  data-ocid="profile.select.blood_group"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(bloodGroupLabels) as BloodGroup[]).map((b) => (
                    <SelectItem key={b} value={b}>
                      {bloodGroupLabels[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                min={0}
                step="0.1"
                data-ocid="profile.input.height"
                {...form.register("heightCm", {
                  min: { value: 0, message: "Height can't be negative" },
                })}
              />
              {form.formState.errors.heightCm ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.heightCm.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                min={0}
                step="0.1"
                data-ocid="profile.input.weight"
                {...form.register("weightKg", {
                  min: { value: 0, message: "Weight can't be negative" },
                })}
              />
              {form.formState.errors.weightKg ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.weightKg.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact">Contact number *</Label>
              <Input
                id="contact"
                data-ocid="profile.input.contact"
                {...form.register("contact", {
                  required: "Contact number is required",
                  minLength: {
                    value: 7,
                    message: "Enter a valid contact number",
                  },
                })}
              />
              {form.formState.errors.contact ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contact.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input
                id="emergencyContact"
                data-ocid="profile.input.emergency_contact"
                {...form.register("emergencyContact")}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                data-ocid="profile.input.address"
                {...form.register("address", {
                  required: "Address is required",
                })}
              />
              {form.formState.errors.address ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.address.message}
                </p>
              ) : null}
            </div>

            {saveProfile.isError ? (
              <p
                className="text-sm text-destructive sm:col-span-2"
                data-ocid="profile.error_state"
              >
                Couldn't save your profile. Please try again.
              </p>
            ) : null}

            <div className="flex items-center gap-2 sm:col-span-2">
              <Button
                type="submit"
                data-ocid="profile.submit_button"
                disabled={saveProfile.isPending}
              >
                <Save className="h-4 w-4" />
                {saveProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-ocid="profile.cancel_button"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
