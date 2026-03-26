// app/api/seasons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

type TrimesterInput = {
  name: string;
  start_date: string;
  end_date: string;
};

type CreateSeasonRequest = {
  name: string;
  start_date: string;
  end_date: string;
  status: "draft" | "in_progress" | "past";
  trimesters: TrimesterInput[];
};

export async function POST(req: NextRequest) {
  try {
    console.log("[API] Requête POST /api/seasons reçue");

    const body: CreateSeasonRequest = await req.json();
    console.log("[API] Corps de la requête :", body);

    if (
      !body.name ||
      !body.start_date ||
      !body.end_date ||
      !body.status ||
      !Array.isArray(body.trimesters) ||
      body.trimesters.length === 0
    ) {
      console.warn("[API] Validation des champs échouée", body);
      return NextResponse.json(
        { error: "Champs requis manquants ou incorrects" },
        { status: 400 }
      );
    }

    // 1. Création de la saison
    const createdSeason = await prisma.season.create({
      data: {
        name: body.name,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        status: body.status,
      },
    });
    console.log("[API] Saison créée avec ID :", createdSeason.id);

    // 2. Création des trimestres liés à la saison
    const trimesters = await Promise.all(
      body.trimesters.map((t, index) =>
        prisma.trimester.create({
          data: {
            season_id: createdSeason.id,
            number: index + 1,
            start_date: new Date(t.start_date),
            end_date: new Date(t.end_date),
          },
        })
      )
    );
    console.log("[API] Trimestres créés :", trimesters.length);

    // 3. Retourne la saison créée avec les trimestres
    return NextResponse.json(
      serializeBigInt({ ...createdSeason, trimesters }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Erreur création saison :", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
