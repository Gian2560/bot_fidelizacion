import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bq from '@/lib/bigquery';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    //const orderBy = searchParams.get("orderBy") || "fecha_ultima_interaccion_bot";
    const orderBy ="fecha_ultima_interaccion_bot";

    //const order = searchParams.get("order") || "asc";
    const order = "desc";
    const search = searchParams.get("search") || "";
    const estado = searchParams.get("estado");
    const bound = searchParams.get("bound");
    let fechaInicio = searchParams.get("fechaInicio");
    let fechaFin = searchParams.get("fechaFin");
    const gestor =searchParams.get("name");
    const role = searchParams.get("role");
    const accionComercial = searchParams.get("accionComercial"); //
    const interaccionBot = searchParams.get("interaccionBot"); // Nuevo parámetro
    let fechaRegistro = searchParams.get("fechaRegistro");
    

    console.log("🔎 Parámetros recibidos:", { page, pageSize, search, estado, bound, fechaInicio, fechaFin, orderBy, order,gestor,accionComercial });

    // 🛠️ Validar fechas (evitar null)
    fechaInicio = fechaInicio && fechaInicio !== "null" ? new Date(fechaInicio) : undefined;
    fechaFin = fechaFin && fechaFin !== "null" ? new Date(fechaFin) : undefined;

    console.log("📌 Fechas después de validación:", { fechaInicio, fechaFin });

    // 🛠️ Construcción de filtros dinámicos
    let filtros = {};
    if (fechaRegistro && fechaRegistro !== "null") {
      const fecha = new Date(fechaRegistro);
      const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
    
      filtros.fecha_creacion = {
        gte: primerDiaMes,
        lte: ultimoDiaMes,
      };
    }
    

    if (search) {
      filtros.OR = [
        { nombre: { contains: search } },
        { email: { contains: search} },
        {celular: {contains: search}},
      ];
    }

    if (estado && estado !== "Todos") {
      filtros.OR = [
    { estado: estado }
    //{ estado_asesor: estado }
  ];
    }

    if (bound && bound !== "Todos") {
      filtros.bound = bound === "INBOUND";
    }

    if (fechaInicio && fechaFin) {
      filtros.fecha_ultima_interaccion_bot = {
        gte: fechaInicio, // Mayor o igual a la fecha de inicio
        lte: fechaFin, // Menor o igual a la fecha de fin
      };
    }
    if ((gestor && gestor !== "Todos")&&(role=="asesor")) {
      filtros.gestor = gestor; // Si usas el nombre
      // o si utilizas gestor_id, sería:
      // filtros.gestor_id = parseInt(gestor, 10);
    }
    let clienteIdsPorAccion = null;
    if (accionComercial && accionComercial !== "Todos") {
      //filtros.estado_asesor = accionComercial; // Filtrar por "Acción Comercial"
      const rows = await prisma.$queryRawUnsafe/* sql */(`
        SELECT cliente_id
        FROM (
          SELECT DISTINCT ON (cliente_id)
                cliente_id, estado
          FROM accion_comercial
          ORDER BY cliente_id, fecha_accion DESC
        ) ult
        WHERE ult.estado = $1
      `, accionComercial);

      clienteIdsPorAccion = rows.map(r => Number(r.cliente_id));
      // Si no hay ninguno, fuerza un IN vacío para no traer nada
      if (clienteIdsPorAccion.length === 0) clienteIdsPorAccion = [-1];
    }
    // Si hay filtro por último estado, agrégalo
    if (clienteIdsPorAccion && accionComercial !== "Sin accion comercial") {
      filtros.cliente_id = { in: clienteIdsPorAccion };
    }
    if (interaccionBot === "Con interacción") {
  filtros.AND = [
    { estado: { not: null } }, // Clientes con estado
    { estado: { not: "activo" } },
    { estado: { not: " " } },
    { estado: { not: "no contactado" } }  // Pero que no sea "activo"
  ];
} else if (interaccionBot === "Sin interacción") {
  filtros.OR = [
    { estado: null }, // Clientes con estado
    { estado: "activo" },
    { estado: " "},
    { estado:"no contactado"}  // Pero que no sea "activo"
  ];
}
    if (accionComercial === "Sin accion comercial") {
      filtros.accion = ""; // Filtra por clientes que no tienen acción comercial
    } 
    
    
    console.log("📌 Filtros aplicados:", filtros);

    // 🛠️ Calcular skip y take para paginación correcta
    const skip = (page - 1) * pageSize;

    // 🛠️ Obtener clientes con paginación correcta
    let clientes = await prisma.cliente.findMany({
      where: filtros,
      orderBy: { [orderBy]: order },
      take: pageSize, // Solo tomar exactamente lo que necesitamos
      skip: skip, // Saltar los registros correctos según la página
      include: {
        accion_comercial: {
          take: 1,
          orderBy: { fecha_accion: "desc" }
        }
      }
    });
    // ---------------------------------------------------------
    // Nueva sección: consultar BigQuery para Fec_Ult_Pag_CCAP y actualizar columna Pago
    // ---------------------------------------------------------
    try {
      const project = 'peak-emitter-350713';
      const datasetFondos = 'FR_general';
      const fondosTable = 'bd_fondos';

      // Obtener códigos únicos no nulos
      const codigos = Array.from(new Set(clientes.map(c => c.codigo_asociado).filter(Boolean)));
      
      let pagosMap = {}; // codigo_asociado -> fecha (string) o null

      if (codigos.length > 0) {
        const BQ_QUERY = `
          SELECT
            Codigo_Asociado,
            MAX(DATE(Fec_Ult_Pag_CCAP)) AS fecha_pago
          FROM \`${project}.${datasetFondos}.${fondosTable}\`
          WHERE Codigo_Asociado IN UNNEST(@codigos)
          GROUP BY Codigo_Asociado
        `;
        const [rows] = await bq.query({
          query: BQ_QUERY,
          params: { codigos },
          parameterMode: 'named',
        });

        rows.forEach(r => {
          // // r.fecha_pago puede venir como string 'YYYY-MM-DD' o Date-like
          // pagosMap[r.Codigo_Asociado] = r.fecha_pago ? String(r.fecha_pago) : null;
          // Normalizar la fecha devuelta por BigQuery a 'YYYY-MM-DD' o null
          let fechaNormalizada = null;
          if (r.fecha_pago) {
            if (r.fecha_pago instanceof Date) {
              fechaNormalizada = r.fecha_pago.toISOString().slice(0, 10);
            } else if (typeof r.fecha_pago === 'object' && r.fecha_pago.value) {
              // Algunos clientes devuelven objetos con .value
              fechaNormalizada = String(r.fecha_pago.value).slice(0, 10);
            } else {
              fechaNormalizada = String(r.fecha_pago).slice(0, 10);
            }
          }
          pagosMap[r.Codigo_Asociado] = fechaNormalizada;
        });
      }

      // Calcular fecha de hoy (solo fecha, sin hora)
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      //today.setHours(0,0,0,0);

      // Actualizar cada cliente en Prisma según resultado (y preparar valor para respuesta)
      for (const cliente of clientes) {
        const codigo = cliente.codigo_asociado;
        const fecStr = pagosMap[codigo] || null;
        let pagoValor = "No pagó";

        if (fecStr) {
          // fecStr esperado: 'YYYY-MM-DD'
          const [y, m, d] = fecStr.split('-').map(n => parseInt(n, 10));
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const fecUTCms = Date.UTC(y, m - 1, d);
            const todayUTCms = todayUTC.getTime();
            const sameMonth = y === todayUTC.getUTCFullYear() && (m - 1) === todayUTC.getUTCMonth();
            // Regla: pago "Sí pagó" si la fecha de pago es del mismo mes/año que hoy y anterior a hoy
            if (sameMonth && fecUTCms < todayUTCms) {
              pagoValor = "Sí pagó";
            } else {
              pagoValor = "No pagó";
            }
          } else {
            pagoValor = "No pagó";
          }
        } else {
          pagoValor = "No pagó";
        }

        // Solo actualizar si es diferente (evita writes innecesarios)
        if (cliente.Pago !== pagoValor) {
          try {
            await prisma.cliente.update({
              where: { cliente_id: cliente.cliente_id },
              data: { Pago: pagoValor },
            });
            // también actualizar el objeto en memoria para la respuesta
            cliente.Pago = pagoValor;
          } catch (upErr) {
            console.warn(`No se pudo actualizar Pago para cliente ${cliente.cliente_id}:`, upErr.message);
          }
        } else {
          // asegurar el campo en el objeto
          cliente.Pago = cliente.Pago ?? pagoValor;
        }
      }
    } catch (bqErr) {
      console.error("Error consultando BigQuery para pagos:", bqErr);
      // No abortamos la petición por esto; seguimos devolviendo clientes sin modificar Pago
    }
    // ---------------------------------------------------------

    // Opcional: Si quieres mantener el ordenamiento por prioridad, hazlo después
    // pero esto puede afectar la paginación. Es mejor hacerlo en la query de Prisma
    const prioridad = [
      "No interesado",
      "Seguimiento - Duda no resuelta", 
      "Promesa de Pago",
      "Seguimiento - Duda resuelta"
    ];
    
    // Solo ordenar si no hay un orderBy específico del usuario
    if (orderBy === "fecha_creacion") {
      clientes = clientes.sort((a, b) => {
        const idxA = prioridad.indexOf(a.estado_asesor || a.categoria_no_interes || "");
        const idxB = prioridad.indexOf(b.estado_asesor || b.categoria_no_interes || "");
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    console.log(`✅ Clientes obtenidos para página ${page}:`, clientes.length);

    // 🛠️ Obtener total de clientes
    const totalClientes = await prisma.cliente.count({ where: filtros });
    // 🗺️ Mapear la respuesta incluyendo estado/motivo desde contrato[0]
    const payload = clientes.map(cliente => {
      const ultimoAccion = cliente.accion_comercial?.[0] ?? null;
  // Aquí puedes agregar otros campos que necesites
  return {
    ...cliente,                     // Conserva todos los campos originales de `cliente`
    id: cliente.cliente_id,         // Agrega el `cliente_id` como `id`
    estado: cliente.estado ?? null,  // Agrega `estado` (con valor por defecto si no existe)
    estado_asesor: ultimoAccion?.estado ?? cliente.estado_asesor ?? null,  // Agrega `motivo` (con valor por defecto si no existe)
    // Otros campos que necesites agregar, por ejemplo:
    nombre_completo: `${cliente.nombre} ${cliente.apellido}`, // Concatenar nombre y apellido
    fecha_creacion: cliente.fecha_creacion?.toISOString(),  // Formatear la fecha de creación
    // Agrega cualquier otro campo que sea relevante para tu respuesta
    Pago: cliente.Pago ?? "No pagó", 
  };
});

    // 🚨 Verificar valores antes de responder
    if (!clientes || !Array.isArray(clientes)) {
      console.warn("⚠️ No se encontraron clientes. Enviando array vacío.");
      return NextResponse.json({ clientes: [], total: 0 });
    }

    return NextResponse.json({ clientes: payload, total: totalClientes });
  } catch (error) {
    console.error("❌ Error en el try-catch:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes", message: error.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
