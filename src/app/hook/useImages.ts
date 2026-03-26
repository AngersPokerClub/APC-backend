// hooks/useWpMedia.ts
import { useQuery } from "@tanstack/react-query";
import { WpMediaImage } from "../types";

export const useWpJetonImages = () => {
  const query = useQuery<WpMediaImage[]>({
    queryKey: ["wpJetonImages"],
    queryFn: async () => {
      const res = await fetch("/api/images/chip?category=4");
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des images WordPress");
      }
      return res.json();
    },
  });

  return {
    data: query.data,             // données retournées (images)
    isLoading: query.isLoading,   // état de chargement
    isError: query.isError,       // présence d'une erreur
    error: query.error,           // objet erreur (détail)
    refetch: query.refetch,       // fonction pour recharger
  };
};

export const useWpBackgroundImages = () => {
  const query = useQuery<WpMediaImage[]>({
    queryKey: ["wpBackgroundImages"],
    queryFn: async () => {
      const res = await fetch("/api/images/background?category=5");
      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des images WordPress");
      }
      return res.json();
    },
  });

  return {
    data: query.data,             // données retournées (images)
    isLoading: query.isLoading,   // état de chargement
    isError: query.isError,       // présence d'une erreur
    error: query.error,           // objet erreur (détail)
    refetch: query.refetch,       // fonction pour recharger
  };
};
