import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chip } from "@/app/types";

export const useAllChips = (enabled = true) => {
  const query = useQuery<Chip[]>({
    queryKey: ["chips"],
    queryFn: async () => {
      const res = await fetch("/api/chip");
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useAddChipToStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      stackId,
      chip_id,
    }: {
      stackId: number;
      chip_id: number;
    }) => {
      const res = await fetch(`/api/stack/${stackId}/chip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip_id }),
      });
      if (!res.ok) throw new Error("Erreur ajout jeton");
    },
    onSuccess: (_, { stackId }) => {
      queryClient.invalidateQueries({
        queryKey: ["stack", stackId.toString()],
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

export const useCreateChipInStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Chip, Error, { stackId: number; value: number }>({
    mutationFn: async ({ stackId, value }) => {
      const res = await fetch(`/api/stack/${stackId}/chip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value,
          chip_image: "/images/ellipseAvatar.png",
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
    onSuccess: (_, { stackId }) => {
      queryClient.invalidateQueries({
        queryKey: ["stack", stackId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["chips"] });
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

export const useRemoveChipFromStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      stackId,
      chipId,
    }: {
      stackId: number;
      chipId: number;
    }) => {
      const res = await fetch(`/api/stack/${stackId}/chip`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip_id: chipId }),
      });
      if (!res.ok) throw new Error("Erreur suppression jeton");
    },
    onSuccess: (_, { stackId }) => {
      queryClient.invalidateQueries({
        queryKey: ["stack", stackId.toString()],
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

