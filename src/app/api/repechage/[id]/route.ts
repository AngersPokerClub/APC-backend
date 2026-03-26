import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// === Headers réutilisables ===
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
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Received DELETE request for repechage id:", id);

    if (!id) {
      console.log("No id provided");
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { ...defaultHeaders() },
      });
    }

    const idNum = Number(id);
    if (isNaN(idNum)) {
      console.log("Invalid id, not a number:", id);
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: { ...defaultHeaders() },
      });
    }

    const repechageEntry = await prisma.repechage.findUnique({
      where: { id: BigInt(idNum) },
    });

    if (!repechageEntry) {
      console.log("Repechage entry not found:", idNum);
      return new Response(JSON.stringify({ error: "Repechage not found" }), {
        status: 404,
        headers: { ...defaultHeaders() },
      });
    }

    await prisma.repechage.delete({
      where: { id: BigInt(idNum) },
    });

    console.log("Deleted repechage id:", idNum);
    return new Response(
      JSON.stringify({ success: true, message: "Repechage deleted" }),
      {
        status: 200,
        headers: { ...defaultHeaders() },
      }
    );
  } catch (err) {
    console.error("Failed deleting repechage:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...defaultHeaders() },
    });
  }
}
