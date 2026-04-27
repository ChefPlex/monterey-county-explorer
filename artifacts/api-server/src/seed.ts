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
  "Carmel Valley Creamery",      // No web presence; too new/unverifiable
  "Aubergine",                   // Reverted — name restored to "Aubergine at L'Auberge Carmel"
];

const SEED_DATA = [
  // ── WINERIES: CARMEL VALLEY ────────────────────────────────────────────────
  {
    name: "Bernardus Winery",
    city: "Carmel Valley",
    note: "The flagship Carmel Valley estate. Winemaker Dean DeKorth's Marinus Bordeaux blend is the benchmark for the appellation — structured, age-worthy, and genuinely Carmel Valley in character. The on-property Lucia restaurant with Cal Stamenov in the kitchen makes this a full culinary destination — dinner is among the most accomplished in the valley; lunch is equally worth it. Appointment tastings available in the vineyard cave.",
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
    note: "Focused, serious wines from Santa Lucia Highlands fruit. The Chardonnay and Pinot Noir here show what the SLH appellation does better than anywhere in California — bright acidity, savory structure, unmistakably coastal. Quiet tasting room, knowledgeable pours. If you're serious about SLH, this is a required stop.",
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
    website: "https://chesebrowines.com",
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

  // ── WINERIES: CHALONE AVA ────────────────────────────────────────────────────
  {
    name: "Chalone Vineyard",
    city: "Soledad",
    note: "California's most isolated wine estate — 1,300 feet up in the Gavilan Range on alkaline limestone, surrounded by Pinnacles National Monument. Planted 1919. The Chalone AVA has no other members. Chenin Blanc, Pinot Blanc, and Pinot Noir from these soils produce a genuinely unusual mineral profile — austere, slow to open, unlike anything in the Salinas Valley below. The geology here is the story.",
    category: "winery",
    lat: 36.4701,
    lng: -121.2299,
    website: "https://chalonevineyard.com",
  },

  // ── WINERIES: SANTA LUCIA HIGHLANDS ────────────────────────────────────────
  {
    name: "Hahn Family Wines",
    city: "Soledad",
    note: "Estate winery in the heart of the Santa Lucia Highlands at 1,200 feet elevation. The cool marine-influenced climate produces Pinot Noir and Chardonnay with real texture and grip. The tasting room has sweeping views of the Salinas Valley floor and runs the full range from accessible to single-vineyard serious.",
    category: "winery",
    lat: 36.3961,
    lng: -121.3390,
    website: "https://hahnwines.com",
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

  {
    name: "Pessagno Winery",
    city: "Salinas",
    note: "High-elevation Santa Lucia Highlands estate on River Road, focused on single-vineyard bottlings from SLH and Arroyo Seco fruit. The Pinot Noir and Chardonnay here show the cooler, more maritime character of the northern SLH blocks. A smaller, more focused operation than Hahn — worth the drive if you're already in the corridor.",
    category: "winery",
    lat: 36.4801,
    lng: -121.4849,
    website: "https://pessagnowines.com",
  },
  {
    name: "Paraiso Vineyards",
    city: "Soledad",
    note: "Smith family planted in 1973, one of the Santa Lucia Highlands originals before the AVA existed. The SLH rosé from Pinot Noir is a benchmark for the appellation. The tasting room sits at 1,200 feet on Paraiso Springs Road with the full sweep of the Salinas Valley below. Less visited than Hahn; the conversation here tends to be with someone who actually grew the fruit.",
    category: "winery",
    lat: 36.4095,
    lng: -121.3720,
    website: "https://paraisovineyards.com",
  },

  // ── WINERIES: CARMEL VALLEY (ADDITIONAL) ─────────────────────────────────
  {
    name: "Boekenoogen Vineyard & Winery",
    city: "Carmel Valley",
    note: "Small-production, estate-focused, and poured by the family. Their Pinot Noir from Carmel Valley and SLH fruit is genuinely good — structured, honest, without the preciousness that follows big press coverage. The tasting room sits just west of the Village on Carmel Valley Road. The kind of stop that rewards people actually paying attention.",
    category: "winery",
    lat: 36.4798,
    lng: -121.7325,
    website: "https://boekenoogenwines.com",
  },
  {
    name: "Silvestri Vineyards",
    city: "Carmel Valley",
    note: "Estate Sangiovese in the Carmel Valley — unusual and worth seeking out. The family planted Italian varieties in the warm mid-valley, which turns out to be a reasonable analog for Tuscan growing conditions. The Sangiovese is the reason to visit; the Cabernet Sauvignon is solid backup. Tasting room in the Village.",
    category: "winery",
    lat: 36.4772,
    lng: -121.7269,
    website: "https://silvestrivineyards.com",
  },

  // ── WINERIES: CARMEL (TASTING ROOMS) ───────────────────────────────────────
  {
    name: "Talbott Vineyards",
    city: "Carmel",
    note: "One of the founding estates of the Santa Lucia Highlands — Talbott planted their Sleepy Hollow Vineyard in 1972, before the AVA existed. Wine Enthusiast named it a California Grand Cru in 2016. The Chardonnay and Pinot Noir remain benchmarks for what the Highlands can do. Tasting room on Lincoln between 5th and 6th in Carmel village.",
    category: "winery",
    lat: 36.5543,
    lng: -121.9264,
    website: "https://talbottvineyards.com",
  },
  {
    name: "McIntyre Vineyards",
    city: "Carmel",
    note: "Steve McIntyre farms nearly a third of the entire Santa Lucia Highlands AVA — more than any other individual in the appellation. His 80-acre estate, planted in 1973, holds some of the oldest Pinot Noir vines in Monterey County. The tasting room at Carmel Crossroads makes the wines accessible without a mountain drive. Old-vine SLH at its most authoritative.",
    category: "winery",
    lat: 36.5395,
    lng: -121.9066,
    website: "https://mcintyrevineyards.com",
  },
  {
    name: "Caraccioli Cellars",
    city: "Carmel",
    note: "The best sparkling wine argument for Monterey County you'll find in a single tasting room. Gary Caraccioli grew up farming in the Salinas Valley; he brought in Michel Salgues — the Frenchman who built Roederer Estate — to translate Santa Lucia Highlands fruit into méthode champenoise wines with real Champagne structure. The Brut and Brut Rosé from the SLH are benchmarks. Quiet, unhurried tasting room on Dolores Street in the village.",
    category: "winery",
    lat: 36.5557,
    lng: -121.9240,
    website: "https://caracciolicellars.com",
  },
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
    name: "De Tierra Vineyards",
    city: "Carmel",
    note: "Small-production Monterey County winery with a tasting room at the Carmel Crossroads. The sourcing spans cool blocks across the county — SLH, Arroyo Seco, Carmel Valley. An easy stop that doesn't require driving the valley and pours more seriously than the strip-mall location would suggest.",
    category: "winery",
    lat: 36.5380,
    lng: -121.9092,
    website: "https://detierra.com",
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
    note: "The cathedral of Big Sur dining — terraced into the cliff at 808 feet with one of the great restaurant views in California. The Ambrosia burger has been feeding travelers since 1949 and hasn't been embarrassed by time. Arrive for lunch before the afternoon coast fog closes in. The Phoenix is the original structure. An institution, earned.",
    category: "restaurant",
    lat: 36.2541,
    lng: -121.8124,
    website: "https://nepenthe.com",
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
    lat: 36.6275,
    lng: -121.9170,
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
    lat: 36.6049,
    lng: -121.8615,
    website: "https://tarpys.com",
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
    name: "Montrio Bistro",
    city: "Monterey",
    note: "The only Michelin-rated restaurant in downtown Monterey — and it earns it quietly, without the fuss of a tasting menu. Set inside Monterey's historic first firehouse (built 1910), the kitchen runs a rotating seasonal menu of American and European-inflected small plates and entrées. Sustainably certified, garden-to-table committed, and genuinely well-executed. The wine list covers California and beyond without being exhausting. Book ahead on weekends.",
    category: "restaurant",
    lat: 36.5997,
    lng: -121.8929,
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
    lat: 36.2611,
    lng: -121.7972,
    website: "https://thevillagebigsur.com",
  },
  {
    name: "Phil's Fish Market",
    city: "Castroville",
    note: "Forty years and one move later, still the definitive cioppino stop in Monterey County. Phil DiGirolamo's market relocated from Moss Landing to a historic 1869 building on Merritt Street in Castroville in 2022. The cioppino — built on local crab, clams, mussels, shrimp, and fish in a tomato-wine broth — is the reason most people come, and it holds up. The fish market operation still sells direct. Artichoke country is right outside the door.",
    category: "restaurant",
    lat: 36.7660,
    lng: -121.7552,
    website: "https://philsfishmarket.com",
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
    name: "Holman Ranch Tavern",
    city: "Carmel Valley",
    note: "The on-property restaurant at Holman Ranch — the valley's answer to what Will's Fargo used to be. Casual but serious: a proper bar program, estate wines poured by the glass, and a menu built around the ranch and surrounding Carmel Valley. The 400-acre property setting is the same as the cave tasting room next door, which makes it the most complete stop in the valley.",
    category: "restaurant",
    lat: 36.4898,
    lng: -121.7315,
    website: "https://holmanranch.com",
  },
  {
    name: "Jeninni Kitchen + Wine Bar",
    city: "Pacific Grove",
    note: "The best natural wine list on the Peninsula after Chez Noir, in a small Pacific Grove dining room that punches well above its address. Mediterranean-inflected small plates built around what's in season locally. The cheese program is strong and the staff knows the list. Come for dinner; the regulars fill it quickly.",
    category: "restaurant",
    lat: 36.6208,
    lng: -121.9170,
    website: "https://jeninni.com",
  },
  {
    name: "The Stationaery",
    city: "Carmel Valley",
    note: "The Village's casual lunch and early dinner stop — California-seasonal cooking, a solid wine-by-the-glass list, and a patio that handles the valley heat well. Fills the practical gap between a morning of tasting rooms and a dinner at Bernardus without requiring a reservation or a jacket.",
    category: "restaurant",
    lat: 36.4791,
    lng: -121.7318,
    website: "https://thestationaery.com",
  },
  {
    name: "Deetjen's Big Sur Inn",
    city: "Big Sur",
    note: "The anti-Sierra Mar Big Sur restaurant. Norwegian homestead built by Grandpa Deetjen in the 1930s — wood fires, creaky floors, Castro Canyon outside the window. The menu doesn't try to justify the setting with price. Dinner by reservation; weekend breakfast draws locals who've been coming for years. Earned in a way that newer Big Sur destinations have to work toward.",
    category: "restaurant",
    lat: 36.2640,
    lng: -121.8210,
    website: "https://deetjens.com",
  },
  {
    name: "Mundaka",
    city: "Carmel",
    note: "Spanish tapas in Carmel that actually hold up. Pintxos, fideos, patatas bravas done correctly in a low-lit space that functions as the closest thing to a late-night option the village offers. A different register from everything else on the tasting row — more communal, less precious. The right stop when the day has been beautiful and you want food without a three-course event.",
    category: "restaurant",
    lat: 36.5556,
    lng: -121.9222,
    website: "https://mundaka.net",
  },

  // ── FARM STANDS & MARKETS ─────────────────────────────────────────────────
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
  {
    name: "Lady & Larder + Marmee's",
    city: "Carmel Valley",
    note: "The cheese and charcuterie anchor of Carmel Valley Village — run by a cheesemaker who serves as president of the California Artisan Cheese Guild. Marmee's, the attached natural wine bar, gives the stop a proper afternoon dimension. At 9 Del Fino Place in the Village. Hours have been subject to pause — call ahead or check the website before visiting.",
    category: "farmstand",
    lat: 36.4810,
    lng: -121.7320,
    website: "https://ladyandlarder.com",
  },

  {
    name: "Pacific Grove Certified Farmers Market",
    city: "Pacific Grove",
    note: "Monday and Saturday market at Lighthouse and Congress covers coastal and inland growers that don't overlap heavily with the Monterey market. Seaweed, coastal microgreens, and backyard honey operations that don't travel to larger venues. A short walk from Passionfish and Wild Fish — pair the two naturally.",
    category: "farmstand",
    lat: 36.6175,
    lng: -121.9051,
    website: "https://montereybayfarmers.org",
  },
  {
    name: "Pezzini Farms",
    city: "Castroville",
    note: "Four generations of artichoke farming in the county that named itself the artichoke capital of the world. Direct retail at their Merritt Street stand gives you the freshest possible Castroville artichokes, year-round, from the family that grows them. Peak is February through May. They know how to cook them; ask.",
    category: "farmstand",
    lat: 36.7655,
    lng: -121.7545,
    website: "https://pezzinifarms.com",
  },

  // ── ARTISAN PRODUCERS ─────────────────────────────────────────────────────
  {
    name: "Carmel Valley Coffee Roasting Co.",
    city: "Carmel Valley",
    note: "The Village coffee institution. Small-batch roasting, knowledgeable staff, and the kind of laid-back porch energy that makes Carmel Valley what it is. A proper stop before a morning of tasting rooms.",
    category: "artisan",
    lat: 36.4797,
    lng: -121.7199,
    website: "https://carmelvalleycoffee.com",
  },
  {
    name: "The Big Sur Bakery",
    city: "Big Sur",
    note: "Wood-fired, focused, and genuinely beloved by the Big Sur community. Breakfast and lunch in a converted gas station with a bakery attached. The pastries come from a real oven using real flour, and the lunch menu follows the season. An honest, slow-food-without-the-label operation in one of the most expensive corridors of real estate in California.",
    category: "artisan",
    lat: 36.2547,
    lng: -121.8025,
    website: "https://bigsurbakery.com",
  },
  {
    name: "Schoch Family Farmstead",
    city: "Salinas",
    note: "One of California's last operating raw-milk dairies — Swiss immigrant heritage, founded 1944, fewer than 80 Holstein cows, now in its third generation. The cheese portfolio is remarkable: Santa Rita (washed rind), Mt. Toro Tomme, authentic Monterey Jack (a California original the county named but largely abandoned), Feta, and a local blue. At farmers markets Fridays and Saturdays; the farm at 662 El Camino Real N is the source.",
    category: "artisan",
    lat: 36.7130,
    lng: -121.6440,
    website: "https://schochfamilyfarm.com",
  },
  {
    name: "Monterey Abalone Company",
    city: "Monterey",
    note: "Art Seavey and Trevor Fay cultivate California red abalone in cages suspended beneath Municipal Wharf 2 — farming in the actual bay rather than tanks. The result is some of the cleanest aquaculture provenance on the Central Coast: abalone fed by wild kelp and plankton of Monterey Bay, harvested and sold from the wharf. Call ahead to visit or purchase direct.",
    category: "artisan",
    lat: 36.6056,
    lng: -121.8940,
    website: "https://montereyabalone.com",
  },
  {
    name: "Parker-Lusseau Pastries",
    city: "Monterey",
    note: "The most committed artisan bakery in Monterey County. French laminated doughs — proper croissants, kouign-amann, seasonal pastries — produced with a rigor that makes this a key supplier to the area's better restaurants and a morning anchor for anyone who knows. The Hartnell Street flagship at 539 Hartnell St is the original; a second cafe on Munras has since opened. Open early weekdays.",
    category: "artisan",
    lat: 36.6003,
    lng: -121.8916,
    website: "https://parkerlusseau.com",
  },
  {
    name: "Happy Girl Kitchen",
    city: "Pacific Grove",
    note: "Fermentation studio, canning operation, and cafe on Central Avenue. Small-batch pickles, jams, kimchi, and fermented vegetables made from Salinas Valley and coastal produce. They run hands-on canning workshops if you want to understand how the pantry gets built. The cafe side runs a quiet breakfast and lunch. Doing the slow-food work without the label.",
    category: "artisan",
    lat: 36.6187,
    lng: -121.9064,
    website: "https://happygirlkitchen.com",
  },
  {
    name: "Alvarado Street Brewery",
    city: "Monterey",
    note: "The serious craft brewery in Monterey County. Local grain sourcing, a farm-to-table beer approach, and a tap room on Alvarado Street that has built a real identity. The IPA program is the headline, but the farmhouse ales and barrel-aged program show real depth. A credible stop for anyone who finds the Peninsula's wine-only focus occasionally exhausting.",
    category: "artisan",
    lat: 36.5997,
    lng: -121.8945,
    website: "https://alvaradostreetbrewery.com",
  },
  {
    name: "Wild Plum Cafe & Bakery",
    city: "Monterey",
    note: "All-vegetarian cafe and bakery that has supplied Peninsula restaurants with whole-grain breads and pastries for years. The approach complements Parker-Lusseau's French lamination — whole grain, seasonal, rooted in ingredient integrity rather than technique display. Breakfast and lunch; closes midafternoon. On Munras Ave.",
    category: "artisan",
    lat: 36.5949,
    lng: -121.8931,
    website: "https://wildplum.com",
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

    // Find which seed entries are not yet in the DB and insert only those
    const existing = await db
      .select({ name: markersTable.name })
      .from(markersTable);
    const existingNames = new Set(existing.map((r) => r.name));

    const toInsert = SEED_DATA.filter((entry) => !existingNames.has(entry.name));

    if (toInsert.length === 0) {
      logger.info("All seed markers already present — nothing to insert");
      return;
    }

    // Insert only the new entries
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
  } catch (err) {
    logger.error({ err }, "Seed failed");
    throw err;
  }
}
