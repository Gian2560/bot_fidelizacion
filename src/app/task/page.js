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
  Tooltip,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector
} from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import ExportIcon from '@mui/icons-material/FileDownload';

// Datos de tareas simuladas organizadas por los 4 estados
const initialTasks = [
  // Comunicación Inmediata
  { id: 1, cliente: 'Ana López', telefono: '123-456-7890', estado: 'comunicacion_inmediata', prioridad: 'alta', fechaCreacion: '2025-08-08', fechaLlamada: null, llamado: false },
  { id: 2, cliente: 'Carlos Pérez', telefono: '987-654-3210', estado: 'comunicacion_inmediata', prioridad: 'urgente', fechaCreacion: '2025-08-07', fechaLlamada: null, llamado: false },
  
  // Negociación de Pago
  { id: 3, cliente: 'María Gómez', telefono: '555-123-4567', estado: 'negociacion_pago', prioridad: 'media', fechaCreacion: '2025-08-06', fechaLlamada: null, llamado: false },
  { id: 4, cliente: 'Luis Torres', telefono: '444-987-6543', estado: 'negociacion_pago', prioridad: 'alta', fechaCreacion: '2025-08-05', fechaLlamada: null, llamado: false },
  
  // Gestión de Contrato
  { id: 5, cliente: 'Elena Díaz', telefono: '333-555-7777', estado: 'gestion_contrato', prioridad: 'media', fechaCreacion: '2025-08-04', fechaLlamada: null, llamado: false },
  { id: 6, cliente: 'José Ruiz', telefono: '222-888-9999', estado: 'gestion_contrato', prioridad: 'baja', fechaCreacion: '2025-08-03', fechaLlamada: null, llamado: false },
  
  // Reclamos
  { id: 7, cliente: 'Patricia Vega', telefono: '111-222-3333', estado: 'reclamos', prioridad: 'urgente', fechaCreacion: '2025-08-02', fechaLlamada: null, llamado: false },
  { id: 8, cliente: 'Roberto Silva', telefono: '999-111-2222', estado: 'reclamos', prioridad: 'alta', fechaCreacion: '2025-08-01', fechaLlamada: null, llamado: false }
];

// Configuración de los 4 estados
const estadosConfig = {
  comunicacion_inmediata: {
    titulo: 'Comunicación Inmediata',
    icono: <PhoneIcon />,
    color: '#f44336',
    descripcion: 'Clientes que requieren contacto urgente'
  },
  negociacion_pago: {
    titulo: 'Negociación de Pago',
    icono: <PaymentIcon />,
    color: '#ff9800',
    descripcion: 'Clientes en proceso de negociación'
  },
  gestion_contrato: {
    titulo: 'Gestión de Contrato',
    icono: <DescriptionIcon />,
    color: '#2196f3',
    descripcion: 'Gestiones relacionadas con contratos'
  },
  reclamos: {
    titulo: 'Reclamos',
    icono: <ReportProblemIcon />,
    color: '#9c27b0',
    descripcion: 'Atención de reclamos y quejas'
  }
};

// Función para obtener el estilo de prioridad
const getPrioridadStyle = (prioridad) => {
  const styles = {
    urgente: { color: '#fff', backgroundColor: '#d32f2f' },
    alta: { color: '#fff', backgroundColor: '#f57c00' },
    media: { color: '#000', backgroundColor: '#ffcc02' },
    baja: { color: '#fff', backgroundColor: '#388e3c' }
  };
  return styles[prioridad] || styles.media;
};

