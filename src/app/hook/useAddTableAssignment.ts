// hooks/useAddTableAssignment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type AddTablePayload = {
  tournamentId: number | string;
  data: {
    table_number: number;
    table_capacity: number;
  };
};

export const useAddTableAssignment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ tournamentId, data }: AddTablePayload) => {
      const res = await fetch(
        `/api/tournament/${tournamentId}/table_assignement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Erreur lors de l'ajout de la table");
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tournament-data", variables.tournamentId]
      });
    }
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

