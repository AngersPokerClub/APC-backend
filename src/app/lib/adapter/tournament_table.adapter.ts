import {
  Tournament,
  TournamentTable,
  Registration,
  TableAssignment
} from "@/app/types";
import { SeatRow } from "@/app/components/table/table.types";
import { WPUser } from "@/app/types/user.types";

// Fonction pour les joueurs non assignés ("Non assigné"), uniquement Confirmed
export const mapFlatAssignementsToSeatRows = (
  assignements: TableAssignment[] | null,
  fallbackRegistrations: Registration[] = []
): SeatRow[] => {
  if (!assignements || assignements.length === 0) {
    return fallbackRegistrations
      .filter((r) => r.statut === "Confirmed") // On filtre uniquement les Confirmed
      .map((r) => {
        const user = r.wp_users;
        return {
          id: r.id,
          avatarName: user?.display_name || "Inconnu",
          avatar: user?.photo_url ?? "/images/ellipseAvatar.png",
          seat: "Non assigné",
          action: "",
          eliminated: false
        };
      });
  }

  // On ne garde que les assignements liés à une registration Confirmed
  return assignements
    .filter(a => a.registration?.statut === "Confirmed")
    .map((a) => {
      const registration = a.registration;
      const user = registration?.wp_users;
      const table = a.tournament_table;

      let avatarName = "Inconnu";
      if (user?.display_name) {
        avatarName = user.display_name;
      } else if (registration?.wp_users?.display_name) {
        avatarName = registration.wp_users.display_name;
      }

      return {
        id: a.id,
        avatarName: avatarName,
        avatar: user?.photo_url || registration?.wp_users?.photo_url || "/images/ellipseAvatar.png",
        seat: a.eliminated
          ? "Éliminé"
          : table
          ? `Table ${table.table_number}, siège ${a.table_seat_number}`
          : "Table inconnue",
        action: "",
        eliminated: a.eliminated
      };
    })
    .sort((a, b) => {
      if (a.eliminated === b.eliminated) return 0;
      return a.eliminated ? 1 : -1;
    });
};

// Fonction de regroupement par table, uniquement Confirmed
export const mapAssignementsGroupedByTable = (
  assignements: TableAssignment[]
) => {
  const groups: Record<string, SeatRow[]> = {};

  // On ne garde que les assignements liés à une registration Confirmed
  const confirmedAssignements = assignements.filter(
    (a) => a.registration?.statut === "Confirmed"
  );

  confirmedAssignements.forEach((a) => {
    if (a.eliminated) return;

    const registration = a.registration;
    const user = registration?.wp_users;
    const table = a.tournament_table;
    const tableNumber = table?.table_number ?? "0";

    let avatarName = "Inconnu";
    if (user?.display_name) {
      avatarName = user.display_name;
    } else if (registration?.wp_users?.display_name) {
      avatarName = registration.wp_users.display_name;
    }

    const seatRow: SeatRow = {
      id: a.id,
      avatarName: avatarName,
      avatar: user?.photo_url || registration?.wp_users?.photo_url || "/images/ellipseAvatar.png",
      seat: `Siège ${a.table_seat_number}`,
      action: "",
      eliminated: false
    };

    if (!groups[tableNumber]) groups[tableNumber] = [];
    groups[tableNumber].push(seatRow);
  });

  Object.keys(groups).forEach((tableNumber) => {
    groups[tableNumber].sort((a, b) => {
      const aSeat = parseInt(a.seat.replace("Siège ", "")) || 0;
      const bSeat = parseInt(b.seat.replace("Siège ", "")) || 0;
      return aSeat - bSeat;
    });
  });

  return groups;
};
