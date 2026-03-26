import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractParamsFromPath } from "@/app/utils/api-params";

export async function DELETE(request: NextRequest) {
  try {
    const { chip } = extractParamsFromPath(request, ["chip"]);

    if (!chip) {
      return NextResponse.json(
        { error: "Chip ID is required" },
        { status: 400 }
      );
    }

    const chipIdBigInt = BigInt(chip);

    await prisma.stack_chip.deleteMany({
      where: { chip_id: chipIdBigInt }
    });

    await prisma.chip.delete({
      where: { id: chipIdBigInt }
    });

    return NextResponse.json({ message: "Chip deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting chip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
