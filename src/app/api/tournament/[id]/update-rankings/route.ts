import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { validateUpdateRankingsPayload } from "@/app/types/edit-rankings.types";

export async function POST(req: NextRequest) {
  const { tournament } = extractParamsFromPath(req, ["tournament"]);
  const tournamentId = parseInt(tournament ?? "");

  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 },
    );
  }

  try {
    // 1. Verify tournament exists and is finished
    const tournamentRecord = await prisma.tournament.findUnique({
      where: { id: BigInt(tournamentId) },
      select: { id: true, tournament_status: true },
    });

    if (!tournamentRecord) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    if (tournamentRecord.tournament_status !== "finish") {
      return NextResponse.json(
        { error: "Rankings can only be edited for finished tournaments" },
        { status: 400 },
      );
    }

    // 2. Parse and validate body
    const body = await req.json();
    const validation = validateUpdateRankingsPayload(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { rankings } = validation.data;

    // 3. Validate all registration_ids belong to this tournament
    const registrationIds = rankings.map((r) => BigInt(r.registration_id));
    const validRegistrations = await prisma.registration.findMany({
      where: {
        id: { in: registrationIds },
        tournament_id: BigInt(tournamentId),
      },
      select: { id: true },
    });

    const validIds = new Set(validRegistrations.map((r) => r.id.toString()));
    const invalidIds = registrationIds.filter(
      (id) => !validIds.has(id.toString()),
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid registration IDs for this tournament: ${invalidIds.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 4. Transaction: DELETE old rankings + CREATE new ones
    await prisma.$transaction([
      // Delete all existing rankings for this tournament
      prisma.tournament_ranking.deleteMany({
        where: { tournament_id: BigInt(tournamentId) },
      }),
      // Create new rankings
      ...rankings.map((r) =>
        prisma.tournament_ranking.create({
          data: {
            registration_id: BigInt(r.registration_id),
            tournament_id: BigInt(tournamentId),
            ranking_position: r.ranking_position,
            ranking_score: r.ranking_score,
          },
        }),
      ),
    ]);

    return NextResponse.json(
      serializeBigInt({
        message: "Rankings updated successfully",
        tournamentId,
        rankingsCount: rankings.length,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error updating rankings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
