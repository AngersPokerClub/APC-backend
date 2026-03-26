// hooks/useUpdateStack.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateStackPayload = {
  stackId: number;
  data: {
    tournament_id: number;
    selected_stack_id: number;
    stack_total_player: number;
    stack_chip: {
      stack_id: number;
      chip_id?: number;
      chip?: {
        value: number;
        chip_image: string;
      };
    }[];
  };
};

export const useUpdateStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, UpdateStackPayload>({
    mutationFn: async ({ stackId, data }) => {
      const res = await fetch(`/api/stack/${stackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.error || "Erreur serveur");
      }

      return res.json(); // Récupération de la réponse si nécessaire
    },
    onSuccess: (_, variables) => {
      // variables correspond aux arguments passés à la mutation
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", variables.data.tournament_id],
      });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,  // Lancer la mutation
    isLoading: mutation.isPending,      // Loader pour UI
    isError: mutation.isError,          // Booléen error
    error: mutation.error,              // Détail de l’erreur
    reset: mutation.reset,              // Reset état mutation
    data: mutation.data,                // Réponse éventuelle
  };
};
