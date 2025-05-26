"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Pagination
} from '@mui/material';
import {
  DataGrid,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Datos simulados de clientes
const rows = [
  { id: 1, nombre: 'Ana López', etapa: 'Onboarding', deuda: 200, asesor: 'Juan Pérez', ultimoContacto: '2025-05-10' },
  { id: 2, nombre: 'Carlos Pérez', etapa: 'Seguimiento', deuda: 500, asesor: 'María Ruiz', ultimoContacto: '2025-05-12' },
  { id: 3, nombre: 'María Gómez', etapa: 'Riesgo', deuda: 750, asesor: 'Ana Salazar', ultimoContacto: '2025-05-08' },
  { id: 4, nombre: 'Luis Torres', etapa: 'Fidelizado', deuda: 0, asesor: 'Carlos Díaz', ultimoContacto: '2025-05-05' },
  { id: 5, nombre: 'Patricia Vargas', etapa: 'Onboarding', deuda: 150, asesor: 'Juan Pérez', ultimoContacto: '2025-05-14' },
];

// Estilos de chips según etapa
const chipStyles = {
  Onboarding: { bg: '#E0F7FA', color: '#007391' },
  Seguimiento: { bg: '#FFF9C4', color: '#FACC15' },
  Riesgo: { bg: '#FFCDD2', color: '#D32F2F' },
  Fidelizado: { bg: '#C8E6C9', color: '#388E3C' },
};

function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
      <Pagination
        color="primary"
        count={pageCount}
        page={page + 1}
        onChange={(e, value) => apiRef.current.setPage(value - 1)}
      />
    </Box>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('');

  // Filtrado de filas según búsqueda y etapa
  const filtered = useMemo(
    () => rows.filter(r =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) &&
      (etapaFilter ? r.etapa === etapaFilter : true)
    ),
    [search, etapaFilter]
  );

  const columns = [
    {
      field: 'nombre',
      headerName: 'Cliente',
      flex: 1,
      renderCell: params => (
        <Link
          href={`/clientes/${params.id}`}
          style={{ textDecoration: 'none', color: '#005c6b', fontWeight: 500 }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'etapa',
      headerName: 'Etapa',
      flex: 0.8,
      renderCell: params => {
        const st = chipStyles[params.value] || { bg: '#E0E0E0', color: '#616161' };
        return <Chip label={params.value} sx={{ backgroundColor: st.bg, color: st.color }} size="small" />;
      },
    },
    {
      field: 'deuda',
      headerName: 'Deuda (USD)',
      type: 'number',
      flex: 0.6,
      valueFormatter: params => {
        const val = params.value;
        return val != null ? `$${val.toLocaleString()}` : '-';
      },
    },
    { field: 'asesor', headerName: 'Asesor', flex: 0.8 },
    { field: 'ultimoContacto', headerName: 'Último Contacto', flex: 1 },
    {
      field: 'acciones',
      headerName: 'Acción',
      flex: 0.4,
      sortable: false,
      filterable: false,
      renderCell: params => (
        <IconButton
          component={Link}
          href={`/clientes/${params.id}`}
          size="small"
          sx={{ color: '#005c6b' }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#254e59', fontWeight: 600 }}>
        Cartera de Clientes
      </Typography>

      {/* Toolbar de filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 300 }}
        />
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Etapa</InputLabel>
          <Select
            label="Etapa"
            value={etapaFilter}
            onChange={e => setEtapaFilter(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {Object.keys(chipStyles).map(key => (
              <MenuItem key={key} value={key}>{key}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Grid de clientes */}
      <Paper elevation={3} sx={{ height: 550 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          disableSelectionOnClick
          components={{
            Pagination: CustomPagination,
          }}
        />
      </Paper>
    </Container>
  );
}
