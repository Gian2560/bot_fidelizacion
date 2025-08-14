"use client";

import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade
} from '@mui/material';

// Iconos
import GroupIcon from '@mui/icons-material/Group';
import TodayIcon from '@mui/icons-material/Today';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BusinessIcon from '@mui/icons-material/Business';
import ExportIcon from '@mui/icons-material/FileDownload';

import { useClientes } from "@/hooks/useClientes";
import ActionComercialModal from "../components/ActionComercialModal";
import ConversationModal from "../components/ConversationModal";

// Mapeo de estados para colores
const getEstadoConfig = (estado) => {
  const configs = {
    'Comunicacion inmediata': { color: '#007391', bg: '#e0f7fa' },
    'Negociacion de pago': { color: '#ff9800', bg: '#fff3e0' },
    'Gestion de contrato': { color: '#254e59', bg: '#e3f2fd' },
    'Duda no resuelta': { color: '#d32f2f', bg: '#ffebee' },
    'Duda agresiva no resuelta': { color: '#d32f2f', bg: '#ffebee' }
  };
  return configs[estado] || { color: '#666', bg: '#f5f5f5' };
};

// Header profesional moderno
function ProfessionalHeader({ totalClientes, activeFilters, onSearch, searchTerm }) {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        background: 'linear-gradient(135deg, #007391 0%, #005c6b 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        mb: 4
      }}
    >
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
      
      <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 3, width: 64, height: 64 }}>
              <GroupIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'white' }}>
                Gestión de Clientes
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, color: 'white' }}>
                Sistema integral de administración de clientes
              </Typography>
            </Box>
          </Box>
          <Box textAlign="right">
            <Chip 
              icon={<TodayIcon />}
              label={new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                mb: 1
              }}
            />
            <Typography variant="caption" display="block" sx={{ opacity: 0.8, color: 'white' }}>
              Última actualización: {new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {totalClientes}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                Total Clientes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {activeFilters}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                Filtros Activos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                {new Date().getDate()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                Día del Mes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                100%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                Disponibilidad
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/*<Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Buscar por nombre, teléfono, documento..."
            variant="outlined"
            size="medium"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'rgba(0,0,0,0.4)', mr: 1 }} />,
              sx: { bgcolor: 'white', borderRadius: 2 }
            }}
            sx={{ flex: 1 }}
          />
        </Box>*/}
      </Box>
    </Paper>
  );
}

// Filtros profesionales
function ProfessionalFilters({ filters, setFilters }) {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <FilterListIcon sx={{ mr: 2, color: '#007391' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#254e59' }}>
          Filtros Avanzados
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.estado || ''}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              label="Estado"
            >
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="Comunicacion inmediata">Comunicación Inmediata</MenuItem>
              <MenuItem value="Negociacion de pago">Negociación de Pago</MenuItem>
              <MenuItem value="Gestion de contrato">Gestión de Contrato</MenuItem>
              <MenuItem value="Duda no resuelta">Duda no Resuelta</MenuItem>
              <MenuItem value="Duda agresiva no resuelta">Duda Agresiva no Resuelta</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Score</InputLabel>
            <Select
              value={filters.score || ''}
              onChange={(e) => setFilters({ ...filters, score: e.target.value })}
              label="Score"
            >
              <MenuItem value="">Todos los scores</MenuItem>
              <MenuItem value="alto">Alto</MenuItem>
              <MenuItem value="medio">Medio</MenuItem>
              <MenuItem value="bajo">Bajo</MenuItem>
              <MenuItem value="no_score">Sin Score</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Gestor"
            value={filters.gestor || ''}
            onChange={(e) => setFilters({ ...filters, gestor: e.target.value })}
            placeholder="Filtrar por gestor"
          />
        </Grid>
      </Grid>
      
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="outlined"
          onClick={() => setFilters({})}
          sx={{ 
            borderColor: '#007391',
            color: '#007391',
            '&:hover': {
              borderColor: '#005c6b',
              bgcolor: '#f0f8ff'
            }
          }}
        >
          Limpiar Filtros
        </Button>
      </Box>
    </Paper>
  );
}

