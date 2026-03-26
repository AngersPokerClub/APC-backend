import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

type Level = {
  tournament_id: bigint;
  level_number: number;
  level_start: Date;
  level_end: Date;
  level_small_blinde: number;
  level_big_blinde: number;
  level_pause: boolean;
  level_chip_race: boolean;
  level_ante: number;
};

export async function POST(req: NextRequest) {
  const { tournament } = extractParamsFromPath(req, ["tournament"]);

  if (!tournament) {
    return NextResponse.json(
      { error: "Missing tournament ID" },
      { status: 400 }
    );
  }

  try {
    const tournamentId = parseInt(tournament);
    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    const tournamentData = await prisma.tournament.findUnique({
      where: { id: BigInt(tournamentId) }
    });

    if (!tournamentData) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const startDate = new Date(tournamentData.tournament_start_date);
    const totalMinutes = tournamentData.estimate_duration; // Durée déjà en minutes
    
    const levels: Level[] = [];
    let currentTime = new Date(startDate);
    let elapsedMinutes = 0;
    let levelNumber = 1;
    let sb = 25;
    let bb = 50;
    const PAUSE_DURATION = 15;
    const LEVEL_DURATION = 20;
    let consecutivePlayedLevels = 0;

    while (elapsedMinutes < totalMinutes) {
      const isPause = consecutivePlayedLevels === 3;
      const duration = isPause ? PAUSE_DURATION : LEVEL_DURATION;

      const levelStart = new Date(currentTime);
      const levelEnd = new Date(currentTime);
      levelEnd.setMinutes(levelEnd.getMinutes() + duration);

      levels.push({
        tournament_id: tournamentData.id,
        level_number: levelNumber,
        level_start: levelStart,
        level_end: levelEnd,
        level_small_blinde: isPause ? 0 : sb,
        level_big_blinde: isPause ? 0 : bb,
        level_pause: isPause,
        level_chip_race: false,
        level_ante: 0,
      });

      if (isPause) {
        consecutivePlayedLevels = 0;
      } else {
        sb = bb;
        bb += 50;
        consecutivePlayedLevels++;
      }

      currentTime = levelEnd;
      elapsedMinutes += duration;
      levelNumber++;
    }

    await prisma.tournament_level.createMany({ data: levels });

    return NextResponse.json(serializeBigInt(levels));
  } catch (error) {
    console.error("Erreur génération niveaux :", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la génération" },
      { status: 500 }
    );
  }
}
