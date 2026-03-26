// hooks/useCreateLevel.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateLevelPayload = {
  tournamentId: number | string;
  data: Record<string, any>;
};

export const useCreateLevel = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ tournamentId, data }: CreateLevelPayload) => {
      const res = await fetch(`/api/tournament/${tournamentId}/level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
    },
    onSuccess: (_, { tournamentId }) => {
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
