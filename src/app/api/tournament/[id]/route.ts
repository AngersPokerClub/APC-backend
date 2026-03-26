import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournamentMocks } from "@/mock";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function GET(req: NextRequest) {
  const { tournament } = extractParamsFromPath(req, ["tournament"]);
  const tournamentId = parseInt(tournament ?? "");

  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const isMock = process.env.MOCK === "true";

  if (isMock) {
    return NextResponse.json({ ...tournamentMocks, tournament });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: BigInt(tournamentId) },
      include: {
        tournament_level: true,
        stack: true,
        tournament_ranking: true,
        tournament_table: true,
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
            },
            table_assignment: true,
            tournament_ranking: true
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeBigInt(tournament));
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
