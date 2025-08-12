"use client";
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Datos simulados de acciones comerciales
const datosSimulados = {
  totalLlamadas: 156,
  llamadasHoy: 24,
  llamadasMes: 89,
  promedioLlamadasDia: 12,
  tendencia: '+15%',
  
  // Distribución por resultado
  resultados: [
    { name: 'Contacto Exitoso', value: 65, color: '#00C49F' },
    { name: 'No Contesta', value: 45, color: '#FF8042' },
    { name: 'Promesa de Pago', value: 28, color: '#0088FE' },
    { name: 'No Interesado', value: 18, color: '#FFBB28' }
  ],
  
  // Llamadas por gestor
  gestores: [
    { nombre: 'Ana García', llamadas: 34, meta: 40, avatar: 'A' },
    { nombre: 'Carlos López', llamadas: 28, meta: 35, avatar: 'C' },
    { nombre: 'María Rodríguez', llamadas: 31, meta: 30, avatar: 'M' },
    { nombre: 'Luis Torres', llamadas: 25, meta: 30, avatar: 'L' },
    { nombre: 'Elena Díaz', llamadas: 38, meta: 45, avatar: 'E' }
  ],
  
  // Tendencia semanal
  tendenciaSemanal: [
    { dia: 'Lun', llamadas: 18 },
    { dia: 'Mar', llamadas: 22 },
    { dia: 'Mié', llamadas: 15 },
    { dia: 'Jue', llamadas: 28 },
    { dia: 'Vie', llamadas: 24 },
    { dia: 'Sáb', llamadas: 12 },
    { dia: 'Dom', llamadas: 8 }
  ]
};

const DashboardLlamadas = () => {
  const [datos, setDatos] = useState(datosSimulados);

  // Calcular porcentaje de cumplimiento promedio
  const cumplimientoPromedio = Math.round(
    datos.gestores.reduce((acc, gestor) => acc + (gestor.llamadas / gestor.meta), 0) / datos.gestores.length * 100
  );

  return (
    <Box>
      {/* Encabezado */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
            <PhoneIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Dashboard de Llamadas
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Gestión y seguimiento de acciones comerciales
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Llamadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {datos.totalLlamadas}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                  <PhoneIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Llamadas Hoy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
                    {datos.llamadasHoy}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#00C49F', width: 48, height: 48 }}>
                  <CalendarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Promedio/Día
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFBB28' }}>
                    {datos.promedioLlamadasDia}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FFBB28', width: 48, height: 48 }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Tendencia
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
                    {datos.tendencia}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#00C49F', width: 48, height: 48 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de resultados */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Distribución por Resultado
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datos.resultados}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datos.resultados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tendencia semanal */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Tendencia Semanal
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datos.tendenciaSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="llamadas" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance por Gestor */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Performance por Gestor
          </Typography>
          <Grid container spacing={2}>
            {datos.gestores.map((gestor, index) => {
              const porcentaje = Math.round((gestor.llamadas / gestor.meta) * 100);
              const cumpleMeta = porcentaje >= 100;
              
              return (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Paper elevation={1} sx={{ p: 2, borderLeft: `4px solid ${cumpleMeta ? '#00C49F' : '#FF8042'}` }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: cumpleMeta ? '#00C49F' : '#FF8042', mr: 2 }}>
                        {gestor.avatar}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {gestor.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {gestor.llamadas}/{gestor.meta} llamadas
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${porcentaje}%`}
                        color={cumpleMeta ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(porcentaje, 100)} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f5f5f5',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: cumpleMeta ? '#00C49F' : '#FF8042'
                        }
                      }}
                    />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardLlamadas;
