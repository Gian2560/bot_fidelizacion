"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Pagination,
} from "@mui/material";
import {
  DataGrid,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";

const colors = {
  primaryBlue: "#007391",
  darkBlue: "#254e59",
  white: "#fff",
  lightBlueBg: "#E3F2FD",
  chipOnboardingBg: "#E0F7FA",
  chipOnboardingColor: "#007391",
  chipSeguimientoBg: "#FFF9C4",
  chipSeguimientoColor: "#FACC15",
  chipRiesgoBg: "#FFCDD2",
  chipRiesgoColor: "#D32F2F",
  chipFidelizadoBg: "#C8E6C9",
  chipFidelizadoColor: "#388E3C",
};

const chipStyles = {
  Onboarding: { bg: colors.chipOnboardingBg, color: colors.chipOnboardingColor },
  Seguimiento: { bg: colors.chipSeguimientoBg, color: colors.chipSeguimientoColor },
  Riesgo: { bg: colors.chipRiesgoBg, color: colors.chipRiesgoColor },
  Fidelizado: { bg: colors.chipFidelizadoBg, color: colors.chipFidelizadoColor },
};

// Datos simulados de clientes
const rows = [
  { id: 1, nombre: "Ana López", etapa: "Onboarding", deuda: 200, asesor: "Juan Pérez", ultimoContacto: "2025-05-10" },
  { id: 2, nombre: "Carlos Pérez", etapa: "Seguimiento", deuda: 500, asesor: "María Ruiz", ultimoContacto: "2025-05-12" },
  { id: 3, nombre: "María Gómez", etapa: "Riesgo", deuda: 750, asesor: "Ana Salazar", ultimoContacto: "2025-05-08" },
  { id: 4, nombre: "Luis Torres", etapa: "Fidelizado", deuda: 0, asesor: "Carlos Díaz", ultimoContacto: "2025-05-05" },
  { id: 5, nombre: "Patricia Vargas", etapa: "Onboarding", deuda: 150, asesor: "Juan Pérez", ultimoContacto: "2025-05-14" },
];

function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
      <Pagination
        color="primary"
        count={pageCount}
        page={page + 1}
        onChange={(e, value) => apiRef.current.setPage(value - 1)}
        shape="rounded"
        sx={{ userSelect: "none" }}
      />
    </Box>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("");

  // Filtrado de filas según búsqueda y etapa
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.nombre.toLowerCase().includes(search.toLowerCase()) &&
          (etapaFilter ? r.etapa === etapaFilter : true)
      ),
    [search, etapaFilter]
  );

  const columns = [
    {
      field: "nombre",
      headerName: "Cliente",
      flex: 1.4,
      minWidth: 160,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Link href={`/clientes/${params.id}`} style={{ textDecoration: "none", color: colors.primaryBlue, fontWeight: 600 }}>
          {params.value}
        </Link>
      ),
    },
    {
      field: "etapa",
      headerName: "Etapa",
      flex: 1,
      minWidth: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const style = chipStyles[params.value] || { bg: "#E0E0E0", color: "#616161" };
        return (
          <Chip
            label={params.value}
            sx={{
              backgroundColor: style.bg,
              color: style.color,
              fontWeight: 600,
              fontSize: "0.85rem",
              paddingX: 1.5,
              paddingY: 0.4,
              borderRadius: 2,
            }}
            size="small"
          />
        );
      },
    },
    {
      field: "deuda",
      headerName: "Deuda (USD)",
      type: "number",
      flex: 0.9,
      minWidth: 110,
      headerAlign: "center",
      align: "right",
      valueFormatter: (params) => {
        const val = params.value;
        return val != null ? `$${val.toLocaleString()}` : "-";
      },
    },
    {
      field: "asesor",
      headerName: "Asesor",
      flex: 1,
      minWidth: 140,
      headerAlign: "center",
      align: "left",
    },
    {
      field: "ultimoContacto",
      headerName: "Último Contacto",
      flex: 1.2,
      minWidth: 140,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "acciones",
      headerName: "Acción",
      flex: 0.5,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton component={Link} href={`/clientes/${params.id}`} size="small" sx={{ color: colors.primaryBlue }}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography
        variant="h4"
        sx={{ mb: 4, color: colors.darkBlue, fontWeight: 700, textAlign: "center", letterSpacing: "0.03em" }}
      >
        Cartera de Clientes
      </Typography>

      {/* Toolbar de filtros */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: 360,
            bgcolor: colors.lightBlueBg,
            borderRadius: 1,
            "& .MuiInputBase-input": {
              fontWeight: 600,
              fontSize: "0.95rem",
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Etapa</InputLabel>
          <Select
            label="Etapa"
            value={etapaFilter}
            onChange={(e) => setEtapaFilter(e.target.value)}
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              bgcolor: colors.lightBlueBg,
              borderRadius: 1,
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {Object.keys(chipStyles).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Grid de clientes */}
      <Paper elevation={4} sx={{ height: 580, borderRadius: 3, overflow: "hidden" }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pageSizeOptions={[5, 10, 20]}
          pageSize={5}
          disableRowSelectionOnClick
          components={{
            Pagination: CustomPagination,
          }}
          sx={{
            borderRadius: 0,
            fontSize: "0.9rem",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.lightBlueBg,
              color: colors.darkBlue,
              fontWeight: "700",
              fontSize: "0.95rem",
            },
            "& .MuiDataGrid-cell": {
              color: colors.darkBlue,
              fontWeight: 600,
              fontSize: "0.9rem",
            },
            "& .MuiTablePagination-root": {
              color: colors.darkBlue,
              fontWeight: 600,
            },
          }}
        />
      </Paper>
    </Container>
  );
}
