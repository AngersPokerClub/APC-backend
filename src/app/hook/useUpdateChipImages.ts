// hooks/useUpdateChipImage.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateChipImagePayload = {
  chipId: number;
  chip_image: string;
};

export const useUpdateChipImage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, UpdateChipImagePayload>({
    mutationFn: async ({ chipId, chip_image }) => {
      const res = await fetch(`/api/chip/${chipId}/image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip_image }),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalide les données pour rafraîchir l'UI après mise à jour
      queryClient.invalidateQueries({ queryKey: ["allChips"] });
      queryClient.invalidateQueries({ queryKey: ["stack"] });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,  // pour déclencher la mutation
    isLoading: mutation.isPending,      // pour afficher un loader dans ton UI
    isError: mutation.isError,          // pour détecter une erreur
    error: mutation.error,              // détail de l'erreur
    reset: mutation.reset,              // pour réinitialiser l'état mutation si nécessaire
  };
};
