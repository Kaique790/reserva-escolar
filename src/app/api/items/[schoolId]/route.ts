import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthOptions } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

const createItemSchema = z
  .object({
    name: z.string().trim().min(1).max(191),
    description: z.string().trim().max(16_000).nullable().optional(),
  })
  .strict();

const updateItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(191).optional(),
    description: z.string().trim().max(16_000).nullable().optional(),
    isActive: z.number().optional(),
  })
  .strict();

const deleteItemSchema = z.object({
  itemId: z.string().min(1),
});

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await getServerSession(createAuthOptions());

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 403 },
      );
    }

    const { schoolId } = await context.params;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        members: {
          where: { userId: user.id, status: "ACTIVE" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escola não encontrada." },
        { status: 404 },
      );
    }

    if (school.members.length === 0) {
      return NextResponse.json(
        { error: "Você não é membro ativo desta escola." },
        { status: 403 },
      );
    }

    const items = await prisma.item.findMany({
      where: { schoolId: school.id },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar itens da escola:", error);

    return NextResponse.json(
      { error: "Erro ao buscar itens da escola." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await getServerSession(createAuthOptions());

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 403 },
      );
    }

    const { schoolId } = await context.params;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        members: {
          where: { userId: user.id, status: "ACTIVE", role: "ADMIN" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escola não encontrada." },
        { status: 404 },
      );
    }

    if (school.members.length === 0) {
      return NextResponse.json(
        {
          error: "Somente administradores ativos da escola podem criar itens.",
        },
        { status: 403 },
      );
    }

    const requestBody = await readJsonBody(request);

    if ("response" in requestBody) {
      return requestBody.response;
    }

    const result = createItemSchema.safeParse(requestBody.body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados do item inválidos.",
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.create({
      data: {
        schoolId: school.id,
        ...result.data,
      },
    });

    return NextResponse.json(
      { success: true, item },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um item com esse nome nesta escola." },
        { status: 409 },
      );
    }

    console.error("Erro ao criar item da escola:", error);

    return NextResponse.json(
      { error: "Erro ao criar item da escola." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await getServerSession(createAuthOptions());

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 403 },
      );
    }

    const { schoolId } = await context.params;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        members: {
          where: { userId: user.id, status: "ACTIVE", role: "ADMIN" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escola não encontrada." },
        { status: 404 },
      );
    }

    if (school.members.length === 0) {
      return NextResponse.json(
        {
          error: "Somente administradores ativos da escola podem criar itens.",
        },
        { status: 403 },
      );
    }

    const requestBody = await readJsonBody(request);

    if ("response" in requestBody) {
      return requestBody.response;
    }

    const result = updateItemSchema.safeParse(requestBody.body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados do item inválidos.",
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.update({
      where: { id: result.data.id },
      data: {
        name: result.data.name,
        description: result.data.description,
        isActive: result.data.isActive === 0 ? true : false,
      },
    });

    return NextResponse.json(
      { success: true, item },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um item com esse nome nesta escola." },
        { status: 409 },
      );
    }

    console.error("Erro ao editar item da escola:", error);

    return NextResponse.json(
      { error: "Erro ao editar item da escola." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await getServerSession(createAuthOptions());

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 403 },
      );
    }

    const { schoolId } = await context.params;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        members: {
          where: { userId: user.id, status: "ACTIVE", role: "ADMIN" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escola não encontrada." },
        { status: 404 },
      );
    }

    if (school.members.length === 0) {
      return NextResponse.json(
        {
          error: "Somente administradores ativos da escola podem deletar itens.",
        },
        { status: 403 },
      );
    }

    const requestBody = await readJsonBody(request);

    if ("response" in requestBody) {
      return requestBody.response;
    }

    const result = deleteItemSchema.safeParse(requestBody.body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados do item inválidos.",
          issues: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const item = await prisma.item.delete({
      where: { id: result.data.itemId },
    });

    return NextResponse.json(
      { success: true, message: `Item '${item.name}' deletado com sucesso.` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao deletar item da escola:", error);

    return NextResponse.json(
      { error: "Erro ao deletar item da escola." },
      { status: 500 },
    );
  }
}