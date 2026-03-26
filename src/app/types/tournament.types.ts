import { Registration } from "./registration.types";
import { Stack } from "./stack.types";
import { TournamentLevel } from "./tournament_level.types";
import { TournamentRanking } from "./tournament_ranking.types";
import { TournamentTable } from "./tournament_table.types";

export type Tournament = {
  id: number;
  wordpress_post_id: number;
  tournament_name: string;
  tournament_description: string;
  tournament_start_date: Date;
  tournament_open_date: Date;
  estimate_duration: number;
  tournament_stack: number;
  tournament_pause: boolean;
  tournament_pause_date?: Date;
  tournament_trimestry: number;
  tournament_category: "APT" | "SPECIAL" | "SITANDGO" | "SUPERFINALE" | "SOLIPOKER";
  tournament_status: "in_coming" | "finish" | "start";
  registration?: Registration[];
  tournament_level?: TournamentLevel[];
  tournament_ranking?: TournamentRanking[];
  tournament_table?: TournamentTable[];
  tournament_background_1: string;
  tournament_background_2: string;
  stack?: Stack;
};
