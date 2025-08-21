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


// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import bigquery from "@/lib/bigquery"; // ← usa tu helper existente

// // ====== columnas/tabla en BigQuery ======
// const BQ_TABLE_FONDOS = "`peak-emitter-350713.FR_general.bd_fondos`";
// const BQ_COL_CODIGO   = "Codigo_Asociado";
// const BQ_COL_DNI      = "N_Doc";                 // ajusta si tu campo se llama distinto
// const BQ_COL_FECHA    = "`Fec_últ_pág_ccap`";  // nombre con espacios/acentos: entre backticks

// // ------ utilidades ------
// function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
// function yyyyMmDd(d) { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; }
// function daysBetween(a,b){const ONE=86400000;const A=new Date(a);A.setHours(0,0,0,0);const B=new Date(b);B.setHours(0,0,0,0);return Math.ceil((B-A)/ONE);}

// // ====== consulta a BigQuery: última fecha de pago por código/DNI ======
// async function fetchUltimosPagos({ codigos = [], dnis = [] }) {
//   // limpia y normaliza
//   const codigosArr = Array.from(new Set((codigos || []).filter(Boolean).map(String)));
//   const dnisArr    = Array.from(new Set((dnis || []).filter(Boolean).map(String)));

//   if (codigosArr.length === 0 && dnisArr.length === 0) {
//     return { byCodigo: new Map(), byDni: new Map() };
//   }

//   const sql = `
//     SELECT
//       CAST(${BQ_COL_CODIGO} AS STRING) AS codigo,
//       CAST(${BQ_COL_DNI}    AS STRING) AS dni,
//       DATE(${BQ_COL_FECHA})            AS fec_ult_pag
//     FROM ${BQ_TABLE_FONDOS}
//     WHERE
//       (ARRAY_LENGTH(@codigos) = 0 OR CAST(${BQ_COL_CODIGO} AS STRING) IN UNNEST(@codigos))
//       OR
//       (ARRAY_LENGTH(@dnis)    = 0 OR CAST(${BQ_COL_DNI}    AS STRING) IN UNNEST(@dnis))
//   `;

//   // 👇 Si alguno de los arrays está vacío, hay que declarar su tipo
//   const [rows] = await bigquery.query({
//     query: sql,
//     params: { codigos: codigosArr, dnis: dnisArr },
//     types:  { codigos: ['STRING'], dnis: ['STRING'] }  // <= clave del fix
//   });

//   const byCodigo = new Map();
//   const byDni    = new Map();
//   for (const r of rows) {
//     if (r.codigo) byCodigo.set(String(r.codigo), r.fec_ult_pag);
//     if (r.dni)    byDni.set(String(r.dni),       r.fec_ult_pag);
//   }
//   return { byCodigo, byDni };
// }


// export async function GET(req) {
//   try {
//     const url = new URL(req.url);
//     const scope = (url.searchParams.get("scope") || "todos").toLowerCase(); // todos | asesor | bot
//     const includeAsesor = scope === "asesor" || scope === "todos";
//     const includeBot    = scope === "bot"    || scope === "todos";

//     // 1) Traer compromisos desde Postgres
//     let citas = [], pagos = [];
//     if (includeAsesor) {
//       citas = await prisma.cita.findMany({
//         include: { cliente: { select: {
//           cliente_id: true, nombre: true, celular: true, gestor: true,
//           documento_identidad: true,  // DNI
//           codigo_asociado: true,      // contrato
//           monto: true                 // monto objetivo del cliente
//         }}}
//       });
//     }
//     if (includeBot) {
//       pagos = await prisma.pago.findMany({
//         include: { cliente: { select: {
//           cliente_id: true, nombre: true, celular: true, gestor: true,
//           documento_identidad: true,
//           codigo_asociado: true,
//           monto: true
//         }}}
//       });
//     }

//     // 2) Unificar compromisos
//     const compromisos = [];
//     if (includeAsesor) for (const c of citas) {
//       compromisos.push({ tipo: "asesor", fecha: new Date(c.fecha_cita), cliente: c.cliente, monto: Number(c.cliente?.monto || 0) });
//     }
//     if (includeBot) for (const p of pagos) {
//       compromisos.push({ tipo: "bot", fecha: new Date(p.fecha_pago), cliente: p.cliente, monto: Number(p.monto ?? p.cliente?.monto ?? 0) });
//     }
//     if (compromisos.length === 0) {
//       return NextResponse.json({
//         totalPromesas: 0, promesasCumplidas: 0, promesasPendientes: 0, promesasVencidas: 0,
//         montoTotal: 0, montoCumplido: 0, tasaCumplimiento: 0,
//         estados: [
//           { name: "Cumplidas", value: 0, color: "#4CAF50" },
//           { name: "Pendientes", value: 0, color: "#FF9800" },
//           { name: "Vencidas",   value: 0, color: "#F44336" },
//         ],
//         gestores: [], proximosVencimientos: []
//       });
//     }

