"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Input } from "@heroui/react";

export type AddTableFormHandle = {
  getValues: () => {
    table_number: number;
    table_capacity: number;
  };
};

type AddTableFormProps = {
  initialNumber?: number;
  initialCapacity?: number;
};

export const AddTableForm = forwardRef<AddTableFormHandle, AddTableFormProps>(
  ({ initialNumber = 1, initialCapacity = 6 }, ref) => {
    const [tableNumber, setTableNumber] = useState(initialNumber);
    const [tableCapacity, setTableCapacity] = useState(initialCapacity);

    useImperativeHandle(ref, () => ({
      getValues: () => ({
        table_number: tableNumber,
        table_capacity: tableCapacity
      })
    }));

    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="w-full">
          <Input
            type="number"
            label="Numéro de table"
            value={String(tableNumber)}
            onChange={(e) => setTableNumber(Number(e.target.value))}
          />
        </div>

        <div className="w-full">
          <Input
            type="number"
            label="Capacité de la table"
            value={String(tableCapacity)}
            onChange={(e) => setTableCapacity(Number(e.target.value))}
          />
        </div>
      </div>
    );
  }
);

AddTableForm.displayName = "AddTableForm";
