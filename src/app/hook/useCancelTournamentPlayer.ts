// hooks/useCancelTournamentPlayer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CancelTournamentPlayerParams = {
  tournamentId: number | string;
  registrationId: number;
};

export const useCancelTournamentPlayer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: CancelTournamentPlayerParams) => {
      const res = await fetch(
        `/api/tournament/${params.tournamentId}/player/${params.registrationId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus: "Cancelled" })
        }
      );

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
    },
    onSuccess: (_, { tournamentId }) => {
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
