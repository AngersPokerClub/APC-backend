import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function GET(req: NextRequest) {
  try {
    const { tournament } = extractParamsFromPath(req, ["tournament"]);

    if (!tournament) {
      return NextResponse.json(
        { error: "Missing tournament ID" },
        { status: 400 }
      );
    }

    const tournamentId = BigInt(tournament);

    const tables = await prisma.tournament_table.findMany({
      where: {
        tournament_id: tournamentId
      },
      orderBy: {
        table_number: "asc"
      }
    });

    return NextResponse.json(serializeBigInt(tables));
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
