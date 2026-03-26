import { Registration } from "./registration.types";
import { TournamentTable } from "./tournament_table.types";

export type TableAssignment = {
  id: number;
  registration_id: number;
  table_id: number;
  table_seat_number: number;
  eliminated: boolean;
  user_kill_id?: number;
  registration?: Registration;
  tournament_table?: TournamentTable;
};