// src/app/api/wp-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.wp_users.findMany({
      orderBy: {
        display_name: "asc"
      },
      select: {
        ID: true,
        user_email: true,
        pseudo_winamax: true,
        display_name: true,
        photo_url: true,
      }
    });

    return NextResponse.json(serializeBigInt(users));
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
