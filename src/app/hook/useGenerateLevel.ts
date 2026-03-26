// hooks/useGenerateLevels.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type GenerateLevelsPayload = string | number;

export const useGenerateLevels = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, GenerateLevelsPayload>({
    mutationFn: async (tournamentId) => {
      const res = await fetch(
        `/api/tournament/${tournamentId}/level/generate`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Erreur serveur");
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
