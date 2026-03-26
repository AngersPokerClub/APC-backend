// hooks/useCancelPlayerElimination.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CancelPlayerEliminationParams = {
  tournamentId: number | string;
  registrationId: number;
};

export const useCancelPlayerElimination = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: CancelPlayerEliminationParams) => {
      const res = await fetch(
        `/api/tournament/${params.tournamentId}/player/${params.registrationId}/cancelElimination`,
        {
          method: "PUT"
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
