import { GenericModal } from "@/app/components/popup";
import {
  EditableStack,
  Stack,
  Tournament,
  TournamentLevel,
  TournamentRanking
} from "@/app/types";
import { NiveauFormBody } from "./popup/add_level_popup";
import { PlayerFormBody } from "./popup/add_player_popup";
import { useMemo, useRef, useState } from "react";
import { formatDate } from "@/app/utils/date";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { StackEditorForm } from "./popup/modif_stack_popup";
import { useGenerateTables } from "@/app/hook/useGenerateTables";
import { useUpdateStack } from "@/app/hook/useUpdateStack";
import { useCreateLevel } from "@/app/hook/useCreateLevel";
import { useCreatePlayer } from "@/app/hook/useCreatePlayer";

interface ModalManagerProps {
  selectedTab: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  selectedTab,
  isOpen,
  onClose
}) => {
  const { tournament, levels, stacks, refetchAll } = useTournamentContext();

  const generateTablesMutation = useGenerateTables();
  const updateStackMutation = useUpdateStack();
  const createLevelMutation = useCreateLevel();
  const createPlayerMutation = useCreatePlayer();

  const levelFormRef = useRef<Partial<TournamentLevel>>({});
  const [playerFormData, setPlayerFormData] = useState({
    pseudo: "",
    firstName: "",
    lastName: ""
  });
  const [tournamentFormData, setTournamentFormData] = useState<
    Partial<Tournament>
  >({});
  const [updatedStack, setUpdatedStack] = useState<EditableStack | null>(null);

  const lastLevel = useMemo(
    () =>
      levels && levels.length > 0
        ? levels.reduce((max, curr) =>
            curr.level_number > max.level_number ? curr : max
          )
        : undefined,
    [levels]
  );

  if (!tournament) return null;

  const handleCreatePlayer = async () => {
    if (!tournament?.id) return;

    try {
      await createPlayerMutation.mutateAsync({
        tournamentId: tournament.id,
        data: playerFormData
      });
      onClose();
    } catch (error) {
      console.error("Erreur ajout joueur :", error);
      alert("Une erreur est survenue : " + error);
    }
  };

  const handleCreateNiveau = async () => {
    if (!tournament?.id || !levelFormRef.current) return;

    const payload = {
      ...levelFormRef.current,
      tournament_id: tournament.id
    };

    try {
      await createLevelMutation.mutateAsync({
        tournamentId: tournament.id,
        data: payload
      });
      onClose();
    } catch (error) {
      console.error("❌ Erreur création niveau :", error);
      alert("Une erreur est survenue.");
    }
  };

  const handleConfirmStackUpdate = async () => {
    if (!updatedStack || !tournament) {
      alert("Aucune modification détectée.");
      return;
    }
    const payload = {
      tournament_id: tournament.id,
      selected_stack_id: updatedStack.id,
      stack_total_player: updatedStack.stack_total_player,
      stack_chip:
        updatedStack.stack_chip?.map((sc) =>
          "chip_id" in sc
            ? {
                stack_id: sc.stack_id,
                chip_id: sc.chip_id
              }
            : {
                stack_id: sc.stack_id,
                chip: {
                  value: sc.chip?.value ?? 0,
                  chip_image: sc.chip?.chip_image ?? ""
                }
              }
        ) ?? []
    };

    try {
      await updateStackMutation.mutateAsync({
        stackId: updatedStack.id,
        data: payload
      });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la modification du stack :", error);
      alert("Une erreur est survenue lors de la modification du stack.");
    }
  };

  const generateTable = async () => {
    if (!tournament?.id) return;

    try {
      await generateTablesMutation.mutateAsync(tournament.id);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la génération des tables :", error);
      alert("Une erreur est survenue lors de la génération des tables.");
    }
  };

  // Liaison des états de chargement à loader de chaque modal :
  if (selectedTab === "1") {
    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Ajouter un niveau"
        confirmLabel="Ajouter le niveau"
        onConfirm={handleCreateNiveau}
        loading={createLevelMutation.isLoading}
      >
        <NiveauFormBody
          isModify={false}
          tournamentStart={new Date(tournament.tournament_start_date)}
          level={lastLevel}
          onUpdate={(data) => {
            levelFormRef.current = { ...levelFormRef.current, ...data };
          }}
        />
      </GenericModal>
    );
  }
  if (selectedTab === "2") {
    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Ajouter un joueur"
        confirmLabel="Ajouter le joueur"
        onConfirm={handleCreatePlayer}
        loading={createPlayerMutation.isLoading}
      >
        <PlayerFormBody
          onUpdate={(data) =>
            setPlayerFormData((prev) => ({ ...prev, ...data }))
          }
        />
      </GenericModal>
    );
  }
  if (selectedTab === "3") {
    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Générer les tables"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        onConfirm={generateTable}
        loading={generateTablesMutation.isLoading}
      >
        <p>Es-tu sûr de vouloir générer les tables pour ce tournoi ?</p>
      </GenericModal>
    );
  }
  if (selectedTab === "4") {
    return (
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Modifier le stack"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmStackUpdate}
        loading={updateStackMutation.isLoading}
      >
        <StackEditorForm
          stacks={stacks}
          currentStackId={tournament.tournament_stack}
          onUpdateStack={setUpdatedStack}
        />
      </GenericModal>
    );
  }

  return null;
};
