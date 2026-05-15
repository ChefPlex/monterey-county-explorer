import { db, markersTable } from "@workspace/db";
import { count, eq, inArray, sql } from "drizzle-orm";
import { logger } from "./lib/logger";

// Entries removed from the curated list — deleted from DB on every boot
const REMOVED_FROM_SEED: string[] = [
  "Gizdich Ranch",               // Santa Cruz County, not Monterey
  "Acme Artisan Cheese",         // Unverifiable — business does not appear to exist
  "The Fish Hopper",             // Tourist trap; note itself hedged
  "The Sardine Factory",         // Historical interest only; not a chef recommendation
  "Earthbound Farm Farm Stand",  // Corporate acquisition changed the experience significantly
  "Lucia Restaurant at Bernardus Lodge", // Redundant — already covered under Bernardus Winery
  "Cantinetta Luca",             // Website dead on all domains; likely permanently closed
  "Café Rustica",                // Website dead on all domains; likely permanently closed
  "Aubergine",                   // Reverted — name restored to "Aubergine at L'Auberge Carmel"
  "Mundaka",                     // Permanently closed
  "Holman Ranch Tavern",         // Permanently closed
  "Schoch Family Farmstead",     // Removed from curated list
  // Removed during May 2026 place-review session
  "Big Sur Bakery",                       // Permanently closed
  "Pacific Grove Certified Farmers Market", // Permanently closed
  "Boekenoogen Vineyard & Winery",        // Duplicate of McIntyre Vineyards
  "Hahn Family Wines",                    // Permanently closed
  "Joullian Vineyards",                   // Permanently closed
  "Paraiso Vineyards",                    // Permanently closed
  "Talbott Vineyards",                    // Permanently closed
  "Lady & Larder + Marmee's",             // Dropped from curated list
  "Carmel Valley Village Farmers Market", // Renamed to "Carmel Farmers Market at The Barnyard"
  "Carmel Valley Farmers Market",         // Renamed to "Carmel Farmers Market at The Barnyard"
  // Renamed during June 2026 audit
  "Carmel Valley Creamery Co.",     // Renamed to "Carmel Valley Creamery"
  "Alvarado Street Brewery",        // Renamed to "Alvarado Street Brewery & Grill"
  "Wild Plum Cafe & Bakery",        // Renamed to "The Wild Plum Cafe"
  "Happy Girl Kitchen",             // Renamed to "Happy Girl Kitchen Co."
  "Carmel Farmers Market",          // Renamed to "Carmel Farmers Market at The Barnyard"
  "Monterey Bay Certified Farmers Market — Monterey", // Renamed to "Monterey Farmers Market at Del Monte Shopping Center"
  "The Stationaery",                // Renamed to "Stationaery"
  "Phil's Fish Market",             // Renamed to "Phil's Fish Market & Eatery"
  "Alta Monterey",                  // Renamed to "Alta Bakery & Cella Restaurant"
  "Montrio Bistro",                 // Renamed to "Montrio"
  "Jeninni Kitchen + Wine Bar",     // Replaced by "Spotted Duck Restaurant"
  "Morgan Winery",                  // Renamed to "Taste Morgan"
  "Wrath Winery",                   // Renamed to "Wrath Wines"
  "Scheid Family Wines",            // Renamed to "Scheid Vineyards Estate Winery"
];

