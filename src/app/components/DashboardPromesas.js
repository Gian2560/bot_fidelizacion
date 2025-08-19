// "use client";
// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   CardContent,
//   Typography,
//   Grid,
//   Box,
//   Avatar,
//   Chip,
//   LinearProgress,
//   Paper,
//   Divider,
//   IconButton,
//   Tooltip,
//   List,
//   ListItem,
//   ListItemAvatar,
//   ListItemText
// } from '@mui/material';
// import {
//   Payment as PaymentIcon,
//   TrendingUp as TrendingUpIcon,
//   CheckCircle as CheckCircleIcon,
//   Schedule as ScheduleIcon,
//   AttachMoney as MoneyIcon,
//   CalendarToday as CalendarIcon,
//   Person as PersonIcon,
//   Warning as WarningIcon
// } from '@mui/icons-material';
// import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// // Colores para los gráficos
// const COLORS = ['#4CAF50', '#FF9800', '#F44336', '#2196F3'];

// // Datos simulados de promesas de pago
// const datosSimulados = {
//   totalPromesas: 87,
//   promesasCumplidas: 62,
//   promesasPendientes: 18,
//   promesasVencidas: 7,
//   montoTotal: 156750,
//   montoCumplido: 118200,
//   tasaCumplimiento: 71,
//   tendencia: '+8%',
  
//   // Distribución por estado
//   estados: [
//     { name: 'Cumplidas', value: 62, color: '#4CAF50' },
//     { name: 'Pendientes', value: 18, color: '#FF9800' },
//     { name: 'Vencidas', value: 7, color: '#F44336' }
//   ],
  
//   // Promesas por gestor
//   gestores: [
//     { 
//       nombre: 'Ana García', 
//       promesas: 18, 
//       cumplidas: 15, 
//       monto: 32500, 
//       avatar: 'A',
//       tasa: 83
//     },
//     { 
//       nombre: 'Carlos López', 
//       promesas: 15, 
//       cumplidas: 9, 
//       monto: 28200, 
//       avatar: 'C',
//       tasa: 60
//     },
//     { 
//       nombre: 'María Rodríguez', 
//       promesas: 22, 
//       cumplidas: 18, 
//       monto: 41600, 
//       avatar: 'M',
//       tasa: 82
//     },
//     { 
//       nombre: 'Luis Torres', 
//       promesas: 16, 
//       cumplidas: 10, 
//       monto: 25800, 
//       avatar: 'L',
//       tasa: 63
//     },
//     { 
//       nombre: 'Elena Díaz', 
//       promesas: 16, 
//       cumplidas: 10, 
//       monto: 28650, 
//       avatar: 'E',
//       tasa: 63
//     }
//   ],
  
//   // Evolución mensual
//   evolucionMensual: [
//     { mes: 'Ene', cumplidas: 45, total: 65 },
//     { mes: 'Feb', cumplidas: 52, total: 72 },
//     { mes: 'Mar', cumplidas: 48, total: 68 },
//     { mes: 'Abr', cumplidas: 58, total: 78 },
//     { mes: 'May', cumplidas: 62, total: 87 }
//   ],
  
//   // Próximos vencimientos
//   proximosVencimientos: [
//     { cliente: 'Juan Pérez', monto: 3500, fecha: '2025-08-15', dias: 3, telefono: '+51987654321' },
//     { cliente: 'Ana Martín', monto: 2800, fecha: '2025-08-16', dias: 4, telefono: '+51976543210' },
//     { cliente: 'Luis García', monto: 4200, fecha: '2025-08-18', dias: 6, telefono: '+51965432187' },
//     { cliente: 'María López', monto: 1500, fecha: '2025-08-20', dias: 8, telefono: '+51954321876' }
//   ]
// };

// const DashboardPromesas = () => {
//   const [datos, setDatos] = useState(datosSimulados);

//   // Formatear números como moneda
//   const formatearMoneda = (amount) => {
//     return new Intl.NumberFormat('es-PE', {
//       style: 'currency',
//       currency: 'PEN'
//     }).format(amount);
//   };

//   return (
//     <Box>
//       {/* Encabezado */}
//       <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
//         <Box display="flex" alignItems="center" mb={2}>
//           <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
//             <PaymentIcon fontSize="large" />
//           </Avatar>
//           <Box>
//             <Typography variant="h4" sx={{ fontWeight: 700 }}>
//               Dashboard de Promesas de Pago
//             </Typography>
//             <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
//               Seguimiento y control de compromisos de pago
//             </Typography>
//           </Box>
//         </Box>
//       </Paper>

