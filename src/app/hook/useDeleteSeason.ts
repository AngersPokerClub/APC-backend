import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteSeason = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number | string) => {
      const res = await fetch(`/api/seasons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || `Erreur serveur (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-seasons"] });
    },
    onError: (error: any) => {
      console.error("[useDeleteSeason] Erreur suppression :", error);
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};