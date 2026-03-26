import { Column } from "../generic_table";
import { StandingRow } from "../table.types";

export const standingsColumns: Column<StandingRow>[] = [
  { name: "Place", uid: "place", align: "start" },
  { name: "Pseudo", uid: "name", align: "start" },
  { name: "Points", uid: "points", align: "center" }
];
