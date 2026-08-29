import { PrismaClient, AvailabilityStatus, ListingStatus, PropertyIntent, PropertyType, VerificationLevel } from "@prisma/client";

const prisma = new PrismaClient();

const PROPERTIES = [
  {
    title: "Modern Bedsitter in Rimpa",
    description: "Affordable bedsitter in a convenient location in Rimpa.",
    intent: PropertyIntent.RENT_HOME,
    propertyType: PropertyType.BEDSITTER,
    rentAmount: 7000,
    bedrooms: 1,
    bathrooms: 1,
    area: "Rimpa",
    verification: VerificationLevel.VERIFIED,
  },
  {
    title: "1 Bedroom Apartment in Kandisi",
    description: "Spacious 1 bedroom apartment with parking and reliable water.",
    intent: PropertyIntent.RENT_HOME,
    propertyType: PropertyType.ONE_BEDROOM,
    rentAmount: 13500,
    bedrooms: 1,
    bathrooms: 1,
    area: "Kandisi",
    verification: VerificationLevel.VERIFIED,
  },
  {
    title: "2 Bedroom Maisonette in Nkoroi",
    description: "Family-friendly 2 bedroom maisonette with borehole water.",
    intent: PropertyIntent.RENT_HOME,
    propertyType: PropertyType.TWO_BEDROOM,
    rentAmount: 22000,
    bedrooms: 2,
    bathrooms: 2,
    area: "Nkoroi",
    verification: VerificationLevel.TRUSTED,
  },
  {
    title: "3 Bedroom Maisonette for Sale",
    description: "Modern 3 bedroom maisonette in a growing residential neighbourhood.",
    intent: PropertyIntent.BUY_HOME,
    propertyType: PropertyType.MAISONETTE,
    saleAmount: 8500000,
    bedrooms: 3,
    bathrooms: 3,
    area: "Tuala",
    verification: VerificationLevel.VERIFIED,
  },
  {
    title: "Modern Apartment for Sale",
    description: "Modern apartment unit suitable for investment or owner occupation.",
    intent: PropertyIntent.BUY_HOME,
    propertyType: PropertyType.APARTMENT,
    saleAmount: 6500000,
    bedrooms: 2,
    bathrooms: 2,
    area: "Rongai Town",
    verification: VerificationLevel.VERIFIED,
  },
  {
    title: "50 x 100 Residential Plot",
    description: "Residential plot available in a developing section of Ongata Rongai.",
    intent: PropertyIntent.BUY_LAND,
    propertyType: PropertyType.LAND,
    saleAmount: 2800000,
    area: "Gataka",
    verification: VerificationLevel.TRUSTED,
  },
  {
    title: "Commercial Plot for Sale",
    description: "Strategically located commercial plot suitable for development.",
    intent: PropertyIntent.BUY_LAND,
    propertyType: PropertyType.COMMERCIAL_PLOT,
    saleAmount: 5500000,
    area: "Maasai Lodge",
    verification: VerificationLevel.VERIFIED,
  },
  {
    title: "Roadside Shop in Rongai Town",
    description: "Commercial shop suitable for retail or service business.",
    intent: PropertyIntent.RENT_COMMERCIAL,
    propertyType: PropertyType.SHOP,
    rentAmount: 25000,
    area: "Rongai Town",
    verification: VerificationLevel.VERIFIED,
  },
];

async function main() {
  for (const property of PROPERTIES) {
    const neighbourhood = await prisma.neighbourhood.findUnique({
      where: {
        name: property.area,
      },
    });

    if (!neighbourhood) {
      throw new Error(`Neighbourhood not found: ${property.area}`);
    }

    await prisma.property.create({
      data: {
        title: property.title,
        description: property.description,
        intent: property.intent,
        propertyType: property.propertyType,
        rentAmount: property.rentAmount,
        saleAmount: property.saleAmount,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        neighbourhoodId: neighbourhood.id,
        listingStatus: ListingStatus.ACTIVE,
        availability: AvailabilityStatus.AVAILABLE_NOW,
        verification: property.verification,
        lastVerifiedAt: new Date(),
      },
    });
  }

  console.log(`Created ${PROPERTIES.length} test properties.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
