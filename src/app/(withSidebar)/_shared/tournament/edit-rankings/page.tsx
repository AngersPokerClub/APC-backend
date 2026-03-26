"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Card, Divider, Avatar } from "@heroui/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTournamentContext } from "@/app/providers/TournamentContextProvider";
import { ButtonComponents } from "@/app/components/button";
import { useUpdateRankings } from "@/app/hook/useUpdateRankings";
import { useNotification } from "@/app/providers/NotificationProvider";
import { EditRankingPlayerRow } from "@/app/types/edit-rankings.types";
import LoadingComponent from "@/app/error/loading/page";

export default function EditRankingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { notify } = useNotification();

  const { tournament, registration, classement } = useTournamentContext();
  const { mutateAsync, isLoading } = useUpdateRankings(String(id));

  // Build editable rows from registrations + existing rankings
  const initialRows = useMemo(() => {
    if (!registration || !classement) return [];

    const rankingMap = new Map(classement.map((r) => [r.registration_id, r]));

    const rows: EditRankingPlayerRow[] = registration
      .filter((r) => r.statut === "Confirmed")
      .map((reg) => {
        const ranking = rankingMap.get(reg.id);
        return {
          registration_id: reg.id,
          user_display_name: reg.wp_users?.display_name ?? "Joueur inconnu",
          pseudo_winamax: reg.wp_users?.pseudo_winamax ?? "",
          photo_url: reg.wp_users?.photo_url ?? null,
          ranking_position: ranking?.ranking_position ?? null,
          ranking_score: ranking?.ranking_score ?? null,
          has_existing_ranking: !!ranking,
        };
      });

    // Sort: ranked first (by position ASC), then unranked (by registration_id)
    rows.sort((a, b) => {
      if (a.has_existing_ranking && !b.has_existing_ranking) return -1;
      if (!a.has_existing_ranking && b.has_existing_ranking) return 1;
      if (a.has_existing_ranking && b.has_existing_ranking) {
        return (a.ranking_position ?? 0) - (b.ranking_position ?? 0);
      }
      return a.registration_id - b.registration_id;
    });

    return rows;
  }, [registration, classement]);

  // Local state for editable values
  const [editableRows, setEditableRows] = useState<EditRankingPlayerRow[]>([]);

  useEffect(() => {
    setEditableRows(initialRows);
  }, [initialRows]);

  const rankedPlayers = editableRows.filter(
    (r) => r.ranking_position !== null && r.ranking_score !== null,
  );
  const unrankedPlayers = editableRows.filter(
    (r) => r.ranking_position === null || r.ranking_score === null,
  );

  const updateRow = (
    registrationId: number,
    field: "ranking_position" | "ranking_score",
    value: string,
  ) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    setEditableRows((prev) =>
      prev.map((row) =>
        row.registration_id === registrationId
          ? { ...row, [field]: isNaN(numValue as number) ? null : numValue }
          : row,
      ),
    );
  };

  const handleSave = async () => {
    // Filter only rows with both position and score filled
    const validRankings = editableRows.filter(
      (r) =>
        r.ranking_position !== null &&
        r.ranking_position >= 1 &&
        r.ranking_score !== null &&
        r.ranking_score >= 0,
    );

    if (validRankings.length === 0) {
      notify("error", "Aucun classement valide à sauvegarder");
      return;
    }

    // Check for invalid values
    const invalidRows = editableRows.filter(
      (r) =>
        (r.ranking_position !== null && r.ranking_position < 1) ||
        (r.ranking_score !== null && r.ranking_score < 0),
    );

    if (invalidRows.length > 0) {
      notify(
        "error",
        "Certaines valeurs sont invalides (position ≥ 1, score ≥ 0)",
      );
      return;
    }

    if (!window.confirm("Confirmer les modifications du classement ?")) {
      return;
    }

    try {
      await mutateAsync({
        rankings: validRankings.map((r) => ({
          registration_id: r.registration_id,
          ranking_position: r.ranking_position!,
          ranking_score: r.ranking_score!,
        })),
      });
      notify("success", "Classement mis à jour avec succès");
      // Navigate back to tournament page
      const basePath = pathname.replace("/edit-rankings", "");
      router.push(basePath);
    } catch (err) {
      console.error("❌ Erreur mise à jour classement:", err);
      notify(
        "error",
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du classement",
      );
    }
  };

  if (!tournament || !registration) {
    return <LoadingComponent />;
  }

  if (tournament.tournament_status !== "finish") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-primary_brand-50 font-satoshiBold text-l">
          Le classement ne peut être modifié que pour un tournoi terminé.
        </p>
        <ButtonComponents
          text="Retour"
          onClick={() => router.back()}
          buttonClassName="bg-primary_background hover:bg-primary_hover_background"
          textClassName="text-primary_brand-50"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-0 pb-safe-area">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none cursor-pointer"
            aria-label="Retour"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              className="text-white"
            />
            <span className="text-white font-satoshiRegular text-base">
              Retour
            </span>
          </button>
          <h1 className="font-satoshiBlack text-xl max-sm:text-base text-white">
            Modifier le classement — {tournament.tournament_name}
          </h1>
        </div>
        <ButtonComponents
          text="Sauvegarder"
          onClick={handleSave}
          loading={isLoading}
          disabled={isLoading}
          buttonClassName="bg-green-700 hover:bg-green-600"
          textClassName="text-white"
        />
      </div>

      {/* Summary */}
      <Card className="rounded-xl bg-background_card p-4">
        <div className="flex flex-wrap gap-6 text-primary_brand-50 font-satoshiRegular text-sm">
          <span>
            <strong>Total joueurs :</strong> {editableRows.length}
          </span>
          <span>
            <strong>Avec classement :</strong> {rankedPlayers.length}
          </span>
          <span>
            <strong>Sans classement :</strong> {unrankedPlayers.length}
          </span>
        </div>
      </Card>

      {/* Ranked players */}
      <RankingSection
        title="Joueurs classés"
        rows={rankedPlayers}
        onUpdateRow={updateRow}
      />

      {/* Unranked players */}
      {unrankedPlayers.length > 0 && (
        <RankingSection
          title="Joueurs sans classement"
          rows={unrankedPlayers}
          onUpdateRow={updateRow}
        />
      )}
    </div>
  );
}

