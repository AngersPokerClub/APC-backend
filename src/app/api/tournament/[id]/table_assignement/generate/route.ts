import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

function getBalancedCapacities(
  totalPlayers: number,
  maxPerTable: number,
): number[] {
  const nTables = Math.ceil(totalPlayers / maxPerTable);
  const minPerTable = Math.floor(totalPlayers / nTables);
  const remainder = totalPlayers % nTables;
  const capacities = Array(nTables).fill(minPerTable);
  for (let i = 0; i < remainder; i++) {
    capacities[i]++;
  }
  return capacities;
}

function getTableCapacities(totalPlayers: number, category: string): number[] {
  if (
    category === "APT" ||
    category === "SOLIPOKER" ||
    category === "SPECIAUX"
  ) {
    // APT, SOLIPOKER, SPECIAUX, SUPERFINALE: final table holds up to 9, multi-table max 8
    if (totalPlayers <= 9) {
      return [totalPlayers];
    }
    return getBalancedCapacities(totalPlayers, 8);
  } else if (category === "SITANDGO") {
    return getBalancedCapacities(totalPlayers, 9);
  } else {
    return getBalancedCapacities(totalPlayers, 8);
  }
}

export async function POST(req: NextRequest) {
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array]; // copier pour ne pas muter l'original
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
    }
    return arr;
  }

  try {
    const { tournament } = extractParamsFromPath(req, ["tournament"]);
    const tournamentId = parseInt(tournament ?? "");
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const t = await prisma.tournament.findUnique({
      where: { id: BigInt(tournamentId) },
      select: { tournament_category: true },
    });
    if (!t) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    // Suppression des anciennes tables et assignments en batch
    const existingTables = await prisma.tournament_table.findMany({
      where: { tournament_id: BigInt(tournamentId) },
      select: { id: true },
    });
    if (existingTables.length > 0) {
      const tableIds = existingTables.map((t) => t.id);
      await prisma.$transaction([
        prisma.table_assignment.deleteMany({
          where: { table_id: { in: tableIds } },
        }),
        prisma.tournament_table.deleteMany({
          where: { id: { in: tableIds } },
        }),
      ]);
    }

    // Récupération des joueurs et mélange aléatoire
    const registrations = await prisma.registration.findMany({
      where: {
        tournament_id: BigInt(tournamentId),
        statut: "Confirmed",
      },
    });
    const shuffled = shuffleArray(registrations);
    const totalPlayers = shuffled.length;

    // Calcul des capacités équilibrées
    const tableCapacities = getTableCapacities(
      totalPlayers,
      t.tournament_category,
    );

    // Création tables et assignments dans une transaction optimisée
    const createdTables = await prisma.$transaction(async (tx) => {
      const tables = [];
      for (let i = 0; i < tableCapacities.length; i++) {
        const table = await tx.tournament_table.create({
          data: {
            tournament_id: BigInt(tournamentId),
            table_number: i + 1,
            table_capacity: tableCapacities[i],
          },
        });
        tables.push(table);
      }

      // Préparer toutes les assignations avant insertion
      let playerIndex = 0;
      const assignmentsData = [];
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const capacity = tableCapacities[i];
        const players = shuffled.slice(playerIndex, playerIndex + capacity);
        for (let j = 0; j < players.length; j++) {
          assignmentsData.push({
            registration_id: players[j].id,
            table_id: table.id,
            table_seat_number: j + 1,
          });
        }
        playerIndex += capacity;
      }

      if (assignmentsData.length > 0) {
        await tx.table_assignment.createMany({
          data: assignmentsData,
          skipDuplicates: true,
        });
      }

      return tables;
    });

    return NextResponse.json(
      serializeBigInt({
        message: "Tables and assignments created",
        createdTables,
      }),
    );
  } catch (error) {
    console.error("❌ Erreur lors de la génération des tables :", error);
    return NextResponse.json(
      { error: "Failed to generate tables" },
      { status: 500 },
    );
  }
}
