import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bigquery from "@/lib/bigquery";
// Util: truncar a inicio del día (servidor)
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtISO(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${dd}-${mm}`.replace(/-(\d{2})$/, (m, dd) => `-${dd}`); // yyyy-MM-dd
}
function daysDiff(from, to) {
  const ONE = 24 * 60 * 60 * 1000;
  return Math.ceil((to - from) / ONE);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "todos").toLowerCase();

    const today = startOfToday();
    const includeAsesor = scope === "asesor" || scope === "todos";
    const includeBot    = scope === "bot"    || scope === "todos";

    let citas = [];
    let pagos = [];

    if (includeAsesor) {
      citas = await prisma.cita.findMany({
        include: { 
          cliente: { select: { nombre: true, celular: true, gestor: true } }
        }
      });
    }
    if (includeBot) {
      pagos = await prisma.pago.findMany({
        include: { 
          cliente: { select: { nombre: true, celular: true, gestor: true } }
        }
      });
    }

    // --- KPIs básicos ---
    const totalCitas = citas.length;
    const totalPagos = pagos.length;
    const totalPromesas = totalCitas + totalPagos;

    // Cumplidas por ahora = 0 (vendrá de BigQuery)
    const promesasCumplidas = 0;

    // Pendientes / Vencidas por fecha
    const vencidasCitas = citas.filter(c => new Date(c.fecha_cita) < today).length;
    const vencidasPagos = pagos.filter(p => new Date(p.fecha_pago) < today).length;
    const promesasVencidas = vencidasCitas + vencidasPagos;

    const pendientesCitas = citas.filter(c => new Date(c.fecha_cita) >= today).length;
    const pendientesPagos = pagos.filter(p => new Date(p.fecha_pago) >= today).length;
    const promesasPendientes = pendientesCitas + pendientesPagos;

    const tasaCumplimiento = totalPromesas > 0 ? Math.round((promesasCumplidas / totalPromesas) * 100) : 0;

    // Distribución para el pie
    const estados = [
      { name: "Cumplidas", value: promesasCumplidas, color: "#4CAF50" },
      { name: "Pendientes", value: promesasPendientes, color: "#FF9800" },
      { name: "Vencidas", value: promesasVencidas, color: "#F44336" },
    ];

    // Próximos vencimientos (próximos eventos en fecha futura)
    const upCitas = citas
      .filter(c => new Date(c.fecha_cita) >= today)
      .map(c => ({
        cliente: c.cliente?.nombre || "Cliente",
        monto: 0, // pendiente BigQuery
        fecha: fmtISO(c.fecha_cita),
        dias: daysDiff(today, new Date(c.fecha_cita)),
        telefono: c.cliente?.celular || "",
      }));

    const upPagos = pagos
      .filter(p => new Date(p.fecha_pago) >= today)
      .map(p => ({
        cliente: p.cliente?.nombre || "Cliente",
        monto: Number(p.monto || 0),
        fecha: fmtISO(p.fecha_pago),
        dias: daysDiff(today, new Date(p.fecha_pago)),
        telefono: p.cliente?.celular || "",
      }));

    const proximosVencimientos = [...upCitas, ...upPagos]
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 10);

    // Performance por gestor (solo útil si hay citas/asesor)
    let gestores = [];
    if (includeAsesor) {
      const map = new Map();
      for (const c of citas) {
        const key = c.cliente?.gestor || "Sin asignar";
        const entry = map.get(key) || { 
          nombre: key, promesas: 0, cumplidas: 0, monto: 0, tasa: 0, avatar: key?.[0]?.toUpperCase() || "?" 
        };
        entry.promesas += 1;
        // cumplidas = 0 (placeholder BigQuery)
        map.set(key, entry);
      }
      gestores = Array.from(map.values())
        .map(g => ({ ...g, tasa: g.promesas ? Math.round((g.cumplidas / g.promesas) * 100) : 0 }))
        .sort((a, b) => b.promesas - a.promesas)
        .slice(0, 6);
    }

    const payload = {
      totalPromesas,
      promesasCumplidas,
      promesasPendientes,
      promesasVencidas,
      montoTotal: 0, // pendiente BigQuery
      montoCumplido: 0, // pendiente BigQuery
      tasaCumplimiento,
      estados,
      gestores,
      proximosVencimientos,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[DASHBOARD_PROMESAS] Error:", err);
    return NextResponse.json({ error: "Internal error", details: String(err?.message || err) }, { status: 500 });
  }
}
