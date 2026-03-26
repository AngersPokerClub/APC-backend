import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // ✅ params est maintenant une Promise
) {
  try {
    const { id } = await params; // ✅ Await params pour obtenir l'id
    const tournamentId = BigInt(id);

    // Get the Day 2 tournament details
    const day2Tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        tournament_start_date: true,
        tournament_trimestry: true,
        tournament_category: true,
      },
    });

    if (!day2Tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    // Calculate date range: 7 days before Day 2 start date
    const day2StartDate = new Date(day2Tournament.tournament_start_date);
    const sevenDaysBefore = new Date(day2StartDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    // Find Day 1 tournaments (Friday and Saturday) from the same edition
    const day1Tournaments = await prisma.tournament.findMany({
      where: {
        tournament_category: "SOLIPOKER",
        tournament_trimestry: day2Tournament.tournament_trimestry,
        tournament_start_date: {
          gte: sevenDaysBefore,
          lt: day2StartDate,
        },
        OR: [
          { tournament_name: { contains: "vendredi" } },
          { tournament_name: { contains: "Vendredi" } },
          { tournament_name: { contains: "VENDREDI" } },
          { tournament_name: { contains: "friday" } },
          { tournament_name: { contains: "Friday" } },
          { tournament_name: { contains: "FRIDAY" } },
          { tournament_name: { contains: "samedi" } },
          { tournament_name: { contains: "Samedi" } },
          { tournament_name: { contains: "SAMEDI" } },
          { tournament_name: { contains: "saturday" } },
          { tournament_name: { contains: "Saturday" } },
          { tournament_name: { contains: "SATURDAY" } },
        ],
      },
      include: {
        registration: {
          where: {
            statut: "Confirmed",
          },
        },
        stack: {
          select: {
            stack_total_player: true,
          },
        },
      },
    });

    // Calculate total chips from all Day 1 tournaments
    let totalChips = 0;
    const day1Details: Array<{
      name: string;
      confirmedPlayers: number;
      stackPerPlayer: number;
      totalChips: number;
    }> = [];

    for (const tournament of day1Tournaments) {
      const confirmedPlayersCount = tournament.registration.length;
      const stackPerPlayer = tournament.stack?.stack_total_player ?? 0;
      const chips = confirmedPlayersCount * stackPerPlayer;

      totalChips += chips;

      day1Details.push({
        name: tournament.tournament_name,
        confirmedPlayers: confirmedPlayersCount,
        stackPerPlayer: stackPerPlayer,
        totalChips: chips,
      });
    }

    return NextResponse.json({
      totalChips,
      day1Details,
      metadata: {
        day2TournamentId: id, // ✅ Utilise id au lieu de params.id
        day1TournamentsFound: day1Tournaments.length,
        dateRangeStart: sevenDaysBefore.toISOString(),
        dateRangeEnd: day2StartDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching Day 1 data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Day 1 tournament data" },
      { status: 500 },
    );
  }
}
