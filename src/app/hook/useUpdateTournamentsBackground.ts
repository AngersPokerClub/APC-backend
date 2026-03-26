import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateTournamentBackgroundPayload = {
  id: number;
  background: string[]
}

export const useUpdateTournamentBackgrounds = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, UpdateTournamentBackgroundPayload>({
    mutationFn: async ({ id, background }) => {
      const res = await fetch(`/api/tournament/${id}/backgrounds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgrounds: background })
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", payload.id],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync, // Lancer la mutation
    isLoading: mutation.isPending,     // Loader
    isError: mutation.isError,         // Erreur booléen
    error: mutation.error,             // Détail de l’erreur
    reset: mutation.reset,             // Reset mutation si besoin
  };
};
