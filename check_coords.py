import math

def check(name, lat, lng):
    print(f"{name}: {lat}, {lng}")

# Aubergine at L'Auberge Carmel: 36.5551, -121.9231 (Monte Verde at 7th Ave)
# Chez Noir: 36.5535, -121.9244 (5th Ave between San Carlos and Dolores)
# Il Tegamino: 36.5548, -121.9229 (Court of Golden Bough off Ocean Ave)
# Mundaka: 36.5556, -121.9222 (San Carlos between Ocean and 7th)
# Cultura Comida y Bebida: 36.5557, -121.9228

# Reference points in Carmel:
# Ocean Ave & San Carlos: 36.5552, -121.9232 (approx)
# Ocean Ave & Dolores: 36.5551, -121.9242 (approx)
# 7th & Monte Verde: 36.5543, -121.9248 (approx)

# Let's use a more precise grid for Carmel blocks:
# Carmel blocks are roughly 80-100m.
# 1 degree lat ~ 111km
# 0.0001 lat ~ 11m
# 1 degree lng ~ 89km (at 36.5N)
# 0.0001 lng ~ 9m

# Ocean Ave & San Carlos St is a central intersection.
# Let's assume Ocean & San Carlos is ~ 36.5552, -121.9232
# North of Ocean: 6th, 5th, 4th... (lat increases)
# South of Ocean: 7th, 8th... (lat decreases)
# West of San Carlos: Dolores, Lincoln, Monte Verde, Casanova... (lng decreases/becomes more negative)
# East of San Carlos: Mission, Junipero... (lng increases)

venues = [
    ("Aubergine", 36.5551, -121.9231, "Monte Verde at 7th"),
    ("Chez Noir", 36.5535, -121.9244, "5th Ave between San Carlos and Dolores"),
    ("Il Tegamino", 36.5548, -121.9229, "Court of Golden Bough off Ocean Ave"),
    ("Mundaka", 36.5556, -121.9222, "San Carlos between Ocean and 7th"),
    ("Cultura", 36.5557, -121.9228, "Unknown")
]

for name, lat, lng, target in venues:
    print(f"Checking {name} at {lat}, {lng}. Expected: {target}")
