import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId)) {
    return new Response(JSON.stringify({ error: "ID invalide" }), { status: 400 });
  }

  try {
    const data = await req.json();
    const { chip_image } = data;

    if (!chip_image) {
      return new Response(JSON.stringify({ error: "chip_image est requis" }), { status: 400 });
    }

    const updatedChip = await prisma.chip.update({
      where: { id: numericId },
      data: { chip_image: chip_image },
    });

    return new Response(JSON.stringify(updatedChip), { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour image chip:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}
