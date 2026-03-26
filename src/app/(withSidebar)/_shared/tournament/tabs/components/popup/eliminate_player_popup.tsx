import { Radio, RadioGroup } from "@heroui/react";
import { Registration } from "@/app/types";

type EliminatePlayerProps = {
  eliminatePlayer: string;
  allPlayerTable: Registration[];
  selectedKillerId: number | null;
  onSelectKiller: (id: number) => void;
};


export const EliminatePlayerFormBody: React.FC<EliminatePlayerProps> = ({
  eliminatePlayer,
  allPlayerTable,
  selectedKillerId,
  onSelectKiller
}) => {
  return (
    <div className="flex flex-col gap-6 text-primary_brand-50 w-full">
      <span className="text-l font-satoshiRegular">
        Qui a éliminé {eliminatePlayer} ?
      </span>
      <RadioGroup
        name="killer"
        className="flex flex-col gap-3"
        value={selectedKillerId !== null ? String(selectedKillerId) : ""}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          console.log(value);
          onSelectKiller(Number(value));
        }}
      >
        {allPlayerTable.map((player) => (
          <Radio key={player.id} value={String(player.id)}>
            <div className="flex items-center gap-4 p-2 rounded w-full">
              <img
                src={player.wp_users?.photo_url || "/images/ellipseAvatar.png"}
                alt={player.wp_users?.display_name ?? ""}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-satoshiRegular text-l">
                {player.wp_users?.display_name ?? ""}
              </span>
            </div>
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};


