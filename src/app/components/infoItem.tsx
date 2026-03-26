"use client";

import { ReactNode } from "react";

type InfoItemProps = {
  label: string;
  value: ReactNode;
};

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="text-primary_brand-50 text-center flex flex-col items-center gap-1">
      <div className="text-xl sm:text-2xl md:text-4xl font-satoshiBold leading-tight">
        {label}
      </div>
      <div className="text-3xl sm:text-5xl md:text-6xl font-satoshiBold leading-tight">
        {value}
      </div>
    </div>
  );
}