//       {/* Tarjetas de resumen */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         <Grid item xs={12} md={3}>
//           <Card elevation={3} sx={{ height: '100%' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="text.secondary" variant="body2">
//                     Total Promesas
//                   </Typography>
//                   <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#11998e' }}>
//                     {datos.totalPromesas}
//                   </Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: '#11998e', width: 48, height: 48 }}>
//                   <PaymentIcon />
//                 </Avatar>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={3}>
//           <Card elevation={3} sx={{ height: '100%' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="text.secondary" variant="body2">
//                     Cumplidas
//                   </Typography>
//                   <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
//                     {datos.promesasCumplidas}
//                   </Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}>
//                   <CheckCircleIcon />
//                 </Avatar>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={3}>
//           <Card elevation={3} sx={{ height: '100%' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="text.secondary" variant="body2">
//                     Monto Total
//                   </Typography>
//                   <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
//                     {formatearMoneda(datos.montoTotal)}
//                   </Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: '#2196F3', width: 48, height: 48 }}>
//                   <MoneyIcon />
//                 </Avatar>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={3}>
//           <Card elevation={3} sx={{ height: '100%' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Box>
//                   <Typography color="text.secondary" variant="body2">
//                     Tasa Cumplimiento
//                   </Typography>
//                   <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
//                     {datos.tasaCumplimiento}%
//                   </Typography>
//                 </Box>
//                 <Avatar sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}>
//                   <TrendingUpIcon />
//                 </Avatar>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Gráficos principales */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {/* Distribución por estado */}
//         <Grid item xs={12} md={6}>
//           <Card elevation={3} sx={{ height: 400 }}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
//                 Distribución por Estado
//               </Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <PieChart>
//                   <Pie
//                     data={datos.estados}
//                     cx="50%"
//                     cy="50%"
//                     labelLine={false}
//                     label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     dataKey="value"
//                   >
//                     {datos.estados.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                   <RechartsTooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Evolución mensual */}
//         <Grid item xs={12} md={6}>
//           <Card elevation={3} sx={{ height: 400 }}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
//                 Evolución Mensual
//               </Typography>
//               <ResponsiveContainer width="100%" height={300}>
//                 <AreaChart data={datos.evolucionMensual}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="mes" />
//                   <YAxis />
//                   <RechartsTooltip />
//                   <Area 
//                     type="monotone" 
//                     dataKey="total" 
//                     stackId="1" 
//                     stroke="#FF9800" 
//                     fill="#FF9800"
//                     fillOpacity={0.6}
//                   />
//                   <Area 
//                     type="monotone" 
//                     dataKey="cumplidas" 
//                     stackId="2" 
//                     stroke="#4CAF50" 
//                     fill="#4CAF50"
//                     fillOpacity={0.8}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       <Grid container spacing={3}>
//         {/* Performance por Gestor */}
//         <Grid item xs={12} md={8}>
//           <Card elevation={3}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
//                 Performance por Gestor
//               </Typography>
//               <Grid container spacing={2}>
//                 {datos.gestores.map((gestor, index) => (
//                   <Grid item xs={12} md={6} key={index}>
//                     <Paper elevation={1} sx={{ p: 2, borderLeft: `4px solid ${gestor.tasa >= 70 ? '#4CAF50' : '#FF9800'}` }}>
//                       <Box display="flex" alignItems="center" mb={2}>
//                         <Avatar sx={{ bgcolor: gestor.tasa >= 70 ? '#4CAF50' : '#FF9800', mr: 2 }}>
//                           {gestor.avatar}
//                         </Avatar>
//                         <Box flex={1}>
//                           <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
//                             {gestor.nombre}
//                           </Typography>
//                           <Typography variant="body2" color="text.secondary">
//                             {gestor.cumplidas}/{gestor.promesas} promesas • {formatearMoneda(gestor.monto)}
//                           </Typography>
//                         </Box>
//                         <Chip 
//                           label={`${gestor.tasa}%`}
//                           color={gestor.tasa >= 70 ? 'success' : 'warning'}
//                           variant="outlined"
//                         />
//                       </Box>
//                       <LinearProgress 
//                         variant="determinate" 
//                         value={gestor.tasa} 
//                         sx={{ 
//                           height: 8, 
//                           borderRadius: 4,
//                           backgroundColor: '#f5f5f5',
//                           '& .MuiLinearProgress-bar': {
//                             backgroundColor: gestor.tasa >= 70 ? '#4CAF50' : '#FF9800'
//                           }
//                         }}
//                       />
//                     </Paper>
//                   </Grid>
//                 ))}
//               </Grid>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Próximos vencimientos */}
//         <Grid item xs={12} md={4}>
//           <Card elevation={3} sx={{ height: '100%' }}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
//                 <WarningIcon sx={{ mr: 1, color: '#FF9800' }} />
//                 Próximos Vencimientos
//               </Typography>
//               <List dense>
//                 {datos.proximosVencimientos.map((promesa, index) => (
//                   <ListItem key={index} sx={{ px: 0 }}>
//                     <ListItemAvatar>
//                       <Avatar sx={{ 
//                         bgcolor: promesa.dias <= 3 ? '#F44336' : promesa.dias <= 7 ? '#FF9800' : '#4CAF50',
//                         width: 32,
//                         height: 32
//                       }}>
//                         <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
//                           {promesa.dias}
//                         </Typography>
//                       </Avatar>
//                     </ListItemAvatar>
//                     <ListItemText
//                       primary={
//                         <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                           {promesa.cliente}
//                         </Typography>
//                       }
//                       secondary={
//                         <Typography variant="body2" component="span" color="textSecondary">
//                           <Box component="span" sx={{ display: 'block', color: 'primary.main', fontWeight: 600, fontSize: '0.875rem' }}>
//                             {formatearMoneda(promesa.monto)}
//                           </Box>
//                           <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
//                             Vence: {promesa.fecha}
//                           </Box>
//                         </Typography>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//               </List>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };

