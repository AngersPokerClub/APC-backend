"use client";

import { TournamentProvider } from "@/app/providers/TournamentContextProvider";
import { useParams } from "next/navigation";

export default function EditRankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();

  if (!id) return null;

  return (
    <TournamentProvider tournamentId={id as string}>
      {children}
    </TournamentProvider>
  );
}
