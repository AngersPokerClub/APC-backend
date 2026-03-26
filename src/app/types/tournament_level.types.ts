import { Tournament } from "./tournament.types";

export type TournamentLevel = {
  id: number;
  tournament_id: number;
  level_number: number;
  level_start: string;
  level_end: string;
  level_small_blinde: number;
  level_big_blinde: number;
  level_pause: boolean;
  level_chip_race: boolean;
  level_ante?: number;
  tournament?: Tournament;
};
