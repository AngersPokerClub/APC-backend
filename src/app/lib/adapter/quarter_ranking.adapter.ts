import { StandingRow } from "@/app/components/table/table.types";
import {
  Registration,
  Season,
  Tournament,
  TournamentRanking,
} from "@/app/types";
import { Trimester } from "@/app/types/trimester.types";
import { WPUser } from "@/app/types/user.types";

type TrimestryKey = "T1" | "T2" | "T3";

export const mapQuarterRankingByTrimestry = (
  category: string,
  trimesters: Trimester[],
  tournaments: Tournament[],
  registrations: Registration[],
  seasons: Season[],
  rankings: TournamentRanking[]
): Record<TrimestryKey, StandingRow[]> => {
  const result: Record<TrimestryKey, StandingRow[]> = {
    T1: [],
    T2: [],
    T3: [],
  };

  // Chaîne de rôle invitée à exclure strictement
  const excludedRoleString = 'um_custom_role_1';

  rankings.forEach((ranking) => {
    if (!ranking.tournament) return;
    if (!ranking.registration?.wp_users) return;

    // Vérifier que le rôle existe dans wp_users.role (type string)
    const userRole = ranking.registration.wp_users.role;

    // Exclure si le rôle correspond à la chaîne d'invité
    if (userRole === excludedRoleString) {
      return; // On ignore cet utilisateur
    }

    // Filtrer par catégorie, insensible à la casse
    if (ranking.tournament.tournament_category.toUpperCase() !== category.toUpperCase()) return;

    // Récupérer le trimestre du tournoi
    const trimesterObj = trimesters.find(
      (trimester) => trimester.id === ranking.tournament?.tournament_trimestry
    );
    if (!trimesterObj) return;

    const trimestryKey = `T${trimesterObj.number}` as TrimestryKey;
    if (!(trimestryKey in result)) return;

    const userId = ranking.registration.id;
    const userName = ranking.registration.wp_users.display_name || `Joueur ${userId}`;

    const existingUser = result[trimestryKey].find((user) => user.name === userName);
    if (existingUser) {
      existingUser.points += ranking.ranking_score ?? 0;
    } else {
      result[trimestryKey].push({
        id: String(userId),
        place: 0,
        name: userName,
        points: ranking.ranking_score ?? 0,
      });
    }
  });

  // Tri des joueurs et attribution des places
  (Object.keys(result) as TrimestryKey[]).forEach((key) => {
    result[key]
      .sort((a, b) => b.points - a.points)
      .forEach((row, index) => {
        row.place = index + 1;
      });
  });

  return result;
};




export const mapClassementTournament = (
  classement: TournamentRanking[]
): StandingRow[] => {
  return classement
    .flatMap((classe) => {
      if (!classe.registration || !classe.registration.wp_users) return [];
      return {
        id: String(classe.id),
        place: classe.ranking_position,
        name: classe.registration.wp_users.display_name,
        points: classe.ranking_score,
      };
    })
    .filter((row): row is StandingRow => row !== undefined)
    .sort((a, b) => b.points - a.points); // Tri décroissant par points
};

