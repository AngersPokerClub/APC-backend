"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDisclosure } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Delete02Icon,
  Eraser01Icon
} from "@hugeicons/core-free-icons";

import { GenericTable } from "@/app/components/table/generic_table";
import { seatsColumns } from "@/app/components/table/presets/seats.config";
import { ActionDefinition, SeatRow } from "@/app/components/table/table.types";
import { SearchBarComponents } from "@/app/components/form/search_bar";
import { GenericModal } from "@/app/components/popup";
import { EliminatePlayerFormBody } from "./components/popup/eliminate_player_popup";
import { mapFlatAssignementsToSeatRows } from "@/app/lib/adapter/tournament_table.adapter";
import { Registration, TableAssignment } from "@/app/types";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { useCancelTournamentPlayer } from "@/app/hook/useCancelTournamentPlayer";
import { useCancelPlayerElimination } from "@/app/hook/useCancelPlayerElimination";
import { useFinishTournament } from "@/app/hook/useUpdateTournament";
import { useEliminatePlayer } from "@/app/hook/useEliminatePlayer";
import LoadingComponent from "@/app/error/loading/page";
import React from "react";
import { useNotification } from "@/app/providers/NotificationProvider";

export const PlayerTabs = React.memo(() => {
  const { notify } = useNotification();

  const [flatRows, setFlatRows] = useState<SeatRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<TableAssignment | null>(null);
  const [killerOptions, setKillerOptions] = useState<Registration[]>([]);
  const [selectedKillerId, setSelectedKillerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelKillModal, setIsCancelKillModal] = useState(false);
  const [isCancelStatusModal, setIsCancelStatusModal] = useState(false);
  // Nouveau state pour loader modal élimination
  const [isEliminateLoading, setIsEliminateLoading] = useState(false);
  const finishTriggered = useRef(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tournament, assignements, registration } = useTournamentContext();

  const cancelPlayerMutation = useCancelTournamentPlayer();
  const cancelEliminationMutation = useCancelPlayerElimination();
  const eliminatePlayerMutation = useEliminatePlayer();
  const finishTournamentMutation = useFinishTournament();

  const transformedRows = useMemo(() => {
    if (!tournament?.id) return [];
    return mapFlatAssignementsToSeatRows(assignements, registration);
  }, [tournament?.id, assignements, registration]);

  useEffect(() => {
    setFlatRows(transformedRows);
    setIsLoading(false);
  }, [transformedRows]);

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
  
    if (tournament.tournament_status === "finish" || !tournamentIsFinished) {
      finishTriggered.current = false;
    }
  }, [assignements, tournament?.tournament_status, finishTournamentMutation, notify, tournament]);
  
  


  const filteredRows = useMemo(() => {
    if (!search) return flatRows;
    return flatRows.filter((row) =>
      row.avatarName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [flatRows, search]);

  const getConditionalActions = useCallback((
    item: SeatRow
  ): ActionDefinition<SeatRow>[] => {
    if (tournament?.tournament_status !== "start") {
      return item.eliminated === false
        ? [
            {
              tooltip: "Éliminer",
              icon: (
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={20}
                  strokeWidth={1.5}
                />
              ),
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
                setSelectedKillerId(null);
                onOpen();
              }
            },
            {
              tooltip: "Supprimer",
              icon: <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.5} />,
              onClick: () => {
                let assignment = assignements.find((a) => a.id === item.id);
      
                if (!assignment) {
                  const fallbackReg = registration.find(
                    (r) => r.wp_users?.display_name === item.avatarName
                  );
                  if (fallbackReg) {
                    assignment = {
                      id: -1,
                      tournament_id: tournament?.id,
                      registration_id: fallbackReg.id,
                      eliminated: false,
                      table_seat_number: 0,
                      tournament_table: null,
                      registration: fallbackReg
                    } as unknown as TableAssignment;
                  }
                }
      
                if (assignment) {
                  setSelectedPlayer(assignment);
                  setIsCancelStatusModal(true);
                }
              },
              color: "danger"
            }
          ]
        : [
            {
              tooltip: "Annuler élimination",
              icon: (
                <HugeiconsIcon
                  icon={Eraser01Icon}
                  size={20}
                  strokeWidth={1.5}
                />
              ),
              onClick: () => {
                const assignment = assignements.find((a) => a.id === item.id);
                if (!assignment) return;

                setSelectedPlayer(assignment);
                setIsCancelKillModal(true);
              }
            }
          ];
    }

    return [
      {
        tooltip: "Supprimer",
        icon: <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={1.5} />,
        onClick: () => {
          let assignment = assignements.find((a) => a.id === item.id);

          if (!assignment) {
            const fallbackReg = registration.find(
              (r) => r.wp_users?.display_name === item.avatarName
            );
            if (fallbackReg) {
              assignment = {
                id: -1,
                tournament_id: tournament.id,
                registration_id: fallbackReg.id,
                eliminated: false,
                table_seat_number: 0,
                tournament_table: null,
                registration: fallbackReg
              } as unknown as TableAssignment;
            }
          }

          if (assignment) {
            setSelectedPlayer(assignment);
            setIsCancelStatusModal(true);
          }
        },
        color: "danger"
      }
    ];
  }, [tournament?.tournament_status, assignements, onOpen, registration, tournament?.id]);

  // 🆕 Elimination avec retour API + notifs killer et rééquilibrage détaillé
  const handleConfirmElimination = useCallback(async (killerRegistrationId: number) => {
    if (!selectedPlayer || !tournament) return;
    try {
      setIsEliminateLoading(true);
      
      const killerRegistration = killerOptions.find(k => k.id == killerRegistrationId);

      const res = await eliminatePlayerMutation.mutateAsync({
        tournamentId: tournament.id,
        registrationId: selectedPlayer.registration_id,
        killerId: killerRegistrationId,
      });

      notify("error", `💀 ${selectedPlayer.registration?.wp_users?.display_name} a été éliminé par ${killerRegistration?.wp_users?.display_name}`);

      if (res?.moves?.length) {
        res.moves.forEach((move) => {
          const from = (move.fromTableNumber !== undefined && move.fromTableSeat !== undefined)
            ? `T${move.fromTableNumber}#S${move.fromTableSeat}`
            : (move.fromTableNumber !== undefined)
            ? `T${move.fromTableNumber}`
            : "Table inconnue";
      
          const to = (move.toTableNumber !== undefined && move.toTableSeat !== undefined)
            ? `T${move.toTableNumber}#S${move.toTableSeat}`
            : (move.toTableNumber !== undefined)
            ? `T${move.toTableNumber}`
            : "Table inconnue";
      
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
  }, [selectedPlayer, tournament, killerOptions, eliminatePlayerMutation, notify, onClose]);

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="flex flex-col gap-6">
      <div className="px-1 sm:px-0">
        <SearchBarComponents
          label="Pseudo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full overflow-x-auto">
        <div className="max-w-4xl mx-auto">
          <GenericTable
            columns={seatsColumns}
            items={filteredRows}
            width={false}
            ariaLabel="Joueurs"
            showActions
            enableRowClick
            getDetailUrl={() => ""}
            actions={getConditionalActions}
            enableSorting={false}
          />
        </div>
      </div>

      {/* Modal élimination */}
      <GenericModal
        isOpen={isOpen}
        onClose={onClose}
        title="Éliminer un joueur"
        confirmLabel="Confirmer l'élimination"
        onConfirm={async () => {
          if (selectedKillerId) await handleConfirmElimination(selectedKillerId);
        }}
        loading={isEliminateLoading} // <-- Loader activé ici
      >
        <EliminatePlayerFormBody
          eliminatePlayer={selectedPlayer?.registration?.wp_users?.display_name ?? ""}
          allPlayerTable={killerOptions}
          selectedKillerId={selectedKillerId}
          onSelectKiller={setSelectedKillerId}
        />
      </GenericModal>

      {/* Modal annulation élimination */}
      <GenericModal
        isOpen={isCancelKillModal}
        onClose={() => setIsCancelKillModal(false)}
        title="Annuler l'élimination"
        confirmLabel="Annuler"
        cancelLabel="Retour"
        onConfirm={async () => {
          if (!selectedPlayer || !tournament) return;
          try {
            await cancelEliminationMutation.mutateAsync({
              tournamentId: tournament.id,
              registrationId: selectedPlayer.registration_id
            });
            notify("success", `✅ Élimination annulée pour ${selectedPlayer.registration?.wp_users?.display_name}`);
            setSelectedPlayer(null);
            setIsCancelKillModal(false);
          } catch (error) {
            console.error("Erreur annulation élimination:", error);
            notify("error", "❌ Une erreur est survenue lors de l'annulation.");
          }
        }}
      >
        <p>
          Es-tu sûr de vouloir annuler l&apos;élimination de{" "}
          <b>{selectedPlayer?.registration?.wp_users?.display_name}</b> ?
        </p>
      </GenericModal>

      {/* Modal suppression joueur */}
      <GenericModal
        isOpen={isCancelStatusModal}
        onClose={() => setIsCancelStatusModal(false)}
        title="Supprimer le joueur du tournoi"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          if (!selectedPlayer || !tournament) return;
          try {
            await cancelPlayerMutation.mutateAsync({
              tournamentId: tournament.id,
              registrationId: selectedPlayer.registration_id
            });
            notify("error", `❌ ${selectedPlayer.registration?.wp_users?.display_name} a été retiré du tournoi`);
            setSelectedPlayer(null);
            setIsCancelStatusModal(false);
          } catch (error) {
            console.error("Erreur suppression joueur:", error);
            notify("error", "❌ Une erreur est survenue lors de la suppression.");
          }
        }}
      >
        <p>
          Es-tu sûr de vouloir supprimer l&apos;invitation du joueur{" "}
          <b>{selectedPlayer?.registration?.wp_users?.display_name}</b> ?
        </p>
      </GenericModal>
    </div>
  );
});

PlayerTabs.displayName = 'PlayerTabs';