// Componente para las tarjetas de resumen de cada estado
function EstadoCard({ estado, tasks, onSelectEstado, selectedEstado }) {
  const config = estadosConfig[estado];
  const estadoTasks = tasks.filter(t => t.estado === estado);
  const pendientes = estadoTasks.filter(t => !t.llamado).length;
  const completados = estadoTasks.filter(t => t.llamado).length;
  const isSelected = selectedEstado === estado;

  return (
    <Grid item xs={12} md={3}>
      <Card
        elevation={isSelected ? 8 : 3}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          borderLeft: `4px solid ${config.color}`,
          backgroundColor: isSelected ? '#f8f9fa' : 'white',
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            elevation: 6,
            transform: 'translateY(-2px)'
          }
        }}
        onClick={() => onSelectEstado(isSelected ? '' : estado)}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: config.color, mr: 2 }}>
              {config.icono}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {config.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {config.descripcion}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
            <Box textAlign="center">
              <Typography variant="h4" color={config.color} sx={{ fontWeight: 'bold' }}>
                {pendientes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {completados}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completados
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

// Componente para mostrar las tareas de un estado específico en accordion
function EstadoAccordion({ estado, tasks, onMarcarLlamada }) {
  const config = estadosConfig[estado];
  const estadoTasks = tasks.filter(t => t.estado === estado);
  const pendientes = estadoTasks.filter(t => !t.llamado);
  const completados = estadoTasks.filter(t => t.llamado);

  return (
    <Accordion sx={{ mb: 2, borderLeft: `4px solid ${config.color}` }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" width="100%">
          <Avatar sx={{ bgcolor: config.color, mr: 2, width: 32, height: 32 }}>
            {config.icono}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {config.titulo}
          </Typography>
          <Badge badgeContent={pendientes.length} color="error" sx={{ mr: 2 }}>
            <Chip label={`${estadoTasks.length} total`} size="small" />
          </Badge>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {estadoTasks.map(task => (
            <Grid item xs={12} md={6} key={task.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  backgroundColor: task.llamado ? '#e8f5e8' : '#fff',
                  opacity: task.llamado ? 0.8 : 1
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'grey.300', mr: 2, width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {task.cliente}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.telefono}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={task.prioridad.toUpperCase()}
                      size="small"
                      sx={getPrioridadStyle(task.prioridad)}
                    />
                  </Box>
                  
                  <Box display="flex" justify="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Creado: {task.fechaCreacion}
                      </Typography>
                      {task.fechaLlamada && (
                        <Typography variant="caption" display="block" color="success.main">
                          Llamado: {task.fechaLlamada}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant={task.llamado ? "outlined" : "contained"}
                      color={task.llamado ? "success" : "primary"}
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => onMarcarLlamada(task.id)}
                      disabled={task.llamado}
                    >
                      {task.llamado ? 'Llamado' : 'Marcar llamada'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

// Toolbar personalizado
function CustomToolbar({ onExport, stats }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      p: 2, 
      bgcolor: '#f8f9fa',
      borderRadius: '8px 8px 0 0'
    }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#254e59' }}>
          Resumen General
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {stats.total} tareas totales • {stats.pendientes} pendientes • {stats.completadas} completadas
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<ExportIcon />}
        onClick={onExport}
        sx={{ borderColor: '#007391', color: '#007391' }}
      >
        Exportar
      </Button>
    </Box>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedEstado, setSelectedEstado] = useState('');

  // Función para marcar una tarea como llamada
  const handleMarcarLlamada = (taskId) => {
    const now = new Date();
    const fechaHora = now.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, llamado: true, fechaLlamada: fechaHora }
        : task
    ));
  };

  // Función para exportar datos
  const handleExport = () => {
    const csv = [
      ['ID', 'Cliente', 'Teléfono', 'Estado', 'Prioridad', 'Fecha Creación', 'Llamado', 'Fecha Llamada'],
      ...tasks.map(t => [
        t.id, 
        t.cliente, 
        t.telefono, 
        estadosConfig[t.estado].titulo,
        t.prioridad, 
        t.fechaCreacion, 
        t.llamado ? 'Sí' : 'No', 
        t.fechaLlamada || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tareas_asesor.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = tasks.length;
    const completadas = tasks.filter(t => t.llamado).length;
    const pendientes = total - completadas;
    return { total, completadas, pendientes };
  }, [tasks]);

  // Filtrar tareas por estado seleccionado
  const filteredTasks = selectedEstado 
    ? tasks.filter(t => t.estado === selectedEstado)
    : tasks;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Encabezado */}
      <Box textAlign="center" mb={4}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            color: '#007391',
            mb: 1
          }}
        >
          Módulo de Tareas del Asesor
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Gestiona las tareas organizadas por estados de atención
        </Typography>
      </Box>

      {/* Tarjetas de resumen por estado */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.keys(estadosConfig).map(estado => (
          <EstadoCard
            key={estado}
            estado={estado}
            tasks={tasks}
            onSelectEstado={setSelectedEstado}
            selectedEstado={selectedEstado}
          />
        ))}
      </Grid>

      {/* Panel principal */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CustomToolbar onExport={handleExport} stats={stats} />
        
        <Box sx={{ p: 3 }}>
          {selectedEstado ? (
            // Vista de estado específico
            <Box>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#254e59' }}>
                {estadosConfig[selectedEstado].titulo}
              </Typography>
              <EstadoAccordion
                estado={selectedEstado}
                tasks={tasks}
                onMarcarLlamada={handleMarcarLlamada}
              />
            </Box>
          ) : (
            // Vista general de todos los estados
            <Box>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#254e59' }}>
                Todos los Estados
              </Typography>
              {Object.keys(estadosConfig).map(estado => (
                <EstadoAccordion
                  key={estado}
                  estado={estado}
                  tasks={tasks}
                  onMarcarLlamada={handleMarcarLlamada}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
