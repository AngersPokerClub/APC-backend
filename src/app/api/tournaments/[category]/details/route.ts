import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { tournament_tournament_category } from "@/generated/prisma";
import { extractParamsFromPath } from "@/app/utils/api-params";

const categoryMap: Record<string, tournament_tournament_category> = {
  apt: tournament_tournament_category.APT,
  ag: tournament_tournament_category.SPECIAUX,
  sitandgo: tournament_tournament_category.SITANDGO,
  superfinale: tournament_tournament_category.SUPERFINALE,
  solipoker: tournament_tournament_category.SOLIPOKER,
};

export async function GET(req: NextRequest) {
  try {
    const tournaments = extractParamsFromPath(req, ["tournaments"]);
    const categoryParam = tournaments.tournaments;
    const normalizedCategory = categoryParam?.toLowerCase() ?? "";
    const mappedCategory = categoryMap[normalizedCategory];

    if (!mappedCategory) {
      console.warn(`⚠️ Catégorie invalide reçue : '${categoryParam}'`);
      return NextResponse.json(
        { error: `Invalid category '${categoryParam}'` },
        { status: 400 }
      );
    }

    // Récupérer tournois avec inscriptions et utilisateurs liés
    const result = await prisma.tournament.findMany({
      where: { tournament_category: mappedCategory },
      include: {
        registration: {
          include: {
            wp_users: {
              select: {
                ID: true,
                user_login: true,
                user_pass: true,
                user_nicename: true,
                user_email: true,
                user_url: true,
                user_registered: true,
                user_activation_key: true,
                user_status: true,
                display_name: true,
                pseudo_winamax: true,
                photo_url: true,
              },
            },
          },
        },
      },
    });

    const trimestry = await prisma.trimester.findMany();
    const seasons = await prisma.season.findMany();

    // Récupérer les classements avec tournois et utilisateurs
    const tournament_ranking = await prisma.tournament_ranking.findMany({
      include: {
        tournament: true,
        registration: {
          include: {
            wp_users: {
              select: {
                ID: true,
                user_login: true,
                user_pass: true,
                user_nicename: true,
                user_email: true,
                user_url: true,
                user_registered: true,
                user_activation_key: true,
                user_status: true,
                display_name: true,
                pseudo_winamax: true,
                photo_url: true,
              },
            },
          },
        },
      },
    });

    // Extraire les IDs utilisateurs des inscriptions et classements
    const regUserIds = result.flatMap((t) => t.registration.map((r) => r.wp_users.ID));
    const rankUserIds = tournament_ranking
      .map((r) => r.registration?.wp_users?.ID)
      .filter((id): id is bigint => typeof id === "bigint" || typeof id === "number");
    const userIds = Array.from(new Set([...regUserIds, ...rankUserIds]));

    // Récupérer les rôles (wp_capabilities) en une seule requête
    const userMetas = await prisma.wp_usermeta.findMany({
      where: {
        user_id: { in: userIds.map((id) => BigInt(id)) },
        meta_key: "wp_capabilities",
      },
      select: {
        user_id: true,
        meta_value: true,
      },
    });

    // Construire map user_id => rôle (string JSON brut)
    const userRolesMap: Record<string, string> = {};
    userMetas.forEach(({ user_id, meta_value }) => {
      if (meta_value) {
        userRolesMap[user_id.toString()] = meta_value;
      }
    });

    // Fonction helper pour extraire un rôle lisible depuis la string sérialisée PHP (si besoin)
    // Sinon tu peux juste garder la string brute en role string
    function parsePhpSerializedRole(serialized: string): string | null {
      // Ici simplifié à une détection de rôle basique, à adapter selon vrai contenu
      if (serialized.includes('um_custom_role_1')) return "um_custom_role_1";
      try {
        // utiliser JSON.parse si format JSON, sinon null
        return JSON.parse(serialized);
      } catch {
        return null;
      }
    }

    // Enrichir les wp_users dans les inscriptions avec la propriété role (string ou null)
    const registrationsWithRoles = result.flatMap((t) =>
      t.registration.map((reg) => {
        const userIdStr = reg.wp_users.ID.toString();
        const roleSerialized = userRolesMap[userIdStr] ?? null;
        const role = roleSerialized ? parsePhpSerializedRole(roleSerialized) : null;

        return {
          ...reg,
          wp_users: {
            ...reg.wp_users,
            role: typeof role === "string" ? role : null, // stocker le rôle simplifié
          },
        };
      })
    );

    // Enrichir également les wp_users dans tournament_ranking
    const tournamentRankingWithRoles = tournament_ranking.map((ranking) => {
      if (!ranking.registration?.wp_users) return ranking;

      const userIdStr = ranking.registration.wp_users.ID.toString();
      const roleSerialized = userRolesMap[userIdStr] ?? null;
      const role = roleSerialized ? parsePhpSerializedRole(roleSerialized) : null;

      return {
        ...ranking,
        registration: {
          ...ranking.registration,
          wp_users: {
            ...ranking.registration.wp_users,
            role: typeof role === "string" ? role : null,
          },
        },
      };
    });

    const responseData = serializeBigInt({
      tournamentss: result,
      registrationsWithRoles,
      trimestry,
      seasons,
      tournament_ranking: tournamentRankingWithRoles,
    });

    console.log(`✅ Données récupérées avec succès pour la catégorie : ${mappedCategory}`);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des données :", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
