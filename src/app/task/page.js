"use client";
import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useClientes } from '@/hooks/useClientes';
import ActionComercialModal from '@/app/components/ActionComercialModal';
import ConversationModal from '@/app/components/ConversationModal';
import { fetchConversacion } from '../../../services/clientesService';
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
import ChatIcon from '@mui/icons-material/Chat';

// Datos de tareas simuladas organizadas por los 4 estados
const initialTasks = [
  // Comunicación Inmediata
  { 
    id: 5, 
    cliente: 'Daniel', 
    telefono: '+51993538942', 
    email: 'ana.lopez@email.com',
    documento: '12345678',
    estado: 'comunicacion_inmediata', 
    fechaCreacion: '2025-08-08', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Juan Pérez',
    observacion: 'Cliente con deuda vencida hace 15 días'
  },
  { 
    id: 2, 
    cliente: 'Carlos Pérez Silva', 
    telefono: '+51976543210', 
    email: 'carlos.perez@gmail.com',
    documento: '87654321',
    estado: 'comunicacion_inmediata', 
    fechaCreacion: '2025-08-07', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'María García',
    observacion: 'Requiere seguimiento urgente por promesa de pago incumplida'
  },
  
  // Negociación de Pago
  { 
    id: 3, 
    cliente: 'María Gómez Torres', 
    telefono: '+51965432187', 
    email: 'maria.gomez@hotmail.com',
    documento: '23456789',
    estado: 'negociacion_pago', 
    fechaCreacion: '2025-08-06', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Luis Rodríguez',
    observacion: 'Interesada en plan de pagos fraccionado'
  },
  { 
    id: 4, 
    cliente: 'Luis Torres Mendoza', 
    telefono: '+51954321876', 
    email: 'luis.torres@yahoo.com',
    documento: '34567890',
    estado: 'negociacion_pago', 
    fechaCreacion: '2025-08-05', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Carmen Díaz',
    observacion: 'Solicita descuento por pronto pago'
  },
  
  // Gestión de Contrato
  { 
    id: 5, 
    cliente: 'Elena Díaz Vargas', 
    telefono: '+51943218765', 
    email: 'elena.diaz@outlook.com',
    documento: '45678901',
    estado: 'gestion_contrato', 
    fechaCreacion: '2025-08-04', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Roberto Castro',
    observacion: 'Revisión de términos contractuales pendiente'
  },
  { 
    id: 13, 
    cliente: 'José Ruiz Flores', 
    telefono: '+51932187654', 
    email: 'jose.ruiz@empresa.com',
    documento: '56789012',
    estado: 'gestion_contrato', 
    fechaCreacion: '2025-08-03', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Ana Morales',
    observacion: 'Actualización de datos personales requerida'
  },
  { 
    id: 10, 
    cliente: 'Patricia Herrera', 
    telefono: '+51921876543', 
    email: 'patricia.herrera@gmail.com',
    documento: '67890123',
    estado: 'gestion_contrato', 
    fechaCreacion: '2025-08-04', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Miguel Santos',
    observacion: 'Renovación de contrato en proceso'
  },
  { 
    id: 11, 
    cliente: 'Fernando López', 
    telefono: '+51910765432', 
    email: 'fernando.lopez@correo.com',
    documento: '78901234',
    estado: 'gestion_contrato', 
    fechaCreacion: '2025-08-03', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Isabel Ramírez',
    observacion: 'Cambio de plan solicitado'
  },
  
  // Reclamos
  { 
    id: 7, 
    cliente: 'Patricia Vega Sánchez', 
    telefono: '+51987123456', 
    email: 'patricia.vega@hotmail.com',
    documento: '89012345',
    estado: 'reclamos', 
    fechaCreacion: '2025-08-02', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Carlos Mendoza',
    observacion: 'Reclamo por cobro indebido - URGENTE'
  },
  { 
    id: 8, 
    cliente: 'Roberto Silva Castro', 
    telefono: '+51976234567', 
    email: 'roberto.silva@empresa.pe',
    documento: '90123456',
    estado: 'reclamos', 
    fechaCreacion: '2025-08-01', 
    fechaLlamada: null, 
    llamado: false,
    gestor: 'Lucía Vásquez',
    observacion: 'Disconforme con atención recibida'
  }
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

// Función para obtener el estilo de gestores (reemplaza prioridad)
const getGestorColor = (gestor) => {
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f'];
  const index = gestor.length % colors.length;
  return colors[index];
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
function EstadoAccordion({ estado, tasks, onMarcarLlamada, onAccionComercial, onVerConversacion }) {
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
                        <Typography variant="caption" color="text.secondary">
                          Doc: {task.documento}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={task.gestor}
                      size="small"
                      sx={{ 
                        color: '#fff', 
                        backgroundColor: getGestorColor(task.gestor),
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Box display="flex" justify="space-between" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Creado: {task.fechaCreacion}
                      </Typography>
                      {task.fechaLlamada && (
                        <Typography variant="caption" display="block" color="success.main">
                          Llamado: {task.fechaLlamada}
                        </Typography>
                      )}
                      {task.observacion && (
                        <Typography variant="caption" display="block" color="primary.main" sx={{ fontStyle: 'italic' }}>
                          {task.observacion}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        color="info"
                        size="small"
                        startIcon={<ChatIcon />}
                        onClick={() => onVerConversacion(task.id)}
                      >
                        Ver Chat
                      </Button>
                      <Button
                        variant={task.llamado ? "outlined" : "contained"}
                        color={task.llamado ? "success" : "primary"}
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => {
                          onAccionComercial(task);
                        }}
                        disabled={task.llamado}
                      >
                        {task.llamado ? 'Llamado' : 'Marcar llamada'}
                      </Button>
                    </Box>
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
  const [selectedClient, setSelectedClient] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openConversationModal, setOpenConversationModal] = useState(false);
  const [conversationData, setConversationData] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(0);
  const { data: session } = useSession();
  const { 
    gestores, 
    handleSaveCliente
  } = useClientes();

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

  // Función para abrir modal de acción comercial
  const handleAccionComercial = (task) => {
    setSelectedClient({
      id: task.id,
      nombre: task.cliente,
      celular: task.telefono,
      email: task.email,
      documento: task.documento,
      gestor: task.gestor,
      observacion: task.observacion
    });
    setOpenModal(true);
  };

  // Función para cerrar modal de acción comercial
  const handleClose = () => {
    setOpenModal(false);
    setSelectedClient(null);
  };

  // Función para ver conversación (mantenemos local para manejar el estado de conversación)
  const handleVerConversacion = async (clienteId) => {
    setConversationLoading(true);
    setOpenConversationModal(true);

    try {
      const data = await fetchConversacion(clienteId);
      setConversationData(data);
    } catch (error) {
      console.error("Error al obtener la conversación:", error);
      setConversationData(null);
    } finally {
      setConversationLoading(false);
    }
  };

  // Función para cerrar modal de conversación
  const handleCloseConversation = () => {
    setOpenConversationModal(false);
    setConversationData(null);
    setSelectedConversation(0);
  };

  // Función personalizada para guardar cliente y marcar tarea como llamada
  const handleSaveClienteAndMarkTask = async (clienteData) => {
    try {
      // Primero guardar en la base de datos usando el hook
      await handleSaveCliente(clienteData);
      
      // Luego marcar la tarea como llamada localmente
      const now = new Date();
      const fechaHora = now.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      setTasks(prev => prev.map(task => 
        task.id === clienteData.id 
          ? { ...task, llamado: true, fechaLlamada: fechaHora }
          : task
      ));
      
      // Cerrar el modal
      handleClose();
      
    } catch (error) {
      console.error('Error al guardar cliente:', error);
    }
  };

  // Función para exportar datos
  const handleExport = () => {
    const csv = [
      ['ID', 'Cliente', 'Teléfono', 'Email', 'Documento', 'Estado', 'Gestor', 'Fecha Creación', 'Llamado', 'Fecha Llamada', 'Observación'],
      ...tasks.map(t => [
        t.id, 
        t.cliente, 
        t.telefono,
        t.email || 'N/A',
        t.documento,
        estadosConfig[t.estado].titulo,
        t.gestor, 
        t.fechaCreacion, 
        t.llamado ? 'Sí' : 'No', 
        t.fechaLlamada || 'N/A',
        t.observacion || 'N/A'
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
                onAccionComercial={handleAccionComercial}
                onVerConversacion={handleVerConversacion}
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
                  onAccionComercial={handleAccionComercial}
                  onVerConversacion={handleVerConversacion}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Modales */}
      <ActionComercialModal
        open={openModal}
        onClose={handleClose}
        cliente={selectedClient}
        onSave={handleSaveClienteAndMarkTask}
        gestores={gestores}
      />

      <ConversationModal
        open={openConversationModal}
        onClose={handleCloseConversation}
        conversationData={conversationData}
        conversationLoading={conversationLoading}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
    </Container>
  );
}
