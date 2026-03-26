import { Column } from "../generic_table";
import { SeatRow } from "../table.types";

export const seatsColumns: Column<SeatRow>[] = [
  { name: "Nom", uid: "avatar", align: "start" },
  { name: "Siège", uid: "seat", align: "start" },
  { name: "", uid: "action", align: "start" }
];
