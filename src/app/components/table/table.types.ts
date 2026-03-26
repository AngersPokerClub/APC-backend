// components/Table/table.types.ts

export type Column<T> = {
  name: string;
  uid: keyof T;
  align?: "start" | "center" | "end";
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export type GenericTableProps<T extends { id: string | number }> = {
  columns: Column<T>[];
  items: T[];
  ariaLabel: string;
  enableDrag?: boolean;
  onReorder?: (newItems: T[]) => void;
};

export type ActionDefinition<T> = {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (item: T) => void;
  color?: "default" | "danger";
};

export type SeatRow = {
  id: number;
  avatarName: string;
  avatar: string | null;
  seat: string;
  eliminated: boolean;
  action: string;
};

export type StandingRow = {
  id: string;
  place: number;
  name: string;
  points: number;
};

export type BlindRow = {
  id: number;
  level: number;
  small: string;
  big: string;
  ante: string;
  pause: boolean;
  duration: string;
  time: string;
  action: string;
};

export type TournamentRow = {
  id: string;
  name: string;
  players: number;
  trimestry: number;
  tournament_date: string;
  open_tournament_date: string;
  status: string;
  action: string;
};

export type SeasonRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  action: string;
};
