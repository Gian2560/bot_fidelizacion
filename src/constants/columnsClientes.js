import { Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import ActionButton from "@/app/components/ActionButton";

// 🔹 Mapas de estilos
const ESTADO_STYLES = {
  "EN SEGUIMIENTO":   { color: "#1565C0", backgroundColor: "#BBDEFB"},
  "NO QUIERE PAGAR":  { color: "#8C6E11", backgroundColor: "#FFECB3"},
  "NO INTERESADO":    { color: "#B71C1C", backgroundColor: "#FFCDD2"},
  "PROMESA DE PAGO":  { color: "#2E7D32", backgroundColor: "#C8E6C9"},
  "FINALIZADO":       { color: "#5E35B1", backgroundColor: "#D1C4E9" },
};

const MOTIVO_STYLES = {
  "ECONOMICO":        { color: "#D84315", backgroundColor: "#FFCCBC", fontWeight: "bold" },
  "MALA INFORMACION": { color: "#6A1B9A", backgroundColor: "#E1BEE7", fontWeight: "bold" },
  "SE COMPROMETE A PAGAR EL {FECHA_LEGIBLE}":   { color: "#795548", backgroundColor: "#D7CCC8", fontWeight: "bold" },
  "OTROS MOTIVOS":   { color: "#8D6E63", backgroundColor: "#FFECB3", fontWeight: "bold" },
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
    flex: 1,
    minWidth: 120,
    renderCell: params => {
      const raw = params.value;
      const key = raw ? raw.toUpperCase() : "";
      const label = ESTADO_STYLES[key] ? raw : "NINGUNO";
      const style = {...getEstadoStyle(raw),fontWeight: "bold"};

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

  {
    field: "motivo",
    headerName: "Motivo",
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

  { field: "accion",  headerName: "Acción Comercial", flex: 1, minWidth: 120 },
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
            { label: "Acción Comercial", action: () => edit(params.row) },
            { label: "Ver Conversación", action: () => conversacion(params.row.id) },
            { label: "Ver Detalle",      action: () => router.push(`/clientes/${params.row.id}`) },
          ]}
        />
      );
    },
  },
];
