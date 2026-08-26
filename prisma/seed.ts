import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEIGHBOURHOODS = [
  "Rongai Town",
  "Rimpa",
  "Kandisi",
  "Nkoroi",
  "Tuala",
  "Gataka",
  "Maasai Lodge",
  "Kware",
  "Matasia",
];

const AMENITIES: { key: string; label: string }[] = [
  { key: "parking", label: "Parking" },
  { key: "water", label: "Water" },
  { key: "borehole", label: "Borehole" },
  { key: "electricity", label: "Electricity" },
  { key: "security", label: "Security" },
  { key: "cctv", label: "CCTV" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "balcony", label: "Balcony" },
  { key: "laundry", label: "Laundry" },
  { key: "pet_friendly", label: "Pet friendly" },
  { key: "children_friendly", label: "Children friendly" },
  { key: "prepaid_electricity", label: "Prepaid electricity" },
  { key: "garbage_collection", label: "Garbage collection" },
];

async function main() {
  for (const name of NEIGHBOURHOODS) {
    await prisma.neighbourhood.upsert({
      where: { name },
      update: {},
      create: { name, townSlug: "ongata-rongai" },
    });
  }

  for (const amenity of AMENITIES) {
    await prisma.amenity.upsert({
      where: { key: amenity.key },
      update: { label: amenity.label },
      create: amenity,
    });
  }

  console.log(`Seeded ${NEIGHBOURHOODS.length} neighbourhoods and ${AMENITIES.length} amenities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
