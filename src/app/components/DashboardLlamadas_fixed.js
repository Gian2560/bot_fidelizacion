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
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Fade,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
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
  
  // Distribución por estado (basada en los estados reales encontrados en BD)
  resultados: [
    { name: 'Promesa de Pago', value: 28, color: '#00C49F' },
    { name: 'Seguimiento - Duda resuelta', value: 35, color: '#0088FE' },
    { name: 'No interesado', value: 18, color: '#FF8042' },
    { name: 'Seguimiento - Duda no resuelta', value: 12, color: '#FFA726' }
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
  // 📊 Estados principales
  const [datos, setDatos] = useState(datosSimulados);
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGestores, setLoadingGestores] = useState(false);
  
  // 🎨 Estados para filtros
  const [filtros, setFiltros] = useState({
    gestor: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // 📊 Función para transformar datos de la API al formato del componente
  const transformarDatosAPI = (datosAPI) => {
    if (!datosAPI || !datosAPI.distribucionEstados) {
      return datosSimulados;
    }

    // 🎨 Colores específicos para cada estado
    const coloresEstados = {
      'Promesa de Pago': '#00C49F',
      'Seguimiento - Duda resuelta': '#0088FE',
      'No interesado': '#FF8042',
      'Seguimiento - Duda no resuelta': '#FFA726'
    };

    // Transformar distribucionEstados en formato para el gráfico de pie
    const resultados = Object.entries(datosAPI.distribucionEstados)
      .filter(([estado, cantidad]) => cantidad > 0) // Solo estados con datos
      .map(([estado, cantidad]) => ({
        name: estado,
        value: cantidad,
        color: coloresEstados[estado] || '#8884d8'
      }));

    return {
      ...datosAPI,
      resultados: resultados
    };
  };

  // 📅 Obtener fechas por defecto (último mes)
  const obtenerFechasPorDefecto = () => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    return {
      fechaDesde: hace30Dias.toISOString().split('T')[0],
      fechaHasta: hoy.toISOString().split('T')[0]
    };
  };

  // 🔄 Cargar gestores al inicializar
  useEffect(() => {
    cargarGestores();
    const fechasDefecto = obtenerFechasPorDefecto();
    setFiltros(prev => ({
      ...prev,
      ...fechasDefecto
    }));
  }, []);

  // 🔄 Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarEstadisticas();
    }
  }, [filtros]);

  // 📊 Función para cargar gestores
  const cargarGestores = async () => {
    try {
      setLoadingGestores(true);
      const response = await fetch('/api/gestores');
      if (response.ok) {
        const data = await response.json();
        setGestores(data);
      } else {
        console.error('Error al cargar gestores');
      }
    } catch (error) {
      console.error('Error al cargar gestores:', error);
    } finally {
      setLoadingGestores(false);
    }
  };

  // 📊 Función para cargar estadísticas (conectada con API real)
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // 🔗 Preparación de parámetros para la API
      const params = new URLSearchParams({
        gestor: filtros.gestor || '',
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta
      });

      console.log('📊 Llamando a API statsasesor con parámetros:', params.toString());
      
      // 🌐 Llamada real a la API
      const response = await fetch(`/api/statsasesor?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos de la API:', data);
        
        // 🔄 Transformar datos de la API al formato del componente
        const datosTransformados = transformarDatosAPI(data);
        console.log('🔄 Datos transformados:', datosTransformados);
        setDatos(datosTransformados);
      } else {
        console.error('❌ Error en la respuesta de la API:', response.status);
        // Fallback a datos simulados si hay error
        setDatos(datosSimulados);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      // Fallback a datos simulados si hay error
      setDatos(datosSimulados);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manejar cambios en filtros
  const manejarCambioFiltro = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // 🔄 Resetear filtros
  const resetearFiltros = () => {
    const fechasDefecto = obtenerFechasPorDefecto();
    setFiltros({
      gestor: '',
      ...fechasDefecto
    });
  };

  // Calcular porcentaje de cumplimiento promedio
  const cumplimientoPromedio = datos.gestores && datos.gestores.length > 0 ? 
    Math.round(datos.gestores.reduce((acc, gestor) => acc + (gestor.llamadas / gestor.meta), 0) / datos.gestores.length * 100) : 0;

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

      {/* 🎛️ Panel de Filtros */}
      <Fade in={true}>
        <Card elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <FilterIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Filtros de Búsqueda
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            {/* Filtro por Gestor */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                loading={loadingGestores}
                options={[{ id: '', nombre_completo: 'Todos los gestores' }, ...gestores]}
                getOptionLabel={(option) => option.nombre_completo || ''}
                value={gestores.find(g => g.id === filtros.gestor) || { id: '', nombre_completo: 'Todos los gestores' }}
                onChange={(event, newValue) => {
                  manejarCambioFiltro('gestor', newValue?.id || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gestor"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                      endAdornment: (
                        <>
                          {loadingGestores ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {option.nombre_completo?.charAt(0) || 'T'}
                    </Avatar>
                    {option.nombre_completo}
                  </Box>
                )}
              />
            </Grid>

            {/* Filtro Fecha Desde */}
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => manejarCambioFiltro('fechaDesde', e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: <CalendarIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            {/* Filtro Fecha Hasta */}
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Hasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => manejarCambioFiltro('fechaHasta', e.target.value)}
                fullWidth
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: <CalendarIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            {/* Botones de Acción */}
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={resetearFiltros}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    },
                  }}
                >
                  Limpiar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Información de filtros activos */}
          {(filtros.gestor || filtros.fechaDesde || filtros.fechaHasta) && (
            <Box mt={2} p={2} sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Filtros activos:</strong>
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {filtros.gestor && (
                  <Chip
                    label={`Gestor: ${gestores.find(g => g.id === filtros.gestor)?.nombre_completo || 'Seleccionado'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filtros.fechaDesde && (
                  <Chip
                    label={`Desde: ${filtros.fechaDesde}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filtros.fechaHasta && (
                  <Chip
                    label={`Hasta: ${filtros.fechaHasta}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}
        </Card>
      </Fade>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', position: 'relative' }}>
            {loading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(255,255,255,0.8)"
                zIndex={1}
                borderRadius={1}
              >
                <CircularProgress />
              </Box>
            )}
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Llamadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {datos.totalLlamadas || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                  <PhoneIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', position: 'relative' }}>
            {loading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(255,255,255,0.8)"
                zIndex={1}
                borderRadius={1}
              >
                <CircularProgress />
              </Box>
            )}
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Llamadas Hoy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
                    {datos.llamadasHoy || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#00C49F', width: 48, height: 48 }}>
                  <CalendarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', position: 'relative' }}>
            {loading && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(255,255,255,0.8)"
                zIndex={1}
                borderRadius={1}
              >
                <CircularProgress />
              </Box>
            )}
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Promedio/Día
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFBB28' }}>
                    {datos.promedioLlamadasDia || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FFBB28', width: 48, height: 48 }}>
                  <ScheduleIcon />
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
                Estados de Acciones Comerciales
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datos.resultados || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => 
                      value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(datos.resultados || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      `${value} acciones`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de barras por categorías de estados */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Resumen por Categorías
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  {
                    categoria: 'Exitosos',
                    cantidad: (datos.distribucionEstados?.['Promesa de Pago'] || 0),
                    color: '#00C49F'
                  },
                  {
                    categoria: 'En Proceso',
                    cantidad: (datos.distribucionEstados?.['Seguimiento - Duda resuelta'] || 0),
                    color: '#0088FE'
                  },
                  {
                    categoria: 'Negativos',
                    cantidad: (datos.distribucionEstados?.['No interesado'] || 0) + 
                             (datos.distribucionEstados?.['Seguimiento - Duda no resuelta'] || 0),
                    color: '#FF8042'
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} acciones`, 'Cantidad']}
                  />
                  <Bar dataKey="cantidad" fill="#8884d8">
                    {[
                      { fill: '#00C49F' },
                      { fill: '#0088FE' },
                      { fill: '#FF8042' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 📋 Estado de Preparación para APIs */}
      <Fade in={true}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mt: 3, 
            backgroundColor: 'info.light', 
            color: 'info.contrastText',
            borderLeft: '4px solid',
            borderLeftColor: 'info.main'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            🚀 Dashboard con Estados Reales de Acciones Comerciales
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            • Gráficos actualizados: Estados específicos de la base de datos<br/>
            • API Gestores: <code>/api/gestores</code> ✅ (Funcionando)<br/>
            • API Estadísticas: <code>/api/statsasesor</code> ✅ (Estados reales de BD)<br/>
            • Estados disponibles: "Promesa de Pago", "Seguimiento - Duda resuelta", "No interesado", "Seguimiento - Duda no resuelta"<br/>
            • Visualización: Gráfico de pie + Barras por categorías con transformación automática de datos<br/>
            • Categorización: Exitosos (Promesa de Pago) | En Proceso (Duda resuelta) | Negativos (No interesado + Duda no resuelta)
          </Typography>
        </Paper>
      </Fade>
     
    </Box>
  );
};

export default DashboardLlamadas;
