"use client";
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import dayjs from 'dayjs';

// Simulación de programaciones
let initialSchedules = [
  { id: 1, tipo: 'R1', cohort: '7 días mora', fecha: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'), canal: 'WhatsApp', estado: 'Programado' },
  { id: 2, tipo: 'R2', cohort: '14 días mora', fecha: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm'), canal: 'SMS', estado: 'Programado' },
];

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [tipo, setTipo] = useState('R1');
  const [cohort, setCohort] = useState('7 días mora');
  const [fecha, setFecha] = useState(dayjs().add(1, 'day'));
  const [canal, setCanal] = useState('WhatsApp');

  const handleAdd = () => {
    const next = schedules.length ? Math.max(...schedules.map(s => s.id)) + 1 : 1;
    setSchedules([
      ...schedules,
      { id: next, tipo, cohort, fecha: fecha.format('YYYY-MM-DD HH:mm'), canal, estado: 'Programado' }
    ]);
  };

  const handleDelete = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'tipo', headerName: 'Tipo', flex: 1 },
    { field: 'cohort', headerName: 'Cohorte', flex: 1 },
    { field: 'fecha', headerName: 'Fecha y Hora', flex: 1.5 },
    { field: 'canal', headerName: 'Canal', flex: 1 },
    { field: 'estado', headerName: 'Estado', flex: 1, renderCell: (params) => {
        const color = params.value === 'Programado' ? 'primary' : 'default';
        return <Chip label={params.value} color={color} size="small" />;
      }
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton color="primary"><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
          <IconButton color="success"><SendIcon /></IconButton>
        </Box>
      )
    }
  ];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#254e59', fontWeight: 600 }}>
        Programador de Recordatorios
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={tipo} label="Tipo" onChange={e => setTipo(e.target.value)}>
                <MenuItem value="R1">Recordatorio 1 (R1)</MenuItem>
                <MenuItem value="R2">Recordatorio 2 (R2)</MenuItem>
                <MenuItem value="R3">Recordatorio 3 (R3)</MenuItem>
                <MenuItem value="Incentivo">Incentivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Cohorte</InputLabel>
              <Select value={cohort} label="Cohorte" onChange={e => setCohort(e.target.value)}>
                <MenuItem value="7 días mora">7 días mora</MenuItem>
                <MenuItem value="14 días mora">14 días mora</MenuItem>
                <MenuItem value="30 días mora">30 días mora</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Fecha y Hora"
                value={fecha}
                onChange={newVal => setFecha(newVal)}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Canal</InputLabel>
              <Select value={canal} label="Canal" onChange={e => setCanal(e.target.value)}>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
                <MenuItem value="Correo">Correo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} alignSelf="center">
            <Button variant="contained" color="primary" onClick={handleAdd}>
              Agregar Programación
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ height: 500 }}>
        <DataGrid
          rows={schedules}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10]}
          disableSelectionOnClick
        />
      </Paper>
    </Container>
  );
}
