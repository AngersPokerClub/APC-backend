import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournament_tournament_status } from "@/generated/prisma";
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

    if (status === "in_coming") {
      // Création date UTC
      const utcDate = DateTime.now().toUTC().toJSDate();

      // Récupération des niveaux triés avant la transaction
      const levels = await prisma.tournament_level.findMany({
        where: { tournament_id: tournamentId },
        orderBy: { level_number: "asc" }
      });

      // Calcul des nouveaux horaires
      let previousEnd = new Date(utcDate);

      const updateLevelsData = levels.map(level => {
        // Parse explicitement en UTC depuis ISO string
        const startOriginal = DateTime.fromISO(level.level_start.toISOString(), { zone: "utc" });
        const endOriginal = DateTime.fromISO(level.level_end.toISOString(), { zone: "utc" });        
        const originalDuration = endOriginal.toMillis() - startOriginal.toMillis();

        const start = DateTime.fromJSDate(previousEnd).toUTC();
        const end = start.plus({ milliseconds: originalDuration });
        previousEnd = end.toJSDate();

        return {
          id: level.id,
          data: {
            level_start: start.toJSDate(),
            level_end: end.toJSDate()
          }
        };
      });


      // Transaction regroupée : mise à jour tournoi + tous les niveaux
      const [updatedTournament, ...updatedLevels] = await prisma.$transaction([
        prisma.tournament.update({
          where: { id: tournamentId },
          data: {
            tournament_start_date: utcDate,
            tournament_status: status,
            tournament_pause: false
          }
        }),
        ...updateLevelsData.map(levelUpdate =>
          prisma.tournament_level.update({
            where: { id: levelUpdate.id },
            data: levelUpdate.data
          })
        )
      ]);

      return NextResponse.json(
        serializeBigInt({
          message: "Tournament started and levels updated (UTC time)",
          startDate: utcDate,
          levels: updatedLevels
        }),
        { status: 200 }
      );
    } else {
      const updated = await prisma.tournament.update({
        where: { id: tournamentId },
        data: { tournament_status: status }
      });

      return NextResponse.json(serializeBigInt(updated), { status: 200 });
    }
  } catch (error) {
    console.error("❌ Error updating tournament status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
