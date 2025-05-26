"use client";
import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Pagination,
  Divider
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Datos simulados
const initialData = [
  { id: 1, cliente: 'Ana López', deuda: 200, promesa: '2025-06-01', incentivoEnviado: '2025-05-20', estado: 'Pendiente' },
  { id: 2, cliente: 'Carlos Pérez', deuda: 500, promesa: '2025-06-05', incentivoEnviado: '2025-05-18', estado: 'Cumplida' },
  { id: 3, cliente: 'María Gómez', deuda: 750, promesa: '2025-06-03', incentivoEnviado: '2025-05-19', estado: 'Vencida' }
];

function SummaryCards({ data }) {
  const counts = useMemo(() => {
    return data.reduce((acc, cur) => {
      acc[cur.estado] = (acc[cur.estado] || 0) + 1;
      return acc;
    }, {});
  }, [data]);

  const items = [
    { label: 'Pendientes', color: 'warning', count: counts['Pendiente'] || 0 },
    { label: 'Cumplidas', color: 'success', count: counts['Cumplida'] || 0 },
    { label: 'Vencidas', color: 'error', count: counts['Vencida'] || 0 },
    { label: 'Canceladas', color: 'default', count: counts['Cancelada'] || 0 }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {items.map(item => (
        <Grid item xs={12} sm={6} md={3} key={item.label}>
          <Card elevation={2} sx={{ borderLeft: `4px solid ${item.color === 'success' ? '#388e3c' : item.color === 'error' ? '#d32f2f' : item.color === 'warning' ? '#f57c00' : '#616161'}` }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: item.color === 'warning' ? '#f57c00' : item.color === 'success' ? '#388e3c' : item.color === 'error' ? '#d32f2f' : '#616161' }}>
                {item.count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function CustomToolbar({ onAdd, filters }) {
  const { filterCliente, setFilterCliente, filterEstado, setFilterEstado, filterDate, setFilterDate } = filters;
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', alignItems: 'center', py: 1, px: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Buscar cliente..."
          variant="outlined"
          value={filterCliente}
          onChange={e => setFilterCliente(e.target.value)}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="Cumplida">Cumplida</MenuItem>
            <MenuItem value="Vencida">Vencida</MenuItem>
            <MenuItem value="Cancelada">Cancelada</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Fecha Promesa"
            value={filterDate}
            onChange={val => setFilterDate(val)}
            renderInput={params => <TextField size="small" {...params} sx={{ width: 160 }} />}
          />
        </LocalizationProvider>
      </Stack>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>Nuevo Incentivo</Button>
    </GridToolbarContainer>
  );
}

export default function IncentivesPage() {
  const [rows, setRows] = useState(initialData);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: null, cliente: '', deuda: '', promesa: dayjs().format('YYYY-MM-DD'), estado: 'Pendiente' });

  const [filterCliente, setFilterCliente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterDate, setFilterDate] = useState(null);

  // Modal
  const handleOpen = (row = null) => {
    setForm(row || { id: null, cliente: '', deuda: '', promesa: dayjs().format('YYYY-MM-DD'), estado: 'Pendiente' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // Save
  const handleSave = () => {
    if (form.id) setRows(rows.map(r => r.id === form.id ? form : r));
    else {
      const next = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
      setRows([...rows, { ...form, id: next, incentivoEnviado: dayjs().format('YYYY-MM-DD') }]);
    }
    handleClose();
  };

  // Estado change
  const handleStateChange = (id, estado) => setRows(rows.map(r => r.id === id ? { ...r, estado } : r));

  // Filtered rows
  const filtered = useMemo(() => rows.filter(r =>
    r.cliente.toLowerCase().includes(filterCliente.toLowerCase()) &&
    (filterEstado ? r.estado === filterEstado : true) &&
    (filterDate ? r.promesa === filterDate.format('YYYY-MM-DD') : true)
  ), [rows, filterCliente, filterEstado, filterDate]);

  const columns = [
    { field: 'cliente', headerName: 'Cliente', flex: 1 },
    { field: 'deuda', headerName: 'Deuda (USD)', flex: 0.8, valueFormatter: ({ value }) => `$${Number(value).toLocaleString()}` },
    { field: 'promesa', headerName: 'Promesa Pago', flex: 1 },
    { field: 'incentivoEnviado', headerName: 'Enviado', flex: 1 },
    { field: 'estado', headerName: 'Estado', flex: 0.8, renderCell: ({ value }) => {
        let color;
        switch (value) {
          case 'Cumplida': color = 'success'; break;
          case 'Vencida': color = 'error'; break;
          case 'Cancelada': color = 'default'; break;
          default: color = 'warning';
        }
        return <Chip label={value} color={color} size="small" sx={{ fontWeight: 500 }} />;
      }
    },
    { field: 'acciones', headerName: 'Acciones', flex: 1.2, sortable: false, renderCell: params => (
        <Stack direction="row" spacing={1}>
          <IconButton color="primary" onClick={() => handleOpen(params.row)}><EditIcon /></IconButton>
          <IconButton color="success" onClick={() => handleStateChange(params.id, 'Cumplida')}><CheckCircleIcon /></IconButton>
          <IconButton color="error" onClick={() => handleStateChange(params.id, 'Cancelada')}><CancelIcon /></IconButton>
          <IconButton onClick={() => handleOpen()}><ReplayIcon /></IconButton>
        </Stack>
      ) }
  ];

  function CustomPagination() {
    const apiRef = useGridApiContext();
    const page = useGridSelector(apiRef, gridPageSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <Pagination count={pageCount} page={page + 1} onChange={(e, v) => apiRef.current.setPage(v - 1)} color="primary" />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#254e59', fontWeight: 700 }}>Incentivos & Promesas de Pago</Typography>
      <SummaryCards data={rows} />
      <Divider sx={{ mb: 2 }} />
      <Paper elevation={4} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ height: 600 }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            disableSelectionOnClick
            components={{ Toolbar: () => <CustomToolbar onAdd={handleOpen} filters={{ filterCliente, setFilterCliente, filterEstado, setFilterEstado, filterDate, setFilterDate }} />, Pagination: CustomPagination }}
            sx={{ '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' } }}
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? 'Editar Incentivo' : 'Nuevo Incentivo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Cliente" fullWidth value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
            <TextField label="Deuda (USD)" fullWidth type="number" value={form.deuda} onChange={e => setForm({ ...form, deuda: Number(e.target.value) })} />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Fecha Promesa" value={dayjs(form.promesa)} onChange={newVal => setForm({ ...form, promesa: newVal.format('YYYY-MM-DD') })} renderInput={params => <TextField fullWidth {...params} />} />
            </LocalizationProvider>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Cumplida">Cumplida</MenuItem>
                <MenuItem value="Vencida">Vencida</MenuItem>
                <MenuItem value="Cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
