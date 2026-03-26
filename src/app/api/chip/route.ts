import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";

export async function GET(_: NextRequest) {
  try {
    const chips = await prisma.chip.findMany();
    return NextResponse.json(serializeBigInt(chips), { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching chips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { value, chip_image } = body;

    if (
      typeof value !== "number" ||
      !chip_image ||
      typeof chip_image !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const chip = await prisma.chip.create({
      data: {
        value,
        chip_image
      }
    });

    return NextResponse.json(serializeBigInt(chip), { status: 201 });
  } catch (error) {
    console.error("❌ Error creating chip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
