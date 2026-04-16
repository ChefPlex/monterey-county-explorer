import { db, markersTable } from "@workspace/db";
import { count, eq, inArray, sql } from "drizzle-orm";
import { logger } from "./lib/logger";

// Entries removed from the curated list — deleted from DB on every boot
const REMOVED_FROM_SEED: string[] = [];

const SEED_DATA = [
  // ── WINERIES: CARMEL VALLEY ────────────────────────────────────────────────
  {
    name: "Bernardus Winery",
    city: "Carmel Valley",
    note: "The flagship Carmel Valley estate. Winemaker Dean DeKorth's Marinus Bordeaux blend is the benchmark for the appellation — structured, age-worthy, and genuinely Carmel Valley in character. On-property restaurant with Cal Stamenov in the kitchen makes this a full culinary destination. Appointment tastings available in the vineyard cave.",
    category: "winery",
    lat: 36.4734,
    lng: -121.7296,
    website: "https://bernardus.com",
  },
  {
    name: "Folktale Winery",
    city: "Carmel Valley",
    note: "The hospitality standout in the valley. Live music weekends, a full food menu, and a portfolio ranging from sparkling to Pinot Noir. The grounds are stunning and the vibe is the opposite of stuffy. Great for an afternoon that turns into an evening.",
    category: "winery",
    lat: 36.5097,
    lng: -121.8160,
    website: "https://folktalewinery.com",
  },
  {
    name: "Wrath Winery",
    city: "Carmel Valley",
    note: "Focused, serious wines from Santa Lucia Highlands fruit. Michael Michaud built his career in the SLH — the Chardonnay and Pinot Noir here show what the appellation does better than anywhere in California. Quiet tasting room, knowledgeable pours. If you're serious about SLH, this is a required stop.",
    category: "winery",
    lat: 36.4810,
    lng: -121.7205,
    website: "https://wrathwines.com",
  },
  {
    name: "Morgan Winery",
    city: "Carmel Valley",
    note: "The original Santa Lucia Highlands champion. Dan Lee planted in the SLH before anyone else believed in it. The Double L Vineyard Pinot is the reference point for the appellation — bright, savory, and unmistakably coastal. Carmel Valley Village tasting room is an easy walk from the main strip.",
    category: "winery",
    lat: 36.4800,
    lng: -121.7210,
    website: "https://morganwinery.com",
  },
  {
    name: "Holman Ranch",
    city: "Carmel Valley",
    note: "400 acres of Carmel Valley hillside with a cave tasting room that earns the drive. Their Pinot Noir and Chardonnay from the estate vineyard show genuine SLH restraint. One of the most beautiful properties in the county — the setting alone justifies the appointment.",
    category: "winery",
    lat: 36.4895,
    lng: -121.7312,
    website: "https://holmanranch.com",
  },
  {
    name: "Chesebro Wines",
    city: "Carmel Valley",
    note: "Small-production, family-run, and poured by the people who made it. Chesebro sources from Carmel Valley vineyards and keeps the tasting room personal and unpretentious. The kind of stop that reminds you why wine country should feel like meeting someone, not touring an attraction.",
    category: "winery",
    lat: 36.4805,
    lng: -121.7197,
    website: "https://cheesebrewines.com",
  },
  {
    name: "Joullian Vineyards",
    city: "Carmel Valley",
    note: "Classic Carmel Valley stop, family-owned since the 1980s. Cabernet Sauvignon from the warm inland microclimate is genuinely good; the Riesling and Chardonnay from cooler blocks are underrated. Tasting room in the Village is low-key and friendly.",
    category: "winery",
    lat: 36.5080,
    lng: -121.8148,
    website: "https://joullian.com",
  },

  // ── WINERIES: SANTA LUCIA HIGHLANDS ────────────────────────────────────────
  {
    name: "Hahn Family Wines",
    city: "Soledad",
    note: "Estate winery in the heart of the Santa Lucia Highlands at 1,200 feet elevation. The cool marine-influenced climate produces Pinot Noir and Chardonnay with real texture and grip. The tasting room has sweeping views of the Salinas Valley floor and runs the full range from accessible to single-vineyard serious.",
    category: "winery",
    lat: 36.3961,
    lng: -121.3390,
    website: "https://hahnwinery.com",
  },
  {
    name: "Scheid Family Wines",
    city: "Greenfield",
    note: "One of the most respected growers in Monterey County — over 4,000 acres under vine in the Salinas Valley — now pouring their own label. The Greenfield tasting room is a no-fuss destination for understanding what the valley floor and hillside vineyards produce at different elevations and exposures.",
    category: "winery",
    lat: 36.3244,
    lng: -121.2455,
    website: "https://scheidvineyards.com",
  },

  // ── WINERIES: CARMEL (TASTING ROOMS) ───────────────────────────────────────
  {
    name: "Albatross Ridge",
    city: "Carmel",
    note: "Tasting room in Carmel village, estate vineyard high in the Santa Lucia Highlands at 2,200 feet — one of the highest in Monterey County. The elevation and marine influence produce Pinot Noir that is leaner and more savory than Sonoma Coast equivalents. Worth a stop if you're walking Carmel's tasting row.",
    category: "winery",
    lat: 36.5558,
    lng: -121.9234,
    website: "https://albatrossridge.com",
  },
  {
    name: "A Taste of Monterey",
    city: "Monterey",
    note: "The most efficient single stop for understanding Monterey wine without driving the appellation. Over 70 local wines available by the glass, flight, or bottle, plus retail. Cannery Row location has bay views. The staff knows the producers personally — ask what they're excited about.",
    category: "winery",
    lat: 36.6188,
    lng: -121.8948,
    website: "https://atasteofmonterey.com",
  },

  // ── RESTAURANTS ─────────────────────────────────────────────────────────────
  {
    name: "Nepenthe",
    city: "Big Sur",
    note: "The cathedral of Big Sur dining — terraced into the cliff at 808 feet with one of the great restaurant views in California. The Ambrosia burger has been feeding travelers since 1949 and hasn't been embarrassed by time. Arrive for lunch before the afternoon coast fog closes in. The phonix is the original structure. An institution, earned.",
    category: "restaurant",
    lat: 36.2541,
    lng: -121.8124,
    website: "https://nepenthebigsusr.com",
  },
  {
    name: "Aubergine at L'Auberge Carmel",
    city: "Carmel",
    note: "The best table on the Monterey Peninsula. Justin Cogley's seasonal tasting menu is among the most technically accomplished in Northern California — hyper-local, precise, and entirely worth the price. The bread service alone sets a standard. Book weeks ahead and come hungry.",
    category: "restaurant",
    lat: 36.5551,
    lng: -121.9231,
    website: "https://auberginecarmel.com",
  },
  {
    name: "Cantinetta Luca",
    city: "Carmel",
    note: "Reliable Italian in the village with genuinely good house-made pasta and a wine list weighted toward Monterey County producers. The charcuterie board is serious. If you're staying in Carmel and need a good dinner without a tasting menu investment, this is the answer.",
    category: "restaurant",
    lat: 36.5557,
    lng: -121.9241,
    website: "https://cantinettaluca.com",
  },
  {
    name: "Passionfish",
    city: "Pacific Grove",
    note: "The neighborhood restaurant Pacific Grove deserves and almost doesn't know it has. Ted Walter's wine list is famously well-priced — zero markup on most bottles is the stated goal — and the sustainable seafood is sourced with real intention. Book ahead. The regulars fill it.",
    category: "restaurant",
    lat: 36.6275,
    lng: -121.9170,
    website: "https://passionfish.net",
  },
  {
    name: "The Sardine Factory",
    city: "Monterey",
    note: "A Cannery Row institution since 1968. The Captain's Room is old-school California fine dining at its most theatrical — vaulted ceilings, full service, the works. The abalone bisque has been on the menu for decades for good reason. An important historical stop for understanding Monterey's dining history.",
    category: "restaurant",
    lat: 36.6197,
    lng: -121.8964,
    website: "https://sardinefactory.com",
  },
  {
    name: "Cultura Comida y Bebida",
    city: "Carmel",
    note: "The best argument that Carmel's restaurant scene is getting more interesting. Local sourcing, a Mexican-inflected menu built around what's in season in the Salinas Valley, and a natural wine list that would hold its own in San Francisco. Genuinely exciting cooking in a town not always known for it.",
    category: "restaurant",
    lat: 36.5557,
    lng: -121.9228,
    website: "https://culturacarmel.com",
  },
  {
    name: "Tarpy's Roadhouse",
    city: "Monterey",
    note: "The classic for a reason. Stone farmhouse building, wood-fired cooking, and a menu built for people who actually eat — not people performing a dining experience. The prime rib is a weekend ritual for half the Peninsula. Reliable, honest, and genuinely good.",
    category: "restaurant",
    lat: 36.6049,
    lng: -121.8615,
    website: "https://tarpys.com",
  },
  {
    name: "Café Rustica",
    city: "Carmel Valley",
    note: "The Carmel Valley Village gathering spot. Wood-fired pizzas, solid pasta, and a patio that captures everything right about warm Carmel Valley evenings. Unpretentious, consistent, and fills up with locals during the week — which tells you everything you need to know.",
    category: "restaurant",
    lat: 36.4804,
    lng: -121.7197,
    website: "https://caferusticacarmelvalley.com",
  },
  {
    name: "The Fish Hopper",
    city: "Monterey",
    note: "Cannery Row seafood with bay views. Not a destination in the Aubergine sense, but an honest, well-run seafood restaurant that does justice to the local catch. Good for Dungeness crab in season. The clam chowder is better than most on the Row.",
    category: "restaurant",
    lat: 36.6181,
    lng: -121.8971,
    website: "https://fishhopper.com",
  },
  {
    name: "Wild Fish",
    city: "Pacific Grove",
    note: "Small, focused, and genuinely committed to sustainable local seafood. Pacific Grove's quiet gem. The menu changes with what came off the boats. No swordfish, no farmed salmon — Wild Fish means it. Book ahead; it seats very few.",
    category: "restaurant",
    lat: 36.6261,
    lng: -121.9205,
    website: "https://wild-fish.com",
  },
  {
    name: "Sierra Mar at Post Ranch Inn",
    city: "Big Sur",
    note: "A 1,200-foot cliff perch with one of the most dramatic dining rooms in California. The cuisine leans organic and local; the wine list is genuinely exceptional. The price reflects the setting — but the setting is legitimately extraordinary. Lunch is more accessible than dinner. Reserve the moment you book lodging.",
    category: "restaurant",
    lat: 36.2366,
    lng: -121.8091,
    website: "https://postranchinn.com/dining",
  },

  // ── FARM STANDS & MARKETS ─────────────────────────────────────────────────
  {
    name: "Earthbound Farm Farm Stand",
    city: "Carmel Valley",
    note: "The farm that launched organic on a national scale — Earthbound Farm started as a 2.5-acre raspberry plot in Carmel Valley in 1984. The farm stand on Carmel Valley Road sells their full produce range alongside prepared foods, seasonal smoothies, and ready-to-eat bowls. Walk the certified organic demonstration garden while you're there. A piece of California food history.",
    category: "farmstand",
    lat: 36.5225,
    lng: -121.8680,
    website: "https://earthboundfarm.com",
  },
  {
    name: "Gizdich Ranch",
    city: "Watsonville",
    note: "Pick-your-own apples and olallieberries in the coastal foothills above Watsonville, operating since 1937. The ranch makes their own pies, juices, and preserves on-site using estate fruit. A genuine working farm in a county whose agricultural output most people never see. Seasonal operation — call ahead for pick-your-own availability.",
    category: "farmstand",
    lat: 36.9128,
    lng: -121.7706,
    website: "https://gizdich-ranch.com",
  },
  {
    name: "Monterey Bay Certified Farmers Market — Monterey",
    city: "Monterey",
    note: "The Monterey Peninsula's best weekly market, drawing farms from across the Salinas Valley floor and coastal hills. Castroville artichoke growers, Watsonville strawberry farms, coastal microgreens, and specialty produce direct from growers. Tuesday and Saturday in the Old Monterey Marketplace. The most direct connection to what's actually growing in the county right now.",
    category: "farmstand",
    lat: 36.6001,
    lng: -121.8932,
    website: "https://montereybayfarmers.org",
  },
  {
    name: "Carmel Valley Village Farmers Market",
    city: "Carmel Valley",
    note: "Small but honest weekly market in the Village. Local farms, backyard growers, valley honey, and seasonal vegetables. Worth pairing with a tasting room stop — it runs Sunday mornings in the Village.",
    category: "farmstand",
    lat: 36.4800,
    lng: -121.7202,
    website: "https://montereybayfarmers.org",
  },

  // ── ARTISAN PRODUCERS ─────────────────────────────────────────────────────
  {
    name: "Carmel Valley Coffee Roasting Co.",
    city: "Carmel Valley",
    note: "The Village coffee institution. Small-batch roasting, knowledgeable staff, and the kind of laid-back porch energy that makes Carmel Valley what it is. A proper stop before a morning of tasting rooms.",
    category: "producer",
    lat: 36.4797,
    lng: -121.7199,
    website: "https://carmelvalleycoffee.com",
  },
  {
    name: "The Big Sur Bakery",
    city: "Big Sur",
    note: "Wood-fired, focused, and genuinely beloved by the Big Sur community. Breakfast and lunch in a converted gas station with a bakery attached. The pastries come from a real oven using real flour, and the lunch menu follows the season. An honest, slow-food-without-the-label operation in one of the most expensive corridors of real estate in California.",
    category: "producer",
    lat: 36.2547,
    lng: -121.8025,
    website: "https://bigsurbakery.com",
  },
  {
    name: "Acme Artisan Cheese",
    city: "Monterey",
    note: "Local cheese board stop on the Peninsula — Monterey County Jack, aged varieties, and a rotating selection of California farmstead cheeses. Worth picking up before a picnic in Carmel Valley or a wine-with-cheese afternoon at a tasting room that allows outside food.",
    category: "producer",
    lat: 36.5990,
    lng: -121.8880,
    website: "https://acmecheese.com",
  },
];

