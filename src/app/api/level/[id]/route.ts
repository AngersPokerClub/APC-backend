import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { getDurationInMinutes } from "@/app/utils/date";
import { Prisma } from "@/generated/prisma";
import { DefaultArgs } from "@/generated/prisma/runtime/library";

export async function PUT(req: NextRequest) {
  try {
    const { level } = extractParamsFromPath(req, ["level"]);
    if (!level) {
      return NextResponse.json(
        { error: "Level ID is required" },
        { status: 400 },
      );
    }

    const levelId = BigInt(level);
    const data = await req.json();

    const currentLevel = await prisma.tournament_level.findUnique({
      where: { id: levelId },
    });
    if (!currentLevel) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const duration = parseInt(data.duration_minutes);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: "Invalid duration_minutes" },
        { status: 400 },
      );
    }

    const levelStart = new Date(currentLevel.level_start);
    const updatedEnd = new Date(levelStart);
    updatedEnd.setMinutes(updatedEnd.getMinutes() + duration);

    const allLevels = await prisma.tournament_level.findMany({
      where: { tournament_id: currentLevel.tournament_id },
      orderBy: { level_number: "asc" },
    });

    const updatedIndex = allLevels.findIndex(
      (lvl) => lvl.id.toString() === levelId.toString(),
    );
    if (updatedIndex === -1) {
      return NextResponse.json(
        { error: "Level index not found" },
        { status: 500 },
      );
    }

    const updatedLevelData = {
      level_end: updatedEnd,
      level_small_blinde: data.level_small_blinde,
      level_big_blinde: data.level_big_blinde,
      level_pause: data.level_pause,
      level_chip_race: data.level_chip_race,
      level_ante: data.level_ante,
    };

    // Préparation des updates en batch
    let currentTime = new Date(updatedEnd);
    const updatesBatch = [
      prisma.tournament_level.update({
        where: { id: levelId },
        data: updatedLevelData,
      }),
    ];

    for (let i = updatedIndex + 1; i < allLevels.length; i++) {
      const level = allLevels[i];
      const durationMinutes =
        (new Date(level.level_end).getTime() -
          new Date(level.level_start).getTime()) /
        60000;

      const newStart = new Date(currentTime);
      const newEnd = new Date(currentTime);
      newEnd.setMinutes(newEnd.getMinutes() + durationMinutes);

      updatesBatch.push(
        prisma.tournament_level.update({
          where: { id: level.id },
          data: {
            level_start: newStart,
            level_end: newEnd,
          },
        }),
      );

      currentTime = newEnd;
    }

    // Transaction batch directe
    await prisma.$transaction(updatesBatch);

    const updatedLevel = await prisma.tournament_level.findUnique({
      where: { id: levelId },
    });

    return NextResponse.json(serializeBigInt(updatedLevel));
  } catch (error) {
    console.error("Error updating level duration and rescheduling:", error);
    return NextResponse.json(
      { error: "Failed to update level and reschedule following levels" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { level } = extractParamsFromPath(req, ["level"]);
    if (!level) {
      return NextResponse.json(
        { error: "Level ID is required" },
        { status: 400 },
      );
    }

    const levelId = BigInt(level);
    const deletedLevel = await prisma.tournament_level.findUnique({
      where: { id: levelId },
    });
    if (!deletedLevel) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const tournamentId = deletedLevel.tournament_id;
    const levelNumber = deletedLevel.level_number;

    const followingLevels = await prisma.tournament_level.findMany({
      where: {
        tournament_id: tournamentId,
        level_number: { gt: levelNumber },
      },
      orderBy: { level_number: "asc" },
    });

    // 🎯 FEATURE 2: Level Reset Bug Fix
    // When a level is deleted, the next level should start at NOW with full duration
    // instead of inheriting remaining time from the deleted level
    const now = new Date();
    let previousEnd = now; // Start from NOW instead of previous level's end

    // Préparer la batch des update promises
    const updatesBatch: Prisma.Prisma__tournament_levelClient<
      {
        id: bigint;
        tournament_id: bigint;
        level_number: number;
        level_start: Date;
        level_end: Date;
        level_small_blinde: number;
        level_big_blinde: number;
        level_pause: boolean;
        level_chip_race: boolean;
        level_ante: number | null;
      },
      never,
      DefaultArgs,
      Prisma.PrismaClientOptions
    >[] = [];

    followingLevels.forEach((level, index) => {
      const durationMin = getDurationInMinutes(
        new Date(level.level_start),
        new Date(level.level_end),
      );

      // For the first following level (the one immediately after deletion):
      // Set start to NOW and end to NOW + full duration
      const newStart = index === 0 ? now : new Date(previousEnd);
      const newEnd = new Date(newStart.getTime() + durationMin * 60 * 1000);

      previousEnd = newEnd;

      updatesBatch.push(
        prisma.tournament_level.update({
          where: { id: level.id },
          data: {
            level_number: level.level_number - 1,
            level_start: newStart,
            level_end: newEnd,
          },
        }),
      );
    });

    // Transaction batch (delete + updates)
    await prisma.$transaction([
      prisma.tournament_level.delete({ where: { id: levelId } }),
      ...updatesBatch,
    ]); // timeout augmenté à 20s

    return NextResponse.json({
      message: "Level deleted and reordered successfully",
    });
  } catch (error) {
    console.error("Error in DELETE level reorder:", error);
    return NextResponse.json(
      { error: "Failed to delete and reorder levels" },
      { status: 500 },
    );
  }
}
