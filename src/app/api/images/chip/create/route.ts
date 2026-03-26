// app/api/chips/create/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export const runtime = "nodejs"; // nécessaire pour upload

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const stackId = formData.get("stackId");
    const value = formData.get("value");

    // Traitement image : uniquement WordPress
    const wpImageUrl = formData.get("wpImageUrl");
    if (!wpImageUrl || typeof wpImageUrl !== "string") {
      return Response.json({ error: "Image WordPress requise" }, { status: 400 });
    }

    // Enregistre dans la db
    const chip = await prisma.chip.create({
      data: {
        value: Number(value),
        chip_image: wpImageUrl,
        stack_chip: {
          create: [{ stack_id: Number(stackId) }]
        }
      }
    });

    return Response.json(serializeBigInt(chip));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erreur lors de la création du chip" }, { status: 500 });
  }
}
