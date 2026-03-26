// lib/adapter/season.adapter.ts
import { SeasonRow } from "@/app/components/table/table.types";
import { Season } from "@/app/types/season.types";
import { toISODateOnly } from "@/app/utils/date";

export function mapSeasonsToRows(seasons: Season[]): SeasonRow[] {
  return seasons.map((season) => ({
    id: String(season.id),
    name: season.name,
    start_date: toISODateOnly(season.start_date),
    end_date: toISODateOnly(season.end_date),
    status: season.status,
    action: "",
    trimester: season.trimester
      ? season.trimester.map((t) => ({
          name: `T${t.number}`,
          start_date: toISODateOnly(t.start_date),
          end_date: toISODateOnly(t.end_date),
        }))
      : [],
  }));
}


