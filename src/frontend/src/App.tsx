import { AuthProvider, useAuth } from "@/lib/auth";
import { router } from "@/lib/routes";
import { ThemeProvider } from "@/lib/theme";
import { RouterProvider } from "@tanstack/react-router";

function AppRouter() {
  const auth = useAuth();
  router.update({ context: { auth } });
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
