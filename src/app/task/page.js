"use client";
import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  Box,
  Stack,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector
} from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import SnoozeIcon from '@mui/icons-material/Snooze';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExportIcon from '@mui/icons-material/FileDownload';

// Simulación de tareas de asesor
const initialTasks = [
  { id: 1, cliente: 'Ana López', tipo: 'Sin respuesta', fecha: '2025-05-22', estado: 'Pendiente' },
  { id: 2, cliente: 'Carlos Pérez', tipo: 'Promesa vencida', fecha: '2025-05-20', estado: 'Urgente' },
  { id: 3, cliente: 'María Gómez', tipo: 'Contacto fallido', fecha: '2025-05-21', estado: 'Pendiente' },
  { id: 4, cliente: 'Luis Torres', tipo: 'Sin respuesta', fecha: '2025-05-23', estado: 'Pendiente' }
];

// Tarjetas resumen interactivas
function TaskSummary({ tasks, onSelectType, activeType }) {
  const counts = useMemo(
    () => tasks.reduce((acc, t) => { acc[t.tipo] = (acc[t.tipo] || 0) + 1; return acc; }, {}),
    [tasks]
  );
  const types = ['Sin respuesta', 'Promesa vencida', 'Contacto fallido'];
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {types.map(tipo => {
        const active = activeType === tipo;
        return (
          <Grid item xs={12} sm={4} key={tipo}>
            <Card
              elevation={active ? 6 : 2}
              sx={{ cursor: 'pointer', borderLeft: active ? '4px solid #007391' : '4px solid transparent' }}
              onClick={() => onSelectType(active ? '' : tipo)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>{tipo}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{counts[tipo] || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

// Toolbar con filtros y acciones masivas
function CustomToolbar({ onClear, onFilterChange, filters, selection, onBulkComplete, onExport }) {
  const { filterCliente, filterTipo, filterEstado } = filters;
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, px: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Buscar cliente..."
          value={filterCliente}
          onChange={e => onFilterChange('cliente', e.target.value)}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={filterTipo}
            onChange={e => onFilterChange('tipo', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Sin respuesta">Sin respuesta</MenuItem>
            <MenuItem value="Promesa vencida">Promesa vencida</MenuItem>
            <MenuItem value="Contacto fallido">Contacto fallido</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={filterEstado}
            onChange={e => onFilterChange('estado', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="Urgente">Urgente</MenuItem>
            <MenuItem value="Completado">Completado</MenuItem>
            <MenuItem value="Postergado">Postergado</MenuItem>
          </Select>
        </FormControl>
        <Button size="small" onClick={onClear}>Limpiar filtros</Button>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {selection.length > 0 && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={() => onBulkComplete(selection)}
          >Completar {selection.length}</Button>
        )}
        <Tooltip title="Exportar CSV">
          <IconButton onClick={onExport}><ExportIcon /></IconButton>
        </Tooltip>
      </Stack>
    </GridToolbarContainer>
  );
}

// Paginación personalizada
function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
      <Button onClick={() => apiRef.current.setPage(page - 1)} disabled={page === 0}>Anterior</Button>
      <Typography sx={{ mx: 2, alignSelf: 'center' }}>Página {page + 1} de {pageCount}</Typography>
      <Button onClick={() => apiRef.current.setPage(page + 1)} disabled={page + 1 === pageCount}>Siguiente</Button>
    </Box>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filterCliente, setFilterCliente] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selection, setSelection] = useState([]);

  const handleFilterChange = (field, value) => {
    if (field === 'cliente') setFilterCliente(value);
    if (field === 'tipo') setFilterTipo(value);
    if (field === 'estado') setFilterEstado(value);
  };
  const clearFilters = () => { setFilterCliente(''); setFilterTipo(''); setFilterEstado(''); };

  const handleComplete = id => setTasks(tasks.map(t => t.id === id ? { ...t, estado: 'Completado' } : t));
  const handleSnooze = id => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0,10);
    setTasks(tasks.map(t => t.id === id ? { ...t, fecha: iso, estado: 'Postergado' } : t));
  };
  const handleBulkComplete = ids => setTasks(tasks.map(t => ids.includes(t.id) ? { ...t, estado: 'Completado' } : t));

  const filtered = useMemo(() => tasks.filter(t =>
    t.cliente.toLowerCase().includes(filterCliente.toLowerCase()) &&
    (filterTipo ? t.tipo === filterTipo : true) &&
    (filterEstado ? t.estado === filterEstado : true)
  ), [tasks, filterCliente, filterTipo, filterEstado]);

  const handleExport = () => {
    const csv = [
      ['ID','Cliente','Tipo','Fecha','Estado'],
      ...filtered.map(r => [r.id, r.cliente, r.tipo, r.fecha, r.estado])
    ].map(e => e.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tareas.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const columns = [
    { field: 'cliente', headerName: 'Cliente', flex: 1 },
    { field: 'tipo', headerName: 'Tipo', flex: 1 },
    { field: 'fecha', headerName: 'Fecha', flex: 0.8 },
    { field: 'estado', headerName: 'Estado', flex: 0.8, renderCell: ({ value }) => <Chip label={value} size="small" /> },
    { field: 'acciones', headerName: 'Acciones', flex: 1.2, sortable: false, renderCell: params => (
        <Stack direction="row" spacing={1}>
          <IconButton color="success" onClick={() => handleComplete(params.id)}><CheckIcon /></IconButton>
          <IconButton color="warning" onClick={() => handleSnooze(params.id)}><SnoozeIcon /></IconButton>
          <IconButton color="primary"><VisibilityIcon /></IconButton>
        </Stack>
    ) }
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#254e59', fontWeight: 700 }}>Cola de Tareas del Asesor</Typography>
      <TaskSummary tasks={tasks} onSelectType={setFilterTipo} activeType={filterTipo} />
      <Divider sx={{ mb: 2 }} />
      <Paper elevation={3} sx={{ height: 550, borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          checkboxSelection
          onSelectionModelChange={setSelection}
          selectionModel={selection}
          disableSelectionOnClick
          components={{
            Toolbar: () => <CustomToolbar onClear={clearFilters} onFilterChange={handleFilterChange} filters={{ filterCliente, filterTipo, filterEstado }} selection={selection} onBulkComplete={handleBulkComplete} onExport={handleExport} />,
            Pagination: CustomPagination
          }}
          sx={{ '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' } }}
        />
      </Paper>
    </Container>
  );
}
