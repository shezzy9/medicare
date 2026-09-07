import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCallerDoctorProfile,
  useSaveDoctorProfile,
} from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Loader2, Save, Stethoscope, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface ProfileFormValues {
  name: string;
  specialization: string;
  licenseNumber: string;
  contact: string;
  email: string;
  bio: string;
}

function ProfileFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 4 }, (_, i) => `field-${i}`).map((id) => (
          <div key={id} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DoctorProfilePage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal() ?? Principal.anonymous();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useCallerDoctorProfile();
  const saveProfile = useSaveDoctorProfile();

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      name: "",
      specialization: "",
      licenseNumber: "",
      contact: "",
      email: "",
      bio: "",
    },
  });

  // Initialize the form once from the loaded profile.
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        specialization: profile.specialization,
        licenseNumber: profile.licenseNumber,
        contact: profile.contact,
        email: profile.email ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    const now = BigInt(Date.now()) * 1_000_000n;
    saveProfile.mutate({
      userId: profile?.userId ?? principal,
      name: values.name.trim(),
      specialization: values.specialization.trim(),
      licenseNumber: values.licenseNumber.trim(),
      contact: values.contact.trim(),
      email: values.email?.trim() || undefined,
      bio: values.bio?.trim() || undefined,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your professional and contact information."
      />

      {isLoading ? (
        <ProfileFormSkeleton />
      ) : isError ? (
        <Card className="gap-0 p-6">
          <div
            data-ocid="error_state"
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <UserRound className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Couldn&apos;t load your profile
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Something went wrong while fetching your profile. Please try
              again.
            </p>
            <Button
              type="button"
              variant="outline"
              data-ocid="retry_button"
              className="mt-5"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="font-display">
                      Professional details
                    </CardTitle>
                    <CardDescription>
                      Your credentials and specialty shown to patients.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          data-ocid="profile.name_input"
                          placeholder="Dr. Jane Smith"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  rules={{
                    required: "Specialization is required",
                    minLength: {
                      value: 2,
                      message: "Specialization must be at least 2 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input
                          data-ocid="profile.specialization_input"
                          placeholder="Cardiology"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  rules={{
                    required: "License number is required",
                    minLength: {
                      value: 3,
                      message: "License number must be at least 3 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License number</FormLabel>
                      <FormControl>
                        <Input
                          data-ocid="profile.license_input"
                          placeholder="MD-123456"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  rules={{
                    required: "Contact is required",
                    minLength: {
                      value: 5,
                      message: "Contact must be at least 5 characters",
                    },
                    maxLength: {
                      value: 40,
                      message: "Contact must be under 40 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input
                          data-ocid="profile.contact_input"
                          placeholder="+1 555 010 1234"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          data-ocid="profile.email_input"
                          placeholder="jane.smith@medicare.health"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for professional correspondence.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  rules={{
                    maxLength: {
                      value: 500,
                      message: "Bio must be under 500 characters",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          data-ocid="profile.bio_input"
                          placeholder="A short introduction about your practice and experience."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Shown to patients when they view your profile.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {saveProfile.isError ? (
              <div
                data-ocid="error_state"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                Couldn&apos;t save your profile. Please check your details and
                try again.
              </div>
            ) : null}

            {saveProfile.isSuccess ? (
              <div
                data-ocid="success_state"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600"
              >
                Your profile has been saved successfully.
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                data-ocid="save_button"
                disabled={saveProfile.isPending}
              >
                {saveProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
