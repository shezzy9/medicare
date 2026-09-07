import { type Role, createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

export interface AuthContextValue {
  /** The caller's assigned role, or null when not yet assigned. */
  role: Role | null;
  /** True while the role is being resolved from the backend. */
  roleLoading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** Assigns the caller's role on first sign-in. */
  selectRole: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const roleQuery = useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerRole();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const selectRole = useCallback(
    async (role: Role) => {
      if (!actor) throw new Error("Backend is not ready");
      await actor.assignCallerRole(role);
      await queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
    [actor, queryClient],
  );

  const logout = useCallback(() => {
    clear();
    queryClient.clear();
  }, [clear, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      role: roleQuery.data ?? null,
      roleLoading: roleQuery.isLoading || isFetching,
      isAuthenticated,
      isInitializing,
      selectRole,
      logout,
    }),
    [
      roleQuery.data,
      roleQuery.isLoading,
      isFetching,
      isAuthenticated,
      isInitializing,
      selectRole,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
