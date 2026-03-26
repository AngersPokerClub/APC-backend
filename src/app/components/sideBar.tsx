"use client";

import { useState } from "react";
import Link from "next/link";
import { STRINGS } from "../constants/string";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout02Icon,
  SidebarLeft01Icon,
  SidebarLeftIcon
} from "@hugeicons/core-free-icons";
import { ButtonComponents } from "./button";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const sidebarWidth = collapsed ? "w-16" : "w-72";

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col justify-between ${sidebarWidth} shrink-0 h-full bg-neutral-950/5 text-ligth transition-all duration-300`}>
        <div className={`flex flex-col ${collapsed ? "gap-8" : "gap-10"}`}>
          <div
            className={`flex ${
              collapsed ? "flex-col gap-6" : "flex-row"
            } items-center justify-between p-4`}>
            <img src="/images/white_logo.svg" alt="Logo" className="h-8 w-8" />
            <ButtonComponents
              iconOnly
              onClick={() => setCollapsed(!collapsed)}
              icon={
                collapsed ? (
                  <HugeiconsIcon
                    icon={SidebarLeftIcon}
                    size={20}
                    strokeWidth={1.5}
                  />
                ) : (
                  <HugeiconsIcon
                    icon={SidebarLeft01Icon}
                    size={20}
                    strokeWidth={1.5}
                  />
                )
              }
            />
          </div>

          <nav className="px-3 flex flex-col gap-2">
            {STRINGS.sidebar.menu_item.map(({ label, icon, href }) => (
              <Link
                key={label}
                href={href}
                className={`group flex items-center transition-colors rounded-lg ${
                  collapsed
                    ? `justify-center p-3 ${
                        pathname.startsWith(href)
                          ? "bg-primary_brand-700"
                          : "hover:bg-primary_brand-700"
                      }`
                    : `p-4 gap-4 ${
                        pathname.startsWith(href)
                          ? "bg-primary_brand-700"
                          : "hover:bg-primary_brand-700"
                      }`
                }`}>
                <HugeiconsIcon
                  icon={icon}
                  size={20}
                  className="shrink-0 text-neutral-50"
                />
                {!collapsed && (
                  <span className="text-l font-satoshiRegular text-neutral-50">
                    {label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <Link
            href="https://angers-poker-club.fr/"
            className="flex justify-between items-center bg-white/5 rounded p-2 hover:bg-primary_brand-500">
            {!collapsed && (
              <span className="text-s font-satoshiRegular leading-4">
                Retour au site
              </span>
            )}
            <HugeiconsIcon icon={Logout02Icon} size={20} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Mobile bottom navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-700 flex justify-around items-center py-2">
        {STRINGS.sidebar.menu_item.map(({ label, icon, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center text-xs ${
              pathname.startsWith(href)
                ? "text-primary_brand-500"
                : "text-neutral-200"
            }`}>
            <HugeiconsIcon icon={icon} size={20} />
          </Link>
        ))}
        <Link href="/">
          <HugeiconsIcon icon={Logout02Icon} size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </>
  );
}
