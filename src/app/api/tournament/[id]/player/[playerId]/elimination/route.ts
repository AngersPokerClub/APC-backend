import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { Prisma } from "@/generated/prisma";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { reequilibrateTables } from "@/app/utils/reequilibrate";

function getAptScore(total: number, rank: number): number {
  const aptScoreRanges = [
    { min: 0, max: 15, scores: [26, 18, 12, 8, 6, 5] },
    { min: 16, max: 20, scores: [28, 20, 15, 11, 8, 5, 3] },
    { min: 21, max: 25, scores: [35, 25, 18, 13, 9, 6, 4, 3, 2] },
    { min: 26, max: 30, scores: [40, 28, 21, 15, 11, 8, 6, 4, 3, 2, 1] },
    { min: 31, max: 35, scores: [45, 32, 24, 18, 12, 10, 7, 5, 4, 3, 2, 1, 1] },
    {
      min: 36,
      max: 40,
      scores: [51, 36, 27, 20, 15, 11, 8, 5, 4, 3, 3, 2, 2, 1, 1],
    },
    {
      min: 41,
      max: 45,
      scores: [56, 41, 30, 22, 16, 12, 9, 7, 5, 4, 3, 3, 2, 2, 1, 1, 1],
    },
    {
      min: 46,
      max: 50,
      scores: [62, 47, 33, 24, 17, 13, 9, 7, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1],
    },
    {
      min: 51,
      max: 55,
      scores: [
        67, 51, 36, 26, 19, 14, 10, 8, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 2, 1, 1, 1,
      ],
    },
    {
      min: 56,
      max: 60,
      scores: [
        73, 56, 39, 28, 20, 15, 11, 9, 6, 5, 5, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1,
        1,
      ],
    },
  ] as const;
  const range = aptScoreRanges.find((r) => total >= r.min && total <= r.max);
  return range?.scores[rank - 1] ?? 0;
}

function getSitAndGoScore(total: number, rank: number): number {
  const sitAndGoScores: Record<number, number[]> = {
    5: [5, 2, 0, 0, 0],
    6: [6, 3, 0, 0, 0, 0],
    7: [7, 4, 2, 0, 0, 0, 0],
    8: [8, 5, 3, 0, 0, 0, 0, 0],
    9: [9, 6, 4, 2, 0, 0, 0, 0, 0],
  };
  const scores = sitAndGoScores[total];
  return scores ? (scores[rank - 1] ?? 0) : 0;
}

function findNextAvailableSeat(
  players: { table_seat_number: number | null }[],
  startSeat: number = 1,
): number {
  const occupied = new Set(
    players
      .map((p) => p.table_seat_number)
      .filter((n): n is number => n !== null),
  );
  let seat = startSeat;
  while (occupied.has(seat)) {
    seat++;
  }
  return seat;
}

async function getScoreAndRankingPosition(
  tx: Prisma.TransactionClient,
  tournamentId: number | bigint,
  ranking_position: number,
) {
  const tournament = await tx.tournament.findUnique({
    where: { id: BigInt(tournamentId) },
  });
  if (!tournament) {
    return {
      ranking_position,
      score: 0,
      tournament_category: undefined,
      totalRegistrations: 0,
    };
  }
  const totalRegistrations = await tx.registration.count({
    where: {
      tournament_id: BigInt(tournamentId),
      statut: "Confirmed",
    },
  });

  let score = 0;
  if (tournament.tournament_category === "APT") {
    score = getAptScore(totalRegistrations, ranking_position);
  } else if (tournament.tournament_category === "SITANDGO") {
    score = getSitAndGoScore(totalRegistrations, ranking_position);
  }

  return {
    ranking_position,
    score,
    tournament_category: tournament.tournament_category,
    totalRegistrations,
  };
}

