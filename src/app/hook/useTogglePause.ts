import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useTogglePause = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (pause: boolean) => {
      const res = await fetch(`/api/tournament/${tournamentId}/pause`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause })
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du statut de pause");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId]
      });
    }
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};
