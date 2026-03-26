// hooks/useCreatePlayer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreatePlayerPayload = {
  tournamentId: number | string;
  data: Record<string, any>;
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ tournamentId, data }: CreatePlayerPayload) => {
      const res = await fetch(`/api/tournament/${tournamentId}/player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.error || "Erreur serveur");
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
