import { stackMock } from "@/mock/stack.mock";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";

const isMock = process.env.MOCK === "true";

export async function GET(req: NextRequest) {
  const { stack } = extractParamsFromPath(req, ["stack"]);

  if (!stack) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  if (isMock) {
    const result = stackMock.find((s) => String(s.id) === stack);
    return NextResponse.json(JSON.parse(JSON.stringify(result ?? {})));
  }

  try {
    const numericId = parseInt(stack);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await prisma.stack.findUnique({
      where: { id: numericId },
      include: {
        stack_chip: {
          include: {
            chip: true
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    return NextResponse.json(serializeBigInt(result));
  } catch (error) {
    console.error("Error fetching stack by ID:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { stack } = extractParamsFromPath(req, ["stack"]);

    if (!stack) {
      return NextResponse.json({ error: "Missing stack ID" }, { status: 400 });
    }

    const stackId = parseInt(stack);
    if (isNaN(stackId)) {
      return NextResponse.json({ error: "Invalid stack ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      tournament_id,
      selected_stack_id,
      stack_total_player,
      stack_chip: updatedChips
    } = body;

    const updates: Promise<any>[] = [];

    if (tournament_id && selected_stack_id) {
      updates.push(
        prisma.tournament.update({
          where: { id: BigInt(tournament_id) },
          data: {
            tournament_stack: selected_stack_id
          }
        })
      );
    }

    if (typeof stack_total_player === "number") {
      const currentStack = await prisma.stack.findUnique({
        where: { id: selected_stack_id },
        select: { stack_total_player: true }
      });

      if (
        currentStack &&
        currentStack.stack_total_player !== stack_total_player
      ) {
        updates.push(
          prisma.stack.update({
            where: { id: selected_stack_id },
            data: { stack_total_player }
          })
        );
      }
    }

    if (Array.isArray(updatedChips)) {
      for (const sc of updatedChips) {
        if (
          (!sc.chip_id || sc.chip_id === 0) &&
          sc.chip &&
          typeof sc.chip.value === "number" &&
          typeof sc.chip.chip_image === "string" &&
          sc.chip.chip_image.trim() !== ""
        ) {
          const createdChip = await prisma.chip.create({
            data: {
              value: sc.chip.value,
              chip_image: sc.chip.chip_image
            }
          });

          updates.push(
            prisma.stack_chip.create({
              data: {
                stack_id: selected_stack_id,
                chip_id: createdChip.id
              }
            })
          );
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "No changes detected" },
        { status: 200 }
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ message: "Stack update(s) applied" });
  } catch (error) {
    console.error("❌ Error updating stack:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { stack } = extractParamsFromPath(request, ["stack"]);

    if (!stack) {
      return NextResponse.json({ error: "Stack ID is required" }, { status: 400 });
    }

    const stackId = parseInt(stack);
    if (isNaN(stackId)) {
      return NextResponse.json({ error: "Invalid Stack ID" }, { status: 400 });
    }

    const existing = await prisma.stack.findUnique({
      where: { id: stackId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    await prisma.stack.delete({ where: { id: stackId } });

    return NextResponse.json({ message: "Stack deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting stack:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
