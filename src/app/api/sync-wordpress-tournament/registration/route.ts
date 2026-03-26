import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("➡️ Reçu depuis WordPress :", body);

    const {
      wordpress_post_id,
      wordpress_user_id,
      statut,
      inscription_date
    }: {
      wordpress_post_id: number;
      wordpress_user_id: number;
      statut: "Confirmed" | "Cancelled";
      inscription_date: string;
    } = body;

    if (
      !wordpress_post_id ||
      !wordpress_user_id ||
      !statut ||
      !inscription_date
    ) {
      console.warn("⚠️ Paramètres manquants :", {
        wordpress_post_id,
        wordpress_user_id,
        statut,
        inscription_date
      });
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findFirst({
      where: { wordpress_post_id: wordpress_post_id }
    });

    if (!tournament) {
      console.warn("⚠️ Aucun tournoi trouvé pour post_id :", wordpress_post_id);
      return NextResponse.json(
        { error: "Tournoi non trouvé" },
        { status: 404 }
      );
    }

    console.log("✅ Tournoi trouvé :", tournament.id);

    const existing = await prisma.registration.findFirst({
      where: {
        tournament_id: tournament.id,
        user_id: BigInt(wordpress_user_id)
      }
    });

    if (existing) {
      console.log("✏️ Mise à jour de l'inscription existante...");
      const updated = await prisma.registration.update({
        where: { id: existing.id },
        data: { statut }
      });
      return NextResponse.json(serializeBigInt(updated));
    } else {
      console.log("🆕 Création nouvelle inscription...");
      const created = await prisma.registration.create({
        data: {
          tournament_id: tournament.id,
          user_id: BigInt(wordpress_user_id),
          statut,
          inscription_date: new Date(inscription_date)
        }
      });
      return NextResponse.json(serializeBigInt(created));
    }
  } catch (err) {
    console.error("❌ Erreur interne :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
