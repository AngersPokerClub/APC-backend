"use client";

import { useState, useEffect, useRef } from "react";
import { useDisclosure } from "@heroui/react";
import { Cancel01Icon, CoinsSwapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { GenericModal } from "@/app/components/popup";
import { GenericTable } from "@/app/components/table/generic_table";
import { seatsColumns } from "@/app/components/table/presets/seats.config";
import { ActionDefinition, SeatRow } from "@/app/components/table/table.types";
import { mapAssignementsGroupedByTable } from "@/app/lib/adapter/tournament_table.adapter";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { Registration, TableAssignment } from "@/app/types";
import { EliminatePlayerFormBody } from "./components/popup/eliminate_player_popup";
import { MovePlayerModalBody } from "./components/popup/move_player_popup";
import { useMovePlayer } from "@/app/hook/useMovePlayer";
import { useEliminatePlayer } from "@/app/hook/useEliminatePlayer";
import { useFinishTournament } from "@/app/hook/useUpdateTournament";
import { useAvailableTables } from "@/app/hook/useAvailableTables";
import LoadingComponent from "@/app/error/loading/page";
import { useNotification } from "@/app/providers/NotificationProvider";

export const TableTabs = () => {
  const { notify } = useNotification();

  const [groupedRows, setGroupedRows] = useState<Record<string, SeatRow[]>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<TableAssignment | null>(null);
  const [seatNumber, setSeatNumber] = useState<number>(1);

  const [killerOptions, setKillerOptions] = useState<Registration[]>([]);
  const [selectedKillerId, setSelectedKillerId] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tournament, assignements } = useTournamentContext();

  const movePlayerMutation = useMovePlayer();
  const eliminatePlayerMutation = useEliminatePlayer();
  const finishTournamentMutation = useFinishTournament();

  const [selectedPlayerToMove, setSelectedPlayerToMove] = useState<TableAssignment | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveOptions, setMoveOptions] = useState<TableAssignment[]>([]);
  const [moveMode, setMoveMode] = useState<"swap" | "move">("swap");
  const [selectedSwapTargetId, setSelectedSwapTargetId] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isEliminateLoading, setIsEliminateLoading] = useState(false);

  
  const finishTriggered = useRef(false);


  const { data: availableTables } = useAvailableTables(
    tournament?.id,
    selectedPlayerToMove?.table_id,
    moveMode === "move"
  );

  useEffect(() => {
    if (tournament?.id) {
      setGroupedRows(mapAssignementsGroupedByTable(assignements));
    }
  }, [tournament?.id, assignements]);

  const wasTournamentFinished = useRef(false);
  
  useEffect(() => {
    if (!tournament) return;
  
    const alivePlayers = assignements.filter(a => !a.eliminated);
  
    let tournamentIsFinished = false;
    if (tournament.tournament_category === "SITANDGO") {
      const playersByTable = alivePlayers.reduce<Record<number, number>>((acc, player) => {
        const tableNumber = player.tournament_table?.table_number ?? -1;
        if (tableNumber >= 0) {
          acc[tableNumber] = (acc[tableNumber] || 0) + 1;
        }
        return acc;
      }, {});
      const allTablesHaveOnePlayer = Object.values(playersByTable).length > 0 &&
        Object.values(playersByTable).every(count => count === 1);
      tournamentIsFinished = allTablesHaveOnePlayer;
    } else {
      tournamentIsFinished = alivePlayers.length === 1;
    }
  
    if (
      tournamentIsFinished &&
      tournament.tournament_status !== "finish" &&
      !finishTriggered.current &&
      !wasTournamentFinished.current
    ) {
      finishTriggered.current = true;
      wasTournamentFinished.current = true;
  
      finishTournamentMutation.mutateAsync(tournament.id)
        .then(() => notify("success", "🏆 Le tournoi est terminé !"))
        .catch(() => {
          finishTriggered.current = false;
          notify("error", "Erreur lors de la clôture du tournoi.");
        });
    }
  
    if (!tournamentIsFinished) {
      wasTournamentFinished.current = false;
    }
  
    if (tournament.tournament_status === "finish" || alivePlayers.length > 1) {
      finishTriggered.current = false;
    }
  }, [assignements, tournament?.tournament_status, finishTournamentMutation, notify, tournament]);
  
  
  


  // ✅ Elimination avec notifs killer + mouvements rééquilibrage détaillés
  const handleConfirmElimination = async (killerId: number) => {
    if (!selectedPlayer || !tournament) return;
  
    try {
      setIsEliminateLoading(true);
  
      const killerRegistration = killerOptions.find(k => k.id == killerId);
  
      const res = await eliminatePlayerMutation.mutateAsync({
        tournamentId: tournament.id,
        registrationId: selectedPlayer.registration_id,
        killerId,
      });
  
      notify(
        "error",
        `💀 ${selectedPlayer.registration?.wp_users?.display_name} a été éliminé par ${killerRegistration?.wp_users?.display_name}`
      );
  
      if (res?.moves?.length) {
        res.moves.forEach((move, idx) => {
          // Logs détaillés pour chaque move
          console.log(`Move [${idx}]:`, move);
          if (move.fromTableNumber === undefined) {
            console.warn(`‼️ Move[${idx}] missing fromTableNumber`, move);
          }
          if (move.fromTableSeat === undefined) {
            console.warn(`‼️ Move[${idx}] missing fromTableSeat`, move);
          }
          if (move.toTableNumber === undefined) {
            console.warn(`‼️ Move[${idx}] missing toTableNumber`, move);
          }
          if (move.toTableSeat === undefined) {
            console.warn(`‼️ Move[${idx}] missing toTableSeat`, move);
          }
      
          const from =
            move.fromTableNumber !== undefined && move.fromTableSeat !== undefined
              ? `T${move.fromTableNumber}#S${move.fromTableSeat}`
              : move.fromTableNumber !== undefined
              ? `T${move.fromTableNumber}`
              : "Table inconnue";
      
          const to =
            move.toTableNumber !== undefined && move.toTableSeat !== undefined
              ? `T${move.toTableNumber}#S${move.toTableSeat}`
              : move.toTableNumber !== undefined
              ? `T${move.toTableNumber}`
              : "Table inconnue";
      
          // Log l’affichage final de la notif
          console.log(
            `Notif affichee pour move[${idx}] : ♻️ ${move.playerName}: ${from} → ${to}`
          );
      
          notify("info", `♻️ ${move.playerName}: ${from} → ${to}`);
        });
      } else if (res?.rebalanced) {
        notify("info", "♻️ Rééquilibrage des tables effectué");
      }
  
      onClose();
    } catch (error) {
      console.error("Erreur élimination joueur:", error);
      notify("error", "❌ Une erreur est survenue lors de l'élimination.");
    } finally {
      setIsEliminateLoading(false);
    }
  };
  

  const getConditionalActions = (item: SeatRow): ActionDefinition<SeatRow>[] => {
    const actions: ActionDefinition<SeatRow>[] = [];

    if (tournament && tournament.tournament_status !== "start") {
      actions.push({
        tooltip: "Éliminer",
        icon: <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} />,
        onClick: () => {
          const assignment = assignements.find((a) => a.id === item.id);
          if (!assignment?.tournament_table?.table_number) return;

          setSelectedPlayer(assignment);

          const killers = assignements
            .filter(
              (a) =>
                !a.eliminated &&
                a.registration &&
                a.tournament_table?.table_number ===
                  assignment.tournament_table?.table_number &&
                a.registration_id !== assignment.registration_id
            )
            .map((a) => a.registration)
            .filter((r): r is Registration => !!r);

          setKillerOptions(killers);
          onOpen();
        }
      });
    }

    actions.push({
      tooltip: "Changer de place",
      icon: <HugeiconsIcon icon={CoinsSwapIcon} size={20} strokeWidth={1.5} />,
      onClick: () => {
        const assignment = assignements.find((a) => a.id === item.id);
        if (!assignment) return;

        setSelectedPlayerToMove(assignment);

        const otherPlayers = assignements.filter(
          (a) =>
            !a.eliminated &&
            a.id !== assignment.id &&
            a.registration &&
            a.tournament_table
        );

        setMoveOptions(otherPlayers);
        setIsMoveModalOpen(true);
      }
    });

    return actions;
  };

  if (!tournament) return <LoadingComponent />;

  return (
    <div className="flex flex-col gap-6">
      {Object.keys(groupedRows).length > 0 ? (
        <div className="flex flex-col gap-6 sm:flex-col xl:grid xl:grid-cols-3 xl:gap-6">
          {Object.entries(groupedRows).map(([tableNumber, rows]) => (
            <div key={tableNumber} className="flex flex-col gap-2">
              <h2 className="text-center sm:text-left text-base sm:text-xl font-bold">
                TABLE {tableNumber}
              </h2>
              <div className="w-full overflow-x-auto">
                <GenericTable<SeatRow>
                  columns={seatsColumns}
                  items={rows}
                  ariaLabel={`Table ${tableNumber}`}
                  showActions
                  actions={getConditionalActions}
                  enableSorting={false}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-white mt-10">
          Aucun joueur assigné à une table pour ce tournoi.
        </div>
      )}

      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Éliminer un joueur"
        confirmLabel="Confirmer l'élimination"
        onConfirm={async () => {
          if (selectedKillerId) handleConfirmElimination(selectedKillerId);
        }}
        loading={isEliminateLoading}  // <--- ici la prop loading
      >
        <EliminatePlayerFormBody
          eliminatePlayer={selectedPlayer?.registration?.wp_users?.display_name ?? ""}
          allPlayerTable={killerOptions}
          selectedKillerId={selectedKillerId}
          onSelectKiller={setSelectedKillerId}
        />
      </GenericModal>


      <GenericModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setSelectedSwapTargetId(null);
          setSelectedTableId(null);
          setMoveMode("swap");
        }}
        title={`Changer de place : ${selectedPlayerToMove?.registration?.wp_users?.display_name ?? ""}`}
        confirmLabel="Confirmer"
        onConfirm={async () => {
          if (!selectedPlayerToMove || !tournament?.id) return;

          const targetId =
            moveMode === "swap" ? selectedSwapTargetId : selectedTableId;

          if (!targetId) {
            alert("Aucune cible sélectionnée");
            return;
          }

          try {
            const payload: any = {
              tournamentId: tournament.id,
              playerId: selectedPlayerToMove.id,
              mode: moveMode,
              targetId
            };

            if (moveMode === "move") {
              payload.seatNumber = seatNumber;
            }

            await movePlayerMutation.mutateAsync(payload);

            let tableDest = "";
            if (moveMode === "swap") {
              const targetPlayer = assignements.find((a) => a.id === targetId);
              tableDest = targetPlayer?.tournament_table?.table_number
                ? `Table ${targetPlayer.tournament_table.table_number}`
                : "une autre table";
            } else {
              const targetTable = availableTables?.find((t: any) => t.id === targetId);
              tableDest = targetTable
                ? `Table ${targetTable.table_number}`
                : "une autre table";
            }

            notify(
              "info",
              `🔄 ${selectedPlayerToMove?.registration?.wp_users?.display_name} est maintenant à ${tableDest}`
            );

            setIsMoveModalOpen(false);
            setSelectedSwapTargetId(null);
            setSelectedTableId(null);
            setMoveMode("swap");
          } catch (err) {
            console.error("❌ Erreur lors du déplacement :", err);
            notify("error", "❌ Une erreur est survenue lors du déplacement.");
          }
        }}>
        <MovePlayerModalBody
          selectedPlayer={selectedPlayerToMove!}
          moveOptions={
            moveMode === "swap" ? moveOptions : availableTables ?? []
          }
          tournamentId={tournament.id}
          onSelectTarget={(value: string) => {
            if (moveMode === "swap") {
              setSelectedSwapTargetId(parseInt(value));
            } else {
              setSelectedTableId(parseInt(value));
            }
          }}
          onSelectMode={(mode) => setMoveMode(mode)}
          selectedMode={moveMode}
          selectedTarget={
            moveMode === "swap"
              ? selectedSwapTargetId?.toString() ?? ""
              : selectedTableId?.toString() ?? ""
          }
          onSeatNumberChange={setSeatNumber}
        />
      </GenericModal>
    </div>
  );
};
