import {
  PrismaClient,
  PropertyIntent,
  PropertyType,
  AvailabilityStatus,
  VerificationLevel,
  ListingStatus,
  UserRole,
} from "@prisma/client";

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

const AMENITIES = [
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

const LANDLORD_ID = "00000000-0000-0000-0000-000000000001";
const CARETAKER_ID = "00000000-0000-0000-0000-000000000002";

const PROPERTY_IDS = {
  rongaiOneBedroom: "10000000-0000-0000-0000-000000000001",
  rongaiBedsitter: "10000000-0000-0000-0000-000000000002",
  kandisiOneBedroom: "10000000-0000-0000-0000-000000000003",
  rimpaBedsitter: "10000000-0000-0000-0000-000000000004",
  nkoroiMaisonette: "10000000-0000-0000-0000-000000000005",
  tualaTwoBedroom: "10000000-0000-0000-0000-000000000006",
  gatakaThreeBedroom: "10000000-0000-0000-0000-000000000007",
  maasaiLand: "10000000-0000-0000-0000-000000000008",
};

async function main() {
  const neighbourhoods: Record<string, { id: string }> = {};

  for (const name of NEIGHBOURHOODS) {
    const neighbourhood = await prisma.neighbourhood.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        townSlug: "ongata-rongai",
      },
    });

    neighbourhoods[name] = neighbourhood;
  }

  const amenities: Record<string, { id: string }> = {};

  for (const amenity of AMENITIES) {
    const record = await prisma.amenity.upsert({
      where: { key: amenity.key },
      update: { label: amenity.label },
      create: amenity,
    });

    amenities[amenity.key] = record;
  }

  await prisma.user.upsert({
    where: { id: LANDLORD_ID },
    update: {
      name: "Rongai Homes Test Landlord",
      phone: "254700000001",
      role: UserRole.LANDLORD,
    },
    create: {
      id: LANDLORD_ID,
      name: "Rongai Homes Test Landlord",
      email: "landlord.test@rongaihomes.local",
      phone: "254700000001",
      role: UserRole.LANDLORD,
    },
  });

  await prisma.user.upsert({
    where: { id: CARETAKER_ID },
    update: {
      name: "Rongai Homes Test Caretaker",
      phone: "254700000002",
      role: UserRole.CARETAKER,
    },
    create: {
      id: CARETAKER_ID,
      name: "Rongai Homes Test Caretaker",
      email: "caretaker.test@rongaihomes.local",
      phone: "254700000002",
      role: UserRole.CARETAKER,
    },
  });

  const kandisiBuilding = await prisma.building.upsert({
    where: { id: "20000000-0000-0000-0000-000000000001" },
    update: {
      name: "Kandisi Heights",
      address: "Kandisi, Ongata Rongai",
    },
    create: {
      id: "20000000-0000-0000-0000-000000000001",
      name: "Kandisi Heights",
      neighbourhoodId: neighbourhoods["Kandisi"].id,
      address: "Kandisi, Ongata Rongai",
      landlordId: LANDLORD_ID,
    },
  });

  const rimpaBuilding = await prisma.building.upsert({
    where: { id: "20000000-0000-0000-0000-000000000002" },
    update: {
      name: "Rimpa Court",
      address: "Rimpa, Ongata Rongai",
    },
    create: {
      id: "20000000-0000-0000-0000-000000000002",
      name: "Rimpa Court",
      neighbourhoodId: neighbourhoods["Rimpa"].id,
      address: "Rimpa, Ongata Rongai",
      landlordId: LANDLORD_ID,
    },
  });

  const properties = [
    {
      id: PROPERTY_IDS.rongaiOneBedroom,
      title: "1 Bedroom Apartment",
      description:
        "Bright one-bedroom apartment in Rongai Town with reliable water, parking and controlled access.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.ONE_BEDROOM,
      rentAmount: 14000,
      saleAmount: null,
      depositAmount: 14000,
      bedrooms: 1,
      bathrooms: 1,
      neighbourhoodId: neighbourhoods["Rongai Town"].id,
      buildingId: null,
      unitLabel: "B04",
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 18,
      amenities: ["parking", "water", "security"],
    },
    {
      id: PROPERTY_IDS.rongaiBedsitter,
      title: "Modern Bedsitter",
      description:
        "Affordable bedsitter close to Rongai Town amenities and public transport.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.BEDSITTER,
      rentAmount: 7500,
      saleAmount: null,
      depositAmount: 7500,
      bedrooms: 0,
      bathrooms: 1,
      neighbourhoodId: neighbourhoods["Rongai Town"].id,
      buildingId: null,
      unitLabel: "C12",
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 42,
      amenities: ["water", "security", "prepaid_electricity"],
    },
    {
      id: PROPERTY_IDS.kandisiOneBedroom,
      title: "1 Bedroom Apartment",
      description:
        "One-bedroom apartment in Kandisi with parking, reliable water and secure access.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.ONE_BEDROOM,
      rentAmount: 13500,
      saleAmount: null,
      depositAmount: 13500,
      bedrooms: 1,
      bathrooms: 1,
      neighbourhoodId: neighbourhoods["Kandisi"].id,
      buildingId: kandisiBuilding.id,
      unitLabel: "A03",
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 35,
      amenities: ["parking", "water", "cctv"],
    },
    {
      id: PROPERTY_IDS.rimpaBedsitter,
      title: "Bedsitter",
      description:
        "Clean bedsitter in Rimpa with CCTV and convenient access to local shops and transport.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.BEDSITTER,
      rentAmount: 7000,
      saleAmount: null,
      depositAmount: 7000,
      bedrooms: 0,
      bathrooms: 1,
      neighbourhoodId: neighbourhoods["Rimpa"].id,
      buildingId: rimpaBuilding.id,
      unitLabel: "D07",
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 120,
      amenities: ["cctv", "water", "electricity"],
    },
    {
      id: PROPERTY_IDS.nkoroiMaisonette,
      title: "2 Bedroom Maisonette",
      description:
        "Spacious two-bedroom maisonette in Nkoroi with borehole water, parking and pet-friendly space.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.MAISONETTE,
      rentAmount: 22000,
      saleAmount: null,
      depositAmount: 22000,
      bedrooms: 2,
      bathrooms: 2,
      neighbourhoodId: neighbourhoods["Nkoroi"].id,
      buildingId: null,
      unitLabel: null,
      verification: VerificationLevel.TRUSTED,
      verifiedMinutesAgo: 12,
      amenities: ["borehole", "parking", "pet_friendly"],
    },
    {
      id: PROPERTY_IDS.tualaTwoBedroom,
      title: "2 Bedroom Apartment",
      description:
        "Well-positioned two-bedroom apartment in Tuala with balcony, water and secure parking.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.TWO_BEDROOM,
      rentAmount: 18000,
      saleAmount: null,
      depositAmount: 18000,
      bedrooms: 2,
      bathrooms: 2,
      neighbourhoodId: neighbourhoods["Tuala"].id,
      buildingId: null,
      unitLabel: null,
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 55,
      amenities: ["balcony", "parking", "water"],
    },
    {
      id: PROPERTY_IDS.gatakaThreeBedroom,
      title: "3 Bedroom Standalone House",
      description:
        "Three-bedroom standalone house in Gataka with ample parking and reliable water supply.",
      intent: PropertyIntent.RENT_HOME,
      propertyType: PropertyType.STANDALONE_HOUSE,
      rentAmount: 30000,
      saleAmount: null,
      depositAmount: 30000,
      bedrooms: 3,
      bathrooms: 2,
      neighbourhoodId: neighbourhoods["Gataka"].id,
      buildingId: null,
      unitLabel: null,
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 70,
      amenities: ["parking", "water", "security"],
    },
    {
      id: PROPERTY_IDS.maasaiLand,
      title: "Serviced Land for Sale",
      description:
        "Residential land opportunity in Maasai Lodge suitable for a home or investment project.",
      intent: PropertyIntent.BUY_LAND,
      propertyType: PropertyType.LAND,
      rentAmount: null,
      saleAmount: 2500000,
      depositAmount: null,
      bedrooms: null,
      bathrooms: null,
      neighbourhoodId: neighbourhoods["Maasai Lodge"].id,
      buildingId: null,
      unitLabel: null,
      verification: VerificationLevel.VERIFIED,
      verifiedMinutesAgo: 90,
      acreage: 0.125,
      titleDeedStatus: "Title deed available for verification",
      roadAccess: "All-weather road",
      zoning: "Residential",
      amenities: [],
    },
  ];

  for (const property of properties) {
    const lastVerifiedAt = new Date(
      Date.now() - property.verifiedMinutesAgo * 60 * 1000
    );

    await prisma.property.upsert({
      where: { id: property.id },
      update: {
        title: property.title,
        description: property.description,
        intent: property.intent,
        propertyType: property.propertyType,
        rentAmount: property.rentAmount,
        saleAmount: property.saleAmount,
        depositAmount: property.depositAmount,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        neighbourhoodId: property.neighbourhoodId,
        buildingId: property.buildingId,
        unitLabel: property.unitLabel,
        landlordId: LANDLORD_ID,
        caretakerId: CARETAKER_ID,
        listingStatus: ListingStatus.ACTIVE,
        availability: AvailabilityStatus.AVAILABLE_NOW,
        lastVerifiedAt,
        verification: property.verification,
        acreage: property.acreage,
        titleDeedStatus: property.titleDeedStatus,
        roadAccess: property.roadAccess,
        zoning: property.zoning,
      },
      create: {
        id: property.id,
        title: property.title,
        description: property.description,
        intent: property.intent,
        propertyType: property.propertyType,
        rentAmount: property.rentAmount,
        saleAmount: property.saleAmount,
        depositAmount: property.depositAmount,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        neighbourhoodId: property.neighbourhoodId,
        buildingId: property.buildingId,
        unitLabel: property.unitLabel,
        landlordId: LANDLORD_ID,
        caretakerId: CARETAKER_ID,
        listingStatus: ListingStatus.ACTIVE,
        availability: AvailabilityStatus.AVAILABLE_NOW,
        lastVerifiedAt,
        verification: property.verification,
        acreage: property.acreage,
        titleDeedStatus: property.titleDeedStatus,
        roadAccess: property.roadAccess,
        zoning: property.zoning,
      },
    });

    await prisma.availabilityRecord.deleteMany({
      where: { propertyId: property.id },
    });

    await prisma.availabilityRecord.create({
      data: {
        propertyId: property.id,
        status: AvailabilityStatus.AVAILABLE_NOW,
        confirmedBy: CARETAKER_ID,
      },
    });

    await prisma.verificationRecord.deleteMany({
      where: { propertyId: property.id },
    });

    await prisma.verificationRecord.create({
      data: {
        propertyId: property.id,
        level: property.verification,
        notes: "Development test property for Rongai Homes.",
        verifiedBy: null,
      },
    });

    await prisma.propertyAmenity.deleteMany({
      where: { propertyId: property.id },
    });

    if (property.amenities.length > 0) {
      await prisma.propertyAmenity.createMany({
        data: property.amenities.map((key) => ({
          propertyId: property.id,
          amenityId: amenities[key].id,
        })),
      });
    }
  }

  console.log("Rongai Homes seed completed successfully.");
  console.log(`Neighbourhoods: ${NEIGHBOURHOODS.length}`);
  console.log(`Amenities: ${AMENITIES.length}`);
  console.log(`Properties: ${properties.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
