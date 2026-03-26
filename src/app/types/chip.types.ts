import { StackChip } from "./tournament_chip_inventory.types";

export type Chip = {
  id: number;
  value: number;
  chip_image: string;
  stack_chip?: StackChip[];
};

export type NewChip = {
  value: number;
  chip_image: string;
};

