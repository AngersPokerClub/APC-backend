// hooks/useAvailableTables.ts
import { useQuery } from "@tanstack/react-query";

export const useAvailableTables = (
  tournamentId?: number | string,
  currentTableId?: number,
  enabled = false
) => {
  const query = useQuery({
    queryKey: ["tournament-tables", tournamentId],
    queryFn: async () => {
      const res = await fetch(`/api/tournament/${tournamentId}/table`);
      if (!res.ok) throw new Error("Erreur chargement des tables");
      const tables = await res.json();

      return tables.filter((t: any) => t.id !== currentTableId);
    },
    enabled: !!tournamentId && enabled
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
