import { useState } from "react";
import { useGetMarkerStats, getGetMarkerStatsQueryKey } from "@workspace/api-client-react";
import { MapComponent } from "@/components/Map";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<"all" | "winery" | "restaurant">("all");

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background font-sans">
      {/* Sidebar Panel */}
      <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      
      {/* Map Area */}
      <div className="flex-1 relative h-full">
        <MapComponent activeFilter={activeFilter} />
      </div>
    </div>
  );
}
