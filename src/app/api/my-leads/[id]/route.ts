import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateLeadSchema = z
  .object({
    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "ASSIGNED",
        "VIEWING_SCHEDULED",
        "COMPLETED",
        "CLOSED",
      ])
      .optional(),
    assignedToId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.assignedToId !== undefined,
    {
      message: "Please provide a status or assignee.",
    }
  );

export const dynamic = "force-dynamic";

export async function GET(
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

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        property: {
          landlordId: session.user.id,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            neighbourhood: {
              select: {
                name: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            agentProfile: {
              select: {
                agencyName: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lead,
    });
  } catch (error) {
    console.error("MY_LEAD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load the enquiry." },
      { status: 500 }
    );
  }
}

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
    const result = updateLeadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide a valid lead update." },
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

    const data: {
      status?: z.infer<typeof updateLeadSchema>["status"];
      assignedToId?: string | null;
    } = {};

    if (result.data.status !== undefined) {
      data.status = result.data.status;
    }

    if (result.data.assignedToId !== undefined) {
      if (result.data.assignedToId === null) {
        data.assignedToId = null;
      } else {
        const assignee = await prisma.user.findFirst({
          where: {
            id: result.data.assignedToId,
            OR: [
              {
                role: "CARETAKER",
              },
              {
                role: "AGENT",
                agentProfile: {
                  isNot: null,
                },
              },
            ],
          },
          select: {
            id: true,
          },
        });

        if (!assignee) {
          return NextResponse.json(
            {
              error:
                "The selected person is not an eligible agent or caretaker.",
            },
            { status: 400 }
          );
        }

        data.assignedToId = assignee.id;
      }
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data,
      select: {
        id: true,
        status: true,
        assignedToId: true,
        updatedAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            agentProfile: {
              select: {
                agencyName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("LEAD_UPDATE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to update the enquiry." },
      { status: 500 }
    );
  }
}
