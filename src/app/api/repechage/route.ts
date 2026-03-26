import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

function defaultHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://angers-poker-club.fr", // remplacer par le vrai domaine client
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-WP-Nonce",
    "Content-Type": "application/json",
    "X-PNonce": crypto.randomUUID(),
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      ...defaultHeaders(),
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received body:", body);

    const { userId, trimesterNumber, category, repechage_etat, repechage_period } = body;

    const currentSeason = await prisma.season.findFirst({
      where: { status: "in_progress" },
    });

    if (!currentSeason) {
      return new Response(JSON.stringify({ error: "Current season not found" }), {
        status: 400,
        headers: { ...defaultHeaders() }
      });
    }

    const user = await prisma.wp_users.findUnique({
      where: { ID: BigInt(userId) },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { ...defaultHeaders() }
      });
    }

    // Recherche du trimestre si trimesterNumber est donné
    let trimester_id = null;
    if (trimesterNumber !== undefined && trimesterNumber !== null) {
      const trimester = await prisma.trimester.findFirst({
        where: {
          id: trimesterNumber,
          season_id: currentSeason.id,
        },
      });
      if (!trimester) {
        return new Response(JSON.stringify({ error: "Trimester not found" }), {
          status: 400,
          headers: { ...defaultHeaders() }
        });
      }
      trimester_id = trimester.id;
    }

    const repechageEntry = await prisma.repechage.create({
      data: {
        trimester_id: trimester_id,
        user_id: BigInt(userId),
        category: category.trim(),
        repechage_etat: repechage_etat,
        repechage_period: repechage_period,
      },
    });

    return new Response(JSON.stringify(serializeBigInt(repechageEntry)), {
      status: 200,
      headers: { ...defaultHeaders() }
    });

  } catch (err) {
    console.error("Error during repechage creation:", err);
    return new Response(JSON.stringify({ error: "Failed to create repechage entry" }), {
      status: 500,
      headers: { ...defaultHeaders() }
    });
  }
}
