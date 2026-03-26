// hooks/useEndTournament.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type EndTournamentPayload = void;

export const useEndTournament = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, EndTournamentPayload>({
    mutationFn: async () => {
      const res = await fetch(`/api/tournament/${tournamentId}/end`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finish" }), // adapte à ton enum réel
      });

      if (!res.ok) {
        throw new Error("Erreur lors du changement de statut");
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
