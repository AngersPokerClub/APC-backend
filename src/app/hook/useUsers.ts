// hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
import { User } from "../types/user.types";

export const useUsers = () => {
  const query = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
  });

  return {
    data: query.data,           // Les utilisateurs, typés
    isLoading: query.isLoading, // Loader pour l'UI
    isError: query.isError,     // Pour l'affichage d'erreur
    error: query.error,         // Détail de l'erreur
    refetch: query.refetch,     // Pour recharger la liste
  };
};
