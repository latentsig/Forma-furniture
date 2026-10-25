export type Category = 'Seating' | 'Tables' | 'Bedroom' | 'Storage';

export type Product = {
  id: string; name: string; category: Category; price: number; material: string;
  description: string; image: string; size: string; lead: string; gallery: string[];
};

export const products = [
  {
    "id": "forma-001-sunday-oak-lounge-chair",
    "name": "Sunday Oak Lounge Chair",
    "category": "Seating",
    "price": 28000,
    "material": "Solid oak · natural linen",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-001.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-001.jpg",
      "image%20assets/forma-seat-001-side.jpg",
      "image%20assets/forma-seat-001-rear.jpg"
    ]
  },
  {
    "id": "forma-002-moss-velvet-armchair",
    "name": "Moss Velvet Armchair",
    "category": "Seating",
    "price": 35350,
    "material": "American walnut · moss velvet",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-002.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-002.jpg",
      "image%20assets/forma-seat-002-side.jpg",
      "image%20assets/forma-seat-002-rear.jpg"
    ]
  },
  {
    "id": "forma-003-cloud-bouclé-barrel-chair",
    "name": "Cloud Bouclé Barrel Chair",
    "category": "Seating",
    "price": 42700,
    "material": "Bouclé upholstery · ash",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-003.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-003.jpg",
      "image%20assets/forma-seat-003-side.jpg",
      "image%20assets/forma-seat-003-rear.jpg"
    ]
  },
  {
    "id": "forma-004-cane-counter-stool",
    "name": "Cane Counter Stool",
    "category": "Seating",
    "price": 50050,
    "material": "Solid teak · hand-woven cane",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-004.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-004.jpg",
      "image%20assets/forma-seat-004-side.jpg",
      "image%20assets/forma-seat-004-rear.jpg"
    ]
  },
  {
    "id": "forma-005-saddle-leather-sling-chair",
    "name": "Saddle Leather Sling Chair",
    "category": "Seating",
    "price": 57400,
    "material": "Walnut frame · saddle leather",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-005.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-005.jpg",
      "image%20assets/forma-seat-005-side.jpg",
      "image%20assets/forma-seat-005-rear.jpg"
    ]
  },
  {
    "id": "forma-006-reclaimed-timber-accent-stool",
    "name": "Reclaimed Timber Accent Stool",
    "category": "Seating",
    "price": 64750,
    "material": "Solid oak · natural linen",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-006.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-006.jpg",
      "image%20assets/forma-seat-006-side.jpg",
      "image%20assets/forma-seat-006-rear.jpg"
    ]
  },
  {
    "id": "forma-007-woven-cane-lounge-chair",
    "name": "Woven Cane Lounge Chair",
    "category": "Seating",
    "price": 72100,
    "material": "American walnut · moss velvet",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-007.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-007.jpg",
      "image%20assets/forma-seat-007-side.jpg",
      "image%20assets/forma-seat-007-rear.jpg"
    ]
  },
  {
    "id": "forma-008-oatmeal-bouclé-ottoman",
    "name": "Oatmeal Bouclé Ottoman",
    "category": "Seating",
    "price": 79450,
    "material": "Bouclé upholstery · ash",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-008.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-008.jpg",
      "image%20assets/forma-seat-008-side.jpg",
      "image%20assets/forma-seat-008-rear.jpg"
    ]
  },
  {
    "id": "forma-009-walnut-leather-lounge-chair",
    "name": "Walnut Leather Lounge Chair",
    "category": "Seating",
    "price": 86800,
    "material": "Solid teak · hand-woven cane",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-009.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-009.jpg",
      "image%20assets/forma-seat-009-side.jpg",
      "image%20assets/forma-seat-009-rear.jpg"
    ]
  },
  {
    "id": "forma-010-olive-velvet-barrel-chair",
    "name": "Olive Velvet Barrel Chair",
    "category": "Seating",
    "price": 94150,
    "material": "Walnut frame · saddle leather",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-010.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-010.jpg",
      "image%20assets/forma-seat-010-side.jpg",
      "image%20assets/forma-seat-010-rear.jpg"
    ]
  },
  {
    "id": "forma-011-relaxed-linen-two-seater",
    "name": "Relaxed Linen Two Seater",
    "category": "Seating",
    "price": 101500,
    "material": "Solid oak · natural linen",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-011.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-011.jpg",
      "image%20assets/forma-seat-011-side.jpg",
      "image%20assets/forma-seat-011-rear.jpg"
    ]
  },
  {
    "id": "forma-012-sculpted-cane-dining-chair",
    "name": "Sculpted Cane Dining Chair",
    "category": "Seating",
    "price": 108850,
    "material": "American walnut · moss velvet",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-012.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-012.jpg",
      "image%20assets/forma-seat-012-side.jpg",
      "image%20assets/forma-seat-012-rear.jpg"
    ]
  },
  {
    "id": "forma-013-rustic-oak-bench",
    "name": "Rustic Oak Bench",
    "category": "Seating",
    "price": 116200,
    "material": "Bouclé upholstery · ash",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-013.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-013.jpg",
      "image%20assets/forma-seat-013-side.jpg",
      "image%20assets/forma-seat-013-rear.jpg"
    ]
  },
  {
    "id": "forma-014-bouclé-pedestal-chair",
    "name": "Bouclé Pedestal Chair",
    "category": "Seating",
    "price": 123550,
    "material": "Solid teak · hand-woven cane",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-014.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-014.jpg",
      "image%20assets/forma-seat-014-side.jpg",
      "image%20assets/forma-seat-014-rear.jpg"
    ]
  },
  {
    "id": "forma-015-woven-walnut-bench",
    "name": "Woven Walnut Bench",
    "category": "Seating",
    "price": 130900,
    "material": "Walnut frame · saddle leather",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-015.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-015.jpg",
      "image%20assets/forma-seat-015-side.jpg",
      "image%20assets/forma-seat-015-rear.jpg"
    ]
  },
  {
    "id": "forma-016-black-spindle-dining-chair",
    "name": "Black Spindle Dining Chair",
    "category": "Seating",
    "price": 138250,
    "material": "Solid oak · natural linen",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-016.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-016.jpg",
      "image%20assets/forma-seat-016-side.jpg",
      "image%20assets/forma-seat-016-rear.jpg"
    ]
  },
  {
    "id": "forma-017-tufted-leather-ottoman",
    "name": "Tufted Leather Ottoman",
    "category": "Seating",
    "price": 145600,
    "material": "American walnut · moss velvet",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-017.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-017.jpg",
      "image%20assets/forma-seat-017-side.jpg",
      "image%20assets/forma-seat-017-rear.jpg"
    ]
  },
  {
    "id": "forma-018-cream-bouclé-lounge-chair",
    "name": "Cream Bouclé Lounge Chair",
    "category": "Seating",
    "price": 152950,
    "material": "Bouclé upholstery · ash",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-018.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-018.jpg",
      "image%20assets/forma-seat-018-side.jpg",
      "image%20assets/forma-seat-018-rear.jpg"
    ]
  },
  {
    "id": "forma-019-walnut-bar-stool",
    "name": "Walnut Bar Stool",
    "category": "Seating",
    "price": 34300,
    "material": "Solid teak · hand-woven cane",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-019.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-019.jpg",
      "image%20assets/forma-seat-019-side.jpg",
      "image%20assets/forma-seat-019-rear.jpg"
    ]
  },
  {
    "id": "forma-020-cane-reclining-chaise",
    "name": "Cane Reclining Chaise",
    "category": "Seating",
    "price": 41650,
    "material": "Walnut frame · saddle leather",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-020.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-020.jpg",
      "image%20assets/forma-seat-020-side.jpg",
      "image%20assets/forma-seat-020-rear.jpg"
    ]
  },
  {
    "id": "forma-021-teak-frame-lounge-chair",
    "name": "Teak Frame Lounge Chair",
    "category": "Seating",
    "price": 49000,
    "material": "Solid oak · natural linen",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-021.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-021.jpg",
      "image%20assets/forma-seat-021-side.jpg",
      "image%20assets/forma-seat-021-rear.jpg"
    ]
  },
  {
    "id": "forma-022-moss-velvet-pouf",
    "name": "Moss Velvet Pouf",
    "category": "Seating",
    "price": 56350,
    "material": "American walnut · moss velvet",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-022.jpg",
    "size": "W 168 × D 86 × H 76 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-022.jpg",
      "image%20assets/forma-seat-022-side.jpg",
      "image%20assets/forma-seat-022-rear.jpg"
    ]
  },
  {
    "id": "forma-023-cognac-sling-armchair",
    "name": "Cognac Sling Armchair",
    "category": "Seating",
    "price": 63700,
    "material": "Bouclé upholstery · ash",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-023.jpg",
    "size": "W 62 × D 48 × H 42 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-023.jpg",
      "image%20assets/forma-seat-023-side.jpg",
      "image%20assets/forma-seat-023-rear.jpg"
    ]
  },
  {
    "id": "forma-024-ivory-bouclé-accent-chair",
    "name": "Ivory Bouclé Accent Chair",
    "category": "Seating",
    "price": 71050,
    "material": "Solid teak · hand-woven cane",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-024.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-seat-024.jpg",
      "image%20assets/forma-seat-024-side.jpg",
      "image%20assets/forma-seat-024-rear.jpg"
    ]
  },
  {
    "id": "forma-025-forest-green-loveseat",
    "name": "Forest Green Loveseat",
    "category": "Seating",
    "price": 78400,
    "material": "Walnut frame · saddle leather",
    "description": "A considered silhouette, natural materials and generous comfort make this a lasting piece for everyday living.",
    "image": "image%20assets/forma-seat-025.jpg",
    "size": "W 78 × D 82 × H 78 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-seat-025.jpg",
      "image%20assets/forma-seat-025-side.jpg",
      "image%20assets/forma-seat-025-rear.jpg"
    ]
  },
  {
    "id": "forma-026-sol-oak-pedestal-table",
    "name": "Sol Oak Pedestal Table",
    "category": "Tables",
    "price": 32000,
    "material": "Solid oak · natural oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-026.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-026.jpg",
      "image%20assets/forma-table-026-side.jpg",
      "image%20assets/forma-table-026-rear.jpg"
    ]
  },
  {
    "id": "forma-027-noir-ash-dining-table",
    "name": "Noir Ash Dining Table",
    "category": "Tables",
    "price": 39350,
    "material": "Smoked ash · matte finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-027.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-027.jpg",
      "image%20assets/forma-table-027-side.jpg",
      "image%20assets/forma-table-027-rear.jpg"
    ]
  },
  {
    "id": "forma-028-walnut-writing-desk",
    "name": "Walnut Writing Desk",
    "category": "Tables",
    "price": 46700,
    "material": "American walnut · hand-rubbed oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-028.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-028.jpg",
      "image%20assets/forma-table-028-side.jpg",
      "image%20assets/forma-table-028-rear.jpg"
    ]
  },
  {
    "id": "forma-029-travertine-drum-side-table",
    "name": "Travertine Drum Side Table",
    "category": "Tables",
    "price": 54050,
    "material": "Travertine · honed finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-029.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-029.jpg",
      "image%20assets/forma-table-029-side.jpg",
      "image%20assets/forma-table-029-rear.jpg"
    ]
  },
  {
    "id": "forma-030-live-edge-console",
    "name": "Live Edge Console",
    "category": "Tables",
    "price": 61400,
    "material": "Reclaimed teak · natural grain",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-030.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-030.jpg",
      "image%20assets/forma-table-030-side.jpg",
      "image%20assets/forma-table-030-rear.jpg"
    ]
  },
  {
    "id": "forma-031-low-tide-coffee-table",
    "name": "Low Tide Coffee Table",
    "category": "Tables",
    "price": 68750,
    "material": "Solid oak · natural oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-031.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-031.jpg",
      "image%20assets/forma-table-031-side.jpg",
      "image%20assets/forma-table-031-rear.jpg"
    ]
  },
  {
    "id": "forma-032-carrara-cube-side-table",
    "name": "Carrara Cube Side Table",
    "category": "Tables",
    "price": 76100,
    "material": "Smoked ash · matte finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-032.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-032.jpg",
      "image%20assets/forma-table-032-side.jpg",
      "image%20assets/forma-table-032-rear.jpg"
    ]
  },
  {
    "id": "forma-033-gather-oval-dining-table",
    "name": "Gather Oval Dining Table",
    "category": "Tables",
    "price": 83450,
    "material": "American walnut · hand-rubbed oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-033.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-033.jpg",
      "image%20assets/forma-table-033-side.jpg",
      "image%20assets/forma-table-033-rear.jpg"
    ]
  },
  {
    "id": "forma-034-narrow-entry-console",
    "name": "Narrow Entry Console",
    "category": "Tables",
    "price": 90800,
    "material": "Travertine · honed finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-034.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-034.jpg",
      "image%20assets/forma-table-034-side.jpg",
      "image%20assets/forma-table-034-rear.jpg"
    ]
  },
  {
    "id": "forma-035-burl-accent-table",
    "name": "Burl Accent Table",
    "category": "Tables",
    "price": 98150,
    "material": "Reclaimed teak · natural grain",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-035.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-035.jpg",
      "image%20assets/forma-table-035-side.jpg",
      "image%20assets/forma-table-035-rear.jpg"
    ]
  },
  {
    "id": "forma-036-oak-drawer-writing-desk",
    "name": "Oak Drawer Writing Desk",
    "category": "Tables",
    "price": 105500,
    "material": "Solid oak · natural oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-036.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-036.jpg",
      "image%20assets/forma-table-036-side.jpg",
      "image%20assets/forma-table-036-rear.jpg"
    ]
  },
  {
    "id": "forma-037-walnut-nesting-tables",
    "name": "Walnut Nesting Tables",
    "category": "Tables",
    "price": 112850,
    "material": "Smoked ash · matte finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-037.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-037.jpg",
      "image%20assets/forma-table-037-side.jpg",
      "image%20assets/forma-table-037-rear.jpg"
    ]
  },
  {
    "id": "forma-038-reclaimed-teak-farmhouse-table",
    "name": "Reclaimed Teak Farmhouse Table",
    "category": "Tables",
    "price": 120200,
    "material": "American walnut · hand-rubbed oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-038.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-038.jpg",
      "image%20assets/forma-table-038-side.jpg",
      "image%20assets/forma-table-038-rear.jpg"
    ]
  },
  {
    "id": "forma-039-travertine-pebble-coffee-table",
    "name": "Travertine Pebble Coffee Table",
    "category": "Tables",
    "price": 35550,
    "material": "Travertine · honed finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-039.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-039.jpg",
      "image%20assets/forma-table-039-side.jpg",
      "image%20assets/forma-table-039-rear.jpg"
    ]
  },
  {
    "id": "forma-040-round-bistro-table",
    "name": "Round Bistro Table",
    "category": "Tables",
    "price": 42900,
    "material": "Reclaimed teak · natural grain",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-040.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-040.jpg",
      "image%20assets/forma-table-040-side.jpg",
      "image%20assets/forma-table-040-rear.jpg"
    ]
  },
  {
    "id": "forma-041-fluted-oak-console",
    "name": "Fluted Oak Console",
    "category": "Tables",
    "price": 50250,
    "material": "Solid oak · natural oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-041.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-041.jpg",
      "image%20assets/forma-table-041-side.jpg",
      "image%20assets/forma-table-041-rear.jpg"
    ]
  },
  {
    "id": "forma-042-smoked-walnut-dining-table",
    "name": "Smoked Walnut Dining Table",
    "category": "Tables",
    "price": 57600,
    "material": "Smoked ash · matte finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-042.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-042.jpg",
      "image%20assets/forma-table-042-side.jpg",
      "image%20assets/forma-table-042-rear.jpg"
    ]
  },
  {
    "id": "forma-043-sculpted-pedestal-side-table",
    "name": "Sculpted Pedestal Side Table",
    "category": "Tables",
    "price": 64950,
    "material": "American walnut · hand-rubbed oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-043.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-043.jpg",
      "image%20assets/forma-table-043-side.jpg",
      "image%20assets/forma-table-043-rear.jpg"
    ]
  },
  {
    "id": "forma-044-slim-studio-desk",
    "name": "Slim Studio Desk",
    "category": "Tables",
    "price": 72300,
    "material": "Travertine · honed finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-044.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-044.jpg",
      "image%20assets/forma-table-044-side.jpg",
      "image%20assets/forma-table-044-rear.jpg"
    ]
  },
  {
    "id": "forma-045-onyx-vein-console",
    "name": "Onyx Vein Console",
    "category": "Tables",
    "price": 79650,
    "material": "Reclaimed teak · natural grain",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-045.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-045.jpg",
      "image%20assets/forma-table-045-side.jpg",
      "image%20assets/forma-table-045-rear.jpg"
    ]
  },
  {
    "id": "forma-046-sculptural-oak-dining-table",
    "name": "Sculptural Oak Dining Table",
    "category": "Tables",
    "price": 87000,
    "material": "Solid oak · natural oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-046.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-046.jpg",
      "image%20assets/forma-table-046-side.jpg",
      "image%20assets/forma-table-046-rear.jpg"
    ]
  },
  {
    "id": "forma-047-cove-oak-bedside-table",
    "name": "Cove Oak Bedside Table",
    "category": "Tables",
    "price": 94350,
    "material": "Smoked ash · matte finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-047.jpg",
    "size": "W 110 × D 62 × H 38 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-047.jpg",
      "image%20assets/forma-table-047-side.jpg",
      "image%20assets/forma-table-047-rear.jpg"
    ]
  },
  {
    "id": "forma-048-teak-trestle-bench-table",
    "name": "Teak Trestle Bench Table",
    "category": "Tables",
    "price": 101700,
    "material": "American walnut · hand-rubbed oil",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-048.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-048.jpg",
      "image%20assets/forma-table-048-side.jpg",
      "image%20assets/forma-table-048-rear.jpg"
    ]
  },
  {
    "id": "forma-049-black-marble-hall-console",
    "name": "Black Marble Hall Console",
    "category": "Tables",
    "price": 109050,
    "material": "Travertine · honed finish",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-049.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-table-049.jpg",
      "image%20assets/forma-table-049-side.jpg",
      "image%20assets/forma-table-049-rear.jpg"
    ]
  },
  {
    "id": "forma-050-walnut-oval-coffee-table",
    "name": "Walnut Oval Coffee Table",
    "category": "Tables",
    "price": 116400,
    "material": "Reclaimed teak · natural grain",
    "description": "Thoughtful proportions and a tactile finish bring quiet character to shared meals, working days and slower moments.",
    "image": "image%20assets/forma-table-050.jpg",
    "size": "W 180 × D 90 × H 76 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-table-050.jpg",
      "image%20assets/forma-table-050-side.jpg",
      "image%20assets/forma-table-050-rear.jpg"
    ]
  },
  {
    "id": "forma-051-still-oak-platform-bed",
    "name": "Still Oak Platform Bed",
    "category": "Bedroom",
    "price": 24000,
    "material": "Solid oak · natural oil",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-051.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-051.jpg",
      "image%20assets/forma-bedroom-051-side.jpg",
      "image%20assets/forma-bedroom-051-rear.jpg"
    ]
  },
  {
    "id": "forma-052-linen-cloud-king-bed",
    "name": "Linen Cloud King Bed",
    "category": "Bedroom",
    "price": 31350,
    "material": "Linen upholstery · kiln-dried teak",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-052.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-052.jpg",
      "image%20assets/forma-bedroom-052-side.jpg",
      "image%20assets/forma-bedroom-052-rear.jpg"
    ]
  },
  {
    "id": "forma-053-walnut-canopy-bed",
    "name": "Walnut Canopy Bed",
    "category": "Bedroom",
    "price": 38700,
    "material": "American walnut · hand finished",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-053.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-053.jpg",
      "image%20assets/forma-bedroom-053-side.jpg",
      "image%20assets/forma-bedroom-053-rear.jpg"
    ]
  },
  {
    "id": "forma-054-cane-arc-headboard-bed",
    "name": "Cane Arc Headboard Bed",
    "category": "Bedroom",
    "price": 46050,
    "material": "Natural cane · solid ash",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-054.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-054.jpg",
      "image%20assets/forma-bedroom-054-side.jpg",
      "image%20assets/forma-bedroom-054-rear.jpg"
    ]
  },
  {
    "id": "forma-055-soft-curve-upholstered-bed",
    "name": "Soft Curve Upholstered Bed",
    "category": "Bedroom",
    "price": 53400,
    "material": "Bouclé upholstery · walnut",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-055.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-055.jpg",
      "image%20assets/forma-bedroom-055-side.jpg",
      "image%20assets/forma-bedroom-055-rear.jpg"
    ]
  },
  {
    "id": "forma-056-walnut-two-drawer-nightstand",
    "name": "Walnut Two Drawer Nightstand",
    "category": "Bedroom",
    "price": 60750,
    "material": "Solid oak · natural oil",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-056.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-056.jpg",
      "image%20assets/forma-bedroom-056-side.jpg",
      "image%20assets/forma-bedroom-056-rear.jpg"
    ]
  },
  {
    "id": "forma-057-natural-oak-bedside-table",
    "name": "Natural Oak Bedside Table",
    "category": "Bedroom",
    "price": 68100,
    "material": "Linen upholstery · kiln-dried teak",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-057.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-057.jpg",
      "image%20assets/forma-bedroom-057-side.jpg",
      "image%20assets/forma-bedroom-057-rear.jpg"
    ]
  },
  {
    "id": "forma-058-fluted-cove-nightstand",
    "name": "Fluted Cove Nightstand",
    "category": "Bedroom",
    "price": 75450,
    "material": "American walnut · hand finished",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-058.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-058.jpg",
      "image%20assets/forma-bedroom-058-side.jpg",
      "image%20assets/forma-bedroom-058-rear.jpg"
    ]
  },
  {
    "id": "forma-059-marble-top-bedside-cabinet",
    "name": "Marble Top Bedside Cabinet",
    "category": "Bedroom",
    "price": 82800,
    "material": "Natural cane · solid ash",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-059.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-059.jpg",
      "image%20assets/forma-bedroom-059-side.jpg",
      "image%20assets/forma-bedroom-059-rear.jpg"
    ]
  },
  {
    "id": "forma-060-floating-walnut-nightstand",
    "name": "Floating Walnut Nightstand",
    "category": "Bedroom",
    "price": 90150,
    "material": "Bouclé upholstery · walnut",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-060.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-060.jpg",
      "image%20assets/forma-bedroom-060-side.jpg",
      "image%20assets/forma-bedroom-060-rear.jpg"
    ]
  },
  {
    "id": "forma-061-six-drawer-oak-dresser",
    "name": "Six Drawer Oak Dresser",
    "category": "Bedroom",
    "price": 97500,
    "material": "Solid oak · natural oil",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-061.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-061.jpg",
      "image%20assets/forma-bedroom-061-side.jpg",
      "image%20assets/forma-bedroom-061-rear.jpg"
    ]
  },
  {
    "id": "forma-062-walnut-tallboy-chest",
    "name": "Walnut Tallboy Chest",
    "category": "Bedroom",
    "price": 104850,
    "material": "Linen upholstery · kiln-dried teak",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-062.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-062.jpg",
      "image%20assets/forma-bedroom-062-side.jpg",
      "image%20assets/forma-bedroom-062-rear.jpg"
    ]
  },
  {
    "id": "forma-063-cane-front-dresser",
    "name": "Cane Front Dresser",
    "category": "Bedroom",
    "price": 112200,
    "material": "American walnut · hand finished",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-063.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-063.jpg",
      "image%20assets/forma-bedroom-063-side.jpg",
      "image%20assets/forma-bedroom-063-rear.jpg"
    ]
  },
  {
    "id": "forma-064-low-teak-dresser",
    "name": "Low Teak Dresser",
    "category": "Bedroom",
    "price": 119550,
    "material": "Natural cane · solid ash",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-064.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-064.jpg",
      "image%20assets/forma-bedroom-064-side.jpg",
      "image%20assets/forma-bedroom-064-rear.jpg"
    ]
  },
  {
    "id": "forma-065-sagewood-six-drawer-chest",
    "name": "Sagewood Six Drawer Chest",
    "category": "Bedroom",
    "price": 126900,
    "material": "Bouclé upholstery · walnut",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-065.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-065.jpg",
      "image%20assets/forma-bedroom-065-side.jpg",
      "image%20assets/forma-bedroom-065-rear.jpg"
    ]
  },
  {
    "id": "forma-066-cane-door-wardrobe",
    "name": "Cane Door Wardrobe",
    "category": "Bedroom",
    "price": 134250,
    "material": "Solid oak · natural oil",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-066.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-066.jpg",
      "image%20assets/forma-bedroom-066-side.jpg",
      "image%20assets/forma-bedroom-066-rear.jpg"
    ]
  },
  {
    "id": "forma-067-walnut-armoire",
    "name": "Walnut Armoire",
    "category": "Bedroom",
    "price": 141600,
    "material": "Linen upholstery · kiln-dried teak",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-067.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-067.jpg",
      "image%20assets/forma-bedroom-067-side.jpg",
      "image%20assets/forma-bedroom-067-rear.jpg"
    ]
  },
  {
    "id": "forma-068-classic-oak-wardrobe",
    "name": "Classic Oak Wardrobe",
    "category": "Bedroom",
    "price": 148950,
    "material": "American walnut · hand finished",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-068.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-068.jpg",
      "image%20assets/forma-bedroom-068-side.jpg",
      "image%20assets/forma-bedroom-068-rear.jpg"
    ]
  },
  {
    "id": "forma-069-linen-front-wardrobe",
    "name": "Linen Front Wardrobe",
    "category": "Bedroom",
    "price": 30300,
    "material": "Natural cane · solid ash",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-069.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-069.jpg",
      "image%20assets/forma-bedroom-069-side.jpg",
      "image%20assets/forma-bedroom-069-rear.jpg"
    ]
  },
  {
    "id": "forma-070-dressing-island-chest",
    "name": "Dressing Island Chest",
    "category": "Bedroom",
    "price": 37650,
    "material": "Bouclé upholstery · walnut",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-070.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-070.jpg",
      "image%20assets/forma-bedroom-070-side.jpg",
      "image%20assets/forma-bedroom-070-rear.jpg"
    ]
  },
  {
    "id": "forma-071-oak-upholstered-bedroom-bench",
    "name": "Oak Upholstered Bedroom Bench",
    "category": "Bedroom",
    "price": 45000,
    "material": "Solid oak · natural oil",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-071.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-071.jpg",
      "image%20assets/forma-bedroom-071-side.jpg",
      "image%20assets/forma-bedroom-071-rear.jpg"
    ]
  },
  {
    "id": "forma-072-bouclé-dressing-stool",
    "name": "Bouclé Dressing Stool",
    "category": "Bedroom",
    "price": 52350,
    "material": "Linen upholstery · kiln-dried teak",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-072.jpg",
    "size": "W 48 × D 42 × H 52 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-072.jpg",
      "image%20assets/forma-bedroom-072-side.jpg",
      "image%20assets/forma-bedroom-072-rear.jpg"
    ]
  },
  {
    "id": "forma-073-walnut-vanity-desk",
    "name": "Walnut Vanity Desk",
    "category": "Bedroom",
    "price": 59700,
    "material": "American walnut · hand finished",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-073.jpg",
    "size": "W 120 × D 52 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-073.jpg",
      "image%20assets/forma-bedroom-073-side.jpg",
      "image%20assets/forma-bedroom-073-rear.jpg"
    ]
  },
  {
    "id": "forma-074-rustic-blanket-chest",
    "name": "Rustic Blanket Chest",
    "category": "Bedroom",
    "price": 67050,
    "material": "Natural cane · solid ash",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-074.jpg",
    "size": "W 110 × D 38 × H 44 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-074.jpg",
      "image%20assets/forma-bedroom-074-side.jpg",
      "image%20assets/forma-bedroom-074-rear.jpg"
    ]
  },
  {
    "id": "forma-075-tufted-linen-storage-ottoman",
    "name": "Tufted Linen Storage Ottoman",
    "category": "Bedroom",
    "price": 74400,
    "material": "Bouclé upholstery · walnut",
    "description": "Made for a more restful room, with honest materials, softened lines and useful details finished by hand.",
    "image": "image%20assets/forma-bedroom-075.jpg",
    "size": "Queen · W 160 × L 208 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-bedroom-075.jpg",
      "image%20assets/forma-bedroom-075-side.jpg",
      "image%20assets/forma-bedroom-075-rear.jpg"
    ]
  },
  {
    "id": "forma-076-walnut-library-bookcase",
    "name": "Walnut Library Bookcase",
    "category": "Storage",
    "price": 38000,
    "material": "Solid walnut · hand finished",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-076.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-076.jpg",
      "image%20assets/forma-storage-076-side.jpg",
      "image%20assets/forma-storage-076-rear.jpg"
    ]
  },
  {
    "id": "forma-077-oak-four-door-sideboard",
    "name": "Oak Four Door Sideboard",
    "category": "Storage",
    "price": 45350,
    "material": "Solid oak · natural oil",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-077.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-077.jpg",
      "image%20assets/forma-storage-077-side.jpg",
      "image%20assets/forma-storage-077-rear.jpg"
    ]
  },
  {
    "id": "forma-078-fluted-teak-credenza",
    "name": "Fluted Teak Credenza",
    "category": "Storage",
    "price": 52700,
    "material": "Teak · brushed brass",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-078.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-078.jpg",
      "image%20assets/forma-storage-078-side.jpg",
      "image%20assets/forma-storage-078-rear.jpg"
    ]
  },
  {
    "id": "forma-079-black-frame-display-shelf",
    "name": "Black Frame Display Shelf",
    "category": "Storage",
    "price": 60050,
    "material": "Blackened steel · walnut",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-079.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-079.jpg",
      "image%20assets/forma-storage-079-side.jpg",
      "image%20assets/forma-storage-079-rear.jpg"
    ]
  },
  {
    "id": "forma-080-cane-front-cabinet",
    "name": "Cane Front Cabinet",
    "category": "Storage",
    "price": 67400,
    "material": "Cane weave · natural teak",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-080.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-080.jpg",
      "image%20assets/forma-storage-080-side.jpg",
      "image%20assets/forma-storage-080-rear.jpg"
    ]
  },
  {
    "id": "forma-081-walnut-media-console",
    "name": "Walnut Media Console",
    "category": "Storage",
    "price": 74750,
    "material": "Solid walnut · hand finished",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-081.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-081.jpg",
      "image%20assets/forma-storage-081-side.jpg",
      "image%20assets/forma-storage-081-rear.jpg"
    ]
  },
  {
    "id": "forma-082-slim-hallway-console",
    "name": "Slim Hallway Console",
    "category": "Storage",
    "price": 82100,
    "material": "Solid oak · natural oil",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-082.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-082.jpg",
      "image%20assets/forma-storage-082-side.jpg",
      "image%20assets/forma-storage-082-rear.jpg"
    ]
  },
  {
    "id": "forma-083-arched-glass-display-cabinet",
    "name": "Arched Glass Display Cabinet",
    "category": "Storage",
    "price": 89450,
    "material": "Teak · brushed brass",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-083.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-083.jpg",
      "image%20assets/forma-storage-083-side.jpg",
      "image%20assets/forma-storage-083-rear.jpg"
    ]
  },
  {
    "id": "forma-084-oak-drawer-chest",
    "name": "Oak Drawer Chest",
    "category": "Storage",
    "price": 96800,
    "material": "Blackened steel · walnut",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-084.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-084.jpg",
      "image%20assets/forma-storage-084-side.jpg",
      "image%20assets/forma-storage-084-rear.jpg"
    ]
  },
  {
    "id": "forma-085-teak-linen-armoire",
    "name": "Teak Linen Armoire",
    "category": "Storage",
    "price": 104150,
    "material": "Cane weave · natural teak",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-085.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-085.jpg",
      "image%20assets/forma-storage-085-side.jpg",
      "image%20assets/forma-storage-085-rear.jpg"
    ]
  },
  {
    "id": "forma-086-walnut-bar-cabinet",
    "name": "Walnut Bar Cabinet",
    "category": "Storage",
    "price": 111500,
    "material": "Solid walnut · hand finished",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-086.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-086.jpg",
      "image%20assets/forma-storage-086-side.jpg",
      "image%20assets/forma-storage-086-rear.jpg"
    ]
  },
  {
    "id": "forma-087-modular-open-shelving",
    "name": "Modular Open Shelving",
    "category": "Storage",
    "price": 118850,
    "material": "Solid oak · natural oil",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-087.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-087.jpg",
      "image%20assets/forma-storage-087-side.jpg",
      "image%20assets/forma-storage-087-rear.jpg"
    ]
  },
  {
    "id": "forma-088-narrow-fluted-cupboard",
    "name": "Narrow Fluted Cupboard",
    "category": "Storage",
    "price": 126200,
    "material": "Teak · brushed brass",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-088.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-088.jpg",
      "image%20assets/forma-storage-088-side.jpg",
      "image%20assets/forma-storage-088-rear.jpg"
    ]
  },
  {
    "id": "forma-089-sculptural-display-shelf",
    "name": "Sculptural Display Shelf",
    "category": "Storage",
    "price": 133550,
    "material": "Blackened steel · walnut",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-089.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-089.jpg",
      "image%20assets/forma-storage-089-side.jpg",
      "image%20assets/forma-storage-089-rear.jpg"
    ]
  },
  {
    "id": "forma-090-apothecary-drawer-cabinet",
    "name": "Apothecary Drawer Cabinet",
    "category": "Storage",
    "price": 140900,
    "material": "Cane weave · natural teak",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-090.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-090.jpg",
      "image%20assets/forma-storage-090-side.jpg",
      "image%20assets/forma-storage-090-rear.jpg"
    ]
  },
  {
    "id": "forma-091-woven-cane-storage-chest",
    "name": "Woven Cane Storage Chest",
    "category": "Storage",
    "price": 148250,
    "material": "Solid walnut · hand finished",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-091.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-091.jpg",
      "image%20assets/forma-storage-091-side.jpg",
      "image%20assets/forma-storage-091-rear.jpg"
    ]
  },
  {
    "id": "forma-092-dark-oak-sideboard",
    "name": "Dark Oak Sideboard",
    "category": "Storage",
    "price": 155600,
    "material": "Solid oak · natural oil",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-092.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-092.jpg",
      "image%20assets/forma-storage-092-side.jpg",
      "image%20assets/forma-storage-092-rear.jpg"
    ]
  },
  {
    "id": "forma-093-pale-ash-bookcase",
    "name": "Pale Ash Bookcase",
    "category": "Storage",
    "price": 162950,
    "material": "Teak · brushed brass",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-093.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-093.jpg",
      "image%20assets/forma-storage-093-side.jpg",
      "image%20assets/forma-storage-093-rear.jpg"
    ]
  },
  {
    "id": "forma-094-ribbed-front-credenza",
    "name": "Ribbed Front Credenza",
    "category": "Storage",
    "price": 44300,
    "material": "Blackened steel · walnut",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-094.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-094.jpg",
      "image%20assets/forma-storage-094-side.jpg",
      "image%20assets/forma-storage-094-rear.jpg"
    ]
  },
  {
    "id": "forma-095-walnut-record-cabinet",
    "name": "Walnut Record Cabinet",
    "category": "Storage",
    "price": 51650,
    "material": "Cane weave · natural teak",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-095.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-095.jpg",
      "image%20assets/forma-storage-095-side.jpg",
      "image%20assets/forma-storage-095-rear.jpg"
    ]
  },
  {
    "id": "forma-096-hall-tree-with-shoe-bench",
    "name": "Hall Tree with Shoe Bench",
    "category": "Storage",
    "price": 59000,
    "material": "Solid walnut · hand finished",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-096.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-096.jpg",
      "image%20assets/forma-storage-096-side.jpg",
      "image%20assets/forma-storage-096-rear.jpg"
    ]
  },
  {
    "id": "forma-097-walnut-drinks-trolley",
    "name": "Walnut Drinks Trolley",
    "category": "Storage",
    "price": 66350,
    "material": "Solid oak · natural oil",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-097.jpg",
    "size": "W 160 × D 45 × H 82 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-097.jpg",
      "image%20assets/forma-storage-097-side.jpg",
      "image%20assets/forma-storage-097-rear.jpg"
    ]
  },
  {
    "id": "forma-098-floating-wall-cabinet",
    "name": "Floating Wall Cabinet",
    "category": "Storage",
    "price": 73700,
    "material": "Teak · brushed brass",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-098.jpg",
    "size": "W 120 × D 58 × H 200 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-098.jpg",
      "image%20assets/forma-storage-098-side.jpg",
      "image%20assets/forma-storage-098-rear.jpg"
    ]
  },
  {
    "id": "forma-099-oak-pantry-wardrobe",
    "name": "Oak Pantry Wardrobe",
    "category": "Storage",
    "price": 81050,
    "material": "Blackened steel · walnut",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-099.jpg",
    "size": "W 130 × D 38 × H 82 cm",
    "lead": "Made to order · 4–8 weeks",
    "gallery": [
      "image%20assets/forma-storage-099.jpg",
      "image%20assets/forma-storage-099-side.jpg",
      "image%20assets/forma-storage-099-rear.jpg"
    ]
  },
  {
    "id": "forma-100-low-walnut-tv-console",
    "name": "Low Walnut TV Console",
    "category": "Storage",
    "price": 88400,
    "material": "Cane weave · natural teak",
    "description": "A calm, practical piece with carefully considered storage and warm natural texture for the spaces you live in.",
    "image": "image%20assets/forma-storage-100.jpg",
    "size": "W 120 × D 38 × H 188 cm",
    "lead": "Ready in 2–3 weeks",
    "gallery": [
      "image%20assets/forma-storage-100.jpg",
      "image%20assets/forma-storage-100-side.jpg",
      "image%20assets/forma-storage-100-rear.jpg"
    ]
  }
] as Product[];
