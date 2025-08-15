"use client";

import { useParams } from "next/navigation";
import { useClienteDetalle } from "@/hooks/useClienteDetalle";
import { 
  Typography, Box, Tabs, Tab, Divider, Card, CardContent, CircularProgress,
  Grid, Chip, Paper, Avatar, LinearProgress, Container
} from "@mui/material";
import ConversationModal from "@/app/components/ConversationModal";
import { useState } from "react";
import Historico from "@/app/components/Historico";

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ScoreIcon from '@mui/icons-material/Score';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChatIcon from '@mui/icons-material/Chat';

export default function ClienteDetallePage() {
  const { id } = useParams();
  const {
    cliente,
    loading,
    conversationData,
    conversationLoading,
    selectedConversation,
    setSelectedConversation,
    loadConversacion,
  } = useClienteDetalle(id);

  const [tab, setTab] = useState(0);

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    if (!estado) return { color: '#666', bg: '#f5f5f5' };
    
    const estadoUpper = estado.toUpperCase();
    const colorMap = {
      'ACTIVO': { color: '#4caf50', bg: '#e8f5e8' },
      'PROMESA DE PAGO': { color: '#2196f3', bg: '#e3f2fd' },
      'NO INTERESADO': { color: '#f44336', bg: '#ffebee' },
      'SEGUIMIENTO - DUDA RESUELTA': { color: '#9c27b0', bg: '#f3e5f5' },
      'SEGUIMIENTO - DUDA NO RESUELTA': { color: '#ff9800', bg: '#fff3e0' },
    };
    return colorMap[estadoUpper] || { color: '#666', bg: '#f5f5f5' };
  };

  // Función para obtener el color del score
  const getScoreColor = (score) => {
    if (!score || score === 'no_score') return { color: '#666', bg: '#f5f5f5' };
    
    const scoreMap = {
      'alto': { color: '#4caf50', bg: '#e8f5e8' },
      'medio': { color: '#ff9800', bg: '#fff3e0' },
      'bajo': { color: '#f44336', bg: '#ffebee' },
    };
    return scoreMap[score.toLowerCase()] || { color: '#666', bg: '#f5f5f5' };
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
          <CircularProgress size={60} sx={{ color: "#007391", mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Cargando información del cliente...</Typography>
        </Box>
      </Container>
    );
  }

  if (!cliente) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#ffebee' }}>
          <Typography variant="h5" sx={{ color: "#d32f2f", mb: 2 }}>❌ Cliente no encontrado</Typography>
          <Typography color="textSecondary">El cliente solicitado no existe en la base de datos.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 🔹 ENCABEZADO PROFESIONAL CON GRADIENT */}
      <Paper 
        elevation={8}
        sx={{ 
          background: 'linear-gradient(135deg, #007391 0%, #005c6b 100%)',
          color: 'white',
          borderRadius: 3,
          p: 4,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(50%, -50%)'
          }
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 80, 
                  height: 80,
                  fontSize: '2rem'
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  {cliente.nombre} {cliente.apellido || ''}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="h6">{cliente.celular}</Typography>
                </Box>
                {cliente.email && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body1">{cliente.email}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>Estado del Cliente</Typography>
              <Chip
                label={cliente.estado || 'Sin estado'}
                sx={{
                  bgcolor: getEstadoColor(cliente.estado).bg,
                  color: getEstadoColor(cliente.estado).color,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  height: 40,
                  px: 2
                }}
              />
              {cliente.score && cliente.score !== 'no_score' && (
                <Box mt={2}>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>Score</Typography>
                  <Chip
                    icon={<ScoreIcon />}
                    label={cliente.score.toUpperCase()}
                    sx={{
                      bgcolor: getScoreColor(cliente.score).bg,
                      color: getScoreColor(cliente.score).color,
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 🔹 PESTAÑAS MODERNAS */}
      <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{
            background: 'linear-gradient(90deg, #007391 0%, #005c6b 100%)',
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 60,
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            },
            '& .Mui-selected': {
              color: '#ffcc00',
              backgroundColor: 'rgba(236, 236, 236, 0.2)',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffcc00',
              height: 4
            },
          }}
        >
          <Tab 
            icon={<AssignmentIndIcon />} 
            iconPosition="start"
            label="Información General" 
          />
          <Tab 
            icon={<ChatIcon />} 
            iconPosition="start"
            label="Conversaciones" 
            onClick={loadConversacion} 
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
            label="Histórico" 
          />
        </Tabs>

        {/* 🔹 CONTENIDO DE LAS PESTAÑAS */}
        <Box sx={{ p: 3, bgcolor: '#fafafa', minHeight: '500px' }}>
          {tab === 0 && (
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#007391', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon /> Información Personal
                    </Typography>
                    
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Documento de Identidad</Typography>
                        <Typography variant="body1">{cliente.documento_identidad || 'No registrado'} ({cliente.tipo_documento || 'N/A'})</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Email</Typography>
                        <Typography variant="body1">{cliente.email || 'No registrado'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Gestor Asignado</Typography>
                        <Chip 
                          label={cliente.gestor || 'Sin asignar'} 
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Fecha de Creación</Typography>
                        <Typography variant="body1">{formatearFecha(cliente.fecha_creacion)}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Estados y Seguimiento */}
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#007391', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon /> Estados y Seguimiento
                    </Typography>
                    
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Estado Actual</Typography>
                        <Chip
                          label={cliente.estado || 'Sin estado'}
                          sx={{
                            bgcolor: getEstadoColor(cliente.estado).bg,
                            color: getEstadoColor(cliente.estado).color,
                            fontWeight: 'bold',
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Estado del Asesor</Typography>
                        <Chip
                          label={cliente.estado_asesor || 'Sin estado'}
                          sx={{
                            bgcolor: getEstadoColor(cliente.estado_asesor).bg,
                            color: getEstadoColor(cliente.estado_asesor).color,
                            fontWeight: 'bold',
                            mt: 0.5
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Última Interacción</Typography>
                        <Typography variant="body1">{formatearFecha(cliente.fecha_ultima_interaccion)}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Última Interacción Bot</Typography>
                        <Typography variant="body1">{formatearFecha(cliente.fecha_ultima_interaccion_bot)}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información Financiera */}
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#007391', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceWalletIcon /> Información Financiera
                    </Typography>
                    
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Monto</Typography>
                        <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          {cliente.monto ? `$${cliente.monto}` : 'No especificado'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Fecha de Cuota</Typography>
                        <Typography variant="body1">{cliente.feccuota || 'No especificada'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Código de Pago</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {cliente.codpago || 'No disponible'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Cuenta Activa de Pago</Typography>
                        <Chip 
                          label={cliente.Cta_Act_Pag ? `Cuenta ${cliente.Cta_Act_Pag}` : 'No definida'} 
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Información Adicional */}
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#007391', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon /> Información Adicional
                    </Typography>
                    
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Modelo</Typography>
                        <Typography variant="body1">{cliente.modelo || 'No especificado'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Código de Asociado</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {cliente.codigo_asociado || 'No disponible'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Categoría No Interés</Typography>
                        <Typography variant="body1">{cliente.categoria_no_interes || 'No aplica'}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold">Detalle No Interés</Typography>
                        <Typography variant="body1">{cliente.detalle_no_interes || 'No aplica'}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Observaciones y Detalles */}
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#007391', mb: 2 }}>
                      📝 Observaciones y Detalles
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold" sx={{ mb: 1 }}>
                          Observaciones
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', minHeight: 100 }}>
                          <Typography variant="body1">
                            {cliente.observacion || 'Sin observaciones registradas'}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary" fontWeight="bold" sx={{ mb: 1 }}>
                          Detalle
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', minHeight: 100 }}>
                          <Typography variant="body1">
                            {cliente.detalle || 'Sin detalles adicionales'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab de Conversaciones */}
          {tab === 1 && (
            <ConversationModal
              open={true}
              conversationData={conversationData}
              conversationLoading={conversationLoading}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
              onClose={() => setTab(0)}
            />
          )}

          {/* Tab de Histórico */}
          {tab === 2 && (
            <Box>
              <Historico clienteId={id} />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
