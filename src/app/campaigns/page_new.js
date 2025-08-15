"use client";

import { 
  Box, Button, Typography, CircularProgress, Alert, Container, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Tooltip, IconButton, Grid, Card, CardContent,
  Fade, InputAdornment, TextField
} from "@mui/material";
import CampaignModal from "../components/CampaignModal";
import useCampaigns from "../../hooks/useCampaigns";
import { useRouter } from "next/navigation";

// Iconos
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CampaignIcon from '@mui/icons-material/Campaign';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';

const CampaignsPage = () => {
  const {
    campaigns,
    templates,
    pagination,
    setPagination,
    sortModel,
    setSortModel,
    openModal,
    selectedCampaign,
    handleEdit,
    handleClose,
    fetchCampaigns,
    handleCreate,
    handleCreateCampaign,
    handleDeleteCampaign,
    handleUploadClients,
    loading,
    error,
  } = useCampaigns();
  const router = useRouter();

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    if (!estado) return { color: '#666', bg: '#f5f5f5' };
    
    const estadoUpper = estado.toUpperCase();
    const colorMap = {
      'ACTIVA': { color: '#4caf50', bg: '#e8f5e8' },
      'PAUSADA': { color: '#ff9800', bg: '#fff3e0' },
      'FINALIZADA': { color: '#f44336', bg: '#ffebee' },
      'BORRADOR': { color: '#9c27b0', bg: '#f3e5f5' },
    };
    return colorMap[estadoUpper] || { color: '#2196f3', bg: '#e3f2fd' };
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  // Función para manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: parseInt(event.target.value, 10), 
      page: 1 
    }));
  };

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
            <Box display="flex" alignItems="center" gap={2}>
              <CampaignIcon sx={{ fontSize: '3rem' }} />
              <Box>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  Gestión de Campañas
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Administra y monitorea todas tus campañas de marketing
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '1.1rem',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Nueva Campaña
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 🔹 ESTADÍSTICAS RÁPIDAS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={4} 
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(45deg, #e8f5e8 0%, #c8e6c9 100%)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingUpIcon sx={{ fontSize: '3rem', color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">
                {campaigns?.length || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" fontWeight="500">
                Total Campañas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={4} 
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(45deg, #e3f2fd 0%, #bbdefb 100%)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CampaignIcon sx={{ fontSize: '3rem', color: '#2196f3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#1976d2">
                {campaigns?.filter(c => c.estado_campanha === 'activa')?.length || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" fontWeight="500">
                Campañas Activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={4} 
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(45deg, #fff3e0 0%, #ffcc80 100%)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <GroupIcon sx={{ fontSize: '3rem', color: '#ff9800', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#f57c00">
                {campaigns?.reduce((sum, camp) => sum + (camp.num_clientes || 0), 0) || 0}
              </Typography>
              <Typography variant="body1" color="textSecondary" fontWeight="500">
                Total Clientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🔹 FILTROS Y BÚSQUEDA */}
      <Paper elevation={4} sx={{ borderRadius: 3, p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar campañas por nombre o descripción..."
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#007391',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#007391',
                  }
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary" textAlign="right">
              Mostrando {campaigns?.length || 0} de {pagination.total || 0} campañas
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 🔹 ALERTA DE ERROR */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => {/* limpiar error */}}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* 🔹 TABLA MODERNA */}
      {loading ? (
        <Paper elevation={4} sx={{ borderRadius: 3, p: 8, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: "#007391", mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Cargando campañas...
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow 
                  sx={{ 
                    background: 'linear-gradient(90deg, #007391 0%, #005c6b 100%)',
                    '& .MuiTableCell-root': {
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      borderBottom: 'none'
                    }
                  }}
                >
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Clientes</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns?.map((campaign, index) => (
                  <TableRow
                    key={campaign.id}
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: '#f8f9fa',
                      },
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        transform: 'scale(1.01)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell>
                      <Chip 
                        label={campaign.id} 
                        size="small"
                        sx={{ 
                          bgcolor: '#007391', 
                          color: 'white', 
                          fontWeight: 'bold' 
                        }} 
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="600" color="#2c3e50">
                        {campaign.nombre_campanha || 'Sin nombre'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {campaign.descripcion || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={campaign.estado_campanha || 'Sin estado'}
                        sx={{
                          bgcolor: getEstadoColor(campaign.estado_campanha).bg,
                          color: getEstadoColor(campaign.estado_campanha).color,
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {formatearFecha(campaign.fechaCreacion)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={campaign.num_clientes || 0}
                        variant="outlined"
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: '#4caf50',
                              '&:hover': { 
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                transform: 'scale(1.1)' 
                              }
                            }}
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Editar campaña">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: '#007391',
                              '&:hover': { 
                                bgcolor: 'rgba(0, 115, 145, 0.1)',
                                transform: 'scale(1.1)' 
                              }
                            }}
                            onClick={() => handleEdit(campaign)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={campaign.puedeEliminar ? "Eliminar campaña" : "No se puede eliminar (campaña enviada)"}>
                          <span>
                            <IconButton 
                              size="small"
                              disabled={!campaign.puedeEliminar}
                              sx={{ 
                                color: '#f44336',
                                '&:hover': { 
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  transform: 'scale(1.1)' 
                                },
                                '&.Mui-disabled': {
                                  color: '#bdbdbd'
                                }
                              }}
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Mostrar mensaje si no hay campañas */}
                {!campaigns || campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box textAlign="center">
                        <CampaignIcon sx={{ fontSize: '4rem', color: '#bdbdbd', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No hay campañas disponibles
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                          Crea tu primera campaña para comenzar
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleCreate}
                          sx={{ bgcolor: '#007391' }}
                        >
                          Crear Campaña
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 🔹 PAGINACIÓN MODERNA */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={pagination.total || 0}
            rowsPerPage={pagination.pageSize}
            page={(pagination.page || 1) - 1}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
            sx={{
              borderTop: '1px solid #e0e0e0',
              '& .MuiTablePagination-toolbar': {
                padding: '16px 24px'
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.875rem',
                color: '#616161'
              }
            }}
          />
        </Paper>
      )}

      {/* 🔹 MODAL DE CAMPAÑA */}
      <CampaignModal
        open={openModal}
        onClose={handleClose}
        campaign={selectedCampaign}
        templates={templates}
        onSave={handleCreateCampaign}
      />
    </Container>
  );
};

export default CampaignsPage;
