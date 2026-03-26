import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function PUT(req: NextRequest) {
  const { tournament, player } = extractParamsFromPath(req, [
    "tournament",
    "player"
  ]);

  if (!tournament || !player) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const tournamentId = parseInt(tournament);
    const registrationId = parseInt(player);

    if (isNaN(tournamentId) || isNaN(registrationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const assignment = await prisma.table_assignment.findFirst({
      where: {
        registration_id: BigInt(registrationId),
        registration: {
          tournament_id: BigInt(tournamentId)
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    await prisma.table_assignment.update({
      where: { id: assignment.id },
      data: {
        eliminated: false,
        user_kill_id: null
      }
    });

    await prisma.tournament_ranking.deleteMany({
      where: {
        registration_id: BigInt(registrationId),
        tournament_id: BigInt(tournamentId)
      }
    });

    return NextResponse.json({ message: "Elimination cancelled" });
  } catch (error) {
    console.error("🔥 Erreur lors de l'annulation de l'élimination:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
