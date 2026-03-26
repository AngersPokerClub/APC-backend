import { use } from "react";
import { TournamentProvider } from "@/app/providers/TournamentContextProvider";

export default function GameLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <TournamentProvider tournamentId={resolvedParams.id}>
      {children}
    </TournamentProvider>
  );
}
