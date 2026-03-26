"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GenericTable } from "@/app/components/table/generic_table";
import { seatsColumns } from "@/app/components/table/presets/seats.config";
import { mapAssignementsGroupedByTable } from "@/app/lib/adapter/tournament_table.adapter";
import { TournamentProvider, useTournamentContext } from "@/app/providers/TournamentContextProvider";
import LoadingComponent from "@/app/error/loading/page";
import { SeatRow } from "@/app/components/table/table.types";

export default function ShowTableFullScreenPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  if (!id) {
    return <LoadingComponent />;
  }

  return (
    <TournamentProvider tournamentId={id}>
      <ShowTableFullScreen />
    </TournamentProvider>
  );
}

function ShowTableFullScreen() {
  const { id } = useParams();
  const { tournament, assignements } = useTournamentContext();
  const [groupedRows, setGroupedRows] = useState<Record<string, SeatRow[]>>({});
  const [visiblePage, setVisiblePage] = useState(0);

  // Nombre de tables affichées par page
  const tablesPerPage = 3;

  useEffect(() => {
    if (tournament?.id) {
      setGroupedRows(mapAssignementsGroupedByTable(assignements));
    }
  }, [tournament?.id, assignements]);

  // Pagination automatique : change toutes les minutes
  useEffect(() => {
    if (Object.keys(groupedRows).length === 0) return;

    const pageCount = Math.ceil(Object.keys(groupedRows).length / tablesPerPage);
    const interval = setInterval(() => {
      setVisiblePage((current) => (current + 1) % pageCount);
    }, 20000); // 20 secondes

    return () => clearInterval(interval);
  }, [groupedRows, tablesPerPage]);

  if (!tournament) return <LoadingComponent />;

  // Génère les entrées à afficher pour la page courante
  const tableEntries = Object.entries(groupedRows);
  const paginatedEntries = tableEntries.slice(
    visiblePage * tablesPerPage,
    (visiblePage + 1) * tablesPerPage
  );

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col gap-6 p-4">
      {paginatedEntries.length > 0 ? (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            display: "grid",
            maxWidth: "100vw",
          }}
        >
          {paginatedEntries.map(([tableNumber, rows]) => (
            <div key={tableNumber} className="flex flex-col gap-2">
              <h2 className="text-center text-xl font-bold text-white">
                TABLE {tableNumber}
              </h2>
              <div className="w-full overflow-x-auto">
                <GenericTable
                  columns={seatsColumns}
                  items={rows}
                  ariaLabel={`Table ${tableNumber}`}
                  showActions={false}
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
    </div>
  );
}
