// hooks/useUpdateRankings.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UpdateRankingsPayload } from "@/app/types/edit-rankings.types";

export const useUpdateRankings = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, UpdateRankingsPayload>({
    mutationFn: async (payload: UpdateRankingsPayload) => {
      const res = await fetch(
        `/api/tournament/${tournamentId}/update-rankings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Erreur lors de la mise à jour du classement",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId],
      });
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
