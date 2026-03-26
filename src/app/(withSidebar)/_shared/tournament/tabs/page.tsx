"use client";

import { TournamentProvider } from "@/app/providers/TournamentContextProvider";
import TournamentDetailPage from "./tournament_detail_page";
import { useParams } from "next/navigation";

export default function TournamentDetailWrapper() {
  const { id } = useParams();

  if (!id) return null;

  return (
    <TournamentProvider tournamentId={id as string}>
      <TournamentDetailPage />
    </TournamentProvider>
  );
}
