import { useUserContext } from "@/contexts/UserContext";

/**
 * Hook for managing user impersonation
 */
export function useImpersonation() {
  const context = useUserContext();

  return {
    isImpersonating: context.isImpersonating,
    realUserName: context.realUserName,
    impersonatedUserName: context.impersonatedUserName,
    startImpersonation: context.startImpersonation,
    stopImpersonation: context.stopImpersonation,
  };
}
