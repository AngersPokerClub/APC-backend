import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function POST(req: NextRequest) {
  const { stack } = extractParamsFromPath(req, ["stack"]);

  if (!stack) {
    return NextResponse.json(
      { error: "Missing or invalid stack_id" },
      { status: 400 }
    );
  }

  try {
    const stack_id = parseInt(stack);
    const body = await req.json();
    const { value, chip_image, chip_id } = body;

    if (isNaN(stack_id)) {
      return NextResponse.json({ error: "Invalid stack_id" }, { status: 400 });
    }

    let chip;

    if (chip_id) {
      chip = await prisma.chip.findUnique({
        where: { id: BigInt(chip_id) }
      });

      if (!chip) {
        return NextResponse.json({ error: "Chip not found" }, { status: 404 });
      }
    } else {
      if (
        typeof value !== "number" ||
        !chip_image ||
        typeof chip_image !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid payload for chip creation" },
          { status: 400 }
        );
      }

      chip = await prisma.chip.create({
        data: {
          value,
          chip_image
        }
      });
    }

    const relation = await prisma.stack_chip.create({
      data: {
        stack_id,
        chip_id: chip.id
      }
    });

    return NextResponse.json(serializeBigInt(chip), { status: 201 });
  } catch (error) {
    console.error("❌ Error creating or linking chip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { stack } = extractParamsFromPath(request, ["stack"]);

  if (!stack) {
    return NextResponse.json(
      { error: "Missing or invalid stack_id" },
      { status: 400 }
    );
  }

  try {
    const stack_id = parseInt(stack);
    if (isNaN(stack_id)) {
      return NextResponse.json({ error: "Invalid stack_id" }, { status: 400 });
    }

    const body = await request.json();
    const { chip_id } = body;

    if (!chip_id || isNaN(Number(chip_id))) {
      return NextResponse.json({ error: "Invalid chip_id" }, { status: 400 });
    }

    const result = await prisma.stack_chip.delete({
      where: {
        stack_id_chip_id: {
          stack_id,
          chip_id: BigInt(chip_id)
        }
      }
    });

    return NextResponse.json({ message: "Chip removed from stack" });
  } catch (error) {
    console.error("❌ Erreur suppression chip du stack :", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
