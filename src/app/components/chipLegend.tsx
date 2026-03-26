"use client";

import { Chip } from "../types";

type ChipLegendProps = {
  chips: Chip[];
};

export const ChipLegend: React.FC<ChipLegendProps> = ({ chips }) => {
  if (!Array.isArray(chips)) return null;

  return (
    <div className="flex flex-wrap justify-center gap-6 sm:gap-12 md:gap-32 mt-4">
      {chips.map((chip) => (
        <div
          key={chip.id}
          className="flex flex-col items-center w-24 sm:w-28 md:w-32">
          <img
            src={chip.chip_image}
            alt={`Jeton ${chip.value}`}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain"
          />
          <span className="text-primary_brand-50 text-xl font-satoshiBlack mt-1 sm:text-xl2 md:text-xl4">
            {chip.value}
          </span>
        </div>
      ))}
    </div>
  );
};