export async function seedIfEmpty() {
  try {
    // Purge any entries that have been removed from the curated list
    if (REMOVED_FROM_SEED.length > 0) {
      const deleted = await db
        .delete(markersTable)
        .where(inArray(markersTable.name, REMOVED_FROM_SEED))
        .returning({ name: markersTable.name });
      if (deleted.length > 0) {
        logger.info({ removed: deleted.map((d) => d.name) }, "Removed deprecated markers");
      }
    }

    // Count existing markers — if any exist, skip seeding
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(markersTable);

    if (existingCount > 0) {
      logger.info({ count: existingCount }, "Markers table already populated — skipping seed");
      return;
    }

    // Insert Monterey seed data
    const inserted = await db
      .insert(markersTable)
      .values(
        SEED_DATA.map((entry) => ({
          name: entry.name,
          city: entry.city,
          note: entry.note ?? null,
          category: entry.category as "winery" | "restaurant" | "farmstand" | "producer",
          lat: String(entry.lat),
          lng: String(entry.lng),
          website: entry.website ?? null,
        }))
      )
      .returning({ id: markersTable.id, name: markersTable.name });

    logger.info({ count: inserted.length }, "Monterey seed data inserted");
  } catch (err) {
    logger.error({ err }, "Seed failed");
    throw err;
  }
}
