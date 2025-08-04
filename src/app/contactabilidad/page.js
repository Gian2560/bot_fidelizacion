"use client";
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplyIcon from '@mui/icons-material/Reply';
import GroupIcon from '@mui/icons-material/Group';

// Datos dummy para estadísticas
const statsData = {
  totalEnviados: 1500,
  entregados: 1250,
  leidos: 980,
  fallidos: 120,
  respondidos: 430,
  clientesContactados: 1000,
  tasaEntrega: 1250 / 1500,
  tasaLectura: 980 / 1250,
  tasaRespuesta: 430 / 980,
};

const kpiCards = [
  { title: 'Total Enviados', value: statsData.totalEnviados, icon: <CheckCircleIcon sx={{ color: '#1976d2', fontSize: 32 }} /> },
  { title: 'Entregados', value: statsData.entregados, icon: <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: 32 }} /> },
  { title: 'Leídos', value: statsData.leidos, icon: <VisibilityIcon sx={{ color: '#1976d2', fontSize: 32 }} /> },
  { title: 'Fallidos', value: statsData.fallidos, icon: <ErrorIcon sx={{ color: '#d32f2f', fontSize: 32 }} /> },
  { title: 'Respondidos', value: statsData.respondidos, icon: <ReplyIcon sx={{ color: '#5e35b1', fontSize: 32 }} /> },
  { title: 'Clientes Contactados', value: statsData.clientesContactados, icon: <GroupIcon sx={{ color: '#ff9800', fontSize: 32 }} /> },
];

const funnelData = [
  { name: 'Enviados', value: statsData.totalEnviados },
  { name: 'Entregados', value: statsData.entregados },
  { name: 'Leídos', value: statsData.leidos },
  { name: 'Respondidos', value: statsData.respondidos },
];

const barData = [
  { dia: 'Lun', enviados: 200, entregados: 180, leidos: 150, respondidos: 60 },
  { dia: 'Mar', enviados: 250, entregados: 210, leidos: 170, respondidos: 80 },
  { dia: 'Mié', enviados: 300, entregados: 260, leidos: 200, respondidos: 100 },
  { dia: 'Jue', enviados: 350, entregados: 300, leidos: 220, respondidos: 120 },
  { dia: 'Vie', enviados: 400, entregados: 300, leidos: 240, respondidos: 70 },
];

const mensajesRecientes = [
  { id: 1, destinatario: '+51987654321', estado: 'Leído', fecha: '2025-08-01 10:30', respuesta: 'Gracias!' },
  { id: 2, destinatario: '+51987654322', estado: 'Entregado', fecha: '2025-08-01 10:32', respuesta: '' },
  { id: 3, destinatario: '+51987654323', estado: 'Fallido', fecha: '2025-08-01 10:35', respuesta: '' },
  { id: 4, destinatario: '+51987654324', estado: 'Respondido', fecha: '2025-08-01 10:40', respuesta: '¿Cuándo es la próxima cuota?' },
];

const ESTADO_COLORS = {
  'Leído': '#1976d2',
  'Entregado': '#2e7d32',
  'Fallido': '#d32f2f',
  'Respondido': '#5e35b1',
};

export default function DashboardContabilidad() {

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="#1976d2">
        Dashboard de WhatsApp
      </Typography>

      {/* KPIs y PieChart en una sola fila */}
      <Grid container spacing={2} alignItems="stretch" mb={2}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {kpiCards.map((stat) => (
              <Grid item xs={6} sm={4} key={stat.title}>
                <Card elevation={3} sx={{ borderRadius: 2, bgcolor: '#e3f2fd', height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    {stat.icon}
                    <Box>
                      <Typography variant="subtitle2" color="#1976d2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="#254e59">
                        {stat.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 2 }}>
            <Typography variant="subtitle1" color="#1976d2" mb={1}>
              Distribución de Estados
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={funnelData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(ESTADO_COLORS)[index % 4]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos compactos en una fila */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="subtitle1" color="#1976d2" mb={1}>
                Embudo de Conversión
              </Typography>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="subtitle1" color="#1976d2" mb={1}>
                Actividad por Día
              </Typography>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="enviados" fill="#1976d2" />
                  <Bar dataKey="entregados" fill="#2e7d32" />
                  <Bar dataKey="leidos" fill="#1976d2" />
                  <Bar dataKey="respondidos" fill="#5e35b1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de mensajes recientes compacta */}
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="subtitle1" color="#1976d2" mb={1}>
            Mensajes Recientes
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Destinatario</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Respuesta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensajesRecientes.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>{msg.id}</TableCell>
                    <TableCell>{msg.destinatario}</TableCell>
                    <TableCell>
                      <Chip label={msg.estado} sx={{ bgcolor: ESTADO_COLORS[msg.estado], color: '#fff', fontWeight: 'bold', opacity: 0.85 }} />
                    </TableCell>
                    <TableCell>{msg.fecha}</TableCell>
                    <TableCell>{msg.respuesta || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}