const SEED_DATA = [
  // ── WINERIES: CARMEL VALLEY ────────────────────────────────────────────────
  {
    name: "Rombi Wines",
    city: "Carmel Valley",
    note: "Tiny Carmel Valley Village tasting room at 1 Center St for Salvatore Rombi's limited-production reds. The estate is small, the wines are direct-to-consumer, and weekend tastings often mean talking through Cabernet, Merlot, Petite Sirah, and Petit Verdot with the people closest to the vines and barrels. Saturday–Sunday noon to 5pm; weekday tastings by appointment.",
    category: "winery",
    lat: 36.4787585,
    lng: -121.7315368,
    website: "https://rombiwines.com",
  },
  {
    name: "Corral Wine Co.",
    city: "Carmel Valley",
    note: "Family-owned Corral Wine Co. tasting room at 19 E. Carmel Valley Rd., Suite A. A Bell Family Vineyards project with estate fruit from Corral de Tierra / Pastures of Heaven and Monterey AVA sources, started from a barn-barreled estate Pinot Noir in 2017 and now pouring an unfussy Central Coast range in the Village.",
    category: "winery",
    lat: 36.4781314,
    lng: -121.7299498,
    website: "https://www.corralwine.com",
  },
  {
    name: "Bernardus Winery",
    city: "Carmel Valley",
    note: "Flagship Carmel Valley producer with the Village tasting room at 5 W. Carmel Valley Road. Bernardus is still the Marinus Bordeaux-blend reference point for the appellation, but Lucia Restaurant is at Bernardus Lodge down the valley, not on the tasting-room property. Treat this as a winery stop first; make separate plans for the lodge restaurant.",
    category: "winery",
    lat: 36.4791983,
    lng: -121.7304897,
    website: "https://bernardus.com",
  },
  {
    name: "Folktale Winery",
    city: "Carmel Valley",
    note: "Hospitality standout on 15 acres of sustainably farmed vineyards and gardens along the Carmel River. Daily tastings, food, weekend live music, larger events, and a setting that works for people who want wine without the stiff tasting-room ritual. One of the easiest Carmel Valley stops to turn into an afternoon.",
    category: "winery",
    lat: 36.5287459,
    lng: -121.8202824,
    website: "https://folktalewinery.com",
  },
  {
    name: "Wrath Wines",
    city: "Carmel",
    note: "Carmel Plaza tasting room for Wrath's small-production, site-driven Pinot Noir, Chardonnay, Syrah, and Sauvignon Blanc from its estate vineyard and selected Santa Lucia Highlands sites. Open daily in downtown Carmel; the wines are serious, coastal, and built around vineyard character rather than tasting-room flash.",
    category: "winery",
    lat: 36.5541839,
    lng: -121.9203484,
    website: "https://wrathwines.com",
  },
  {
    name: "Taste Morgan",
    city: "Carmel",
    note: "Taste Morgan is Morgan Winery's Crossroads Carmel tasting room at 204 Crossroads Blvd. Dan Lee and the Morgan label are Santa Lucia Highlands originals, with Double L Vineyard Pinot Noir and Chardonnay as reference points. Open daily; walk-ins are typically welcome.",
    category: "winery",
    lat: 36.5368831,
    lng: -121.9091034,
    website: "https://morganwinery.com",
  },
  {
    name: "Holman Ranch",
    city: "Carmel Valley",
    note: "Historic Holman Ranch tasting room is in Carmel Valley Village at 18 W. Carmel Valley Road; the private estate and winery at 60 Holman Road are by appointment. Estate-grown Pinot Noir and Chardonnay are the focus, with ranch tours and cave/hacienda experiences available when booked separately.",
    category: "winery",
    lat: 36.479208,
    lng: -121.7317402,
    website: "https://holmanranch.com",
  },
  {
    name: "Chesebro Wines",
    city: "Carmel Valley",
    note: "Small, family-owned Carmel Valley Village winery with a casual tasting room and estate-grown wines from Carmel Valley and Arroyo Seco vineyards. The strength is personal, unpretentious pouring — often by people close to the farming and cellar work — rather than resort-style theater.",
    category: "winery",
    lat: 36.4777954,
    lng: -121.7291107,
    website: "https://chesebrowines.com",
  },

  // ── WINERIES: CHALONE AVA ────────────────────────────────────────────────────
  {
    name: "Chalone Vineyard",
    city: "Carmel",
    note: "Historic Chalone estate fruit, tasted from the Carmel Plaza room at Ocean and Mission. The vineyard near Pinnacles is Monterey County's oldest producing vineyard, planted in 1919, with limestone and calcium-rich soils that give Chardonnay, Pinot Noir, Chenin Blanc, and Pinot Blanc a distinctive mineral profile. The remote estate remains the story; Carmel is the visitor door.",
    category: "winery",
    lat: 36.554492,
    lng: -121.9206403,
    website: "https://chalonevineyard.com",
  },

  // ── WINERIES: SANTA LUCIA HIGHLANDS ────────────────────────────────────────
  {
    name: "Scheid Vineyards Estate Winery",
    city: "Greenfield",
    note: "Greenfield estate winery and tasting room just off Highway 101 at 1972 Hobson Ave, with vineyard views, outdoor deck, demonstration vineyard, and bocce. Scheid Family Wines farms thousands of sustainable estate acres across a 70-mile span of the Salinas Valley and is a useful stop for understanding Monterey at grower scale.",
    category: "winery",
    lat: 36.4251448,
    lng: -121.3067767,
    website: "https://www.scheidvineyards.com",
  },
  {
    name: "Pessagno Winery",
    city: "Salinas",
    note: "River Road tasting room at 1645 River Road, Salinas, pouring limited-production wines from prestigious single vineyards in Monterey and San Benito Counties. Current public hours are generally Thursday through Monday, noon to 5pm; closed Tuesday and Wednesday. A focused stop if you're already driving the River Road corridor.",
    category: "winery",
    lat: 36.4808488,
    lng: -121.4842889,
    website: "https://pessagnowines.com",
  },

  // ── WINERIES: CARMEL (TASTING ROOMS) ───────────────────────────────────────
  {
    name: "Silvestri Vineyards",
    city: "Carmel",
    note: "Carmel-by-the-Sea tasting room for Alan Silvestri's Carmel Valley estate vineyard. The range is unusually broad for Monterey — Chardonnay, Pinot Noir, Syrah, Barbera, Pinot Blanc, Pinot Gris, and Cabernet Sauvignon — with the full lineup poured in a polished downtown Carmel room.",
    category: "winery",
    lat: 36.5538716,
    lng: -121.9223211,
    website: "https://silvestrivineyards.com",
  },
  {
    name: "McIntyre Vineyards",
    city: "Carmel Valley",
    note: "Carmel Valley Village tasting room for one of the Santa Lucia Highlands' most authoritative growers. McIntyre's 80-acre estate was first planted in 1973 and includes some of the Highlands' oldest Pinot Noir and Chardonnay vines; the Village room at 24 W. Carmel Valley Rd makes those wines accessible without driving River Road.",
    category: "winery",
    lat: 36.4794409,
    lng: -121.7322583,
    website: "https://mcintyrevineyards.com",
  },
  {
    name: "Caraccioli Cellars",
    city: "Carmel",
    note: "Family-run Carmel-by-the-Sea tasting room making one of Monterey County's strongest sparkling-wine arguments. Estate Escolle Vineyard fruit from the Santa Lucia Highlands, Brut Cuvee and Brut Rose as benchmarks, and a methode champenoise program shaped by the late Michel Salgues of Roederer Estate.",
    category: "winery",
    lat: 36.5547022,
    lng: -121.9225815,
    website: "https://caracciolicellars.com",
  },
  {
    name: "Albatross Ridge",
    city: "Carmel",
    note: "Downtown Carmel tasting room for a Carmel Valley estate perched about seven miles from the Pacific. The vineyard sits around 1,250 feet, not 2,200, and focuses on estate Pinot Noir and Chardonnay shaped by coastal wind, diatomaceous soils, and low-yield mountain farming.",
    category: "winery",
    lat: 36.5552906,
    lng: -121.9225955,
    website: "https://albatrossridge.com",
  },
  {
    name: "De Tierra Vineyards",
    city: "Carmel",
    note: "Carmel-by-the-Sea tasting room in a cottage about a block and a half off Ocean Avenue, not the Crossroads. De Tierra pours a broad Monterey County portfolio — Russell Vineyard, single-varietal wines, blends, sparkling, dessert wines — and offers locally sourced small bites in one of Carmel's larger tasting-room spaces.",
    category: "winery",
    lat: 36.556637,
    lng: -121.9208573,
    website: "https://detierra.com",
  },
  {
    name: "A Taste of Monterey",
    city: "Monterey",
    note: "Cannery Row wine bar, market, and bistro with bay-facing windows one block from the Aquarium. Now showcases 95-plus Monterey County wineries and 100-plus wines, with flights, by-the-glass pours, retail bottles, small plates, and maps for building a wider wine-country plan.",
    category: "winery",
    lat: 36.6166986,
    lng: -121.8997165,
    website: "https://atasteofmonterey.com",
  },

  // ── RESTAURANTS ─────────────────────────────────────────────────────────────
  {
    name: "Nepenthe",
    city: "Big Sur",
    note: "The classic Big Sur terrace restaurant, about 800 feet above the Pacific at 48510 Highway 1. Opened in 1949 and still built around the Ambrosia Burger, long views, Cafe Kevah, and the Phoenix Shop. Go earlier in the day if you want the best odds of clear coastline before fog moves in.",
    category: "restaurant",
    lat: 36.2218365,
    lng: -121.7592895,
    website: "https://www.phoenixshopbigsur.com",
  },
  {
    name: "Aubergine at L'Auberge Carmel",
    city: "Carmel",
    note: "Two-Michelin-starred tasting-menu restaurant inside L'Auberge Carmel. Chef Justin Cogley's precise, seasonal cooking makes Aubergine the Peninsula's most serious fine-dining room; the experience is polished, intimate, and priced accordingly. Book well ahead and come hungry.",
    category: "restaurant",
    lat: 36.5541304,
    lng: -121.9242179,
    website: "https://auberginecarmel.com",
  },
  {
    name: "Passionfish",
    city: "Pacific Grove",
    note: "Long-running Pacific Grove sustainable-seafood restaurant at 701 Lighthouse Ave, built by founders Ted and Cindy Walter around realistic wine pricing and ocean-conscious sourcing. Now carried forward by Meral Alpay and Berk Guvenc, it remains the Peninsula's benchmark for well-priced bottles and purpose-driven seafood.",
    category: "restaurant",
    lat: 36.6223375,
    lng: -121.9209735,
    website: "https://passionfish.net",
  },
  {
    name: "Cultura Comida y Bebida",
    city: "Carmel",
    note: "Oaxacan-rooted Carmel restaurant in Su Vecino Court. The food and beverage program is scratch-made, local-ingredient driven, and built around the culture of Oaxaca — moles, mezcal, masa, and seasonal Monterey County produce rather than generic resort-town Mexican food.",
    category: "restaurant",
    lat: 36.5559907,
    lng: -121.923069,
    website: "https://culturacarmel.com",
  },
  {
    name: "Alta Bakery & Cella Restaurant",
    city: "Monterey",
    note: "Alta Bakery and Cella share the Historic Cooper-Molera Adobe at 502 Munras Ave. Ben Spungin's daytime bakery/cafe brings breads, pastries, coffee, sandwiches, soups, salads, and garden seating; Cella carries the property into a seasonal Central Coast dinner/bar program with Cal Stamenov also part of the kitchen.",
    category: "restaurant",
    lat: 36.5976296,
    lng: -121.8949869,
    website: "https://www.altamonterey.com",
  },
  {
    name: "Tarpy's Roadhouse",
    city: "Monterey",
    note: "Historic roadhouse steakhouse on Highway 68 at 2999 Monterey-Salinas Hwy. Rustic stone, garden patios, steaks, seafood, ribs, and generous comfort food rather than tiny-plate performance. It remains one of the Peninsula's most reliable group-dinner and special-occasion rooms.",
    category: "restaurant",
    lat: 36.5822807,
    lng: -121.8303061,
    website: "https://tarpys.com",
  },
  {
    name: "Wild Fish",
    city: "Pacific Grove",
    note: "Pacific Grove seafood restaurant at 545 Lighthouse Ave focused on locally caught sustainable seafood and organic produce. The menu shifts with what suppliers and fishermen bring in, and the room stays small enough that reservations matter. A direct, low-flash counterpoint to the Peninsula's more polished seafood rooms.",
    category: "restaurant",
    lat: 36.6204974,
    lng: -121.9170213,
    website: "https://wild-fish.com",
  },
  {
    name: "Montrio",
    city: "Monterey",
    note: "Downtown Monterey restaurant in the city's 1910 first firehouse. Michelin-recognized without tasting-menu formality: sustainably minded seafood, local farm produce, prime meats, European-American comfort, and a broad wine/cocktail program. A reliable reservation before or after an Alvarado Street walk.",
    category: "restaurant",
    lat: 36.599774,
    lng: -121.8953841,
    website: "https://montrio.com",
  },
  {
    name: "Il Tegamino",
    city: "Carmel",
    note: "Hidden Italian comfort-food restaurant in the Court of the Golden Bough, tucked behind Cottage of Sweets on Ocean Avenue between Lincoln and Monte Verde. Giuseppe and Colleen Panzuto's small family-run room is not visible from the street, which is part of why it still feels like a local find.",
    category: "restaurant",
    lat: 36.5547562,
    lng: -121.9240766,
    website: "https://iltegaminocarmel.com",
  },
  {
    name: "Solstice at The Village Big Sur",
    city: "Big Sur",
    note: "Solstice is the wood-hearth restaurant inside The Village Big Sur at 46840 Highway 1. Chef Tim Eelman's menu leans live-fire California: hyper-local produce, sustainably sourced Monterey Bay seafood, smoke, coals, and a wine list built around organic, biodynamic, and sustainably farmed producers. Dinner Wednesday through Sunday.",
    category: "restaurant",
    lat: 36.2697663,
    lng: -121.8079048,
    website: "https://www.thevillagebigsur.com/solstice",
  },
  {
    name: "Phil's Fish Market & Eatery",
    city: "Castroville",
    note: "Phil DiGirolamo's cioppino institution, now at 10700 Merritt Street in Castroville after the move from Moss Landing. The eatery and fish market still revolve around cioppino, chowder, fried seafood, and direct retail; the new address puts it squarely in artichoke country rather than on the harbor.",
    category: "restaurant",
    lat: 36.7657319,
    lng: -121.7583329,
    website: "https://philsfishmarket.com",
  },
  {
    name: "Sierra Mar at Post Ranch Inn",
    city: "Big Sur",
    note: "Sierra Mar is the dramatic dining room at Post Ranch Inn, high on the Big Sur cliffs with floor-to-ceiling Pacific views. The current public-facing experience is farm-driven coastal California cooking, prix fixe lunch and dinner, and a Wine Spectator Grand Award list. Reserve ahead; availability for nonguests is limited.",
    category: "restaurant",
    lat: 36.2298911,
    lng: -121.7651322,
    website: "https://postranchinn.com/dining",
  },
  {
    name: "Chez Noir",
    city: "Carmel",
    note: "One-Michelin-starred Carmel-by-the-Sea restaurant from Jonny and Monique Black. Coastal California cooking with a seafood spine, serious sourcing from the Monterey Peninsula, and a Central Coast-aware wine program. It still feels like a neighborhood house rather than a trophy room, which is the point.",
    category: "restaurant",
    lat: 36.5569346,
    lng: -121.9223308,
    website: "https://cheznoircarmel.com",
  },
  {
    name: "Spotted Duck Restaurant",
    city: "Pacific Grove",
    note: "Former Jeninni Kitchen + Wine Bar space at 542 Lighthouse Ave, now Spotted Duck. Chef-owner Jerry Regester runs a seasonal brasserie/bistro menu in the Historic Holman Building, with local produce, duck, seafood, and a compact dinner schedule. A current Pacific Grove dinner pick rather than the old Jeninni wine-bar identity.",
    category: "restaurant",
    lat: 36.6208136,
    lng: -121.916751,
    website: "https://www.spottedduckpg.com",
  },
  {
    name: "Stationaery",
    city: "Carmel",
    note: "Neighborhood restaurant in San Carlos Square, run by Anthony and Alissa Carnazzo with chef Amalia Scatena leading the kitchen. Breakfast/lunch, a take-away window, natural wines, and dinner service later in the week; the cooking pulls heavily from Monterey and Santa Cruz County farms and ranches. Coffee, bottles, and beach-bound provisions make it more useful than a standard brunch room.",
    category: "restaurant",
    lat: 36.5561884,
    lng: -121.9214131,
    website: "https://thestationaery.com",
  },
  {
    name: "Deetjen's Big Sur Inn",
    city: "Big Sur",
    note: "Historic Big Sur inn and restaurant in a 1930s Norwegian homestead setting: fireplaces, candlelight, wood, and creekside atmosphere instead of cliff-view spectacle. Breakfast is served daily; dinner currently runs Friday through Tuesday and reservations matter. The anti-gloss Big Sur meal, in the best sense.",
    category: "restaurant",
    lat: 36.2174402,
    lng: -121.7508705,
    website: "https://www.deetjens.org",
  },

  // ── FARM STANDS & MARKETS ─────────────────────────────────────────────────
  {
    name: "Monterey Farmers Market at Del Monte Shopping Center",
    city: "Monterey",
    note: "Year-round Monterey Bay Certified Farmers Market in the rear parking lot behind California Pizza Kitchen at Del Monte Shopping Center. Fridays 8am to noon, rain or shine, with California-grown produce, artisan products, flowers, and plants. This is not the Tuesday Old Monterey Marketplace on Alvarado Street.",
    category: "farmstand",
    lat: 36.5836894,
    lng: -121.8937543,
    website: "https://montereybayfarmers.org/our-markets",
  },
  {
    name: "Carmel Farmers Market at The Barnyard",
    city: "Carmel",
    note: "Seasonal Monterey Bay Certified Farmers Market at The Barnyard Shopping Village, Highway 1 and Carmel Valley Road. More than 25 farmers and specialty-food vendors, Tuesday 9am to 1pm, May through September, rain or shine.",
    category: "farmstand",
    lat: 36.5407246,
    lng: -121.9075407,
    website: "https://montereybayfarmers.org/carmel-farmers-market",
  },
  {
    name: "Pezzini Farms",
    city: "Castroville",
    note: "Castroville artichoke institution at 460 Nashua Road. Pezzini has grown heirloom Green Globe artichokes for decades and runs a year-round roadside market with fresh artichokes, produce, artichoke foods, and cooking advice from people who actually know the crop.",
    category: "farmstand",
    lat: 36.74293,
    lng: -121.768829,
    website: "https://pezzinifarms.com",
  },

  // ── ARTISAN PRODUCERS ─────────────────────────────────────────────────────
  {
    name: "Ad Astra Bread Co.",
    city: "Monterey",
    note: "Serious artisan bread on Alvarado Street in downtown Monterey. Open daily 7am to 4pm, with sourdough loaves, pastries, coffee drinks, and baking classes from a focused bakery that takes the craft seriously. The name means 'to the stars.' At 479 Alvarado St.",
    category: "artisan",
    lat: 36.5981886,
    lng: -121.8946152,
    website: "https://www.adastrabread.com",
  },
  {
    name: "Carmel Valley Creamery",
    city: "Carmel Valley",
    note: "Micro-creamery, coffee shop, and mini epicerie in the historic Village community center at 1 Esquiline Road. Cheesemaker Sophie Hauville's operation makes artisan cheese on site, with coffee, pastries, ice cream, and a patio that fits the slow-food character of Carmel Valley.",
    category: "artisan",
    lat: 36.4735539,
    lng: -121.7280782,
    website: "https://www.carmelvalleycreameryco.com",
  },
  {
    name: "Carmel Valley Coffee Roasting Co.",
    city: "Carmel",
    note: "Local organic coffee roaster founded in 1994 with three Carmel locations; this pin is the Ocean Avenue cafe between Lincoln and Monte Verde. Small-batch beans, espresso drinks, sandwiches, and an easy sidewalk stop before wandering Carmel-by-the-Sea.",
    category: "artisan",
    lat: 36.5549331,
    lng: -121.9237493,
    website: "https://carmelcoffeeroasters.com",
  },
  {
    name: "Monterey Abalone Company",
    city: "Monterey",
    note: "In-ocean abalone farm at 160 Municipal Wharf #2. Art Seavey and Trevor Fay cultivate California red abalone in cages suspended beneath Monterey's commercial wharf, using the bay itself rather than land tanks. Call ahead for tours or direct purchases; operating hours can shift with harvest and holidays.",
    category: "artisan",
    lat: 36.6050598,
    lng: -121.889421,
    website: "https://montereyabalone.com",
  },
  {
    name: "Parker-Lusseau Pastries",
    city: "Monterey",
    note: "Historic Fremont Adobe bakery/cafe at 539 Hartnell St. Parker-Lusseau remains the Peninsula's French pastry benchmark: croissants, cakes, tarts, breads, quiche, sandwiches, and coffee made with the discipline that keeps local regulars showing up early. Open Monday–Saturday; closed Sunday.",
    category: "artisan",
    lat: 36.5961403,
    lng: -121.8955473,
    website: "https://parkerlusseau.com",
  },
  {
    name: "Happy Girl Kitchen Co.",
    city: "Pacific Grove",
    note: "Fermentation studio, cannery, and cafe at 173 Central Ave. Small-batch preserves, pickles, kimchi, fermented vegetables, and pantry goods made from farm-driven ingredients, plus whole-food breakfast and lunch and recurring workshops for people who want to learn the craft.",
    category: "artisan",
    lat: 36.6185417,
    lng: -121.9065222,
    website: "https://happygirlkitchen.com",
  },
  {
    name: "Alvarado Street Brewery & Grill",
    city: "Monterey",
    note: "Downtown Monterey's anchor craft brewery at 426 Alvarado St. The kitchen leans locally sourced and the beer program is still hop-forward — West Coast IPAs are the calling card — but the lagers, Belgian-inspired beers, and experimental batches give it more range than a simple brewpub stop.",
    category: "artisan",
    lat: 36.5993012,
    lng: -121.894812,
    website: "https://asb.beer",
  },
  {
    name: "The Wild Plum Cafe",
    city: "Monterey",
    note: "Organic, sustainable cafe and bakery at 731 Munras Ave, Suite B. Not a vegetarian-only spot: the draw is house-baked bread, breakfast and lunch plates, sandwiches, salads, pastries, and a full espresso bar rooted in local, handcrafted ingredients.",
    category: "artisan",
    lat: 36.5948644,
    lng: -121.8930916,
    website: "https://www.thewildplumcafe.com",
  },
];

