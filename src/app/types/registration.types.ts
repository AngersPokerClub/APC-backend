import { TableAssignment } from "./table_assignement.types";
import { Tournament } from "./tournament.types";
import { TournamentRanking } from "./tournament_ranking.types";
import { WPUser } from "./user.types";

export type Registration = {
  id: number;
  user_id: number;
  tournament_id: number;
  inscription_date: string;
  statut: "Confirmed" | "Pending" | "Cancelled";
  wp_users?: WPUser;
  tournament?: Tournament;
  table_assignment?: TableAssignment[];
  tournament_ranking?: TournamentRanking[];
};
