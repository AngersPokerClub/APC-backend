// hooks/useMovePlayer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type MoveMode = "swap" | "move";

export type MovePlayerPayload = {
  tournamentId: number | string;
  playerId: number;
  mode: MoveMode;
  targetId: number;
};

export const useMovePlayer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, MovePlayerPayload>({
    mutationFn: async ({ tournamentId, playerId, mode, targetId }) => {
      const res = await fetch(`/api/tournament/${tournamentId}/table/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, mode, targetId }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors du déplacement");
      }
    },
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync, // lancer la mutation
    isLoading: mutation.isPending,     // pour afficher un loader
    isError: mutation.isError,         // booléen erreur
    error: mutation.error,             // objet/détail erreur
    reset: mutation.reset,             // reset état mutation
  };
};