export async function seedIfEmpty() {
  try {
    // 1. Purge any entries that have been removed from the curated list
    if (REMOVED_FROM_SEED.length > 0) {
      const deleted = await db
        .delete(markersTable)
        .where(inArray(markersTable.name, REMOVED_FROM_SEED))
        .returning({ name: markersTable.name });
      if (deleted.length > 0) {
        logger.info({ removed: deleted.map((d) => d.name) }, "Removed deprecated markers");
      }
    }

    // 2. Sync all seed entries — update existing rows, insert missing ones
    const existing = await db
      .select({ name: markersTable.name })
      .from(markersTable);
    const existingNames = new Set(existing.map((r) => r.name));

    const toUpdate = SEED_DATA.filter((entry) => existingNames.has(entry.name));
    const toInsert = SEED_DATA.filter((entry) => !existingNames.has(entry.name));

    // Update every existing marker from seed (syncs coords, city, note, website on every boot)
    for (const entry of toUpdate) {
      await db
        .update(markersTable)
        .set({
          lat: String(entry.lat),
          lng: String(entry.lng),
          city: entry.city,
          note: entry.note ?? null,
          website: entry.website ?? null,
        })
        .where(eq(markersTable.name, entry.name));
    }
    if (toUpdate.length > 0) {
      logger.info({ count: toUpdate.length }, "Synced seed data to existing markers");
    }

    // Insert any markers not yet in the DB
    if (toInsert.length > 0) {
      const inserted = await db
        .insert(markersTable)
        .values(
          toInsert.map((entry) => ({
            name: entry.name,
            city: entry.city,
            note: entry.note ?? null,
            category: entry.category as "winery" | "restaurant" | "farmstand" | "artisan",
            lat: String(entry.lat),
            lng: String(entry.lng),
            website: entry.website ?? null,
          }))
        )
        .returning({ id: markersTable.id, name: markersTable.name });
      logger.info({ count: inserted.length, names: inserted.map((r) => r.name) }, "New seed markers inserted");
    } else {
      logger.info("All seed markers already present — nothing to insert");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
