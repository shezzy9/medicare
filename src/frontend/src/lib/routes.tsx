import { Role } from "@/backend";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { Layout } from "@/components/Layout";
import type { AuthContextValue } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { AppointmentsPage } from "@/pages/Appointments";
import { ConsultationsPage } from "@/pages/Consultations";
import { DashboardPage } from "@/pages/Dashboard";
import { DevicePage } from "@/pages/Device";
import { LiveMonitoringPage } from "@/pages/LiveMonitoring";
import { MedicalHistoryPage } from "@/pages/MedicalHistory";
import { MyVitalsPage } from "@/pages/MyVitals";
import { NotificationsPage } from "@/pages/Notifications";
import { PrescriptionsPage } from "@/pages/Prescriptions";
import { ProfilePage } from "@/pages/Profile";
import { RoleSelectionPage } from "@/pages/RoleSelection";
import { SettingsPage } from "@/pages/Settings";
import { SignInPage } from "@/pages/SignIn";
import { VitalsHistoryPage } from "@/pages/VitalsHistory";
import { DoctorAppointmentsPage } from "@/pages/doctor/DoctorAppointments";
import { DoctorConsultationsPage } from "@/pages/doctor/DoctorConsultations";
import { DoctorDashboardPage } from "@/pages/doctor/DoctorDashboard";
import { DoctorNotificationsPage } from "@/pages/doctor/DoctorNotifications";
import { DoctorPrescriptionsPage } from "@/pages/doctor/DoctorPrescriptions";
import { DoctorProfilePage } from "@/pages/doctor/DoctorProfile";
import { DoctorSettingsPage } from "@/pages/doctor/DoctorSettings";
import { PatientDetailsPage } from "@/pages/doctor/PatientDetails";
import { PatientsPage } from "@/pages/doctor/Patients";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

export interface RouterContext {
  auth: AuthContextValue;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const { isAuthenticated, roleLoading, role } = useAuth();

  if (!isAuthenticated) return <SignInPage />;
  if (roleLoading) return <FullScreenLoader label="Loading your portal…" />;
  if (role === null) return <RoleSelectionPage />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function requirePatient({ context }: { context: RouterContext }) {
  if (context.auth.role === Role.doctor) {
    throw redirect({ to: "/doctor" });
  }
}

function requireDoctor({ context }: { context: RouterContext }) {
  if (context.auth.role === Role.patient) {
    throw redirect({ to: "/dashboard" });
  }
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (context.auth.role === Role.doctor) throw redirect({ to: "/doctor" });
    throw redirect({ to: "/dashboard" });
  },
});

// ---- Patient portal ----

const patientLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "patient",
  beforeLoad: requirePatient,
});

const dashboardRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const liveMonitoringRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/live-monitoring",
  component: LiveMonitoringPage,
});

const myVitalsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/my-vitals",
  component: MyVitalsPage,
});

const vitalsHistoryRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/vitals-history",
  component: VitalsHistoryPage,
});

const medicalHistoryRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/medical-history",
  component: MedicalHistoryPage,
});

const consultationsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/consultations",
  component: ConsultationsPage,
});

const prescriptionsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/prescriptions",
  component: PrescriptionsPage,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/appointments",
  component: AppointmentsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const deviceRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/device",
  component: DevicePage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => patientLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// ---- Doctor portal ----

const doctorLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "doctor",
  beforeLoad: requireDoctor,
});

const doctorDashboardRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor",
  component: DoctorDashboardPage,
});

const patientsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/patients",
  component: PatientsPage,
});

const patientDetailsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/patients/$patientId",
  component: PatientDetailsPage,
});

const doctorConsultationsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/consultations",
  component: DoctorConsultationsPage,
});

const doctorPrescriptionsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/prescriptions",
  component: DoctorPrescriptionsPage,
});

const doctorAppointmentsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/appointments",
  component: DoctorAppointmentsPage,
});

const doctorNotificationsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/notifications",
  component: DoctorNotificationsPage,
});

const doctorProfileRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/profile",
  component: DoctorProfilePage,
});

const doctorSettingsRoute = createRoute({
  getParentRoute: () => doctorLayoutRoute,
  path: "/doctor/settings",
  component: DoctorSettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  patientLayoutRoute.addChildren([
    dashboardRoute,
    liveMonitoringRoute,
    myVitalsRoute,
    vitalsHistoryRoute,
    medicalHistoryRoute,
    consultationsRoute,
    prescriptionsRoute,
    appointmentsRoute,
    profileRoute,
    deviceRoute,
    notificationsRoute,
    settingsRoute,
  ]),
  doctorLayoutRoute.addChildren([
    doctorDashboardRoute,
    patientsRoute,
    patientDetailsRoute,
    doctorConsultationsRoute,
    doctorPrescriptionsRoute,
    doctorAppointmentsRoute,
    doctorNotificationsRoute,
    doctorProfileRoute,
    doctorSettingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: { auth: undefined as unknown as AuthContextValue },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
