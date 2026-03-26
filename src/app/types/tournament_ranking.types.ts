import { Registration } from "./registration.types";
import { Tournament } from "./tournament.types";

export type TournamentRanking = {
  id: number;
  registration_id: number;
  tournament_id: number;
  ranking_position: number;
  ranking_score: number;
  table_id?: number;
  registration?: Registration;
  tournament?: Tournament;
};