"use client";

import { useEffect, useState } from "react";
import { Card } from "@heroui/react";

import { GenericTable } from "@/app/components/table/generic_table";
import { standingsColumns } from "@/app/components/table/presets/standings.config";
import { mapClassementTournament } from "@/app/lib/adapter/quarter_ranking.adapter";
import { TournamentRanking } from "@/app/types";
import { StandingRow } from "@/app/components/table/table.types";

type ClassementProps = {
  tournament_status: string;
  classement: TournamentRanking[];
};

export const ClassementComponent: React.FC<ClassementProps> = ({
  tournament_status,
  classement
}) => {
  const [classementRow, setClassementRow] = useState<StandingRow[]>([]);

  useEffect(() => {
    setClassementRow(mapClassementTournament(classement));
  }, [classement]);

  return (
    <div className="w-full h-full">
      {tournament_status === "finish" || classementRow.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <div className="min-w-full">
            <GenericTable<StandingRow>
              items={classementRow}
              columns={standingsColumns}
              enableSorting={false}
              ariaLabel="Classement"
            />
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-start h-full bg-background_card p-6 gap-4 text-center">
          <img
            className="w-40 md:w-60 rounded-lg"
            src="/images/classement_image.svg"
            alt="classement svg"
          />
          <p className="text-primary_brand-300 font-satoshiBold text-base sm:text-l leading-7">
            Revenez après le tournoi pour voir qui a dominé les cartes !
          </p>
        </Card>
      )}
    </div>
  );
};
