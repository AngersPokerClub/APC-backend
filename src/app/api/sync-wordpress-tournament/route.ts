import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { 
      wordpress_post_id,
      tournament_name,
      tournament_description,
      tournament_start_date,
      tournament_open_date,
      tournament_trimestry,
      tournament_category,
      estimate_duration,
      tournament_status = "in_coming",
    } = body;
    
    let tournament_stack = body.tournament_stack;
    

    // Validation ou récupération du stack valide
    if (!tournament_stack) {
      // Récupérer le premier stack
      const firstStack = await prisma.stack.findFirst({
        orderBy: { id: "asc" },
      });
      if (!firstStack) {
        return NextResponse.json({ error: "No stack found" }, { status: 400 });
      }
      tournament_stack = firstStack.id;
    } else {
      // Vérifier que le stack existe
      const stackExists = await prisma.stack.findUnique({
        where: { id: tournament_stack }
      });
      if (!stackExists) {
        // Si l'id stack envoyé n'existe pas, récupérer le premier stack
        const firstStack = await prisma.stack.findFirst({
          orderBy: { id: "asc" }
        });
        if (!firstStack) {
          return NextResponse.json({ error: "No stack found" }, { status: 400 });
        }
        tournament_stack = firstStack.id;
      }
    }

    // Le reste de ton code (trimester, season, etc.) reste inchangé

    // ... [Validation trimester, season et création tournoi]

    const trimmedNumberMatch = tournament_trimestry.match(/^T(\d)$/);
    if (!trimmedNumberMatch) {
      return NextResponse.json({ error: "Invalid trimester format" }, { status: 400 });
    }
    const trimesterNumber = parseInt(trimmedNumberMatch[1], 10);

    const currentSeason = await prisma.season.findFirst({
      where: {
        status: 'in_progress',
      }
    });

    if (!currentSeason) {
      return NextResponse.json({ error: "Current season not found" }, { status: 400 });
    }

    const trimester = await prisma.trimester.findFirst({
      where: {
        number: trimesterNumber,
        season_id: currentSeason.id,
      }
    });

    if (!trimester) {
      return NextResponse.json({ error: "Trimester not found for current season" }, { status: 400 });
    }

    const createdTournament = await prisma.tournament.create({
      data: {
        wordpress_post_id,
        tournament_name,
        tournament_description,
        tournament_start_date: new Date(tournament_start_date),
        tournament_open_date: new Date(tournament_open_date),
        estimate_duration: estimate_duration,
        tournament_trimestry: trimester.id,
        tournament_category,
        tournament_status,
        tournament_stack
      }
    });

    return NextResponse.json(serializeBigInt(createdTournament));

  } catch (err) {
    console.error("Error creating tournament from WordPress:", err);
    return NextResponse.json({ error: "Failed to sync tournament" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      wordpress_post_id,
      tournament_name,
      tournament_description,
      tournament_start_date,
      tournament_open_date,
      tournament_trimestry,
      tournament_category,
      estimate_duration,
      tournament_status,
      tournament_stack,
    } = body;

    if (!wordpress_post_id) {
      return NextResponse.json({ error: "wordpress_post_id is required" }, { status: 400 });
    }

    // Recherche du tournoi existant par wordpress_post_id
    const existingTournament = await prisma.tournament.findFirst({
      where: { wordpress_post_id: wordpress_post_id }
    });
    if (!existingTournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Validation et parsing du trimestre
    const trimmedNumberMatch = tournament_trimestry.match(/^T(\d)$/);
    if (!trimmedNumberMatch) {
      return NextResponse.json({ error: "Invalid trimester format" }, { status: 400 });
    }
    const trimesterNumber = parseInt(trimmedNumberMatch[1], 10);

    // Récupérer la saison en cours
    const currentSeason = await prisma.season.findFirst({
      where: {
        status: 'in_progress',
      },
    });
    if (!currentSeason) {
      return NextResponse.json({ error: "Current season not found" }, { status: 400 });
    }

    // Récupérer le trimestre selon numéro et saison
    const trimester = await prisma.trimester.findFirst({
      where: {
        number: trimesterNumber,
        season_id: currentSeason.id,
      },
    });
    if (!trimester) {
      return NextResponse.json({ error: "Trimester not found for current season" }, { status: 400 });
    }

    // Validation du stack
    let validStack = tournament_stack;
    if (!validStack) {
      const firstStack = await prisma.stack.findFirst({
        orderBy: { id: "asc" },
      });
      if (!firstStack) {
        return NextResponse.json({ error: "No stack found" }, { status: 400 });
      }
      validStack = firstStack.id;
    } else {
      const stackExists = await prisma.stack.findUnique({
        where: { id: validStack }
      });
      if (!stackExists) {
        const firstStack = await prisma.stack.findFirst({
          orderBy: { id: "asc" }
        });
        if (!firstStack) {
          return NextResponse.json({ error: "No stack found" }, { status: 400 });
        }
        validStack = firstStack.id;
      }
    }

    // Mise à jour du tournoi
    const updatedTournament = await prisma.tournament.update({
      where: { id: existingTournament.id },
      data: {
        tournament_name,
        tournament_description,
        tournament_start_date: new Date(tournament_start_date),
        tournament_open_date: new Date(tournament_open_date),
        estimate_duration: estimate_duration,
        tournament_trimestry: trimester.id,
        tournament_category,
        tournament_status,
        tournament_stack: validStack,
      },
    });

    return NextResponse.json(serializeBigInt(updatedTournament));
  } catch (err) {
    console.error("Error updating tournament from WordPress:", err);
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
  }
}

// Pour DELETE - suppression d'un tournoi existant
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { wordpress_post_id } = body;

    if (!wordpress_post_id) {
      return NextResponse.json({ error: "wordpress_post_id is required" }, { status: 400 });
    }

    // Vérifier que le tournoi existe
    const existingTournament = await prisma.tournament.findFirst({
      where: { wordpress_post_id: wordpress_post_id }
    });

    if (!existingTournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Suppression du tournoi
    await prisma.tournament.delete({
      where: { id: existingTournament.id },
    });

    return NextResponse.json({ message: "Tournament deleted successfully" });
  } catch (err) {
    console.error("Error deleting tournament from WordPress:", err);
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 });
  }
}

