import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function GET(req: NextRequest) {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { start_date: "desc" },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
        trimester: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            start_date: true,
            end_date: true,
          }
        }
      }
    });

    return NextResponse.json({ seasons: serializeBigInt(seasons) });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
