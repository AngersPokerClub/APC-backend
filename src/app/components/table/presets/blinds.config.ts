import { Column } from "../generic_table";
import { BlindRow } from "../table.types";

export const blindsColumns: Column<BlindRow>[] = [
  { name: "Niveau", uid: "level" },
  { name: "Petite blinde", uid: "small" },
  { name: "Grosse blinde", uid: "big" },
  { name: "Ante", uid: "ante" },
  { name: "Durée", uid: "duration" },
  { name: "Heure", uid: "time" },
  { name: "", uid: "action" }
];
