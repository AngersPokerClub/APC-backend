"use client";

import { ButtonComponents } from "@/app/components/button";
import { TournamentLevel } from "@/app/types";

// Tu peux ajouter le typage prop complet ici pour loader/disabled
type ButtonTabsProps = {
  tournamentStatus: string;
  tabsId: string;
  levels: TournamentLevel[];

  onAddLevel?: () => void;
  isAddLevelLoading?: boolean;

  onResetLevel?: () => void;
  isResetLevelLoading?: boolean;

  onGenerateLevel?: () => void;
  isGenerateLevelLoading?: boolean;

  onAddTable?: () => void;
  isAddTableLoading?: boolean;

  onGenerateTables?: () => void;
  isGenerateTablesLoading?: boolean;

  onAddPlayer?: () => void;
  isAddPlayerLoading?: boolean;

  onEditStack?: () => void;
  isEditStackLoading?: boolean;
};

export const ButtonTabsComponents: React.FC<ButtonTabsProps> = ({
  tournamentStatus,
  tabsId,
  levels,
  onAddLevel,
  isAddLevelLoading,
  onGenerateLevel,
  isGenerateLevelLoading,
  onResetLevel,
  isResetLevelLoading,
  onAddTable,
  isAddTableLoading,
  onGenerateTables,
  isGenerateTablesLoading,
  onAddPlayer,
  isAddPlayerLoading,
  onEditStack,
  isEditStackLoading,
}) => {
  switch (tabsId) {

    case "1":
      return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <ButtonComponents
            text="Ajouter un niveau"
            onClick={onAddLevel}
            buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
            textClassName="text-primary_brand-50"
            loading={isAddLevelLoading}
            disabled={isAddLevelLoading}
          />
          {tournamentStatus === "start" && levels.length === 0 && (
            <ButtonComponents
              text="Générer les niveaux"
              onClick={onGenerateLevel}
              buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
              textClassName="text-primary_brand-50"
              loading={isGenerateLevelLoading}
              disabled={isGenerateLevelLoading}
            />
          )}
          {tournamentStatus === "start" && levels.length > 0 && (
            <ButtonComponents
              text="Réinitialiser les niveaux"
              onClick={onResetLevel}
              buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
              textClassName="text-primary_brand-50"
              loading={isResetLevelLoading}
              disabled={isResetLevelLoading}
            />
          )}
        </div>
      );

    case "2":
      return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* {tournamentStatus !== "in_coming" && tourn && ( */}
            <ButtonComponents
              text="Ajouter un joueur"
              onClick={onAddPlayer}
              buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
              textClassName="text-primary_brand-50"
              loading={isAddPlayerLoading}
              disabled={isAddPlayerLoading}
            />
          {/* )} */}
        </div>
      );

    case "3":
      return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <ButtonComponents
            text="Ajouter une table"
            onClick={onAddTable}
            buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
            textClassName="text-primary_brand-50"
            loading={isAddTableLoading}
            disabled={isAddTableLoading}
          />
          {tournamentStatus !== "in_coming" && (
            <ButtonComponents
              text="Générer les tables"
              onClick={onGenerateTables}
              buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
              textClassName="text-primary_brand-50"
              loading={isGenerateTablesLoading}
              disabled={isGenerateTablesLoading}
            />
          )}
        </div>
      );

    case "4":
      return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {tournamentStatus !== "finish" && (
            <ButtonComponents
              text="Modifier le stack"
              onClick={onEditStack}
              buttonClassName="w-full sm:w-auto bg-white/20 hover:bg-primary_brand-300"
              textClassName="text-primary_brand-50"
              loading={isEditStackLoading}
              disabled={isEditStackLoading}
            />
          )}
        </div>
      );

    default:
      return <></>;
  }
};
