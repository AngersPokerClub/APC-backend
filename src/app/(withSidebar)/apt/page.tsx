"use client";

import { GenericTable } from "../../components/table/generic_table";
import { STRINGS } from "../../constants/string";
import { standingsColumns } from "../../components/table/presets/standings.config";
import {
  ActionDefinition,
  StandingRow,
  TournamentRow,
} from "../../components/table/table.types";
import { tournamentColumns } from "../../components/table/presets/tournament.config";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon } from "@hugeicons/core-free-icons";
import { useTournamentDataByCategory } from "@/app/hook/useTournamentsData";
import TabBar from "../../components/tabBar";
import { TournamentMobileCards } from "../../components/tournament-mobile-cards";

export default function APTHome() {
  type TrimestryKey = "T1" | "T2" | "T3";

  const { data, isLoading } = useTournamentDataByCategory("apt");

  const tournamentRows = data?.tournamentRows ?? [];
  const quarterRankingRows = data?.quarterRankingRows ?? {
    T1: [],
    T2: [],
    T3: [],
  };

  // Logs pour vérifier les données des totaux par trimestre
  (Object.keys(quarterRankingRows) as TrimestryKey[]).forEach((trimestre) => {
    const totalPoints = quarterRankingRows[trimestre].reduce(
      (sum, row) => sum + row.points,
      0
    );
  });

  const getConditionalActions = (item: TournamentRow) => [
    {
      tooltip: "Voir",
      icon: <HugeiconsIcon icon={ViewIcon} size={20} strokeWidth={1.5} />,
      onClick: () => window.open(`/apt/${item.id}`, "_self"),
    },
  ];

  const handleViewTournament = (id: string) => {
    window.open(`/apt/${id}`, "_self");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-white text-xl font-semibold">Chargement...</p>
      </div>
    );
  }

  if (!tournamentRows || tournamentRows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh] px-4">
        <p className="text-white text-xl font-semibold text-center">
          Aucun tournoi disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:gap-6 w-full pb-safe-area">
      <div className="block md:hidden mb-2">
        <TabBar />
      </div>

      <div className="block md:hidden">
        <TournamentMobileCards
          tournaments={tournamentRows}
          onViewTournament={handleViewTournament}
        />
      </div>

      <div className="hidden md:flex flex-col gap-3">
        <h2 className="font-satoshiMedium text-l sm:text-xl3p2 leading-8 sm:leading-10">
          Tournois
        </h2>
        <div className="w-full overflow-x-auto">
          <GenericTable<TournamentRow>
            items={tournamentRows}
            columns={tournamentColumns}
            ariaLabel="Liste des sièges"
            showActions={true}
            actions={getConditionalActions}
            enableRowClick
            getDetailUrl={(id) => `/apt/${id}`}
          />
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-3">
        <h2 className="font-satoshiMedium text-l sm:text-xl3p2 leading-8 sm:leading-10">
          Classement
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {(Object.keys(quarterRankingRows) as TrimestryKey[]).map((trimestry) => (
            <div
              key={trimestry}
              className="flex-1 flex flex-col gap-2 overflow-x-auto"
            >
              <h2 className="font-satoshiRegular text-m sm:text-xl2p9 leading-8 sm:leading-10">
                {STRINGS.apt.trimestry[trimestry]}
              </h2>
              <GenericTable<StandingRow>
                items={quarterRankingRows[trimestry]}
                columns={standingsColumns}
                ariaLabel={`Classement ${trimestry}`}
                showActions={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
