import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

type ModerationAction =
  | "APPROVE"
  | "REJECT"
  | "SUSPEND"
  | "REINSTATE";

const validVerificationLevels = [
  "BASIC",
  "VERIFIED",
  "TRUSTED",
] as const;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const property = await prisma.property.findUnique({
      where: {
        id: params.id,
      },
      include: {
        neighbourhood: {
          select: {
            name: true,
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        caretaker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        agent: {
          select: {
            id: true,
            agencyName: true,
            bio: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        verificationRecords: {
          orderBy: {
            createdAt: "desc",
          },
        },
        reports: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("ADMIN_PROPERTY_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load this property." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();

    const action = body.action as ModerationAction;
    const reason =
      typeof body.reason === "string"
        ? body.reason.trim()
        : "";

    const verificationLevel =
      body.verificationLevel;

    if (
      ![
        "APPROVE",
        "REJECT",
        "SUSPEND",
        "REINSTATE",
      ].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid moderation action." },
        { status: 400 }
      );
    }

    if (
      ["REJECT", "SUSPEND"].includes(action) &&
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            "A reason is required for rejection or suspension.",
        },
        { status: 400 }
      );
    }

    if (
      verificationLevel &&
      !validVerificationLevels.includes(
        verificationLevel
      )
    ) {
      return NextResponse.json(
        { error: "Invalid verification level." },
        { status: 400 }
      );
    }

    const existing = await prisma.property.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        title: true,
        listingStatus: true,
        verification: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    let listingStatus = existing.listingStatus;

    if (action === "APPROVE") {
      listingStatus = "ACTIVE";
    }

    if (action === "REJECT") {
      listingStatus = "REJECTED";
    }

    if (action === "SUSPEND") {
      listingStatus = "SUSPENDED";
    }

    if (action === "REINSTATE") {
      listingStatus = "ACTIVE";
    }

    const actionNames: Record<
      ModerationAction,
      string
    > = {
      APPROVE: "PROPERTY_APPROVED",
      REJECT: "PROPERTY_REJECTED",
      SUSPEND: "PROPERTY_SUSPENDED",
      REINSTATE: "PROPERTY_REINSTATED",
    };

    const property = await prisma.$transaction(
      async (tx) => {
        const updatedProperty =
          await tx.property.update({
            where: {
              id: existing.id,
            },
            data: {
              listingStatus,
              ...(verificationLevel
                ? {
                    verification: verificationLevel,
                  }
                : {}),
            },
            include: {
              neighbourhood: {
                select: {
                  name: true,
                },
              },
              images: {
                select: {
                  id: true,
                  url: true,
                  sortOrder: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          });

        if (verificationLevel) {
          await tx.verificationRecord.create({
            data: {
              propertyId: existing.id,
              level: verificationLevel,
              notes: reason || null,
              verifiedBy: auth.user.id,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: auth.user.id,
            action: actionNames[action],
            entity: "PROPERTY",
            entityId: existing.id,
            metadata: {
              propertyTitle: existing.title,
              previousStatus:
                existing.listingStatus,
              newStatus: listingStatus,
              reason: reason || null,
              verificationLevel:
                verificationLevel || null,
            },
          },
        });

        return updatedProperty;
      }
    );

    return NextResponse.json({
      property,
      message:
        action === "APPROVE"
          ? "Property approved successfully."
          : action === "REJECT"
            ? "Property rejected successfully."
            : action === "SUSPEND"
              ? "Property suspended successfully."
              : "Property reinstated successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN_PROPERTY_MODERATION_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to complete the moderation action.",
      },
      { status: 500 }
    );
  }
}
