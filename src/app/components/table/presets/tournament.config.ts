import { Column } from "../generic_table";
import { TournamentRow } from "../table.types";

export const tournamentColumns: Column<TournamentRow>[] = [
  { name: "Nom", uid: "name" },
  { name: "Participants", uid: "players" },
  { name: "Trimestre", uid: "trimestry" },
  { name: "Date du tournoi", uid: "tournament_date" },
  { name: "Date d'ouverture", uid: "open_tournament_date" },
  { name: "Statut", uid: "status" },
  { name: "", uid: "action" }
];
