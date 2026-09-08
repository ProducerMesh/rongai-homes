import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
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

    if (!user) {
      return NextResponse.json(
        { error: "Your account could not be found." },
        { status: 401 }
      );
    }

    if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to view lead assignees." },
        { status: 403 }
      );
    }

    const assignees = await prisma.user.findMany({
      where: {
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
        name: true,
        phone: true,
        role: true,
        agentProfile: {
          select: {
            agencyName: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      assignees,
    });
  } catch (error) {
    console.error("LEAD_ASSIGNEES_ERROR", error);

    return NextResponse.json(
      { error: "Unable to load lead assignees." },
      { status: 500 }
    );
  }
}
