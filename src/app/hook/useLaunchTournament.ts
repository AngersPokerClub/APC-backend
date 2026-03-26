// hooks/useLaunchTournament.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type LaunchTournamentPayload = void; // rien à passer puisque tu utilises l’id dans ton closure

export const useLaunchTournament = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, LaunchTournamentPayload>({
    mutationFn: async () => {
      const res = await fetch(`/api/tournament/${tournamentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_coming" }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors du changement de statut");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", tournamentId],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync, // à utiliser dans ton onClick ou ta modale
    isLoading: mutation.isPending,     // pour afficher le loader
    isError: mutation.isError,         // gestion d'erreur
    error: mutation.error,             // détail de l'erreur
    reset: mutation.reset,             // si besoin de reset l'état
  };
};
