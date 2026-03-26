import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

// utilitaire : trouve le prochain siège libre dans une table
function findNextAvailableSeat(assignments: { table_seat_number: number | null }[]) {
  const usedSeats = new Set(assignments.map((a) => a.table_seat_number).filter((n): n is number => n !== null));
  let seat = 1;
  while (usedSeats.has(seat)) seat++;
  return seat;
}

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
    const body = await req.json();
    const { pseudo, firstName, lastName } = body;

    if (isNaN(tournamentId) || !pseudo) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Vérifier si déjà inscrit
    const alreadyRegistered = await prisma.registration.findMany({
      where: {
        tournament_id: BigInt(tournamentId),
        wp_users: { display_name: pseudo }
      }
    });

    if (alreadyRegistered.length > 0) {
      return NextResponse.json(
        { error: "Player already registered" },
        { status: 409 }
      );
    }

    // Récupérer ou créer le joueur
    let user = await prisma.wp_users.findFirst({
      where: { display_name: pseudo }
    });

    if (!user) {
      user = await prisma.wp_users.create({
        data: {
          user_login: pseudo,
          user_pass: "",
          user_nicename: `${firstName} ${lastName}`,
          user_email: `${pseudo}@external.com`,
          display_name: pseudo,
          pseudo_winamax: pseudo,
          user_registered: new Date(),
          photo_url: ""
        }
      });

      await prisma.wp_usermeta.create({
        data: {
          user_id: user.ID,
          meta_key: "wp_capabilities",
          meta_value: 'a:1:{s:16:"um_custom_role_1";b:1;}'
        }
      });
    }

    // Inscrire au tournoi
    await prisma.registration.create({
      data: {
        user_id: user.ID,
        tournament_id: BigInt(tournamentId),
        statut: "Confirmed",
        inscription_date: new Date()
      }
    });

    const tables = await prisma.tournament_table.findMany({
      where: { tournament_id: BigInt(tournamentId) },
      include: { table_assignment: true }
    });

    if (tables.length === 0) {
      return NextResponse.json(
        serializeBigInt({
          message: "Player registered but no tables exist yet"
        })
      );
    }

    // Récupérer la registration nouvellement créée
    const newRegistration = await prisma.registration.findFirst({
      where: { user_id: user.ID, tournament_id: BigInt(tournamentId) }
    });

    if (!newRegistration) {
      return NextResponse.json(
        { error: "Registration not created properly" },
        { status: 500 }
      );
    }

    // --- Choix de la table ---
    // On trie par nombre de joueurs
    const minCount = Math.min(...tables.map(t => t.table_assignment.length));
    const candidateTables = tables.filter(t => t.table_assignment.length === minCount);

    // Si plusieurs tables ont le même nombre de joueurs, on tire au hasard
    const targetTable = candidateTables[Math.floor(Math.random() * candidateTables.length)];

    // Trouver le prochain siège libre
    const seatNumber = findNextAvailableSeat(targetTable.table_assignment);

    // Assigner le joueur
    await prisma.table_assignment.create({
      data: {
        registration_id: newRegistration.id,
        table_id: targetTable.id,
        table_seat_number: seatNumber,
        eliminated: false,
        user_kill_id: null
      }
    });

    return NextResponse.json(
      serializeBigInt({
        message: "Player registered and assigned to the least filled table"
      })
    );

  } catch (error) {
    console.error("Error registering player:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
