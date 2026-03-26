"use client";

import { GenericModal } from "@/app/components/popup";
import { GenericTable } from "@/app/components/table/generic_table";
import { blindsColumns } from "@/app/components/table/presets/blinds.config";
import { ActionDefinition, BlindRow } from "@/app/components/table/table.types";
import { mapTournamentLevelsToRow } from "@/app/lib/adapter/tournament_level.adapter";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { TournamentLevel } from "@/app/types";
import { useDisclosure } from "@heroui/react";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NiveauFormBody } from "./components/popup/add_level_popup";
import {
  useDeleteTournamentLevel,
  useUpdateTournamentLevel
} from "@/app/hook/useTournamentLevel";
import LoadingComponent from "@/app/error/loading/page";

export const NiveauxTabs: React.FC = () => {
  const { levels, tournament, refetchAll, refetchOnly } = useTournamentContext();

  const [levelsRow, setLevelsRow] = useState<BlindRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelToDelete, setLevelToDelete] = useState<BlindRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [levelToModify, setLevelToModify] = useState<BlindRow | null>(null);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [tournamentLevelFormData, setTournamentLevelFormData] = useState<
    Partial<TournamentLevel>
  >({});

  const updateLevelMutation = useUpdateTournamentLevel();
  const deleteLevelMutation = useDeleteTournamentLevel();

  // const handleUpdate = useCallback((updated) => {
  //   setTournamentLevelFormData((prev) => ({ ...prev, ...updated }));
  // }, []);
  
  
  const currentLevel = useMemo(() => {
    return levels.find((l) => l.id === levelToModify?.id) || undefined;
  }, [levels, levelToModify]);
  

  useEffect(() => {
    const rows = mapTournamentLevelsToRow(levels);
    setLevelsRow(rows);
    setIsLoading(false);
  }, [levels]);

  const getConditionalActions = (item: BlindRow) => {
    const actions: ActionDefinition<BlindRow>[] = [
      {
        tooltip: "Éditer",
        icon: (
          <HugeiconsIcon icon={PencilEdit02Icon} size={20} strokeWidth={1.5} />
        ),
        onClick: () => {
          setLevelToModify(item);
          setIsModifyModalOpen(true);
        }
      },
      {
        tooltip: "Supprimer",
        icon: <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.5} />,
        onClick: () => {
          setLevelToDelete(item);
          setIsDeleteModalOpen(true);
        },
        color: "danger"
      }
    ];
    return actions;
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <LoadingComponent />
      ) : levelsRow && levelsRow.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <GenericTable<BlindRow>
            columns={blindsColumns}
            items={levelsRow}
            ariaLabel="Niveaux"
            showActions={true}
            actions={getConditionalActions}
          />
        </div>
      ) : (
        <div className="text-center text-white py-10">
          Aucun niveau défini pour ce tournoi.
        </div>
      )}

      <GenericModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setLevelToDelete(null);
        }}
        title="Supprimer le niveau"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          if (!levelToDelete) return;

          try {
            await deleteLevelMutation.mutateAsync(levelToDelete.id);
            
            setIsDeleteModalOpen(false);
            setLevelToDelete(null);
          } catch (error) {
            console.error("Erreur suppression niveau :", error);
            alert("Une erreur est survenue.");
          }
        }}
        loading={deleteLevelMutation.isLoading}
        >
        <p>
          Es-tu sûr de vouloir supprimer le niveau <b>{levelToDelete?.level}</b>{" "}
          ?
        </p>
      </GenericModal>

      <GenericModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        title={`Modifier le niveau ${levelToModify?.level}`}
        confirmLabel="Modifier le niveau"
        onConfirm={async () => {
          if (!levelToModify) return;

          try {
            await updateLevelMutation.mutateAsync({
              id: levelToModify.id,
              data: tournamentLevelFormData
            });

            
            setIsModifyModalOpen(false);
            setLevelToModify(null);
          } catch (error) {
            console.error("Erreur modification niveau :", error);
            alert("Une erreur est survenue.");
          }
        }}
        loading={updateLevelMutation.isLoading}
        >
        <NiveauFormBody
          isModify={true}
          tournamentStart={new Date(levels?.[0]?.level_start)}
          level={currentLevel}
          onUpdate={(updated) =>
            setTournamentLevelFormData((prev) => ({ ...prev, ...updated }))
          }
        />
      </GenericModal>
    </div>
  );
};