// Tabla moderna de clientes
function ModernClientesTable({ 
  clientes, 
  loading, 
  pagination, 
  setPagination,
  handleAccionComercial,
  handleVerConversacion 
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setPagination({ ...pagination, page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setPagination({ ...pagination, pageSize: newRowsPerPage, page: 1 });
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <CircularProgress size={60} sx={{ color: '#007391' }} />
        <Typography variant="h6" sx={{ mt: 2, color: '#254e59' }}>
          Cargando clientes...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#007391' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Cliente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Contacto</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Estado Asesor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Gestor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Última Interacción</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.map((cliente, index) => {
              const estadoConfig = getEstadoConfig(cliente.estado);
              return (
                <TableRow key={cliente.cliente_id || index} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, bgcolor: '#007391', width: 40, height: 40 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {cliente.nombre} {cliente.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Doc: {cliente.documento_identidad || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: '#007391' }} />
                        {cliente.celular}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cliente.email || 'Sin email'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={cliente.estado}
                      size="small"
                      sx={{
                        bgcolor: estadoConfig.bg,
                        color: estadoConfig.color,
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={cliente.estado_asesor || 'Sin Score'}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: cliente.score === 'alto' ? '#4caf50' : 
                                    cliente.score === 'medio' ? '#ff9800' : '#f44336',
                        color: cliente.score === 'alto' ? '#4caf50' : 
                               cliente.score === 'medio' ? '#ff9800' : '#f44336'
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#254e59', fontSize: '0.875rem' }}>
                        {cliente.gestor?.charAt(0) || 'N'}
                      </Avatar>
                      <Typography variant="body2">
                        {cliente.gestor || 'Sin asignar'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {cliente.fecha_ultima_interaccion ? 
                        new Date(cliente.fecha_ultima_interaccion).toLocaleDateString('es-ES') : 
                        'N/A'
                      }
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Ver conversación">
                        <IconButton
                          size="small"
                          onClick={() => handleVerConversacion(cliente.cliente_id)}
                          sx={{ color: '#007391' }}
                        >
                          <ChatIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Acción comercial">
                        <IconButton
                          size="small"
                          onClick={() => handleAccionComercial(cliente)}
                          sx={{ color: '#ff9800' }}
                        >
                          <CallIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={pagination.total || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        sx={{
          bgcolor: '#f8f9fa',
          borderTop: '1px solid #dee2e6',
          '& .MuiTablePagination-toolbar': {
            color: '#254e59'
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontWeight: 600
          }
        }}
      />
    </Paper>
  );
}

export default function ClientesPage() {
  const {
    clientes,
    totalClientes,
    gestores,
    loading,
    filters,
    setFilters,
    pagination,
    setPagination,
    openModal,
    openConversationModal,
    cliente,
    conversationData,
    conversationLoading,
    selectedConversation,
    setSelectedConversation,
    handleAccionComercial,
    handleClose,
    handleVerConversacion,
    handleCloseConversation,
    handleSaveCliente,
  } = useClientes();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Contar filtros activos
  const activeFilters = useMemo(() => {
    return Object.keys(filters).filter(key => filters[key] && filters[key] !== '').length;
  }, [filters]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setFilters({ ...filters, search: term });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header profesional */}
      <ProfessionalHeader 
        totalClientes={totalClientes}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        searchTerm={searchTerm}
      />

      {/* Filtros profesionales */}
      {/*<ProfessionalFilters 
        filters={filters}
        setFilters={setFilters}
      />*/}

      {/* Tabla moderna */}
      <Fade in timeout={500}>
        <Box>
          <ModernClientesTable
            clientes={clientes}
            loading={loading}
            pagination={pagination}
            setPagination={setPagination}
            handleAccionComercial={handleAccionComercial}
            handleVerConversacion={handleVerConversacion}
          />
        </Box>
      </Fade>

      {/* Modales */}
      <ActionComercialModal 
        open={openModal} 
        onClose={handleClose} 
        cliente={cliente} 
        gestores={gestores} 
        onSave={handleSaveCliente} 
      />

      <ConversationModal
        open={openConversationModal}
        onClose={handleCloseConversation}
        conversationLoading={conversationLoading}
        conversationData={conversationData}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
    </Container>
  );
}