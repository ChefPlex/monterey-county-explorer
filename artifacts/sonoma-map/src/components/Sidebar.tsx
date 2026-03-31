import { useGetMarkerStats, useGetMarkers, getGetMarkersQueryKey, getGetMarkerStatsQueryKey } from "@workspace/api-client-react";
import { Wine, Utensils, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeFilter: "all" | "winery" | "restaurant";
  setActiveFilter: (filter: "all" | "winery" | "restaurant") => void;
}

export function Sidebar({ activeFilter, setActiveFilter }: SidebarProps) {
  const { data: stats, isLoading: statsLoading } = useGetMarkerStats({
    query: { queryKey: getGetMarkerStatsQueryKey() }
  });
  
  const { data: markers = [], isLoading: markersLoading } = useGetMarkers({
    query: { queryKey: getGetMarkersQueryKey() }
  });

  const filteredMarkers = markers.filter(marker => {
    if (activeFilter === "all") return true;
    return marker.category === activeFilter;
  });

  return (
    <div className="w-80 h-full bg-card border-r border-border shadow-xl flex flex-col z-10 relative">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Sonoma Journal</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A personal collection of cherished wineries and dining spots in the valley.
        </p>
      </div>

      {/* Stats & Filters */}
      <div className="p-6 border-b border-border bg-card/50">
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => setActiveFilter("all")}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
              activeFilter === "all" 
                ? "bg-background border-border shadow-sm ring-1 ring-ring/20" 
                : "bg-transparent border-transparent hover:bg-muted"
            )}
          >
            <MapPin className="w-5 h-5 mb-1.5 text-foreground" />
            <span className="text-xl font-serif font-medium leading-none mb-1">
              {statsLoading ? "-" : (stats?.total || 0)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">All</span>
          </button>
          
          <button 
            onClick={() => setActiveFilter("winery")}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
              activeFilter === "winery" 
                ? "bg-background border-primary/20 shadow-sm ring-1 ring-primary/30" 
                : "bg-transparent border-transparent hover:bg-muted"
            )}
          >
            <Wine className={cn("w-5 h-5 mb-1.5", activeFilter === "winery" ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xl font-serif font-medium leading-none mb-1 text-foreground">
              {statsLoading ? "-" : (stats?.wineries || 0)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Wineries</span>
          </button>

          <button 
            onClick={() => setActiveFilter("restaurant")}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
              activeFilter === "restaurant" 
                ? "bg-background border-secondary/20 shadow-sm ring-1 ring-secondary/30" 
                : "bg-transparent border-transparent hover:bg-muted"
            )}
          >
            <Utensils className={cn("w-5 h-5 mb-1.5", activeFilter === "restaurant" ? "text-secondary" : "text-muted-foreground")} />
            <span className="text-xl font-serif font-medium leading-none mb-1 text-foreground">
              {statsLoading ? "-" : (stats?.restaurants || 0)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Dining</span>
          </button>
        </div>
      </div>

      {/* Markers List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {markersLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading journal...</p>
            </div>
          ) : filteredMarkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">No spots found</p>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the map to add your first memory.
              </p>
            </div>
          ) : (
            filteredMarkers.map((marker) => (
              <div 
                key={marker.id}
                className="group p-4 rounded-xl border border-border bg-background shadow-sm hover:border-ring/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif font-semibold text-foreground text-lg leading-tight">{marker.name}</h3>
                  <div className={cn(
                    "p-1.5 rounded-full",
                    marker.category === "winery" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {marker.category === "winery" ? <Wine className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                  </div>
                </div>
                {marker.note && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {marker.note}
                  </p>
                )}
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  Added {format(new Date(marker.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Instructions */}
      <div className="p-4 border-t border-border bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Click the map to add a new spot
        </p>
      </div>
    </div>
  );
}
