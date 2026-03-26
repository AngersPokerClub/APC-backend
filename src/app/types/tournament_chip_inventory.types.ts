import { Chip } from "./chip.types";
import { Stack } from "./stack.types";

export type StackChip = {
  stack_id: number;
  chip_id: number;
  chip?: Chip;
  stack?: Stack;
};

export type StackChipInput =
  | { stack_id: number; chip_id: number; chip?: Chip } // existant
  | { stack_id: number; chip: Omit<Chip, "id"> }; // nouveau (pas de chip_id)