// ─── Ranking Section Component ─────────────────────────────────────────

type RankingSectionProps = {
  title: string;
  rows: EditRankingPlayerRow[];
  onUpdateRow: (
    registrationId: number,
    field: "ranking_position" | "ranking_score",
    value: string,
  ) => void;
};

function RankingSection({ title, rows, onUpdateRow }: RankingSectionProps) {
  if (rows.length === 0) return null;

  return (
    <Card className="rounded-xl bg-background_card overflow-hidden">
      <div className="p-4">
        <h2 className="text-primary_brand-50 font-satoshiBold text-l">
          {title} ({rows.length})
        </h2>
      </div>
      <Divider />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="px-4 py-3 text-primary_brand-300 font-satoshiRegular text-sm w-12">
                #
              </th>
              <th className="px-4 py-3 text-primary_brand-300 font-satoshiRegular text-sm">
                Joueur
              </th>
              <th className="px-4 py-3 text-primary_brand-300 font-satoshiRegular text-sm w-32">
                Position
              </th>
              <th className="px-4 py-3 text-primary_brand-300 font-satoshiRegular text-sm w-32">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.registration_id}
                className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-primary_brand-50 font-satoshiRegular text-sm">
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={row.photo_url ?? undefined}
                      name={row.user_display_name.charAt(0)}
                      size="sm"
                      className="bg-zinc-700 text-white"
                    />
                    <div className="flex flex-col">
                      <span className="text-primary_brand-50 font-satoshiBold text-sm">
                        {row.user_display_name}
                      </span>
                      {row.pseudo_winamax && (
                        <span className="text-primary_brand-300 font-satoshiRegular text-xs">
                          @{row.pseudo_winamax}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={1}
                    value={row.ranking_position ?? ""}
                    onChange={(e) =>
                      onUpdateRow(
                        row.registration_id,
                        "ranking_position",
                        e.target.value,
                      )
                    }
                    placeholder="—"
                    className="w-24 bg-zinc-800 text-white border border-zinc-600 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary_background focus:border-transparent
                      placeholder-zinc-500 [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none
                      [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    value={row.ranking_score ?? ""}
                    onChange={(e) =>
                      onUpdateRow(
                        row.registration_id,
                        "ranking_score",
                        e.target.value,
                      )
                    }
                    placeholder="—"
                    className="w-24 bg-zinc-800 text-white border border-zinc-600 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary_background focus:border-transparent
                      placeholder-zinc-500 [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none
                      [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
