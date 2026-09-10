import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);

    const status =
      searchParams.get("status") || "PENDING_APPROVAL";

    const properties = await prisma.property.findMany({
      where: {
        listingStatus: status as
          | "DRAFT"
          | "PENDING_APPROVAL"
          | "ACTIVE"
          | "REJECTED"
          | "SUSPENDED",
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
          take: 10,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      properties,
      count: properties.length,
      status,
    });
  } catch (error) {
    console.error("ADMIN_PROPERTIES_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load admin properties." },
      { status: 500 }
    );
  }
}
