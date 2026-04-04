import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tournament_tournament_status, $Enums } from "@/generated/prisma";
import { serializeBigInt } from "@/app/utils/serializeBigInt";
import { extractParamsFromPath } from "@/app/utils/api-params";
import { DateTime } from "luxon";

export async function PATCH(req: NextRequest) {
	const { tournament } = extractParamsFromPath(req, ["tournament"]);
	if (!tournament) {
		return NextResponse.json(
			{ error: "Missing tournament ID" },
			{ status: 400 }
		);
	}
	const tournamentId = BigInt(tournament);

	try {
		const body = await req.json();
		const { status } = body;

		if (
			!status ||
			!Object.values(tournament_tournament_status).includes(status)
		) {
			return NextResponse.json(
				{ error: "Invalid or missing status" },
				{ status: 400 }
			);
		}

		if (status === "finish") {
			// 1. Vérifie que le tournoi existe
			const mainTournament = await prisma.tournament.findUnique({
				where: { id: tournamentId },
			});
			if (!mainTournament)
				return NextResponse.json(
					{ error: "Tournoi principal introuvable" },
					{ status: 404 }
				);

			// 2. Récupère les survivants + leur user_id en une seule requête (évite N+1)
			const survivors = await prisma.table_assignment.findMany({
				where: {
					eliminated: false,
					tournament_table: { tournament_id: tournamentId },
				},
				select: {
					registration_id: true,
					registration: {
						select: { user_id: true },
					},
				},
			});

			const survivorRegistrationIds = survivors.map((s) => s.registration_id);

			// 3. Récupère et trie le classement
			const rankings = await prisma.tournament_ranking.findMany({
				where: { tournament_id: tournamentId },
				orderBy: { ranking_position: "asc" },
			});

			// 4. Recalcule les positions des éliminés
			const eliminatedRankings = rankings.filter(
				(ranking) => !survivorRegistrationIds.includes(ranking.registration_id)
			);
			eliminatedRankings.forEach((ranking, idx) => {
				ranking.ranking_position = idx + 1;
			});

			// 5. Logique spécifique SOLIPOKER : inscrire les survivants au tournoi du dimanche
			const isSolipoker = mainTournament.tournament_category === "SOLIPOKER";
			let sundayTournamentId: bigint | null = null;
			const registrationCreateData: {
				user_id: bigint;
				tournament_id: bigint;
				inscription_date: Date;
				statut: $Enums.registration_statut;
			}[] = [];

			if (isSolipoker) {
				if (!mainTournament.tournament_trimestry) {
					return NextResponse.json(
						{ error: "Trimestre du tournoi principal introuvable" },
						{ status: 400 }
					);
				}

				// Cherche le tournoi du dimanche dans les 7 jours suivant le tournoi courant,
				// pour éviter de matcher un autre SOLIPOKER du même trimestre.
				const sevenDaysLater = new Date(
					mainTournament.tournament_start_date.getTime() + 7 * 24 * 60 * 60 * 1000
				);

				const sundayTournament = await prisma.tournament.findFirst({
					where: {
						tournament_trimestry: mainTournament.tournament_trimestry,
						tournament_start_date: {
							gt: mainTournament.tournament_start_date,
							lte: sevenDaysLater,
						},
						OR: [
							{ tournament_name: { contains: "dimanche" } },
							{ tournament_name: { contains: "Dimanche" } },
							{ tournament_name: { contains: "DIMANCHE" } },
							{ tournament_name: { contains: "sunday" } },
							{ tournament_name: { contains: "Sunday" } },
							{ tournament_name: { contains: "SUNDAY" } },
						],
					},
				});

				if (!sundayTournament)
					return NextResponse.json(
						{ error: "Tournoi du dimanche introuvable" },
						{ status: 404 }
					);

				sundayTournamentId = sundayTournament.id;

				// Construit les inscriptions à partir des données déjà fetchées (pas de N+1)
				for (const survivor of survivors) {
					if (!survivor.registration?.user_id) {
						console.error(
							`Registration invalide ou manquante pour survivor: ${survivor.registration_id}`
						);
						return NextResponse.json(
							{
								error: `Données de survivor invalides (registration_id: ${survivor.registration_id})`,
							},
							{ status: 400 }
						);
					}
					registrationCreateData.push({
						user_id: BigInt(survivor.registration.user_id),
						tournament_id: sundayTournament.id,
						inscription_date: DateTime.now().toJSDate(),
						statut: $Enums.registration_statut.Confirmed,
					});
				}
			}

			// 6. Transaction : update tournoi + classement (batch via raw SQL) + inscriptions dimanche
			await prisma.$transaction(async (tx) => {
				// Update du statut du tournoi
				await tx.tournament.update({
					where: { id: tournamentId },
					data: { tournament_status: "finish" },
				});

				// Inscriptions dimanche en batch (createMany) — SOLIPOKER only
				if (registrationCreateData.length > 0) {
					await tx.registration.createMany({
						data: registrationCreateData,
						skipDuplicates: true,
					});
				}

				// Update du classement des éliminés en une seule requête SQL raw
				if (eliminatedRankings.length > 0) {
					const cases = eliminatedRankings
						.map((elim) => `WHEN id = ${elim.id} THEN ${elim.ranking_position}`)
						.join(" ");
					const ids = eliminatedRankings.map((elim) => elim.id).join(", ");
					await tx.$executeRawUnsafe(
						`UPDATE tournament_ranking SET ranking_position = CASE ${cases} END WHERE id IN (${ids})`
					);
				}
			});

			return NextResponse.json(
				serializeBigInt({
					message: isSolipoker
						? "Tournoi terminé, survivants inscrits à la finale, classement recalculé."
						: "Tournoi terminé, classement recalculé.",
					tournamentId,
					...(isSolipoker && {
						sundayTournamentId,
						registrationsInserted: registrationCreateData.length,
					}),
					eliminatedRankingCount: eliminatedRankings.length,
				}),
				{ status: 200 }
			);
		} else {
			// Cas d'autres statuts
			const updated = await prisma.tournament.update({
				where: { id: tournamentId },
				data: { tournament_status: status },
			});
			return NextResponse.json(serializeBigInt(updated), { status: 200 });
		}
	} catch (error) {
		console.error("❌ Error in PATCH tournament finish:", error);

		const errorMessage = error instanceof Error ? error.message : String(error);

		return NextResponse.json(
			{
				error: "Internal server error",
				details: errorMessage,
			},
			{ status: 500 }
		);
	}
}
