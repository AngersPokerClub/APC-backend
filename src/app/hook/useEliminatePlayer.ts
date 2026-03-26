// hooks/useEliminatePlayer.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type EliminatePlayerParams = {
  tournamentId: number | string;
  registrationId: number;
  killerId: number;
};

export type EliminatePlayerResponse = {
  message?: string;
  ranking_position?: number;
  score?: number;
  aliveCount?: number;
  rebalanced?: boolean;
  moves?: {
    playerName: string;
    registrationId: number;
    fromTableId: number;
    fromTableNumber?: number;
    fromTableSeat: number;
    toTableId: number;
    toTableNumber?: number;
    toTableSeat: number;
  }[];
};

export const useEliminatePlayer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    EliminatePlayerResponse, // ✅ type du retour
    Error,
    EliminatePlayerParams
  >({
    mutationFn: async (params: EliminatePlayerParams) => {
      const res = await fetch(
        `/api/tournament/${params.tournamentId}/player/${params.registrationId}/elimination`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_kill_id: params.killerId })
        }
      );

      if (!res.ok) {
        throw new Error(await res.text() || "Erreur serveur");
      }

      // 🔹 On lit la réponse JSON complète
      return res.json() as Promise<EliminatePlayerResponse>;
    },

    onSuccess: (_, { tournamentId }) => {
      // 🔹 Invalide le cache pour forcer le refresh des données tournoi
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId]
      });
    }
  });

  return {
    mutateAsync: mutation.mutateAsync, // 🔹 pour .then(...) ou await
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset
  };
};