// export default DashboardPromesas;

"use client";
import React, { useEffect, useState } from "react";
import {
  Card, CardContent, Typography, Grid, Box, Avatar, Chip, LinearProgress,
  Paper, List, ListItem, ListItemAvatar, ListItemText, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import {
  Payment as PaymentIcon, TrendingUp as TrendingUpIcon, CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon, Warning as WarningIcon
} from "@mui/icons-material";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
// si no lo tienes: npm i recharts

const COLORS = ["#4CAF50", "#FF9800", "#F44336", "#2196F3"];

const DashboardPromesas = () => {
  const [scope, setScope] = useState("todos");               // todos | asesor | bot
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    totalPromesas: 0,
    promesasCumplidas: 0,
    promesasPendientes: 0,
    promesasVencidas: 0,
    montoTotal: 0,
    montoCumplido: 0,
    tasaCumplimiento: 0,
    estados: [],
    gestores: [],
    proximosVencimientos: []
  });

  const formatearMoneda = (n) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n || 0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/promesas?scope=${scope}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancel) setDatos(json);
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [scope]);

  return (
    <Box>
      {/* Encabezado + Filtro */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "white" }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mr: 2, width: 56, height: 56 }}>
              <PaymentIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Dashboard de Promesas de Pago
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Seguimiento y control de compromisos de pago
              </Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            value={scope}
            exclusive
            onChange={(_, val) => val && setScope(val)}
            color="standard"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2 }}
          >
            <ToggleButton value="todos" sx={{ color: "white" }}>Todos</ToggleButton>
            <ToggleButton value="asesor" sx={{ color: "white" }}>Por asesor</ToggleButton>
            <ToggleButton value="bot" sx={{ color: "white" }}>Por bot</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">Total Promesas</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#11998e" }}>
                    {datos.totalPromesas}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#11998e", width: 48, height: 48 }}>
                  <PaymentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">Cumplidas</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#4CAF50" }}>
                    {datos.promesasCumplidas}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#4CAF50", width: 48, height: 48 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">Monto Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196F3" }}>
                    {formatearMoneda(datos.montoTotal)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#2196F3", width: 48, height: 48 }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">Tasa Cumplimiento</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#4CAF50" }}>
                    {datos.tasaCumplimiento}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#4CAF50", width: 48, height: 48 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico: Distribución por estado */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Distribución por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datos.estados}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={96}
                    dataKey="value"
                  >
                    {datos.estados.map((e, i) => (
                      <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximos vencimientos */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center" }}>
                <WarningIcon sx={{ mr: 1, color: "#FF9800" }} />
                Próximos Vencimientos
              </Typography>
              <List dense>
                {(datos.proximosVencimientos || []).map((p, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{
                        bgcolor: p.dias <= 3 ? "#F44336" : p.dias <= 7 ? "#FF9800" : "#4CAF50",
                        width: 32, height: 32
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>{p.dias}</Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{p.cliente}</Typography>}
                      secondary={
                        <Typography variant="body2" component="span" color="textSecondary">
                          <Box component="span" sx={{ display: "block", color: "primary.main", fontWeight: 600, fontSize: "0.875rem" }}>
                            {formatearMoneda(p.monto || 0)}
                          </Box>
                          <Box component="span" sx={{ display: "block", color: "text.secondary", fontSize: "0.75rem" }}>
                            Vence: {p.fecha}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance por Gestor (solo para asesor/todos) */}
      {Array.isArray(datos.gestores) && datos.gestores.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Performance por Gestor
                </Typography>

                <Grid container spacing={2}>
                  {datos.gestores.map((g, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper elevation={1} sx={{ p: 2, borderLeft: `4px solid ${g.tasa >= 70 ? "#4CAF50" : "#FF9800"}` }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ bgcolor: g.tasa >= 70 ? "#4CAF50" : "#FF9800", mr: 2 }}>
                            {g.avatar || "?"}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{g.nombre}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {g.cumplidas}/{g.promesas} promesas • {formatearMoneda(g.monto || 0)}
                            </Typography>
                          </Box>
                          <Chip label={`${g.tasa}%`} color={g.tasa >= 70 ? "success" : "warning"} variant="outlined" />
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={g.tasa}
                          sx={{
                            height: 8, borderRadius: 4, backgroundColor: "#f5f5f5",
                            "& .MuiLinearProgress-bar": { backgroundColor: g.tasa >= 70 ? "#4CAF50" : "#FF9800" }
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPromesas;
