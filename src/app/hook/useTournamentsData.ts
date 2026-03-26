// hooks/useTournamentDataByCategory.ts
import { useQuery } from "@tanstack/react-query";
import { mapTournamentsToRow } from "@/app/lib/adapter/tournament.adapter";
import { mapQuarterRankingByTrimestry } from "@/app/lib/adapter/quarter_ranking.adapter";
import { Season, Tournament } from "@/app/types";
import { StandingRow, TournamentRow } from "../components/table/table.types";
import { Trimester } from "../types/trimester.types";

type TrimestryKey = "T1" | "T2" | "T3";

type TournamentDataByCategory = {
  tournaments: Tournament[];
  tournamentRows: TournamentRow[];
  quarterRankingRows: Record<TrimestryKey, StandingRow[]>;
  trimestry: Trimester[];
};

export const useTournamentDataByCategory = (category: string) => {
  const query = useQuery<TournamentDataByCategory>({
    queryKey: ["tournament-details", category],
    queryFn: async (): Promise<TournamentDataByCategory> => {
      const res = await fetch(`/api/tournaments/${category}/details`);
      if (!res.ok) throw new Error("Erreur serveur");

      const data = await res.json();

      // Attention : data.tournamentss doit être data.tournaments ?
      // Sinon corrige l’API ou le mapping ici :
      return {
        tournaments: data.tournamentss, // ou data.tournaments selon ton backend
        tournamentRows: mapTournamentsToRow(
          data.tournamentss,
          data.registrationsWithRoles,
          data.trimestry
        ),
        quarterRankingRows: mapQuarterRankingByTrimestry(
          category,
          data.trimestry,
          data.tournamentss,          // ou data.tournaments selon nom API
          data.registrationsWithRoles,
          data.seasons,
          data.tournament_ranking     // ce tableau doit venir de votre backend avec les données détaillées
        ),
        
        trimestry: data.trimestry
      };
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