export async function PUT(req: NextRequest) {
  const { tournament, player } = extractParamsFromPath(req, [
    "tournament",
    "player",
  ]);
  if (!tournament || !player) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const tournamentId = parseInt(tournament);
    const registrationId = parseInt(player);
    const { user_kill_id } = await req.json();

    if (isNaN(registrationId) || !user_kill_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tournamentData = await prisma.tournament.findUnique({
      where: { id: BigInt(tournamentId) },
      select: { tournament_category: true },
    });
    if (!tournamentData) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    const { tournament_category } = tournamentData;
    const needReequilibrage = tournament_category !== "SITANDGO";
    const hasRanking = ["APT", "SITANDGO", "SPECIAUX", "SOLIPOKER"].includes(
      tournament_category,
    );
    const isSitAndGo = tournament_category === "SITANDGO";

    const assignment = await prisma.table_assignment.findFirst({
      where: { registration_id: BigInt(registrationId) },
      include: { registration: true },
    });

    if (!assignment?.registration) {
      return NextResponse.json(
        { error: "Assignment or registration not found" },
        { status: 404 },
      );
    }

    const userMeta = await prisma.wp_usermeta.findFirst({
      where: {
        user_id: assignment.registration.user_id,
        meta_key: "wp_capabilities",
      },
      select: { meta_value: true },
    });

    // Élimination + MAJ classement dans une transaction unique
    const result = await prisma.$transaction(async (tx) => {
      await tx.table_assignment.update({
        where: { id: assignment.id },
        data: { eliminated: true, user_kill_id: BigInt(user_kill_id) },
      });

      let ranking_position = 0;
      let score = 0;
      let tableId: bigint | null = null;

      if (hasRanking) {
        if (isSitAndGo) {
          tableId = assignment.table_id ?? null;

          const aliveOnThisTable = await tx.table_assignment.count({
            where: {
              table_id: tableId!,
              eliminated: false,
              registration: { statut: "Confirmed" },
            },
          });
          ranking_position = aliveOnThisTable + 1;

          const totalOnThisTable = await tx.table_assignment.count({
            where: {
              table_id: tableId!,
              registration: { statut: "Confirmed" },
            },
          });

          score = getSitAndGoScore(totalOnThisTable, ranking_position);

          // Si il ne reste qu'1 survivant sur cette table, attribuer ses points rang 1 immédiatement
          if (aliveOnThisTable === 1) {
            const survivor = await tx.table_assignment.findFirst({
              where: {
                table_id: tableId!,
                eliminated: false,
                registration: { statut: "Confirmed" },
              },
              include: { registration: true },
            });

            if (survivor?.registration) {
              const survivorScore = getSitAndGoScore(totalOnThisTable, 1);

              await tx.tournament_ranking.deleteMany({
                where: {
                  registration_id: survivor.registration.id,
                  tournament_id: BigInt(tournamentId),
                },
              });
              await tx.tournament_ranking.create({
                data: {
                  registration_id: survivor.registration.id,
                  tournament_id: BigInt(tournamentId),
                  ranking_position: 1,
                  ranking_score: survivorScore,
                  table_id: tableId!,
                },
              });
            }
          }
        } else {
          const aliveCount = await tx.table_assignment.count({
            where: {
              tournament_table: { tournament_id: BigInt(tournamentId) },
              eliminated: false,
              registration: { statut: "Confirmed" },
            },
          });
          ranking_position = aliveCount + 1;

          if (tournament_category === "APT") {
            const res = await getScoreAndRankingPosition(
              tx,
              tournamentId,
              ranking_position,
            );
            score = res.score;
          } else if (tournament_category === "SPECIAUX") {
            score = 0;
          } else {
            score = 0;
          }
        }
      }

      await tx.tournament_ranking.deleteMany({
        where: {
          registration_id: assignment.registration.id,
          tournament_id: BigInt(tournamentId),
        },
      });

      await tx.tournament_ranking.create({
        data: {
          registration_id: assignment.registration.id,
          tournament_id: BigInt(tournamentId),
          ranking_position,
          ranking_score: score,
          ...(isSitAndGo && tableId ? { table_id: tableId } : {}),
        },
      });

      const aliveCount = await tx.table_assignment.count({
        where: {
          tournament_table: { tournament_id: BigInt(tournamentId) },
          eliminated: false,
          registration: { statut: "Confirmed" },
        },
      });

      return { ranking_position, score, aliveCount };
    });

    let rebalanced = false;
    let moves: {
      playerName: string;
      registrationId: number;
      fromTableId: number;
      fromTableNumber?: number;
      fromTableSeat?: number; // Ajouter ici
      toTableId: number;
      toTableNumber?: number;
      toTableSeat?: number; // Ajouter ici
    }[] = [];

    if (needReequilibrage) {
      const tables = await prisma.tournament_table.findMany({
        where: { tournament_id: BigInt(tournamentId) },
        include: { table_assignment: { where: { eliminated: false } } },
      });

      if (tables.filter((t) => t.table_assignment.length > 0).length > 1) {
        const rebalancedData = await reequilibrateTables(tournamentId);
        if (typeof rebalancedData === "boolean") {
          rebalanced = rebalancedData;
        } else {
          rebalanced = rebalancedData.changed;
          moves = rebalancedData.moves ?? [];
        }
      }
    }

    let tournamentFinished = false;
    if (isSitAndGo) {
      const tables = await prisma.tournament_table.findMany({
        where: { tournament_id: BigInt(tournamentId) },
        include: {
          table_assignment: {
            where: { eliminated: false, registration: { statut: "Confirmed" } },
          },
        },
      });
      // Terminé seulement si chaque table a exactement 1 joueur vivant
      tournamentFinished = tables.every((t) => t.table_assignment.length === 1);
    } else {
      tournamentFinished = result.aliveCount === 1;
    }

    if (tournamentFinished && hasRanking) {
      if (isSitAndGo) {
        await prisma.$transaction(async (tx) => {
          // rendu atomique [web:8]
          const tablesCheck = await tx.tournament_table.findMany({
            where: { tournament_id: BigInt(tournamentId) },
            include: {
              table_assignment: {
                where: {
                  eliminated: false,
                  registration: { statut: "Confirmed" },
                },
                include: { registration: true },
              },
            },
          });

          const stillFinished = tablesCheck.every(
            (t) => t.table_assignment.length === 1,
          );
          if (!stillFinished) {
            return;
          }

          for (const table of tablesCheck) {
            const survivor = table.table_assignment[0];
            if (!survivor?.registration) {
              continue;
            }

            const totalOnThisTable = await tx.table_assignment.count({
              where: {
                table_id: table.id,
                registration: { statut: "Confirmed" },
              },
            });
            const finalScore = getSitAndGoScore(totalOnThisTable, 1);

            await tx.tournament_ranking.deleteMany({
              where: {
                registration_id: survivor.registration.id,
                tournament_id: BigInt(tournamentId),
              },
            });
            await tx.tournament_ranking.create({
              data: {
                registration_id: survivor.registration.id,
                tournament_id: BigInt(tournamentId),
                ranking_position: 1,
                ranking_score: finalScore,
                table_id: table.id,
              },
            });
          }
        });
      } else {
        const lastAssignment = await prisma.table_assignment.findFirst({
          where: {
            tournament_table: { tournament_id: BigInt(tournamentId) },
            eliminated: false,
          },
          include: { registration: true },
        });

        if (lastAssignment?.registration) {
          const { score: lastScore } = await getScoreAndRankingPosition(
            prisma,
            tournamentId,
            1,
          );

          await prisma.tournament_ranking.deleteMany({
            where: {
              registration_id: lastAssignment.registration.id,
              tournament_id: BigInt(tournamentId),
            },
          });
          await prisma.tournament_ranking.create({
            data: {
              registration_id: lastAssignment.registration.id,
              tournament_id: BigInt(tournamentId),
              ranking_position: 1,
              ranking_score: lastScore,
            },
          });
        }
      }
    }

    if (tournament_category === "SOLIPOKER") {
      // Récupère tous les rankings des joueurs éliminés, triés du plus grand au plus petit
      const rankings = await prisma.tournament_ranking.findMany({
        where: { tournament_id: BigInt(tournamentId) },
        orderBy: { ranking_position: "desc" },
      });

      // Repère le classement du dernier éliminé
      const newEliminated = rankings.find(
        (r) => r.registration_id === assignment.registration.id,
      );
      if (!newEliminated) {
        console.error("Ranking missing for newly eliminated player");
        // facultatif : return ou throw ici
      } else {
        const conflictPosition = newEliminated.ranking_position;

        // Vérifie s'il y a doublon (plus d'un joueur avec cette position)
        const positionCount = rankings.filter(
          (r) => r.ranking_position === conflictPosition,
        ).length;
        if (positionCount > 1) {
          // Décale toutes les positions ≥ à celle du conflit (sauf le dernier nouvel éliminé)
          const toShift = rankings.filter(
            (r) =>
              r.ranking_position >= conflictPosition &&
              r.registration_id !== assignment.registration.id,
          );
          for (const ranking of toShift) {
            await prisma.tournament_ranking.update({
              where: { id: ranking.id },
              data: { ranking_position: ranking.ranking_position + 1 },
            });
          }
        }
      }
    }

    // Récupérer le nombre de joueurs vivants (non éliminés et confirmés)
    const aliveCount = await prisma.table_assignment.count({
      where: {
        tournament_table: { tournament_id: BigInt(tournamentId) },
        eliminated: false,
        registration: { statut: "Confirmed" },
      },
    });

    return NextResponse.json(
      serializeBigInt({
        message: "Player eliminated and ranking recorded",
        ...result,
        rebalanced,
        moves,
      }),
    );
  } catch (error) {
    console.error("🔥 Error in eliminate route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
