// hooks/useGenerateTables.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type GenerateTablesPayload = number | string;

export const useGenerateTables = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, GenerateTablesPayload>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(
        `/api/tournament/${tournamentId}/table_assignement/generate`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Erreur serveur lors de la génération des tables.");
      }
    },
    onSuccess: (_, tournamentId) => {
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
