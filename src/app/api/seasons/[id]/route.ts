import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

type TrimesterInput = {
  name: string;
  start_date: string;
  end_date: string;
};

type UpdateSeasonRequest = {
  name: string;
  start_date: string;
  end_date: string;
  status: "draft" | "in_progress" | "past";
  trimesters: TrimesterInput[];
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`[API] Requête PATCH /api/seasons/${id} reçue`);

    const body: UpdateSeasonRequest = await req.json();
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

    const updatedSeason = await prisma.season.update({
      where: { id: BigInt(id) },
      data: {
        name: body.name,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        status: body.status,
      },
    });
    console.log("[API] Saison mise à jour avec ID :", updatedSeason.id);

    await prisma.trimester.deleteMany({
      where: {
        season_id: BigInt(id),
      },
    });

    const trimesters = await Promise.all(
      body.trimesters.map((t, index) =>
        prisma.trimester.create({
          data: {
            season_id: updatedSeason.id,
            number: index + 1,
            start_date: new Date(t.start_date),
            end_date: new Date(t.end_date),
          },
        })
      )
    );
    console.log("[API] Trimestres recréés :", trimesters.length);

    return NextResponse.json(
      serializeBigInt({ ...updatedSeason, trimesters }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erreur mise à jour saison :", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`[API] Requête DELETE /api/seasons/${id} reçue`);

    const season = await prisma.season.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!season) {
      return NextResponse.json(
        { error: "Saison introuvable" },
        { status: 404 }
      );
    }

    await prisma.trimester.deleteMany({
      where: { season_id: BigInt(id) },
    });

    const deletedSeason = await prisma.season.delete({
      where: { id: BigInt(id) },
    });

    console.log("[API] Saison supprimée :", deletedSeason.id);

    return NextResponse.json(
      serializeBigInt({ success: true, season: deletedSeason }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erreur suppression saison :", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
