import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetMarkers, useGetMarkerStats } from "@workspace/api-client-react";
import type { Marker } from "@workspace/api-client-react";

type FilterType = "all" | "winery" | "restaurant" | "farmstand";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const FILTERS: { key: FilterType; label: string; icon: IoniconsName }[] = [
  { key: "all", label: "All", icon: "map-outline" },
  { key: "winery", label: "Wineries", icon: "wine-outline" },
  { key: "restaurant", label: "Dining", icon: "restaurant-outline" },
  { key: "farmstand", label: "Farms", icon: "leaf-outline" },
];

// Regional latitude boundaries
// North  ≥ 38.55:  Healdsburg, Alexander Valley, Geyserville, Dry Creek, Cloverdale
// Central 38.35–38.55: Santa Rosa, Sebastopol, Russian River Valley, West County, Windsor, Glen Ellen
// Southern < 38.35: Sonoma town, Petaluma, Carneros, Coast, Point Reyes
const REGIONS = [
  { key: "north", label: "North Sonoma" },
  { key: "central", label: "Central Sonoma" },
  { key: "south", label: "Southern Sonoma" },
] as const;

type RegionKey = typeof REGIONS[number]["key"];

function getRegion(lat: number): RegionKey {
  if (lat >= 38.55) return "north";
  if (lat >= 38.35) return "central";
  return "south";
}

function getCategoryColor(category: string, colors: ReturnType<typeof useColors>) {
  if (category === "winery") return colors.wineRed;
  if (category === "restaurant") return colors.accent;
  return colors.farmGreen;
}

function getCategoryBg(category: string, colors: ReturnType<typeof useColors>) {
  if (category === "winery") return colors.wineRedLight;
  if (category === "restaurant") return colors.goldLight;
  return colors.farmGreenLight;
}

function getCategoryLabel(category: string) {
  if (category === "winery") return "Winery";
  if (category === "restaurant") return "Dining";
  if (category === "farmstand") return "Farm";
  return category;
}

const CATEGORY_ICON_MAP: Record<string, IoniconsName> = {
  winery: "wine",
  restaurant: "restaurant",
  farmstand: "leaf",
};

function getCategoryIcon(category: string): IoniconsName {
  return CATEGORY_ICON_MAP[category] ?? "location";
}

function SpotRow({ item }: { item: Marker }) {
  const colors = useColors();
  const catColor = getCategoryColor(item.category, colors);
  const catBg = getCategoryBg(item.category, colors);
  const catLabel = getCategoryLabel(item.category);
  const catIcon = getCategoryIcon(item.category);

  return (
    <View style={[styles.spotRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.spotIcon, { backgroundColor: catBg }]}>
        <Ionicons name={catIcon} size={18} color={catColor} />
      </View>
      <View style={styles.spotInfo}>
        <Text style={[styles.spotName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? (
          <Text style={[styles.spotNote, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.note}
          </Text>
        ) : null}
      </View>
      <View style={[styles.catBadge, { backgroundColor: catBg }]}>
        <Text style={[styles.catBadgeText, { color: catColor }]}>{catLabel}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, count, colors }: { title: string; count: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionCount, { backgroundColor: colors.muted }]}>
        <Text style={[styles.sectionCountText, { color: colors.mutedForeground }]}>{count}</Text>
      </View>
    </View>
  );
}

interface ScrollableFiltersProps {
  filters: { key: FilterType; label: string; icon: IoniconsName }[];
  activeFilter: FilterType;
  onSelect: (f: FilterType) => void;
  getCount: (f: FilterType) => number;
  colors: ReturnType<typeof useColors>;
}

function ScrollableFilters({ filters, activeFilter, onSelect, getCount, colors }: ScrollableFiltersProps) {
  return (
    <View style={styles.filtersRow}>
      {filters.map((f) => {
        const active = f.key === activeFilter;
        const cnt = getCount(f.key);
        return (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: active ? colors.primary : colors.background,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(f.key)}
            testID={`filter-${f.key}`}
          >
            <Ionicons
              name={f.icon}
              size={14}
              color={active ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text style={[styles.filterLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
              {f.label}
            </Text>
            {cnt > 0 && (
              <View style={[styles.filterCount, { backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.muted }]}>
                <Text style={[styles.filterCountText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                  {cnt}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: markers = [], isLoading } = useGetMarkers();
  const { data: stats } = useGetMarkerStats();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : insets.bottom;

  const getCount = (filter: FilterType) => {
    if (!stats) return 0;
    if (filter === "all") return stats.total;
    if (filter === "winery") return stats.wineries;
    if (filter === "restaurant") return stats.restaurants;
    if (filter === "farmstand") return stats.farmstands;
    return 0;
  };

  const sections = useMemo(() => {
    const filtered = activeFilter === "all"
      ? markers
      : markers.filter((m) => m.category === activeFilter);

    const byRegion: Record<RegionKey, Marker[]> = { north: [], central: [], south: [] };
    for (const m of filtered) {
      byRegion[getRegion(m.lat)].push(m);
    }

    return REGIONS
      .map((r) => ({
        key: r.key,
        title: r.label,
        data: byRegion[r.key].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((s) => s.data.length > 0);
  }, [markers, activeFilter]);

  const totalVisible = sections.reduce((sum, s) => sum + s.data.length, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="journal-screen">
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Journal</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          The places worth knowing
        </Text>

        <ScrollableFilters
          filters={FILTERS}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          getCount={getCount}
          colors={colors}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading journal…</Text>
        </View>
      ) : totalVisible === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={40} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No spots yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Long press the map to add your first spot
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <SpotRow item={item} />}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              count={section.data.length}
              colors={colors}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomInset + 16 },
          ]}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          testID="journal-list"
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sectionCountText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  spotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  spotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  spotInfo: {
    flex: 1,
    gap: 4,
  },
  spotName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  spotNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  catBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
