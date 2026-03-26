import { Populated } from "./helper";
import { Registration } from "./registration.types";
import { Stack } from "./stack.types";
import { TableAssignment } from "./table_assignement.types";
import { StackChip } from "./tournament_chip_inventory.types";
import { TournamentLevel } from "./tournament_level.types";
import { TournamentRanking } from "./tournament_ranking.types";
import { TournamentTable } from "./tournament_table.types";

export type StackChipPopulated = Stack & {
  chips: StackChip[];
};

export type TournamentLevelPopulated = Populated<
  TournamentLevel,
  "tournament_id"
>;

export type TournamentRankingPopulated = Populated<
  TournamentRanking,
  "registration_id" | "tournament_id"
>;

export type TournamentTablePopulated = Populated<
  TournamentTable,
  "tournament_id"
>;

export type RegistrationPopulated = Populated<Registration, "tournament_id">;

export type TableAssignmentPopulated = Populated<
  TableAssignment,
  "registration_id" | "table_id"
>;
