import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function POST(req: NextRequest) {
  try {
    const { tournament } = extractParamsFromPath(req, ["tournament"]);
    if (!tournament) {
      return NextResponse.json(
        { error: "Missing tournament ID" },
        { status: 400 }
      );
    }
    const tournamentId = BigInt(tournament);
    const body = await req.json();
    const { playerId, mode, targetId, seatNumber } = body;

    if (!playerId || !mode || !targetId) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    if (mode === "swap") {
      const players = await prisma.table_assignment.findMany({
        where: {
          id: { in: [BigInt(playerId), BigInt(targetId)] }
        }
      });
      if (players.length !== 2) {
        return NextResponse.json(
          { error: "Joueurs non trouvés" },
          { status: 404 }
        );
      }
      const [playerA, playerB] = players;
      await prisma.$transaction([
        prisma.table_assignment.update({
          where: { id: playerA.id },
          data: {
            table_id: playerB.table_id,
            table_seat_number: playerB.table_seat_number
          }
        }),
        prisma.table_assignment.update({
          where: { id: playerB.id },
          data: {
            table_id: playerA.table_id,
            table_seat_number: playerA.table_seat_number
          }
        })
      ]);
      return NextResponse.json({ message: "Échange effectué avec succès" });
    }

    if (mode === "move") {
      const player = await prisma.table_assignment.findUnique({
        where: { id: BigInt(playerId) }
      });
      if (!player) {
        return NextResponse.json(
          { error: "Joueur non trouvé" },
          { status: 404 }
        );
      }

      const assignments = await prisma.table_assignment.findMany({
        where: {
          table_id: BigInt(targetId),
          eliminated: false
        },
        orderBy: { table_seat_number: "asc" }
      });
      const usedSeats = assignments.map((a) => a.table_seat_number);

      let targetSeat: number | undefined;
      if (seatNumber !== undefined && seatNumber !== null && seatNumber !== "") {
        const parsedSeat = parseInt(seatNumber);
        if (!isNaN(parsedSeat) && parsedSeat >= 1 && parsedSeat <= 8) {
          targetSeat = parsedSeat;
        }
      }

      // Si aucun siège valide donné, on prend le premier siège libre entre 1 et 8
      if (!targetSeat) {
        targetSeat = 1;
        while (usedSeats.includes(targetSeat) && targetSeat <= 8) {
          targetSeat++;
        }
        if (targetSeat > 8) {
          return NextResponse.json(
            { error: "Toutes les places sont occupées à cette table" },
            { status: 400 }
          );
        }
      } else {
        // Si le siège donné est occupé, on gère le conflit (idem que précédemment)
        if (usedSeats.includes(targetSeat)) {
          // On décale le joueur déjà à ce siège au dernier siège libre entre 1 et 8
          let lastSeat = 8;
          while (usedSeats.includes(lastSeat) && lastSeat > 0) {
            lastSeat--;
          }
          if (lastSeat === 0) {
            return NextResponse.json(
              { error: "Toutes les places sont occupées à cette table" },
              { status: 400 }
            );
          }
          const conflict = assignments.find(
            (a) => a.table_seat_number === targetSeat
          );
          if (conflict) {
            await prisma.table_assignment.update({
              where: { id: conflict.id },
              data: { table_seat_number: lastSeat }
            });
          }
        }
      }

      // Mise à jour du joueur déplacé
      await prisma.table_assignment.update({
        where: { id: player.id },
        data: {
          table_id: BigInt(targetId),
          table_seat_number: targetSeat
        }
      });

      return NextResponse.json({ message: "Joueur déplacé avec succès" });
    }

    return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
  } catch (err) {
    console.error("Erreur déplacement joueur :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
