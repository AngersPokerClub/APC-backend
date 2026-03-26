import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { reequilibrateTables } from "@/app/utils/reequilibrate";

export async function PUT(req: NextRequest) {
  const { tournament, player } = extractParamsFromPath(req, [
    "tournament",
    "player"
  ]);

  if (!tournament || !player) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const tournamentId = parseInt(tournament);
    const playerId = parseInt(player);
    const body = await req.json();
    const { newStatus } = body;

    const validStatuses = ["Confirmed", "Pending", "Cancelled"];
    if (
      isNaN(tournamentId) ||
      isNaN(playerId) ||
      !validStatuses.includes(newStatus)
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.registration.updateMany({
      where: {
        id: BigInt(playerId),
        tournament_id: BigInt(tournamentId)
      },
      data: {
        statut: newStatus
      }
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const tableCount = await prisma.tournament_table.count({
      where: { tournament_id: BigInt(tournamentId) }
    });

    if (tableCount > 0) {
      await reequilibrateTables(tournamentId);
    }

    return NextResponse.json({
      message: `Status updated to ${newStatus} for player ${playerId}`
    });
  } catch (error) {
    console.error("🔥 Erreur :", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
