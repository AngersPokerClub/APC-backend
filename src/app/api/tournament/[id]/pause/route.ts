import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function PATCH(req: NextRequest) {
  console.log("🔄 Début PATCH tournois");
  const { tournament } = extractParamsFromPath(req, ["tournament"]);
  if (!tournament) {
    console.log("❌ Pas d'ID tournoi dans le chemin");
    return NextResponse.json({ error: "Missing tournament ID" }, { status: 400 });
  }
  console.log(`🏷️ ID tournoi extrait : ${tournament}`);
  let tournamentId: bigint;
  try {
    tournamentId = BigInt(tournament);
    console.log(`🔢 ID tournoi converti en BigInt : ${tournamentId.toString()}`);
  } catch (err) {
    console.error("❌ Erreur conversion ID tournoi en BigInt :", err);
    return NextResponse.json({ error: "Invalid tournament ID format" }, { status: 400 });
  }
  try {
    const body = await req.json();
    console.log("📥 Payload reçu :", body);
    const { pause } = body;
    if (typeof pause !== "boolean") {
      console.log("❌ Payload invalide : 'pause' non booléen");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    console.log(`⏸️ Valeur 'pause' reçue : ${pause}`);
    const now = new Date();
    const offsetInMinutes = now.getTimezoneOffset();
    const nowWithOffset = new Date(now.getTime() - offsetInMinutes * 60 * 1000);
    console.log(`⏰ Moment actuel : ${now.toISOString()}`);

    const tournamentData = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { tournament_level: { orderBy: { level_number: "asc" } } },
    });

    if (!tournamentData) {
      console.log("❌ Tournoi introuvable en base");
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    console.log("🔍 Données tournoi récupérées:", tournamentData);
    if (pause) {
      // Mise en pause simple
      const updated = await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          tournament_pause: true,
          tournament_pause_date: nowWithOffset,
        },
      });
      console.log("⏸️ Tournoi mis en pause avec succès:", updated);
      return NextResponse.json(serializeBigInt(updated));
    }
    if (!tournamentData.tournament_pause_date) {
      console.log("❌ Pas de date de pause trouvée lors de la reprise");
      return NextResponse.json({ error: "No pause date set" }, { status: 400 });
    }

    const pauseDate = new Date(tournamentData.tournament_pause_date);
    let pauseDurationMs = nowWithOffset.getTime() - pauseDate.getTime();
    if (pauseDurationMs < 0) {
      console.warn("Durée pause négative détectée, correction appliquée");
      pauseDurationMs = 0;
    }

    const updatedLevels: { id: bigint; level_start: Date; level_end: Date; }[] = [];
    let foundPauseLevel = false;
    for (const level of tournamentData.tournament_level) {
      const levelStart = new Date(level.level_start);
      const levelEnd = new Date(level.level_end);
      if (!foundPauseLevel) {
        if (pauseDate >= levelStart && pauseDate < levelEnd) {
          foundPauseLevel = true;
          const remainingLevelMs = levelEnd.getTime() - pauseDate.getTime();
          const newLevelStart = nowWithOffset;
          const newLevelEnd = new Date(newLevelStart.getTime() + remainingLevelMs);
          updatedLevels.push({
            id: level.id,
            level_start: newLevelStart,
            level_end: newLevelEnd,
          });
        } else {
          updatedLevels.push({
            id: level.id,
            level_start: levelStart,
            level_end: levelEnd,
          });
        }
      } else {
        // Décalage complet des niveaux suivants par la durée de pause
        const newLevelStart = new Date(levelStart.getTime() + pauseDurationMs);
        const newLevelEnd = new Date(levelEnd.getTime() + pauseDurationMs);
        updatedLevels.push({
          id: level.id,
          level_start: newLevelStart,
          level_end: newLevelEnd,
        });
      }
    }

    console.log("▶️ Mise à jour en base avec découpage par lots");

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        tournament_pause: false,
        tournament_pause_date: null,
      },
    });

    const batchSize = 10;
    for (let i = 0; i < updatedLevels.length; i += batchSize) {
      const batch = updatedLevels.slice(i, i + batchSize);
      await prisma.$transaction(tx =>
        Promise.all(
          batch.map(lvl =>
            tx.tournament_level.update({
              where: { id: lvl.id },
              data: {
                level_start: lvl.level_start,
                level_end: lvl.level_end,
              },
            })
          )
        )
      );
    }

    console.log("✅ Tournoi repris et niveaux mis à jour");

    return NextResponse.json(serializeBigInt({ success: true }));
  } catch (err) {
    console.error("❌ Erreur lors du PATCH tournoi :", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
