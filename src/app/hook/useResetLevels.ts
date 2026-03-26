// hooks/useResetLevels.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ResetLevelsPayload = number | string;

export const useResetLevels = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, ResetLevelsPayload>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(`/api/tournament/${tournamentId}/level`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la réinitialisation");
      }
    },
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,   // Pour lancer la mutation
    isLoading: mutation.isPending,       // Pour loader dans le bouton
    isError: mutation.isError,           // Pour savoir s'il y a une erreur
    error: mutation.error,               // Pour afficher l’erreur détaillée
    reset: mutation.reset,               // Pour remettre à zéro l’état mutation
  };
};
