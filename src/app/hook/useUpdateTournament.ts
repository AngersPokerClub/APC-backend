// hooks/useUpdateTournament.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tournament } from "@/app/types";

type FinishTournamentPayload = number | string;

export const useFinishTournament = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, FinishTournamentPayload>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`/api/tournament/${tournamentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finish" }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la finalisation du tournoi");
      }
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync, // Pour déclencher la mutation
    isLoading: mutation.isPending,     // Loader UI
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};
