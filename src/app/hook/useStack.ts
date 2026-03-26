// hooks/useCreateStack.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "@/app/types"; // adapte selon ton type réel

type CreateStackPayload = {
  stack_name: string;
  stack_total_player: number;
};

export const useCreateStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Stack, Error, CreateStackPayload>({
    mutationFn: async (data) => {
      const res = await fetch("/api/stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacks"] });
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


type DeleteStackPayload = number; // l'id de la stack

export const useDeleteStack = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, DeleteStackPayload>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/stack/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur serveur");
      // Si besoin, tu peux retourner le résultat avec return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stacks"] });
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

export const useStacks = () => {
  const query = useQuery<Stack[]>({
    queryKey: ["stacks"],
    queryFn: async () => {
      const res = await fetch("/api/stack");
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useStackById = (id?: string) => {
  const query = useQuery<Stack>({
    queryKey: ["stack", id],
    queryFn: async () => {
      const res = await fetch(`/api/stack/${id}`);
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
