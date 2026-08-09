import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export function useCustomerAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.customerAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.customerAuth.logout.useMutation({
    async onSuccess() {
      utils.customerAuth.me.setData(undefined, null);
      await utils.customerAuth.me.invalidate();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      utils.customerAuth.me.setData(undefined, null);
      await utils.customerAuth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      customer: meQuery.data ?? null,
      isLoading: meQuery.isLoading || logoutMutation.isPending,
      isAuthenticated: Boolean(meQuery.data),
      refetch: meQuery.refetch,
      logout,
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      meQuery.refetch,
      logoutMutation.isPending,
      logout,
    ]
  );

  return state;
}
