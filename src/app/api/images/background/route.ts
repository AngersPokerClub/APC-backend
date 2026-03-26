// app/api/images/background/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const images = await getBackgroundImages();

    const serializedImages = images.map((img) => ({
      ...img,
      ID: img.ID.toString(),
    }));

    return Response.json(serializedImages);
  } catch (error) {
    console.error("Erreur dans GET /api/images/fonds :", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function getBackgroundImages() {
  const backgroundFolder = await prisma.wp_fbv.findFirst({
    where: { name: "Fonds" },
  });

  if (!backgroundFolder) return [];

  const attachmentLinks = await prisma.wp_fbv_attachment_folder.findMany({
    where: { folder_id: backgroundFolder.id },
    select: { attachment_id: true },
  });

  const attachmentIds = attachmentLinks.map((l) => l.attachment_id);
  if (attachmentIds.length === 0) return [];

  const images = await prisma.wp_posts.findMany({
    where: {
      ID: { in: attachmentIds },
      post_type: "attachment",
    },
    select: {
      ID: true,
      post_title: true,
      guid: true,
    },
  });

  return images;
}
