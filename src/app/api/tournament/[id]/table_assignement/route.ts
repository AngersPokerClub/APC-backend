import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function GET(req: NextRequest) {
  try {
    const { tournament } = extractParamsFromPath(req, ["tournament"]);
    console.log("📥 Paramètre extrait :", tournament);

    const tournamentId = parseInt(tournament ?? "");
    console.log("🎯 tournamentId après parse :", tournamentId);

    if (isNaN(tournamentId)) {
      console.error("⛔ tournamentId invalide ou non fourni");
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const assignements = await prisma.table_assignment.findMany({
      where: {
        tournament_table: {
          tournament_id: BigInt(tournamentId)
        },
        registration: { statut: "Confirmed" }
      },
      include: {
        registration: {
          include: {
            wp_users: {
              select: {
                ID: true,
                pseudo_winamax: true,
                photo_url: true,
                display_name: true,
                user_status: true,
                user_url: true,
                user_email: true,
                user_nicename: true,
                user_login: true
              }
            }
          }
        },
        tournament_table: {
          select: {
            id: true,
            table_number: true,
            table_capacity: true
          }
        }
      }
    });

    console.log("✅ Affectations récupérées :", assignements.length);
    return NextResponse.json(serializeBigInt(assignements));
  } catch (error) {
    console.error("🔥 Erreur lors du GET /assignments :", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tournament } = extractParamsFromPath(req, ["tournament"]);
    const tournamentId = parseInt(tournament ?? "");

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { table_number, table_capacity } = body;

    if (
      typeof table_number !== "number" ||
      typeof table_capacity !== "number" ||
      table_number <= 0 ||
      table_capacity <= 0
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const newTable = await prisma.tournament_table.create({
      data: {
        tournament_id: BigInt(tournamentId),
        table_number,
        table_capacity
      }
    });

    const allAssignments = await prisma.table_assignment.findMany({
      where: {
        tournament_table: {
          tournament_id: BigInt(tournamentId)
        },
        eliminated: false
      },
      orderBy: {
        id: "asc"
      }
    });

    const allTables = await prisma.tournament_table.findMany({
      where: { tournament_id: BigInt(tournamentId) }
    });

    const totalPlayers = allAssignments.length;
    const totalTables = allTables.length;

    const basePlayersPerTable = Math.floor(totalPlayers / totalTables);
    const extraPlayers = totalPlayers % totalTables;

    const tableDistribution = allTables
      .sort((a, b) => a.table_number - b.table_number)
      .map((table, index) => ({
        tableId: table.id,
        capacity: table.table_capacity,
        targetCount:
          index < extraPlayers ? basePlayersPerTable + 1 : basePlayersPerTable
      }));

    let currentIndex = 0;

    for (const dist of tableDistribution) {
      for (let i = 0; i < dist.targetCount; i++) {
        const player = allAssignments[currentIndex];
        if (!player) break;

        await prisma.table_assignment.update({
          where: { id: player.id },
          data: {
            table_id: dist.tableId,
            table_seat_number: i + 1
          }
        });

        currentIndex++;
      }
    }

    return NextResponse.json(
      serializeBigInt({
        table: newTable,
        reequilibrated: true
      })
    );
  } catch (error) {
    console.error("❌ Erreur ajout table ou rééquilibrage :", error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'ajout de la table" },
      { status: 500 }
    );
  }
}
