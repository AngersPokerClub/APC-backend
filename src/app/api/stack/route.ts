import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function GET(_: NextRequest) {
  try {
    const result = await prisma.stack.findMany({
      include: {
        stack_chip: {
          include: {
            chip: true
          }
        }
      }
    });

    return NextResponse.json(serializeBigInt(result));
  } catch (error) {
    console.error("Error fetching stack:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stack_name, stack_total_player } = body;

    if (!stack_name || typeof stack_name !== "string") {
      return NextResponse.json(
        { error: "Le nom du stack est requis" },
        { status: 400 }
      );
    }

    const created = await prisma.stack.create({
      data: {
        stack_name,
        stack_total_player
      } as any
    });

    return NextResponse.json(serializeBigInt(created), { status: 201 });
  } catch (error) {
    console.error("❌ Error creating stack:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la création du stack" },
      { status: 500 }
    );
  }
}
