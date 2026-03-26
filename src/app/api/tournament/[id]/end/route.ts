import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournament_tournament_status, $Enums } from "@/generated/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { DateTime } from "luxon";

export async function PATCH(req: NextRequest) {
  const { tournament } = extractParamsFromPath(req, ["tournament"]);
  if (!tournament) {
    return NextResponse.json(
      { error: "Missing tournament ID" },
      { status: 400 }
    );
  }
  const tournamentId = BigInt(tournament);

  try {
    const body = await req.json();
    const { status } = body;

    if (
      !status ||
      !Object.values(tournament_tournament_status).includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing status" },
        { status: 400 }
      );
    }

    if (status === "finish") {
      // 1. Vérifie que le tournoi existe
      const mainTournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });
      if (!mainTournament)
        return NextResponse.json(
          { error: "Tournoi principal introuvable" },
          { status: 404 }
        );

      // 2. Récupère les survivants
      const survivors = await prisma.table_assignment.findMany({
        where: {
          eliminated: false,
          tournament_table: { tournament_id: tournamentId },
        },
        select: { registration_id: true },
      });
      const survivorRegistrationIds = survivors.map((s) => s.registration_id);

      // 3. Trouve le tournoi du dimanche
      // Assurer que tournament_trimestry existe
      if (!mainTournament.tournament_trimestry) {
        return NextResponse.json(
          { error: "Trimestre du tournoi principal introuvable" },
          { status: 400 }
        );
      }

      const sundayTournament = await prisma.tournament.findFirst({
        where: {
          tournament_trimestry: mainTournament.tournament_trimestry,
          OR: [
            { tournament_name: { contains: "dimanche" } },
            { tournament_name: { contains: "Dimanche" } },
            { tournament_name: { contains: "DIMANCHE" } },
            { tournament_name: { contains: "sunday" } },
            { tournament_name: { contains: "Sunday" } },
            { tournament_name: { contains: "SUNDAY" } },
          ],
        },
      });

      if (!sundayTournament)
        return NextResponse.json(
          { error: "Tournoi du dimanche introuvable" },
          { status: 404 }
        );

      // 4. Récupère et valide les user_id des survivants
      const userIds: bigint[] = [];
      for (const regId of survivorRegistrationIds) {
        const reg = await prisma.registration.findUnique({
          where: { id: regId },
          select: { user_id: true },
        });
        if (!reg || !reg.user_id) {
          console.error(
            `Registration invalide ou manquante pour survivor: ${regId}`
          );
          return NextResponse.json(
            {
              error: `Données de survivor invalides (registration_id: ${regId})`,
            },
            { status: 400 }
          );
        }
        userIds.push(BigInt(reg.user_id));
      }

      // 5. Prépare les inscriptions à créer (enum !)
      const registrationCreateData = userIds.map((user_id) => ({
        user_id,
        tournament_id: sundayTournament.id,
        inscription_date: DateTime.now().toJSDate(),
        statut: $Enums.registration_statut.Confirmed, // enum généré prisma
      }));

      // 6. Récupère et trie le classement
      const rankings = await prisma.tournament_ranking.findMany({
        where: { tournament_id: tournamentId },
        orderBy: { ranking_position: "asc" },
      });

      // 7. Recalcule les positions des éliminés
      const eliminatedRankings = rankings.filter(
        (ranking) => !survivorRegistrationIds.includes(ranking.registration_id)
      );
      eliminatedRankings.forEach((ranking, idx) => {
        ranking.ranking_position = idx + 1;
      });

      // 8. Transaction : update tournoi + inscriptions + classement
      const transactionOps = [
        prisma.tournament.update({
          where: { id: tournamentId },
          data: { tournament_status: "finish" },
        }),
        ...registrationCreateData.map((data) =>
          prisma.registration.create({ data })
        ),
        ...eliminatedRankings.map((elim) =>
          prisma.tournament_ranking.update({
            where: { id: elim.id },
            data: { ranking_position: elim.ranking_position },
          })
        ),
      ];

      const result = await prisma.$transaction(transactionOps);

      return NextResponse.json(
        serializeBigInt({
          message:
            "Tournoi terminé, survivants inscrits à la finale, classement recalculé.",
          tournamentId,
          sundayTournamentId: sundayTournament.id,
          registrationsInserted: registrationCreateData.length,
          eliminatedRankingCount: eliminatedRankings.length,
        }),
        { status: 200 }
      );
    } else {
      // Cas d'autres statuts
      const updated = await prisma.tournament.update({
        where: { id: tournamentId },
        data: { tournament_status: status },
      });
      return NextResponse.json(serializeBigInt(updated), { status: 200 });
    }
  } catch (error) {
    console.error("❌ Error in PATCH tournament finish:", error);

    // Fournir un message d'erreur plus spécifique si possible
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
