import { Divider } from "@heroui/react";
import Sidebar from "../components/sideBar";
import "../globals.css";
import { NotificationProvider } from "../providers/NotificationProvider";

export default function CommonLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full overflow-auto">
      <div className="flex min-h-screen w-screen overflow-visible">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <Divider orientation="vertical" className="border-2 hidden md:block" />
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto p-0 bg-apt-gradient flex flex-col pb-safe-area">
          <div className="p-2 md:p-6">
            <NotificationProvider>{children}</NotificationProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
