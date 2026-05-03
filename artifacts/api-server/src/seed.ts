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
  "Carmel Valley Creamery",      // Name superseded by verified entry "Carmel Valley Creamery Co."
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
  "Carmel Valley Village Farmers Market", // Renamed to "Carmel Farmers Market"
  "Carmel Valley Farmers Market",         // Renamed to "Carmel Farmers Market"
];

const SEED_DATA = [
  // ── WINERIES: CARMEL VALLEY ────────────────────────────────────────────────
  {
    name: "Bernardus Winery",
    city: "Carmel Valley",
    note: "The flagship Carmel Valley estate. Winemaker Dean DeKorth's Marinus Bordeaux blend is the benchmark for the appellation — structured, age-worthy, and genuinely Carmel Valley in character. The on-property Lucia restaurant with Cal Stamenov in the kitchen makes this a full culinary destination — dinner is among the most accomplished in the valley; lunch is equally worth it. Appointment tastings available in the vineyard cave.",
    category: "winery",
    lat: 36.4791983,
    lng: -121.7304897,
    website: "https://bernardus.com",
  },
  {
    name: "Folktale Winery",
    city: "Carmel Valley",
    note: "The hospitality standout in the valley. Live music weekends, a full food menu, and a portfolio ranging from sparkling to Pinot Noir. The grounds are stunning and the vibe is the opposite of stuffy. Great for an afternoon that turns into an evening.",
    category: "winery",
    lat: 36.5287459,
    lng: -121.8202824,
    website: "https://folktalewinery.com",
  },
  {
    name: "Wrath Winery",
    city: "Carmel Valley",
    note: "Focused, serious wines from Santa Lucia Highlands fruit. The Chardonnay and Pinot Noir here show what the SLH appellation does better than anywhere in California — bright acidity, savory structure, unmistakably coastal. Quiet tasting room, knowledgeable pours. If you're serious about SLH, this is a required stop.",
    category: "winery",
    lat: 36.5541839,
    lng: -121.9203484,
    website: "https://wrathwines.com",
  },
  {
    name: "Morgan Winery",
    city: "Carmel Valley",
    note: "The original Santa Lucia Highlands champion. Dan Lee planted in the SLH before anyone else believed in it. The Double L Vineyard Pinot is the reference point for the appellation — bright, savory, and unmistakably coastal. The Taste Morgan tasting room is in the Crossroads Shopping Center off Highway One — open daily 11–6, walk-ins welcome. The SLH provenance is the story; the address is just the door.",
    category: "winery",
    lat: 36.5368831,
    lng: -121.9091034,
    website: "https://morganwinery.com",
  },
  {
    name: "Holman Ranch",
    city: "Carmel Valley",
    note: "400 acres of Carmel Valley hillside with a cave tasting room that earns the drive. Their Pinot Noir and Chardonnay from the estate vineyard show genuine SLH restraint. One of the most beautiful properties in the county — the setting alone justifies the appointment.",
    category: "winery",
    lat: 36.479208,
    lng: -121.7317402,
    website: "https://holmanranch.com",
  },
  {
    name: "Chesebro Wines",
    city: "Carmel Valley",
    note: "Small-production, family-run, and poured by the people who made it. Chesebro sources from Carmel Valley vineyards and keeps the tasting room personal and unpretentious. The kind of stop that reminds you why wine country should feel like meeting someone, not touring an attraction.",
    category: "winery",
    lat: 36.4777954,
    lng: -121.7291107,
    website: "https://chesebrowines.com",
  },

  // ── WINERIES: CHALONE AVA ────────────────────────────────────────────────────
  {
    name: "Chalone Vineyard",
    city: "Carmel",
    note: "California's most isolated wine estate — 1,300 feet up in the Gavilan Range on alkaline limestone, surrounded by Pinnacles National Monument. Planted 1919. The Chalone AVA has no other members. Chenin Blanc, Pinot Blanc, and Pinot Noir from these soils produce a genuinely unusual mineral profile — austere, slow to open, unlike anything in the Salinas Valley below. The geology here is the story.",
    category: "winery",
    lat: 36.554492,
    lng: -121.9206403,
    website: "https://chalonevineyard.com",
  },

  // ── WINERIES: SANTA LUCIA HIGHLANDS ────────────────────────────────────────
  {
    name: "Scheid Family Wines",
    city: "Greenfield",
    note: "One of the most respected growers in Monterey County — over 4,000 acres under vine in the Salinas Valley — now pouring their own label. The Greenfield tasting room is a no-fuss destination for understanding what the valley floor and hillside vineyards produce at different elevations and exposures.",
    category: "winery",
    lat: 36.4251448,
    lng: -121.3067767,
    website: "https://scheidvineyards.com",
  },

  {
    name: "Pessagno Winery",
    city: "Salinas",
    note: "High-elevation Santa Lucia Highlands estate on River Road, focused on single-vineyard bottlings from SLH and Arroyo Seco fruit. The Pinot Noir and Chardonnay here show the cooler, more maritime character of the northern SLH blocks. A smaller, more focused operation than Hahn — worth the drive if you're already in the corridor.",
    category: "winery",
    lat: 36.4808488,
    lng: -121.4842889,
    website: "https://pessagnowines.com",
  },

  // ── WINERIES: CARMEL VALLEY (ADDITIONAL) ─────────────────────────────────
  {
    name: "Silvestri Vineyards",
    city: "Carmel Valley",
    note: "Estate vineyard in Carmel Valley, tasting room in downtown Carmel-by-the-Sea. The Silvestri family planted Italian varieties — Sangiovese, Barbera, Syrah — alongside Pinot Noir, Chardonnay, Pinot Blanc, and Pinot Gris, a portfolio that is genuinely unusual for Monterey County. The beautifully appointed Carmel tasting room is the only place to try the full range.",
    category: "winery",
    lat: 36.5538716,
    lng: -121.9223211,
    website: "https://silvestrivineyards.com",
  },

  // ── WINERIES: CARMEL (TASTING ROOMS) ───────────────────────────────────────
  {
    name: "McIntyre Vineyards",
    city: "Carmel Valley",
    note: "Steve McIntyre farms nearly a third of the entire Santa Lucia Highlands AVA — more than any other individual in the appellation. His 80-acre estate, planted in 1973, holds some of the oldest Pinot Noir vines in Monterey County. The tasting room at 24 W. Carmel Valley Rd in the Village makes the wines accessible without a mountain drive. Old-vine SLH at its most authoritative.",
    category: "winery",
    lat: 36.4794409,
    lng: -121.7322583,
    website: "https://mcintyrevineyards.com",
  },
  {
    name: "Caraccioli Cellars",
    city: "Carmel",
    note: "The best sparkling wine argument for Monterey County you'll find in a single tasting room. Gary Caraccioli grew up farming in the Salinas Valley; he brought in Michel Salgues — the Frenchman who built Roederer Estate — to translate Santa Lucia Highlands fruit into méthode champenoise wines with real Champagne structure. The Brut and Brut Rosé from the SLH are benchmarks. Quiet, unhurried tasting room on Dolores Street in the village.",
    category: "winery",
    lat: 36.5547022,
    lng: -121.9225815,
    website: "https://caracciolicellars.com",
  },
  {
    name: "Albatross Ridge",
    city: "Carmel",
    note: "Tasting room in Carmel village, estate vineyard high in the Santa Lucia Highlands at 2,200 feet — one of the highest in Monterey County. The elevation and marine influence produce Pinot Noir that is leaner and more savory than Sonoma Coast equivalents. Worth a stop if you're walking Carmel's tasting row.",
    category: "winery",
    lat: 36.5552906,
    lng: -121.9225955,
    website: "https://albatrossridge.com",
  },
  {
    name: "De Tierra Vineyards",
    city: "Carmel",
    note: "Small-production Monterey County winery with a tasting room at the Carmel Crossroads. The sourcing spans cool blocks across the county — SLH, Arroyo Seco, Carmel Valley. An easy stop that doesn't require driving the valley and pours more seriously than the strip-mall location would suggest.",
    category: "winery",
    lat: 36.556637,
    lng: -121.9208573,
    website: "https://detierra.com",
  },
  {
    name: "A Taste of Monterey",
    city: "Monterey",
    note: "The most efficient single stop for understanding Monterey wine without driving the appellation. Over 70 local wines available by the glass, flight, or bottle, plus retail. Cannery Row location has bay views. The staff knows the producers personally — ask what they're excited about.",
    category: "winery",
    lat: 36.6166986,
    lng: -121.8997165,
    website: "https://atasteofmonterey.com",
  },

  // ── RESTAURANTS ─────────────────────────────────────────────────────────────
  {
    name: "Nepenthe",
    city: "Big Sur",
    note: "The cathedral of Big Sur dining — terraced into the cliff at 808 feet with one of the great restaurant views in California. The Ambrosia burger has been feeding travelers since 1949 and hasn't been embarrassed by time. Arrive for lunch before the afternoon coast fog closes in. The Phoenix is the original structure. An institution, earned.",
    category: "restaurant",
    lat: 36.2218365,
    lng: -121.7592895,
    website: "https://nepenthebigsur.com",
  },
  {
    name: "Aubergine at L'Auberge Carmel",
    city: "Carmel",
    note: "The best table on the Monterey Peninsula. Justin Cogley's seasonal tasting menu is among the most technically accomplished in Northern California — hyper-local, precise, and entirely worth the price. The bread service alone sets a standard. Book weeks ahead and come hungry.",
    category: "restaurant",
    lat: 36.5541304,
    lng: -121.9242179,
    website: "https://auberginecarmel.com",
  },
  {
    name: "Passionfish",
    city: "Pacific Grove",
    note: "The neighborhood restaurant Pacific Grove deserves and almost doesn't know it has. Ted Walter's wine list is famously well-priced — zero markup on most bottles is the stated goal — and the sustainable seafood is sourced with real intention. Book ahead. The regulars fill it.",
    category: "restaurant",
    lat: 36.6223375,
    lng: -121.9209735,
    website: "https://passionfish.net",
  },
  {
    name: "Cultura Comida y Bebida",
    city: "Carmel",
    note: "The best argument that Carmel's restaurant scene is getting more interesting. Local sourcing, a Mexican-inflected menu built around what's in season in the Salinas Valley, and a natural wine list that would hold its own in San Francisco. Genuinely exciting cooking in a town not always known for it.",
    category: "restaurant",
    lat: 36.5559907,
    lng: -121.923069,
    website: "https://culturacarmel.com",
  },
  {
    name: "Tarpy's Roadhouse",
    city: "Monterey",
    note: "The classic for a reason. Stone farmhouse building, wood-fired cooking, and a menu built for people who actually eat — not people performing a dining experience. The prime rib is a weekend ritual for half the Peninsula. Reliable, honest, and genuinely good.",
    category: "restaurant",
    lat: 36.5822807,
    lng: -121.8303061,
    website: "https://tarpys.com",
  },
  {
    name: "Wild Fish",
    city: "Pacific Grove",
    note: "Small, focused, and genuinely committed to sustainable local seafood. Pacific Grove's quiet gem. The menu changes with what came off the boats. No swordfish, no farmed salmon — Wild Fish means it. Book ahead; it seats very few.",
    category: "restaurant",
    lat: 36.6204974,
    lng: -121.9170213,
    website: "https://wild-fish.com",
  },
  {
    name: "Montrio Bistro",
    city: "Monterey",
    note: "The only Michelin-rated restaurant in downtown Monterey — and it earns it quietly, without the fuss of a tasting menu. Set inside Monterey's historic first firehouse (built 1910), the kitchen runs a rotating seasonal menu of American and European-inflected small plates and entrées. Sustainably certified, garden-to-table committed, and genuinely well-executed. The wine list covers California and beyond without being exhausting. Book ahead on weekends.",
    category: "restaurant",
    lat: 36.599774,
    lng: -121.8953841,
    website: "https://montrio.com",
  },
  {
    name: "Il Tegamino",
    city: "Carmel",
    note: "The most honest pizza in Carmel. Giuseppe Panzuto came from Naples and does not compromise: proper Neapolitan dough, correct oven temperature, San Marzano tomatoes, fior di latte. Hidden in the Court of the Golden Bough courtyard off Ocean Avenue — the location is not visible from the street, which means it's still a locals-first spot. The kind of place that makes Carmel more interesting.",
    category: "restaurant",
    lat: 36.5547562,
    lng: -121.9240766,
    website: "https://iltegaminocarmel.com",
  },
  {
    name: "Solstice at The Village Big Sur",
    city: "Big Sur",
    note: "The most exciting new restaurant in Big Sur in years. Chef Tim Eelman's live-fire program centers the menu — whole fish roasted over coals, smoke-treated shellfish, grilled local produce — while manager Matt Peterson curates a wine list of genuine intelligence. Inside The Village Big Sur at 46840 Highway 1, which gives it an infrastructure that most Big Sur restaurants lack. The bodega sidecar next door is coming together as a provisions stop. Book ahead.",
    category: "restaurant",
    lat: 36.2697663,
    lng: -121.8079048,
    website: "https://thevillagebigsur.com",
  },
  {
    name: "Phil's Fish Market",
    city: "Castroville",
    note: "Forty years and one move later, still the definitive cioppino stop in Monterey County. Phil DiGirolamo's market relocated from Moss Landing to a historic 1869 building on Merritt Street in Castroville in 2022. The cioppino — built on local crab, clams, mussels, shrimp, and fish in a tomato-wine broth — is the reason most people come, and it holds up. The fish market operation still sells direct. Artichoke country is right outside the door.",
    category: "restaurant",
    lat: 36.7657319,
    lng: -121.7583329,
    website: "https://philsfishmarket.com",
  },
  {
    name: "Sierra Mar at Post Ranch Inn",
    city: "Big Sur",
    note: "A 1,200-foot cliff perch with one of the most dramatic dining rooms in California. The cuisine leans organic and local; the wine list is genuinely exceptional. The price reflects the setting — but the setting is legitimately extraordinary. Lunch is more accessible than dinner. Reserve the moment you book lodging.",
    category: "restaurant",
    lat: 36.2298911,
    lng: -121.7651322,
    website: "https://postranchinn.com/dining",
  },
  {
    name: "Chez Noir",
    city: "Carmel",
    note: "One Michelin Star earned with a minimum of fuss — James Beard finalist for Best New Restaurant, LA Times Top 101, and arguably the most honest French-inspired kitchen on the Peninsula. The natural wine program is rooted in the Central Coast. On 5th between San Carlos and Dolores in Carmel-by-the-Sea. Book well ahead.",
    category: "restaurant",
    lat: 36.5569346,
    lng: -121.9223308,
    website: "https://cheznoircarmel.com",
  },

  {
    name: "Jeninni Kitchen + Wine Bar",
    city: "Pacific Grove",
    note: "The best natural wine list on the Peninsula after Chez Noir, in a small Pacific Grove dining room that punches well above its address. Mediterranean-inflected small plates built around what's in season locally. The cheese program is strong and the staff knows the list. Come for dinner; the regulars fill it quickly.",
    category: "restaurant",
    lat: 36.6208136,
    lng: -121.916751,
    website: "https://jeninni.com",
  },
  {
    name: "The Stationaery",
    city: "Carmel",
    note: "A neighborhood restaurant in San Carlos Square that has become a quiet anchor for Carmel locals. Seasonal California cooking, handmade pastas, and a wine program built around small producers and low-intervention bottles from California and Europe. The kitchen draws from farms across Monterey and Santa Cruz Counties; the menu follows the seasons. Brunch is a weekend ritual, dinner runs Thursday through Sunday. Coffee from Carrier Roasting Co. and a take-away window for guests heading to the beach. Chef Amalia Scatena runs the kitchen under owners Anthony and Alissa Carnazzo.",
    category: "restaurant",
    lat: 36.5561884,
    lng: -121.9214131,
    website: "https://thestationaery.com",
  },
  {
    name: "Deetjen's Big Sur Inn",
    city: "Big Sur",
    note: "The anti-Sierra Mar Big Sur restaurant. Norwegian homestead built by Grandpa Deetjen in the 1930s — wood fires, creaky floors, Castro Canyon outside the window. The menu doesn't try to justify the setting with price. Dinner by reservation; weekend breakfast draws locals who've been coming for years. Earned in a way that newer Big Sur destinations have to work toward.",
    category: "restaurant",
    lat: 36.2174402,
    lng: -121.7508705,
    website: "https://deetjens.com",
  },

  // ── FARM STANDS & MARKETS ─────────────────────────────────────────────────
  {
    name: "Monterey Bay Certified Farmers Market — Monterey",
    city: "Monterey",
    note: "The Monterey Peninsula's best weekly market, drawing farms from across the Salinas Valley floor and coastal hills. Castroville artichoke growers, Watsonville strawberry farms, coastal microgreens, and specialty produce direct from growers. Tuesday and Saturday in the Old Monterey Marketplace. The most direct connection to what's actually growing in the county right now.",
    category: "farmstand",
    lat: 36.5836894,
    lng: -121.8937543,
    website: "https://montereybayfarmers.org",
  },
  {
    name: "Carmel Farmers Market",
    city: "Carmel",
    note: "The Barnyard Shopping Village market at Highway 1 and Carmel Valley Road. Over 25 farmers and vendors — local produce, specialty items, valley honey. Tuesdays 9 am to 1 pm, May through September, rain or shine.",
    category: "farmstand",
    lat: 36.5407246,
    lng: -121.9075407,
    website: "https://montereybayfarmers.org",
  },
  {
    name: "Pezzini Farms",
    city: "Castroville",
    note: "Four generations of artichoke farming in the county that named itself the artichoke capital of the world. Direct retail at their Merritt Street stand gives you the freshest possible Castroville artichokes, year-round, from the family that grows them. Peak is February through May. They know how to cook them; ask.",
    category: "farmstand",
    lat: 36.74293,
    lng: -121.768829,
    website: "https://pezzinifarms.com",
  },

  // ── ARTISAN PRODUCERS ─────────────────────────────────────────────────────
  {
    name: "Carmel Valley Creamery Co.",
    city: "Carmel Valley",
    note: "Artisan creamery in Carmel Valley Village at 1 Esquiline Road. Small-batch ice cream and dairy made with local ingredients — the kind of focused, ingredient-driven operation that fits the Village's slow-food character. A natural stop after a morning of tasting rooms.",
    category: "artisan",
    lat: 36.4735539,
    lng: -121.7280782,
    website: "https://www.carmelvalleycreameryco.com",
  },
  {
    name: "Carmel Valley Coffee Roasting Co.",
    city: "Carmel Valley",
    note: "The Village coffee institution. Small-batch roasting, knowledgeable staff, and the kind of laid-back porch energy that makes Carmel Valley what it is. A proper stop before a morning of tasting rooms.",
    category: "artisan",
    lat: 36.5549331,
    lng: -121.9237493,
    website: "https://carmelvalleycoffee.com",
  },
  {
    name: "Monterey Abalone Company",
    city: "Monterey",
    note: "Art Seavey and Trevor Fay cultivate California red abalone in cages suspended beneath Municipal Wharf 2 — farming in the actual bay rather than tanks. The result is some of the cleanest aquaculture provenance on the Central Coast: abalone fed by wild kelp and plankton of Monterey Bay, harvested and sold from the wharf. Call ahead to visit or purchase direct.",
    category: "artisan",
    lat: 36.6050598,
    lng: -121.889421,
    website: "https://montereyabalone.com",
  },
  {
    name: "Parker-Lusseau Pastries",
    city: "Monterey",
    note: "The most committed artisan bakery in Monterey County. French laminated doughs — proper croissants, kouign-amann, seasonal pastries — produced with a rigor that makes this a key supplier to the area's better restaurants and a morning anchor for anyone who knows. The Hartnell Street flagship at 539 Hartnell St is the original; a second cafe on Munras has since opened. Open early weekdays.",
    category: "artisan",
    lat: 36.5961403,
    lng: -121.8955473,
    website: "https://parkerlusseau.com",
  },
  {
    name: "Happy Girl Kitchen",
    city: "Pacific Grove",
    note: "Fermentation studio, canning operation, and cafe on Central Avenue. Small-batch pickles, jams, kimchi, and fermented vegetables made from Salinas Valley and coastal produce. They run hands-on canning workshops if you want to understand how the pantry gets built. The cafe side runs a quiet breakfast and lunch. Doing the slow-food work without the label.",
    category: "artisan",
    lat: 36.6185417,
    lng: -121.9065222,
    website: "https://happygirlkitchen.com",
  },
  {
    name: "Alvarado Street Brewery",
    city: "Monterey",
    note: "The serious craft brewery in Monterey County. Local grain sourcing, a farm-to-table beer approach, and a tap room on Alvarado Street that has built a real identity. The IPA program is the headline, but the farmhouse ales and barrel-aged program show real depth. A credible stop for anyone who finds the Peninsula's wine-only focus occasionally exhausting.",
    category: "artisan",
    lat: 36.5993012,
    lng: -121.894812,
    website: "https://alvaradostreetbrewery.com",
  },
  {
    name: "Wild Plum Cafe & Bakery",
    city: "Monterey",
    note: "All-vegetarian cafe and bakery that has supplied Peninsula restaurants with whole-grain breads and pastries for years. The approach complements Parker-Lusseau's French lamination — whole grain, seasonal, rooted in ingredient integrity rather than technique display. Breakfast and lunch; closes midafternoon. On Munras Ave.",
    category: "artisan",
    lat: 36.5948644,
    lng: -121.8930916,
    website: "https://wildplum.com",
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
    throw err;
  }
}
