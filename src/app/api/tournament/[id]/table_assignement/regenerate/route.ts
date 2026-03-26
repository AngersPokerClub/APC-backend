import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

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

    const registrations = await prisma.registration.findMany({
      where: { tournament_id: BigInt(tournamentId) }
    });

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "No registrations found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existingTables = await tx.tournament_table.findMany({
        where: { tournament_id: BigInt(tournamentId) }
      });

      const tableIds = existingTables.map((t) => t.id);

      if (tableIds.length > 0) {
        await tx.table_assignment.deleteMany({
          where: { table_id: { in: tableIds } }
        });

        await tx.tournament_table.deleteMany({
          where: { id: { in: tableIds } }
        });
      }

      const shuffled = registrations.sort(() => Math.random() - 0.5);
      const totalPlayers = shuffled.length;
      const playersPerTable = 8;
      const fullTableCount = Math.floor(totalPlayers / playersPerTable);
      const remainingPlayers = totalPlayers % playersPerTable;
      const totalTables = fullTableCount + (remainingPlayers > 0 ? 1 : 0);

      const tables = [];
      let playerIndex = 0;

      // Création des tables
      for (let i = 0; i < totalTables; i++) {
        const remaining = totalPlayers - playerIndex;
        const capacity = i < fullTableCount ? playersPerTable : remaining;

        const table = await tx.tournament_table.create({
          data: {
            tournament_id: BigInt(tournamentId),
            table_number: i + 1,
            table_capacity: capacity
          }
        });

        tables.push({ table, capacity });
        playerIndex += capacity;
      }

      // Préparation des assignments
      playerIndex = 0;
      const assignmentsData = [];
      for (let i = 0; i < tables.length; i++) {
        const { table, capacity } = tables[i];
        const players = shuffled.slice(playerIndex, playerIndex + capacity);
        for (let j = 0; j < players.length; j++) {
          assignmentsData.push({
            registration_id: players[j].id,
            table_id: table.id,
            table_seat_number: j + 1
          });
        }
        playerIndex += capacity;
      }

      if (assignmentsData.length > 0) {
        await tx.table_assignment.createMany({
          data: assignmentsData,
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json(
      serializeBigInt({ message: "Tables regenerated and players reassigned." })
    );
  } catch (error) {
    console.error("Error regenerating tables:", error);
    return NextResponse.json(
      { error: "Failed to regenerate tables" },
      { status: 500 }
    );
  }
}
