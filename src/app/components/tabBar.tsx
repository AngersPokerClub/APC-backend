"use client";

import Link from "next/link";
import { STRINGS } from "../constants/string";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();
  return (
    <div className="w-full py-5 px-2">
      <div className="w-full max-w-xl mx-auto bg-neutral-800/80 rounded-2xl shadow-lg p-1">
        <div className="flex flex-nowrap overflow-x-auto scrollbar-hide">
          {STRINGS.sidebar_mobile.menu_item.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={`flex-1 text-center px-4 py-2 rounded-xl font-satoshiMedium text-sm transition-all duration-200 whitespace-nowrap
                ${pathname.startsWith(href)
                  ? "bg-ligth/20 text-neutral-50 shadow-md"
                  : "bg-transparent text-neutral-50 hover:bg-neutral-700/60"}
              `}
              style={{ minWidth: "max-content" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 