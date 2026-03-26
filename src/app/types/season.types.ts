import { Trimester } from "./trimester.types";

type SeasonStatus = "draft" | "start" | "past";

export type Season = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: SeasonStatus;
  trimester?: Trimester[];
};
