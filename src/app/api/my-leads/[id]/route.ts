import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "ASSIGNED",
    "VIEWING_SCHEDULED",
    "COMPLETED",
    "CLOSED",
  ]),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide a valid lead status." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        property: {
          landlordId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: result.data.status,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("LEAD_STATUS_UPDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update the enquiry status." },
      { status: 500 }
    );
  }
}
