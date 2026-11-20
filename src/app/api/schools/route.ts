import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthOptions } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

const createSchoolSchema = z.object({
  name: z.string().trim().min(1).max(191),
});

const updateSchoolSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().trim().min(1).max(191),
});

const deleteSchoolSchema = z.object({
  schoolId: z.string().min(1),
});

async function getActiveUser() {
  const session = await getServerSession(createAuthOptions());

  if (!session?.user?.email) {
    return {
      response: NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      ),
    };
  }

  const user = await getPrismaClient().user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return {
      response: NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

async function readJsonBody(request: Request) {
  try {
    const body: unknown = await request.json();
    return { body };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        response: NextResponse.json(
          { error: "Corpo JSON inválido." },
          { status: 400 },
        ),
      };
    }

    throw error;
  }
}

async function getSchoolAdminAccess(userId: string, schoolId: string) {
  const school = await getPrismaClient().school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      members: {
        where: {
          userId,
          role: "ADMIN",
          status: "ACTIVE",
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!school) {
    return {
      response: NextResponse.json(
        { error: "Escola não encontrada." },
        { status: 404 },
      ),
    };
  }

  if (school.members.length === 0) {
    return {
      response: NextResponse.json(
        { error: "Somente administradores ativos da escola podem alterá-la." },
        { status: 403 },
      ),
    };
  }

  return { schoolId: school.id };
}

function createSchoolSlug(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slugBase = (normalizedName || "escola").slice(0, 140);

  return `${slugBase}-${randomUUID()}`;
}

function isDuplicateSchoolName(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;

  return Array.isArray(target)
    ? target.includes("name")
    : typeof target === "string" && target.includes("name");
}

export async function POST(request: Request) {
  const authentication = await getActiveUser();

  if ("response" in authentication) {
    return authentication.response;
  }

  const requestBody = await readJsonBody(request);

  if ("response" in requestBody) {
    return requestBody.response;
  }

  const result = createSchoolSchema.safeParse(requestBody.body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Informe um nome de escola válido (até 191 caracteres)." },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();

  try {
    const school = await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: authentication.user.id },
        data: { role: "ADMIN" },
      });

      return transaction.school.create({
        data: {
          name: result.data.name,
          slug: createSchoolSlug(result.data.name),
          ownerId: authentication.user.id,
          members: {
            create: {
              userId: authentication.user.id,
              role: "ADMIN",
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({ school }, { status: 201 });
  } catch (error) {
    if (isDuplicateSchoolName(error)) {
      return NextResponse.json(
        { error: "Já existe uma escola com esse nome." },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function PATCH(request: Request) {
  const authentication = await getActiveUser();

  if ("response" in authentication) {
    return authentication.response;
  }

  const requestBody = await readJsonBody(request);

  if ("response" in requestBody) {
    return requestBody.response;
  }

  const result = updateSchoolSchema.safeParse(requestBody.body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Informe schoolId e um nome válido (até 191 caracteres)." },
      { status: 400 },
    );
  }

  const access = await getSchoolAdminAccess(
    authentication.user.id,
    result.data.schoolId,
  );

  if ("response" in access) {
    return access.response;
  }

  try {
    const school = await getPrismaClient().school.update({
      where: { id: access.schoolId },
      data: {
        name: result.data.name,
        slug: createSchoolSlug(result.data.name),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ school });
  } catch (error) {
    if (isDuplicateSchoolName(error)) {
      return NextResponse.json(
        { error: "Já existe uma escola com esse nome." },
        { status: 409 },
      );
    }

    throw error;
  }
}

export async function DELETE(request: Request) {
  const authentication = await getActiveUser();

  if ("response" in authentication) {
    return authentication.response;
  }

  const requestBody = await readJsonBody(request);

  if ("response" in requestBody) {
    return requestBody.response;
  }

  const result = deleteSchoolSchema.safeParse(requestBody.body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Informe um schoolId válido." },
      { status: 400 },
    );
  }

  const access = await getSchoolAdminAccess(
    authentication.user.id,
    result.data.schoolId,
  );

  if ("response" in access) {
    return access.response;
  }

  await getPrismaClient().school.delete({
    where: { id: access.schoolId },
  });

  return new NextResponse(null, { status: 204 });
}
