import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Chip } from "../types";

type CreateChipPayload = {
  stackId: string | number;
  value: number;
  chipImage: { type: "wordpress"; url: string };
};

export const useCreateChipInStackWithImage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Chip, Error, CreateChipPayload>({
    mutationFn: async ({ stackId, value, chipImage }) => {
      const formData = new FormData();
      formData.append("stackId", stackId.toString());
      formData.append("value", value.toString());

      if (chipImage.type === "wordpress") {
        formData.append("wpImageUrl", chipImage.url);
      } else {
        throw new Error("Seul l’envoi d’image WordPress est supporté");
      }

      const response = await fetch("/api/images/chip/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur API lors de la création du jeton");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stack", variables.stackId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["chips"] });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
    data: mutation.data,
  };
};
