import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  propertyId: z.string().min(1),
  contactName: z.string().trim().min(1).max(100).optional(),
  contactPhone: z.string().trim().min(5).max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please provide valid enquiry information.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const property = await prisma.property.findUnique({
      where: {
        id: data.propertyId,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "The property could not be found." },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);

    const lead = await prisma.lead.create({
      data: {
        propertyId: property.id,
        seekerId: session?.user?.id ?? null,
        channel: "WHATSAPP",
        status: "NEW",
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        message: data.message || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        message: "Your enquiry has been received.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("LEAD_CREATION_ERROR", error);

    return NextResponse.json(
      { error: "Something went wrong while submitting your enquiry." },
      { status: 500 }
    );
  }
}
