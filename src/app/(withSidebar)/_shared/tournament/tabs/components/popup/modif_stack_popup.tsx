import {
  Stack,
  StackChip,
  Chip,
  StackChipInput,
  EditableStack
} from "@/app/types";
import { Input, Button, Divider } from "@heroui/react";
import { useEffect, useState } from "react";

type Props = {
  stacks: Stack[];
  currentStackId: number;
  onUpdateStack: (updatedStack: EditableStack) => void;
};

export const StackEditorForm: React.FC<Props> = ({
  stacks,
  currentStackId,
  onUpdateStack
}) => {
  const currentStack = stacks.find((s) => s.id === currentStackId);
  const [stackId, setStackId] = useState(currentStack?.id ?? 0);
  const [stackTotalPlayer, setStackTotalPlayer] = useState(
    currentStack?.stack_total_player ?? 0
  );
  const [chips, setChips] = useState<StackChipInput[]>(
    currentStack?.stack_chip ?? []
  );

  const [newChipValue, setNewChipValue] = useState<number>(0);
  const [newChipImage, setNewChipImage] = useState<string>("");

  useEffect(() => {
    if (stackId && stacks.length > 0) {
      handleStackChange(stackId);
    }
  }, [stackId, stacks]);

  const handleStackChange = (newId: number) => {
    const selected = stacks.find((s) => s.id === newId);
    if (!selected) return;

    setStackId(selected.id);
    setStackTotalPlayer(selected.stack_total_player);
    setChips(
      selected.stack_chip?.sort(
        (a, b) => (a.chip?.value ?? 0) - (b.chip?.value ?? 0)
      ) ?? []
    );

    const editableStack: EditableStack = {
      id: selected.id,
      stack_name: selected.stack_name,
      stack_total_player: selected.stack_total_player,
      stack_chip: (selected.stack_chip ?? [])
        .map((sc) => ({
          stack_id: sc.stack_id,
          chip_id: sc.chip_id,
          chip: sc.chip
        }))
        .sort((a, b) => (a.chip?.value ?? 0) - (b.chip?.value ?? 0))
    };

    onUpdateStack(editableStack);
  };

  const handleAddChip = () => {
    if (newChipValue <= 0 || !newChipImage) return;

    const newChip: Omit<Chip, "id"> = {
      value: newChipValue,
      chip_image: newChipImage
    };

    const newChips: StackChipInput[] = [
      ...chips,
      {
        stack_id: stackId,
        chip: newChip
      }
    ];

    setChips(newChips);
    setNewChipValue(0);
    setNewChipImage("");

    onUpdateStack({
      id: stackId,
      stack_name: currentStack?.stack_name ?? "",
      stack_total_player: stackTotalPlayer,
      stack_chip: newChips as any
    });
  };

  return (
    <div className="p-6 flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <label className="text-primary_brand-50 font-satoshiBold">
          Stack utilisé
        </label>
        <select
          className="rounded border p-2 bg-neutral-800 text-white"
          value={stackId}
          onChange={(e) => handleStackChange(parseInt(e.target.value))}>
          {stacks.map((stack) => (
            <option key={stack.id} value={stack.id}>
              {stack.stack_name}
            </option>
          ))}
        </select>

        <label className="text-primary_brand-50 font-satoshiBold">
          Stack initial par joueur
        </label>
        <Input
          type="number"
          min={0}
          value={String(stackTotalPlayer)}
          onChange={(e) => {
            const newValue = parseInt(e.target.value);
            setStackTotalPlayer(newValue);
            onUpdateStack({
              id: stackId,
              stack_name: currentStack?.stack_name ?? "",
              stack_total_player: newValue,
              stack_chip: chips
            });
          }}
        />

        <Divider />

        <p className="text-primary_brand-50 font-satoshiBold">Jetons actuels</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {chips.map((sc, index) => (
            <div key={index} className="flex items-center gap-2">
              <img
                src={sc.chip?.chip_image ?? ""}
                alt=""
                className="w-12 h-12 object-contain"
              />
              <span className="font-semibold">{sc.chip?.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
