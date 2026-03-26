import { TableAssignment } from "./table_assignement.types";
import { Tournament } from "./tournament.types";

export type TournamentTable = {
  id: number;
  tournament_id: number;
  table_number: number;
  table_capacity: number;
  table_assignment?: TableAssignment[];
  tournament?: Tournament;
};