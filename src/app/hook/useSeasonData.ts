import { useQuery } from "@tanstack/react-query";
import { SeasonRow } from "../components/table/table.types";
import { Season } from "../types/season.types";
import { mapSeasonsToRows } from "../lib/adapter/season.adapter";

type AllSeasonsResponse = {
    seasons: Season[];
};
  
export const useAllSeasons = () => {
    const query = useQuery<SeasonRow[]>({
        queryKey: ["all-seasons"],
        queryFn: async (): Promise<SeasonRow[]> => {
        const res = await fetch("/api/seasons");
        if (!res.ok) throw new Error("Erreur serveur");

        const data: AllSeasonsResponse = await res.json();

        return mapSeasonsToRows(data.seasons);
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