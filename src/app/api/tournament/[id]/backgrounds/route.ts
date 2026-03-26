// app/api/tournament/[id]/backgrounds/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tournamentId = Number(id);

    const body = await req.json();
    const backgrounds: string[] = body.backgrounds;

    if (!Array.isArray(backgrounds) || backgrounds.some(bg => typeof bg !== "string")) {
      return new Response(JSON.stringify({ error: "Données invalides" }), { status: 400 });
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        tournament_background_1: backgrounds.length > 0 ? backgrounds[0] : null,
        tournament_background_2: backgrounds.length > 1 ? backgrounds[1] : null,
      },
    });

    function bigintReplacer(key: string, value: any) {
      return typeof value === 'bigint' ? value.toString() : value;
    }

    return new Response(JSON.stringify(updatedTournament, bigintReplacer), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}