//     // 3) Preparar listas para BigQuery
//     const codigos = []; const dnis = [];
//     for (const c of compromisos) {
//       if (c.cliente?.codigo_asociado) codigos.push(String(c.cliente.codigo_asociado));
//       if (c.cliente?.documento_identidad) dnis.push(String(c.cliente.documento_identidad));
//     }

//     // 4) BigQuery
//     const { byCodigo, byDni } = await fetchUltimosPagos({ codigos, dnis });

//     // 5) Clasificación y métricas
//     const today = startOfToday();
//     let totalPromesas = compromisos.length;
//     let promesasCumplidas = 0, promesasPendientes = 0, promesasVencidas = 0;
//     let montoTotalPendiente = 0, montoCumplido = 0;
//     const proximosVencimientos = [];

//     for (const c of compromisos) {
//       const cod = c.cliente?.codigo_asociado ? String(c.cliente.codigo_asociado) : null;
//       const dni = c.cliente?.documento_identidad ? String(c.cliente.documento_identidad) : null;
//       const fecUltPagStr = (cod && byCodigo.get(cod)) || (dni && byDni.get(dni)) || null;

//       let cumplida = false;
//       if (fecUltPagStr) cumplida = new Date(fecUltPagStr) <= c.fecha;

//       if (cumplida) {
//         promesasCumplidas += 1;
//         montoCumplido += Number(c.monto || 0);
//       } else {
//         if (c.fecha < today) promesasVencidas += 1; else promesasPendientes += 1;
//         montoTotalPendiente += Number(c.monto || 0);
//         if (c.fecha >= today) {
//           proximosVencimientos.push({
//             cliente: c.cliente?.nombre || "Cliente",
//             monto: Number(c.monto || 0),
//             fecha: yyyyMmDd(c.fecha),
//             dias: daysBetween(today, c.fecha),
//             telefono: c.cliente?.celular || ""
//           });
//         }
//       }
//     }
//     proximosVencimientos.sort((a,b)=>a.dias-b.dias); proximosVencimientos.splice(10);
//     const tasaCumplimiento = totalPromesas ? Math.round((promesasCumplidas/totalPromesas)*100) : 0;

//     // performance por gestor (solo asesor/todos)
//     const gestoresMap = new Map();
//     if (scope !== "bot") {
//       for (const c of compromisos.filter(x=>x.tipo==="asesor")) {
//         const key = c.cliente?.gestor || "Sin asignar";
//         const g = gestoresMap.get(key) || { nombre:key, promesas:0, cumplidas:0, monto:0, avatar:(key?.[0]||"?").toUpperCase() };
//         g.promesas += 1;
//         g.monto += Number(c.monto || 0);
//         gestoresMap.set(key, g);
//       }
//     }
//     const gestores = Array.from(gestoresMap.values()).map(g => ({ ...g, tasa: g.promesas ? Math.round((g.cumplidas/g.promesas)*100) : 0 }));

//     const estados = [
//       { name: "Cumplidas", value: promesasCumplidas, color: "#4CAF50" },
//       { name: "Pendientes", value: promesasPendientes, color: "#FF9800" },
//       { name: "Vencidas",   value: promesasVencidas,   color: "#F44336" },
//     ];

//     return NextResponse.json({
//       totalPromesas,
//       promesasCumplidas,
//       promesasPendientes,
//       promesasVencidas,
//       montoTotal: Number(montoTotalPendiente.toFixed(2)), // lo que falta pagar
//       montoCumplido: Number(montoCumplido.toFixed(2)),
//       tasaCumplimiento,
//       estados,
//       gestores,
//       proximosVencimientos,
//     });

//   } catch (err) {
//     console.error("[DASHBOARD_PROMESAS] Error:", err);
//     return NextResponse.json({ error: "Internal error", details: String(err?.message || err) }, { status: 500 });
//   }
// }
