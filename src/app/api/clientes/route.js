import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const orderBy = searchParams.get("orderBy") || "fecha_creacion";
    const order = searchParams.get("order") || "asc";
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
    { estado: estado },
    { estado_asesor: estado }
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
    if (accionComercial && accionComercial !== "Todos") {
      filtros.estado_asesor = accionComercial; // Filtrar por "Acción Comercial"
    }
    if (interaccionBot === "Con interacción") {
      filtros.fecha_ultima_interaccion_bot = { not: null }; // Clientes con fecha de interacción
    } else if (interaccionBot === "Sin interacción") {
      filtros.fecha_ultima_interaccion_bot = null; // Clientes sin fecha de interacción
    }
    if (accionComercial === "Sin accion comercial") {
      filtros.accion = ""; // Filtra por clientes que no tienen acción comercial
    } 
    
    
    console.log("📌 Filtros aplicados:", filtros);


    // 🛠️ Obtener clientes sin orden especial desde la base de datos
    let clientes = await prisma.cliente.findMany({
      where: filtros,
      orderBy: { [orderBy]: order },
      take: pageSize * 10, // Trae más para asegurar paginación tras ordenar
      skip: 0,
    });

    // Ordenar en JS según prioridad de estados
    const prioridad = [
      "No interesado",
      "Seguimiento - Duda no resuelta",
      "Promesa de Pago",
      "Seguimiento - Duda resuelta"
    ];
    clientes = clientes.sort((a, b) => {
      const idxA = prioridad.indexOf(a.estado_asesor || a.categoria_no_interes || "");
      const idxB = prioridad.indexOf(b.estado_asesor || b.categoria_no_interes || "");
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    // Paginación manual después de ordenar
    clientes = clientes.slice((page - 1) * pageSize, page * pageSize);

    console.log("✅ Clientes obtenidos:", clientes.length);

    // 🛠️ Obtener total de clientes
    const totalClientes = await prisma.cliente.count({ where: filtros });
    // 🗺️ Mapear la respuesta incluyendo estado/motivo desde contrato[0]
    const payload = clientes.map(cliente => {
  // Aquí puedes agregar otros campos que necesites
  return {
    ...cliente,                     // Conserva todos los campos originales de `cliente`
    id: cliente.cliente_id,         // Agrega el `cliente_id` como `id`
    estado: cliente.estado ?? "no contactado",  // Agrega `estado` (con valor por defecto si no existe)
    estado_asesor: cliente.estado_asesor ?? null,  // Agrega `motivo` (con valor por defecto si no existe)
    // Otros campos que necesites agregar, por ejemplo:
    nombre_completo: `${cliente.nombre} ${cliente.apellido}`, // Concatenar nombre y apellido
    fecha_creacion: cliente.fecha_creacion?.toISOString(),  // Formatear la fecha de creación
    // Agrega cualquier otro campo que sea relevante para tu respuesta
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
