import { Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import ActionButton from "@/app/components/ActionButton";

// 🔹 Mapas de estilos
const ESTADO_STYLES = {
  "NO INTERESADO": { color: "#fff", backgroundColor: "#e53935", fontWeight: "bold", border: "2px solid #b71c1c" }, // rojo alerta
  "SEGUIMIENTO - DUDA NO RESUELTA": { color: "#fff", backgroundColor: "#f15252ff", fontWeight: "bold", border: "2px solid #c2185b" }, // rosa/rojo suave
  "PROMESA DE PAGO": { color: "#388e3c", backgroundColor: "#e8f5e9", fontWeight: "bold", border: "2px solid #c8e6c9" }, // verde suave
  "SEGUIMIENTO - DUDA RESUELTA": { color: "#5E35B1", backgroundColor: "#D1C4E9" },
};

const MOTIVO_STYLES = {
  "NO INTERESADO": { color: "#fff", backgroundColor: "#e53935", fontWeight: "bold", border: "2px solid #b71c1c" },
  "SEGUIMIENTO - DUDA NO RESUELTA": { color: "#fff", backgroundColor: "#f15252ff", fontWeight: "bold", border: "2px solid #c2185b" }, // rosa/rojo suave
  "PROMESA DE PAGO": { color: "#388e3c", backgroundColor: "#e8f5e9", fontWeight: "bold", border: "2px solid #c8e6c9" }, // verde suave
  "SEGUIMIENTO - DUDA RESUELTA": { color: "#5E35B1", backgroundColor: "#D1C4E9" },
};

// 🔹 Funciones de estilo (devuelven el estilo o un gris suave)
const getEstadoStyle = estado => {
  const key = estado ? estado.toUpperCase() : "";
  return ESTADO_STYLES[key] || { color: "#616161", backgroundColor: "#E0E0E0", fontWeight: "bold" };
};

const getMotivoStyle = motivo => {
  const key = motivo ? motivo.toUpperCase() : "";
  return MOTIVO_STYLES[key] || { color: "#757575", backgroundColor: "#E0E0E0", fontWeight: "bold" };
};

// 🔹 Columnas para tu DataGrid
export const columnsClientes = (edit, conversacion) => [
  { field: "nombre",   headerName: "Nombre",           flex: 1, minWidth: 150 },
  { field: "celular",  headerName: "Teléfono",         flex: 1, minWidth: 120 },

  {
    field: "estado",
    headerName: "Estado",
    flex: 2,
    minWidth: 180,
    renderCell: params => {
      // Si estado está vacío, muestra 'NINGUNO'
      const raw = params.value && params.value.trim() !== "" ? params.value : "";
      const key = raw ? raw.toUpperCase() : "";
      const label = ESTADO_STYLES[key] ? raw : "NINGUNO";
      const style = { ...getEstadoStyle(raw), fontWeight: "bold" };
      return (
        <Chip
          label={label}
          sx={{
            ...style,
            width: "100%",
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflow: 'visible',
            justifyContent: "center",
          }}
        />
      );
    },
  },

  {
    field: "estado_asesor",
    headerName: "Estado Asesor",
    flex: 1,
    minWidth: 120,
    renderCell: params => {
      const raw = params.value;
      const key = raw ? raw.toUpperCase() : "";
      const label = MOTIVO_STYLES[key] ? raw : "NINGUNO";
      const style = getMotivoStyle(raw);

      return (
        <Chip
          label={label}
          sx={{
            ...style,
            width: "120px",
            justifyContent: "center",
          }}
        />
      );
    },
  },

  //{ field: "estado_asesor",  headerName: "Estado Asesor", flex: 1, minWidth: 120 },
  { field: "gestor",  headerName: "Gestor",            flex: 1, minWidth: 120 },

  {
    field: "acciones",
    headerName: "Acciones",
    flex: 1,
    renderCell: params => {
      const router = useRouter();
      return (
        <ActionButton
          options={[
            { label: "Cambiar estado", action: () => edit(params.row) },
            { label: "Ver Conversación", action: () => conversacion(params.row.id) },
            { label: "Ver Detalle",      action: () => router.push(`/clientes/${params.row.id}`) },
          ]}
        />
      );
    },
  },
];
