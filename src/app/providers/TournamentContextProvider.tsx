"use client";
import { createContext, useContext } from "react";
import {
  Tournament,
  TournamentLevel,
  TournamentRanking,
  Registration,
  TableAssignment,
  Stack
} from "@/app/types";
import { useTournamentData } from "../hook/useTournamentData";
import { Trimester } from "../types/trimester.types";

type TournamentContextType = {
  tournament?: Tournament;
  levels: TournamentLevel[];
  registration: Registration[];
  classement: TournamentRanking[];
  assignements: TableAssignment[];
  stacks: Stack[];
  trimestry: Trimester[];
  refetchAll: () => void;
  refetchOnly: () => void;
};

const TournamentContext = createContext<TournamentContextType | null>(null);

type TournamentProviderProps = {
  tournamentId: string;
  children: React.ReactNode;
};

export const TournamentProvider = ({
  tournamentId,
  children
}: TournamentProviderProps) => {
  const { data, refetch, refetchStatusOnly } = useTournamentData(tournamentId);

  return (
    <TournamentContext.Provider
      value={{
        tournament: data?.tournament,
        levels: data?.levels ?? [],
        registration: data?.registrations ?? [],
        classement: data?.classement ?? [],
        assignements: data?.assignements ?? [],
        stacks: data?.stacks ?? [],
        trimestry: data?.trimestry ?? [],
        refetchAll: () => refetch(),
        refetchOnly: () => refetchStatusOnly?.()
      }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (!context)
    throw new Error(
      "useTournamentContext must be used within a TournamentProvider"
    );
  return context;
};
