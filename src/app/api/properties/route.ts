import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const propertySchema = z.object({
  intent: z.enum([
    "RENT_HOME",
    "BUY_HOME",
    "BUY_LAND",
    "RENT_COMMERCIAL",
    "BUY_COMMERCIAL",
  ]),
  title: z.string().min(3),
  propertyType: z.string().min(1),
  neighbourhood: z.string().min(1),
  description: z.string().optional(),
  rentAmount: z.coerce.number().int().positive().optional(),
  saleAmount: z.coerce.number().int().positive().optional(),
  depositAmount: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to list a property." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please provide all required property information.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const neighbourhood = await prisma.neighbourhood.findUnique({
      where: {
        name: data.neighbourhood,
      },
    });

    if (!neighbourhood) {
      return NextResponse.json(
        { error: "The selected neighbourhood could not be found." },
        { status: 400 }
      );
    }
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    id: true,
    role: true,
    agentProfile: {
      select: {
        id: true,
      },
    },
  },
});

if (!user) {
  return NextResponse.json(
    { error: "Your account could not be found." },
    { status: 401 }
  );
}

if (user.role === "TENANT") {
  return NextResponse.json(
    {
      error:
        "Only landlords, caretakers, and registered agents can list properties.",
    },
    { status: 403 }
  );
}

if (user.role === "AGENT" && !user.agentProfile) {
  return NextResponse.json(
    {
      error:
        "Your agent profile has not been set up yet. Please complete your agent profile before listing a property.",
    },
    { status: 403 }
  );
}
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description || null,
        intent: data.intent,
        propertyType: data.propertyType as any,
        rentAmount: data.rentAmount ?? null,
        saleAmount: data.saleAmount ?? null,
        depositAmount: data.depositAmount ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,

        neighbourhoodId: neighbourhood.id,

        landlordId: user.role === "LANDLORD" ? user.id : null,
caretakerId: user.role === "CARETAKER" ? user.id : null,
agentId:
  user.role === "AGENT" && user.agentProfile
    ? user.agentProfile.id
    : null,

        listingStatus: "PENDING_APPROVAL",
        availability: "NOT_CONFIRMED",
        verification: "BASIC",
      },
    });

    return NextResponse.json(
      {
        success: true,
        propertyId: property.id,
        message: "Property submitted for review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PROPERTY_SUBMISSION_ERROR", error);

    return NextResponse.json(
      { error: "Something went wrong while submitting the property." },
      { status: 500 }
    );
  }
}
