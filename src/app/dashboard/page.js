"use client";
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Phone as PhoneIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import DashboardLlamadas from '../components/DashboardLlamadas';
import DashboardPromesas from '../components/DashboardPromesas';

// Componente de tab personalizado
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Datos de resumen general
const resumenGeneral = {
  totalAcciones: 243,
  totalPromesas: 87,
  tasaEfectividad: 68,
  ingresosMes: 245680
};

const DashboardPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [ultimaActualizacion] = useState(new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatearMoneda = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Encabezado principal */}
      <Paper elevation={3} sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Patrón de fondo decorativo */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }}
        />
        
        <Box position="relative" zIndex={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 3, width: 64, height: 64 }}>
                <DashboardIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  Dashboard Ejecutivo
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Panel de control y métricas de gestión
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Tooltip title="Actualizar datos">
                <IconButton sx={{ color: 'white', mb: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Última actualización: {ultimaActualizacion}
              </Typography>
            </Box>
          </Box>

          {/* Métricas de resumen */}
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {resumenGeneral.totalAcciones}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Acciones
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {resumenGeneral.totalPromesas}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Promesas Activas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {resumenGeneral.tasaEfectividad}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tasa Efectividad
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatearMoneda(resumenGeneral.ingresosMes)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ingresos del Mes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Navegación por pestañas */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            '& .MuiTab-root': { 
              minHeight: 72,
              fontSize: '1.1rem',
              fontWeight: 600
            }
          }}
        >
          <Tab 
            icon={<PhoneIcon sx={{ mb: 1 }} />}
            label="Dashboard de Llamadas"
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              color: tabValue === 0 ? '#667eea' : 'text.secondary'
            }}
          />
          <Tab 
            icon={<PaymentIcon sx={{ mb: 1 }} />}
            label="Dashboard de Promesas"
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              color: tabValue === 1 ? '#11998e' : 'text.secondary'
            }}
          />
        </Tabs>
      </Paper>

      {/* Contenido de las pestañas */}
      <TabPanel value={tabValue} index={0}>
        <DashboardLlamadas />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DashboardPromesas />
      </TabPanel>

      {/* Footer con información adicional */}
      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Sistema de Gestión de Cobranza • Actualizado en tiempo real
        </Typography>
      </Box>
    </Container>
  );
};

export default DashboardPage;
