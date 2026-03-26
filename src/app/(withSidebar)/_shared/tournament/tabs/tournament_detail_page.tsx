"use client";

import { Chip, Tab, Tabs } from "@heroui/react";
import { GeneralTabs } from "./general";
import {
  LinkSquare02Icon,
  ArrowLeft01Icon,
  Home01Icon,
  Table01Icon,
  Home11Icon,
  Layers01Icon,
  UserGroup03Icon,
  Table02Icon,
  TableRoundIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "@/app/constants/string";
import { useParams, useRouter } from "next/navigation";
import { ButtonComponents } from "@/app/components/button";
import { NiveauxTabs } from "./niveaux";
import { ButtonTabsComponents } from "./components/button_tabs_components";
import { PlayerTabs } from "./player";
import { TableTabs } from "./table";
import { ChipTabs } from "./chip";
import { useDisclosure } from "@heroui/react";
import { ModalManager } from "./components/popup_tabs_components";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { GenericModal } from "@/app/components/popup";
import {
  AddTableForm,
  AddTableFormHandle,
} from "./components/popup/add_table_popup";
import { useTogglePause } from "@/app/hook/useTogglePause";
import { useLaunchTournament } from "@/app/hook/useLaunchTournament";
import { useAddTableAssignment } from "@/app/hook/useAddTableAssignment";
import { useResetLevels } from "@/app/hook/useResetLevels";
import { useGenerateLevels } from "@/app/hook/useGenerateLevel";
import LoadingComponent from "@/app/error/loading/page";
import { useEndTournament } from "@/app/hook/useEndTournament";

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournament, levels, registration, classement, trimestry } =
    useTournamentContext();
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("0");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isReinitialiseLevelModalOpen, setIsReinitialiseLevelModalOpen] =
    useState(false);
  const [isGenerateLevelModalOpen, setIsGenerateLevelModalOpen] =
    useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const formRef = useRef<AddTableFormHandle>(null);

  // Mutation hooks
  const togglePauseMutation = useTogglePause(String(id));
  const launchTournamentMutation = useLaunchTournament(String(id));
  const addTableMutation = useAddTableAssignment();
  const resetLevelsMutation = useResetLevels();
  const generateLevelsMutation = useGenerateLevels();

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const endTournamentMutation = useEndTournament(String(id));

  // Example: you can also add future mutations for add level, generate tables, etc.

  const nextTableNumber =
    (tournament?.tournament_table?.length ?? 0) > 0
      ? Math.max(
          ...(tournament!.tournament_table ?? []).map((t) => t.table_number),
        ) + 1
      : 1;

  useEffect(() => {
    if (tournament?.tournament_status === "finish") {
      setSelectedTab("0");
      setIsDisabled(true);
    }
  }, [tournament]);

  const togglePause = async (pause: boolean) => {
    try {
      await togglePauseMutation.mutateAsync(pause);
    } catch (err) {
      console.error("❌ Erreur mise en pause / reprise :", err);
      alert("Une erreur est survenue");
    }
  };

  const isLaunchable =
    (tournament?.tournament_table?.length ?? 0) > 0 &&
    levels.length > 0 &&
    (tournament?.stack?.stack_chip?.length ?? 0) > 0;

  const trimesterObj = trimestry.find(
    (trimester) => trimester.id === tournament?.tournament_trimestry,
  );

  const tabs = useMemo(() => {
    if (!tournament || !registration || !classement) return [];
    return [
      { id: "0", label: "Général", content: <GeneralTabs /> },
      { id: "1", label: "Niveaux", content: <NiveauxTabs /> },
      { id: "2", label: "Joueurs", content: <PlayerTabs /> },
      { id: "3", label: "Tables", content: <TableTabs /> },
      { id: "4", label: "Jetons", content: <ChipTabs /> },
    ];
  }, [tournament, registration, classement, levels]);

  if (!tournament || !registration || !classement) {
    return <LoadingComponent />;
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-0 pb-safe-area">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-satoshiBlack text-xl4 max-sm:hidden">
              {tournament.tournament_name} - Trimestre {trimesterObj?.number}
            </h1>
            <button
              onClick={() => router.back()}
              className="md:hidden flex items-center gap-2 p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none"
              aria-label="Retour"
              style={{
                color: "white",
                fontWeight: 400,
                fontSize: "18px",
                lineHeight: "24px",
              }}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                className="text-white"
              />
              <span className="text-white font-satoshiRegular text-base">
                Menu principal
              </span>
            </button>
          </div>
          <div className="md:hidden w-full flex flex-col items-start mt-3">
            <h1 className="font-satoshiBlack text-base text-white truncate max-w-[60vw]">
              {tournament.tournament_name}
            </h1>
            <Chip
              className={`font-satoshiRegular text-xs mt-2 ${
                tournament.tournament_status === "finish"
                  ? "bg-red-950"
                  : tournament.tournament_status === "start"
                    ? "bg-purple-950"
                    : tournament.tournament_pause
                      ? "bg-danger-500"
                      : "bg-green-950"
              }`}
            >
              {tournament.tournament_pause
                ? "En pause"
                : STRINGS.status[tournament.tournament_status]}
            </Chip>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
          {tournament.tournament_status === "finish" && (
            <ButtonComponents
              text="Modifier le classement"
              onClick={() =>
                router.push(
                  `/${window.location.pathname.split("/").filter(Boolean).slice(0, 2).join("/")}/edit-rankings`,
                )
              }
              buttonClassName="bg-primary_background hover:bg-primary_hover_background"
              textClassName="text-primary_brand-50"
            />
          )}
          {tournament.tournament_status === "start" && (
            <ButtonComponents
              text="Lancer le tournoi"
              onClick={() => setIsLaunchModalOpen(true)}
              buttonClassName="bg-primary_background hover:bg-primary_hover_background"
              textClassName="text-primary_brand-50"
            />
          )}
          {tournament.tournament_table?.length != 0 && selectedTab == "3" && (
            <ButtonComponents
              text="Tables des joueurs"
              onClick={() => window.open(`/showTableFullScreen/${id}`)}
              icon={
                <HugeiconsIcon
                  icon={LinkSquare02Icon}
                  size={20}
                  className="shrink-0"
                  color="white"
                />
              }
              buttonClassName="bg-primary_background hover:bg-primary_hover_background"
              textClassName="text-primary_brand-50"
            />
          )}
          {tournament.tournament_status === "in_coming" && (
            <>
              {tournament.tournament_category === "SOLIPOKER" && (
                <ButtonComponents
                  text="Mettre fin au tournoi"
                  onClick={() => setIsEndModalOpen(true)}
                  buttonClassName="bg-danger-900 hover:bg-danger-500"
                  textClassName="text-white"
                />
              )}
              <ButtonComponents
                text={
                  tournament.tournament_pause
                    ? "Reprendre le tournoi"
                    : "Mettre en pause le tournoi"
                }
                onClick={() => setIsPauseModalOpen(true)}
                buttonClassName="bg-primary_background hover:bg-primary_hover_background"
                textClassName="text-primary_brand-50"
                loading={togglePauseMutation.isLoading}
                disabled={togglePauseMutation.isLoading}
              />
              <ButtonComponents
                text="Voir l'affichage"
                onClick={() => window.open(`/game/${id}`)}
                buttonClassName="bg-primary_background hover:bg-primary_hover_background"
                textClassName="text-primary_brand-50"
                icon={
                  <HugeiconsIcon
                    icon={LinkSquare02Icon}
                    size={20}
                    className="shrink-0"
                    color="white"
                  />
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        {/* Tabs desktop */}
        <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs
            isDisabled={isDisabled}
            className="flex flex-wrap items-center gap-2"
            size="lg"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(String(key))}
            aria-label="Dynamic tabs"
            items={tabs}
          >
            {(item) => (
              <Tab
                key={item.id}
                title={item.label}
                className="text-neutral-50 text-center !font-satoshiRegular !text-xs sm:!text-l"
              />
            )}
          </Tabs>
          {tournament.tournament_status !== "finish" && (
            <ButtonTabsComponents
              tournamentStatus={tournament.tournament_status}
              tabsId={selectedTab}
              levels={levels}
              onAddLevel={onOpen}
              isAddLevelLoading={false}
              onResetLevel={() => setIsReinitialiseLevelModalOpen(true)}
              isResetLevelLoading={resetLevelsMutation.isLoading}
              onGenerateLevel={() => setIsGenerateLevelModalOpen(true)}
              isGenerateLevelLoading={generateLevelsMutation.isLoading}
              onAddPlayer={onOpen}
              isAddPlayerLoading={false}
              onEditStack={onOpen}
              isEditStackLoading={false}
              onAddTable={() => setIsAddTableModalOpen(true)}
              isAddTableLoading={addTableMutation.isLoading}
              onGenerateTables={onOpen}
              isGenerateTablesLoading={false}
            />
          )}
        </div>
        {/* Bottom bar mobile */}
        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] flex justify-between items-center p-3 rounded-3xl gap-2 bg-dark/20 backdrop-blur-md shadow-2xl z-50">
          {[
            { id: "0", label: "Général", icon: Home11Icon },
            { id: "1", label: "Niveaux", icon: Layers01Icon },
            { id: "2", label: "Joueurs", icon: UserGroup03Icon },
            { id: "3", label: "Tables", icon: TableRoundIcon },
          ].map((tab) => {
            const disabled = tournament.tournament_status === "finish";
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (disabled) return;
                  setSelectedTab(tab.id);
                }}
                disabled={disabled}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl gap-1 transition-all duration-200 ${
                  selectedTab === tab.id
                    ? "bg-ligth/10 scale-105"
                    : "bg-transparent hover:bg-neutral-800/50"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                style={{ minWidth: 64 }}
                aria-disabled={disabled}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  size={24}
                  className={`mb-1 text-white ${disabled ? "opacity-50" : ""}`}
                />
                <span
                  className={`text-xs ${
                    selectedTab === tab.id ? "text-white" : "text-neutral-400"
                  } ${disabled ? "opacity-50" : ""}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenu de l'onglet sélectionné */}
        <div className="pb-32 md:pb-0">
          {tabs.find((tab) => tab.id === selectedTab)?.content}
        </div>
      </div>

      <ModalManager
        selectedTab={selectedTab}
        isOpen={isOpen}
        onClose={onClose}
      />

      <GenericModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        title="Lancer le tournoi"
        confirmLabel="Lancer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            if (!isLaunchable) {
              alert(
                "Impossible de lancer le tournoi sans tables, niveaux et jetons.",
              );
              return;
            }
            await launchTournamentMutation.mutateAsync();
            setIsLaunchModalOpen(false);
            window.open(`/game/${id}`);
          } catch (err) {
            console.error("❌ Erreur lancement tournoi :", err);
            alert("Erreur lors du lancement du tournoi");
          }
        }}
        loading={launchTournamentMutation.isLoading}
      >
        <p>
          Es-tu sûr de vouloir lancer le tournoi ?
          <br />
          Il doit contenir au moins une table, un niveau et un jeton.
        </p>
      </GenericModal>

      <GenericModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="Mettre fin au tournoi"
        confirmLabel="Terminer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            await endTournamentMutation.mutateAsync();
            setIsEndModalOpen(false);
          } catch (err) {
            console.error("❌ Erreur pour terminer le tournoi :", err);
            alert("Erreur lors de la clôture du tournoi");
          }
        }}
        loading={endTournamentMutation.isLoading}
      >
        <p>
          Es-tu sûr de vouloir <strong>mettre fin au tournoi</strong> ?
          <br />
          Cette action le clôturera définitivement.
        </p>
      </GenericModal>

      <GenericModal
        isOpen={isGenerateLevelModalOpen}
        onClose={() => setIsGenerateLevelModalOpen(false)}
        title="Générer les niveaux"
        confirmLabel="Générer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            if (!tournament) throw new Error("Tournoi non disponible");
            await generateLevelsMutation.mutateAsync(tournament.id);
            setIsGenerateLevelModalOpen(false);
          } catch (err) {
            console.error("❌ Erreur génération niveaux :", err);
            alert("Erreur lors de la génération des niveaux");
          }
        }}
        loading={generateLevelsMutation.isLoading}
      >
        <p>Es-tu sûr de vouloir générer les niveaux automatiquement ?</p>
      </GenericModal>

      <GenericModal
        isOpen={isReinitialiseLevelModalOpen}
        onClose={() => setIsReinitialiseLevelModalOpen(false)}
        title="Réinitialiser les niveaux"
        confirmLabel="Réinitialiser"
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            if (!tournament) throw new Error("Tournoi non disponible");
            await resetLevelsMutation.mutateAsync(tournament.id);
            setIsReinitialiseLevelModalOpen(false);
          } catch (err) {
            console.error("❌ Erreur réinitialisation niveau :", err);
            alert("Erreur lors de la réinitialisation des niveaux");
          }
        }}
        loading={resetLevelsMutation.isLoading}
      >
        <p>
          Es-tu sûr de vouloir réinitialiser les niveaux ? Attention ils seront
          tous perdus.
        </p>
      </GenericModal>

      <GenericModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        title="Ajouter une table"
        confirmLabel="Ajouter"
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            const values = formRef.current?.getValues();
            if (!values) throw new Error("Valeurs du formulaire indisponibles");
            if (!tournament) throw new Error("Tournoi non disponible");
            await addTableMutation.mutateAsync({
              tournamentId: tournament.id,
              data: values,
            });
            setIsAddTableModalOpen(false);
          } catch (err) {
            console.error("Erreur ajout table :", err);
            alert("Erreur lors de l'ajout de la table");
          }
        }}
        loading={addTableMutation.isLoading}
      >
        <AddTableForm ref={formRef} initialNumber={nextTableNumber} />
      </GenericModal>

      <GenericModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title={
          tournament.tournament_pause
            ? "Reprendre le tournoi"
            : "Mettre en pause le tournoi"
        }
        confirmLabel={
          tournament.tournament_pause ? "Reprendre" : "Mettre en pause"
        }
        cancelLabel="Annuler"
        onConfirm={async () => {
          try {
            await togglePause(!tournament.tournament_pause);
            setIsPauseModalOpen(false);
          } catch (err) {
            console.error("❌ Erreur changement pause :", err);
            alert("Erreur lors de la mise à jour de l'état du tournoi");
          }
        }}
        loading={togglePauseMutation.isLoading}
      >
        <p>
          Es-tu sûr de vouloir{" "}
          {tournament.tournament_pause ? "reprendre" : "mettre en pause"} le
          tournoi ?
        </p>
      </GenericModal>
    </div>
  );
}
