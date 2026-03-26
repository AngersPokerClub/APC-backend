import { StackChip, StackChipInput } from "./tournament_chip_inventory.types";
import { Tournament } from "./tournament.types";

export type Stack = {
  id: number;
  stack_name: string;
  stack_total_player: number;
  stack_chip?: StackChip[];
  tournament?: Tournament[];
};

export type EditableStack = {
  id: number;
  stack_name: string;
  stack_total_player: number;
  stack_chip: StackChipInput[];
};
