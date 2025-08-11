import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/clientes/historico-estado/[id]
export async function GET(req, { params }) {
  try {
    const clienteId = parseInt(params.id, 10);
    if (isNaN(clienteId)) {
      return NextResponse.json({ error: "ID de cliente no válido" }, { status: 400 });
    }

    // 1. Buscar el contrato del cliente
    const contrato = await prisma.contrato.findUnique({
      where: { cliente_id: clienteId },
      select: { contrato_id: true }
    });

    if (!contrato) {
      return NextResponse.json({ historico: [] }); // Sin contrato, sin histórico
    }

    // 2. Buscar el histórico de estados de ese contrato
    const historico = await prisma.historico_estado.findMany({
      where: { contrato_id: contrato.contrato_id },
      orderBy: { fecha_estado: "asc" },
      select: {
        fecha_estado: true,
        estado: true,
        detalle: true,
      },
    });

    return NextResponse.json({ historico });
  } catch (error) {
    console.error("Error en GET /api/clientes/historico-estado/[id]:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
