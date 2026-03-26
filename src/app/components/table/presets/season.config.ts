import { Column } from "../generic_table";
import { SeasonRow } from "../table.types";

export const seasonColumns: Column<SeasonRow>[] = [
  { name: "Nom", uid: "name" },
  { name: "Date de début", uid: "start_date" },
  { name: "Date de fin", uid: "end_date" },
  { name: "Statut", uid: "status" },
  { name: "", uid: "action" }
];
