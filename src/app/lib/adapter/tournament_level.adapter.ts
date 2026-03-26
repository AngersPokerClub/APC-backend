import { BlindRow } from "@/app/components/table/table.types";
import { TournamentLevel } from "@/app/types";
import { formatHour, formatHourFr, formatHourFR, getDurationInMinutes, toLocalISOString } from "@/app/utils/date";

export const mapTournamentLevelsToRow = (
  levels: TournamentLevel[]
): BlindRow[] => {
  return levels
    .filter(level => level.level_start && level.level_end)
    .sort((a, b) => a.level_number - b.level_number)
    .map(level => {
      const start = new Date(level.level_start);
      const end = new Date(level.level_end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

      const durationMinutes = getDurationInMinutes(start, end);

      return {
        id: level.id,
        level: level.level_pause ? "Pause" : level.level_number,
        small: level.level_pause ? "" : level.level_small_blinde.toString(),
        big: level.level_pause ? "" : level.level_big_blinde.toString(),
        ante: level.level_ante ?? '-',
        pause: level.level_pause,
        duration: `${durationMinutes}"`,
        time: formatHourFr(start),  // Utilise formatHour pour UTC brute
        action: ""
      };
    })
    .filter((row): row is BlindRow => row !== null);
};


