// hooks/useUpdateTournamentLevel.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TournamentLevel } from "@/app/types";

// -----------------------------
// Hook : Mise à jour d'un niveau
// -----------------------------
type UpdateTournamentLevelParams = {
  id: number;
  data: Partial<TournamentLevel>;
};

export const useUpdateTournamentLevel = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, UpdateTournamentLevelParams>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/level/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-data"] });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync, // pour lancer la mutation
    isLoading: mutation.isPending,     // pour afficher un loader
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};

// -----------------------------
// Hook : Suppression d'un niveau
// -----------------------------
type DeleteTournamentLevelParams = number;

export const useDeleteTournamentLevel = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, DeleteTournamentLevelParams>({
    mutationFn: async (levelId) => {
      const res = await fetch(`/api/level/${levelId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-data"] });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,     // loader
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};
