import { useMutation, useQueryClient } from "@tanstack/react-query";

type TrimesterInput = {
  name: string;
  start_date: string;
  end_date: string;
};

type UpdateSeasonPayload = {
  id: number;
  data: {
    name: string;
    start_date: string;
    end_date: string;
    status: "draft" | "in_progress" | "past";
    trimesters: TrimesterInput[];
  };
};

export const useUpdateSeason = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: UpdateSeasonPayload) => {
      console.log("[useUpdateSeason] Tentative PATCH /api/seasons/", id, data);

      const res = await fetch(`/api/seasons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log(
        "[useUpdateSeason] Status de la réponse:",
        res.status,
        res.statusText
      );

      let msg: any = {};
      try {
        msg = await res.clone().json();
        console.log("[useUpdateSeason] Corps réponse JSON :", msg);
      } catch (err) {
        const text = await res.text();
        console.log("[useUpdateSeason] Corps réponse brute (pas JSON) :", text);
        msg = { error: "Réponse non-JSON", raw: text };
      }

      if (!res.ok) {
        throw new Error(msg.error || `Erreur serveur (${res.status})`);
      }

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["all-seasons"],
      });
    },
    onError: (error: any) => {
      console.error("[useUpdateSeason] Erreur mutation :", error);
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