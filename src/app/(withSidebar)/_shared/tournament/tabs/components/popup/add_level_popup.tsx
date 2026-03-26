import { InputComponents } from "@/app/components/form/input";
import { NumberInputComponents } from "@/app/components/form/number_input";
import { RadioGroupComponents } from "@/app/components/form/radio_group";
import { TimeInputComponents } from "@/app/components/form/time_input";
import { TournamentLevel } from "@/app/types";
import { Checkbox } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

export type NiveauFormBodyProps = {
  isModify: boolean;
  level?: TournamentLevel;
  tournamentStart: Date;
  onUpdate: (
    data: Partial<TournamentLevel> & { duration_minutes: number }
  ) => void;
};

export const NiveauFormBody: React.FC<NiveauFormBodyProps> = ({
  isModify,
  level,
  tournamentStart,
  onUpdate
}) => {
  const initialStart = useMemo(
    () => new Date(level?.level_start ?? tournamentStart),
    [level, tournamentStart]
  );

  const [isPause, setIsPause] = useState(() => level?.level_pause ?? false);
  const [afterLevel, setAfterLevel] = useState(() =>
    String(level?.level_number ?? 0)
  );
  const [duration, setDuration] = useState(() =>
    level?.level_start && level?.level_end
      ? computeDuration(level.level_start, level.level_end)
      : "00:00"
  );
  const [smallBlind, setSmallBlind] = useState(
    () => level?.level_small_blinde ?? 0
  );
  const [bigBlind, setBigBlind] = useState(() => level?.level_big_blinde ?? 0);
  const [ante, setAnte] = useState(() => level?.level_ante ?? 0);
  const [chipRace, setChipRace] = useState(
    () => level?.level_chip_race ?? false
  );

  useEffect(() => {
    if (level) {
      setIsPause(level.level_pause ?? false);
      setAfterLevel(String(level.level_number ?? 0));
      setDuration(
        level.level_start && level.level_end
          ? computeDuration(level.level_start, level.level_end)
          : "00:00"
      );
      setSmallBlind(level.level_pause ? 0 : level.level_small_blinde ?? 0);
      setBigBlind(level.level_pause ? 0 : level.level_big_blinde ?? 0);
      setAnte(level.level_ante ?? 0);
      setChipRace(level.level_chip_race ?? false);
    }
  }, [level]);

  const triggerUpdate = (overrideValues?: Partial<{ 
    isPause: boolean;
    afterLevel: string;
    duration: string;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    chipRace: boolean;
  }>) => {
    const newIsPause = overrideValues?.isPause ?? isPause;
    const newAfterLevel = overrideValues?.afterLevel ?? afterLevel;
    const newDuration = overrideValues?.duration ?? duration;
    const newSmallBlind = overrideValues?.smallBlind ?? smallBlind ?? 0;
    const newBigBlind = overrideValues?.bigBlind ?? bigBlind ?? 0;
    const newAnte = overrideValues?.ante ?? ante;
    const newChipRace = overrideValues?.chipRace ?? chipRace;
  
    const [durH, durM] = newDuration.split(":").map(Number);
    const durationMinutes = durH * 60 + durM;
  
    if (!isNaN(durationMinutes)) {
      onUpdate({
        level_number: parseInt(newAfterLevel) + 1,
        level_start: initialStart.toISOString(),
        duration_minutes: durationMinutes,
        level_pause: newIsPause,
        level_small_blinde: newSmallBlind,
        level_big_blinde: newBigBlind,
        level_ante: newAnte,
        level_chip_race: newChipRace,
      });
    }
  };
  
  
  

  // useEffect(() => {
  //   const [durH, durM] = duration.split(":").map(Number);
  //   const durationMinutes = durH * 60 + durM;

  //   if (!isNaN(durationMinutes)) {
  //     onUpdate({
  //       level_number: parseInt(afterLevel) + 1,
  //       level_start: initialStart.toISOString(),
  //       duration_minutes: durationMinutes,
  //       level_pause: isPause,
  //       level_small_blinde: smallBlind,
  //       level_big_blinde: bigBlind,
  //       level_ante: ante,
  //       level_chip_race: chipRace
  //     });
  //   }
  // }, [
  //   afterLevel,
  //   duration,
  //   isPause,
  //   smallBlind,
  //   bigBlind,
  //   ante,
  //   chipRace,
  //   initialStart,
  //   onUpdate
  // ]);

  return (
    <div className="flex flex-col gap-6 text-primary_brand-50">
      <RadioGroupComponents
        label="Pause"
        value={String(isPause)}
        onChange={(e) => {
          const newPauseValue = e.target.value === "true";
          setIsPause(newPauseValue);
          triggerUpdate({ isPause: newPauseValue });
        }}
        
      />

      <div className="flex flex-col md:flex-row gap-4">
        <InputComponents
          disabled={isModify}
          type="text"
          label="Après le niveau"
          value={afterLevel}
          onChange={(e) => {
            const val = e.target.value;
            setAfterLevel(val);
            triggerUpdate({ afterLevel: val });
          }}
          
        />
        <TimeInputComponents
          label="Durée"
          value={duration}
          onChange={(e) => {
            const val = e.target.value;
            setDuration(val);
            triggerUpdate({ duration: val });
          }}
          
        />
      </div>

      {!isPause && (
        <div className="flex flex-col md:flex-row gap-4">
          <NumberInputComponents
            type="number"
            label="Petite blinde"
            value={smallBlind}
            onChange={(value) => {
              const smallBlindValue = Number(value);
              const safeValue = isNaN(smallBlindValue) ? 0 : smallBlindValue;
              setSmallBlind(safeValue);
              triggerUpdate({ smallBlind: safeValue });
            }}            
          />
          <NumberInputComponents
            type="number"
            label="Grosse blinde"
            value={bigBlind}
            onChange={(value) => {
              const bigBlindValue = Number(value);
              setBigBlind(bigBlindValue);
              triggerUpdate({ bigBlind: bigBlindValue });
            }}
            
          />
          <NumberInputComponents
            type="number"
            label="Ante"
            value={ante}
            onChange={(value) => {
              const newAnte = Number(value);
              setAnte(newAnte);
              triggerUpdate({ ante: newAnte });
            }}
          />
        </div>
      )}
      {isPause && (
        <div className="mt-2">
          <Checkbox
            isSelected={chipRace}
            onValueChange={() => {
              const newChipRace = !chipRace;
              setChipRace(newChipRace);
              triggerUpdate({ chipRace: newChipRace });
            }}
            
            >
            Chip race
          </Checkbox>
        </div>
      )}
    </div>
  );
};

function computeDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const totalMin = Math.floor(diffMs / 60000);
  const h = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const m = String(totalMin % 60).padStart(2, "0");
  return `${h}:${m}`;
}
