"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  SortDescriptor,
  Spinner,
  Chip
} from "@heroui/react";
import {
  DeadIcon,
  Delete02Icon,
  PencilEdit02Icon,
  ViewIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useMemo, useCallback } from "react";
import { getKeyValue } from "@heroui/react";
import { STRINGS } from "@/app/constants/string";
import { ActionDefinition } from "./table.types";

export type Column<T> = {
  name: string;
  uid: keyof T | "action";
  align?: "start" | "center" | "end";
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

export type GenericTableProps<T extends { id: string | number }> = {
  columns: Column<T>[];
  items: T[];
  width?: boolean;
  ariaLabel: string;
  showActions?: boolean;
  enableRowClick?: boolean;
  enableSorting?: boolean;
  getDetailUrl?: (id: T["id"]) => string;
  actions?: (item: T) => ActionDefinition<T>[];
  useEliminationStatus?: boolean;
};

export function GenericTable<T extends { id: string | number; eliminated?: boolean }>(
  {
    columns,
    items,
    width = true,
    ariaLabel,
    showActions = false,
    enableRowClick = false,
    enableSorting = true,
    getDetailUrl,
    actions,
    useEliminationStatus = false,
  }: GenericTableProps<T>
) {
  const visibleColumns = useMemo(() => 
    showActions
      ? columns
      : columns.filter((col) => col.uid !== "action"),
    [showActions, columns]
  );

  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: String(columns[0]?.uid || "id"),
    direction: "ascending"
  });

  const sortedItems = useMemo(() => {
    if (!enableSorting) return items;
    const { column, direction } = sortDescriptor;
    if (!column || column === "action") return items;
    
    const sorted = [...items].sort((a, b) => {
      const aVal = getKeyValue(a, column);
      const bVal = getKeyValue(b, column);
      const aParsed = typeof aVal === "string" ? aVal.toLowerCase() : aVal;
      const bParsed = typeof bVal === "string" ? bVal.toLowerCase() : bVal;
      if (aParsed < bParsed) return direction === "ascending" ? -1 : 1;
      if (aParsed > bParsed) return direction === "ascending" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortDescriptor, enableSorting]);

  const handleRowClick = useCallback((id: T["id"]) => {
    if (enableRowClick && getDetailUrl) {
      window.open(getDetailUrl(id), "_self");
    }
  }, [enableRowClick, getDetailUrl]);

  const handleActionClick = useCallback((e: React.MouseEvent, action: ActionDefinition<T>, item: T) => {
    e.stopPropagation();
    action.onClick(item);
  }, []);

  const renderCell = useCallback((columnKey: React.Key, item: T) => {
    if (columnKey === "action") {
      return (
        <TableCell>
          <div className="relative flex items-center gap-2">
            {useEliminationStatus && item.eliminated ? (
              <Tooltip content="Éliminé" className="px-3xs">
                <span className="text-danger-500">
                  <HugeiconsIcon
                    icon={DeadIcon}
                    size={20}
                    strokeWidth={1.5}
                  />
                </span>
              </Tooltip>
            ) : (
              actions?.(item)?.map((action, idx) => (
                <Tooltip
                  key={idx}
                  content={action.tooltip}
                  color={
                    action.color === "danger" ? "danger" : "default"
                  }
                  className="px-3xs">
                  <span
                    onClick={(e) => handleActionClick(e, action, item)}
                    className={`text-l px-3xs rounded-xl cursor-pointer active:opacity-50 ${
                      action.color === "danger"
                        ? "text-danger-500"
                        : "text-white"
                    }`}>
                    {action.icon}
                  </span>
                </Tooltip>
              ))
            )}
          </div>
        </TableCell>
      );
    }

    const col = columns.find((c) => c.uid === columnKey);
    const value = item[columnKey as keyof T];
    const content = col?.render ? col.render(value, item) : value;

    if (columnKey === "status") {
      return (
        <TableCell>
          <Chip
            className={`py-0 px-1 items-center justify-center !text-m !font-satoshiLight ${
              value === "finish" || value === "past"
                ? "bg-red-950"
                : value === "start" || value === "in_progress"
                ? "bg-purple-950"
                : "bg-green-950"
            }`}
            size="sm"
            variant="flat">
            {content === "finish"
              ? STRINGS.status.finish
              : content === "in_coming"
              ? STRINGS.status.in_coming : content === "start" ? STRINGS.status.start : content === "draft" ? STRINGS.statusLabel.draft : content === "in_progress" ? STRINGS.statusLabel.in_progress : content === "past" ? STRINGS.statusLabel.past : STRINGS.statutUndefined}
          </Chip>
        </TableCell>
      );
    }

    if (columnKey === "avatar") {
      return (
        <TableCell>
          <div className="flex items-center gap-3">
            <img
              src={
                (item as any).avatar ??
                "/images/ellipseAvatar.png"
              }
              alt={(item as any).avatarName}
              className="w-10 h-10 rounded-full hidden md:block"
              loading="lazy"
            />
            <span className="!font-satoshiRegular !text-l text-white text-left">
              {(item as any).avatarName}
            </span>
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell className="!font-satoshiLight !text-l leading-7 whitespace-nowrap">
        {content as React.ReactNode}
      </TableCell>
    );
  }, [columns, useEliminationStatus, actions, handleActionClick]);

  return (
    <div className="w-full overflow-x-auto">
      <Table
        className="!text-l"
        aria-label={ariaLabel}
        fullWidth={width}
        sortDescriptor={enableSorting ? sortDescriptor : undefined}
        onSortChange={enableSorting ? setSortDescriptor : undefined}>
        <TableHeader columns={visibleColumns}>
          {(column) => (
            <TableColumn
              key={String(column.uid)}
              align={column.align || "start"}
              className="!text-s !font-satoshiLight text-neutral-300 whitespace-nowrap"
              allowsSorting={enableSorting && column.uid !== "action"}>
              {column.name.toUpperCase()}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody
          items={sortedItems}
          isLoading={false}
          loadingContent={<Spinner label="Chargement..." />}>
          {(item) => (
            <TableRow
              key={item.id}
              onClick={() => handleRowClick(item.id)}
              className={`${
                enableRowClick && getDetailUrl
                  ? "hover:bg-white/10 hover:rounded-full cursor-pointer rounded-full"
                  : "rounded-full"
              } !text-l !font-satoshiRegular`}>
              {(columnKey) => renderCell(columnKey, item)}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

GenericTable.displayName = 'GenericTable';
