"use client";

import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../../services/api";
import {
  Container, Typography, Paper, Grid, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, IconButton, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  Switch, FormControlLabel, Chip, Divider, Alert,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, CircularProgress,
  Snackbar
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";

const colors = {
  primaryBlue: "#007391",
  darkBlue: "#254e59", 
  lightBlue: "#4FC3F7",
  white: "#fff",
  lightBlueBg: "#E3F2FD",
  darkBlueBg: "#1E3A8A",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  darkGray: "#374151"
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [nombreTemplate, setNombreTemplate] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [categoria, setCategoria] = useState("MARKETING");
  const [idioma, setIdioma] = useState("es");
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [botones, setBotones] = useState([]);
  const [filterNombre, setFilterNombre] = useState("");
  const [filterEstadoMeta, setFilterEstadoMeta] = useState("");
  
  // Estados para manejo de errores bonitos
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [showError, setShowError] = useState(false);
  
  // Estados para mensajes de éxito
  const [successMessage, setSuccessMessage] = useState("");
  const [successDetails, setSuccessDetails] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Estados para ejemplos de parámetros
  const [parametrosMensaje, setParametrosMensaje] = useState([]);
  const [ejemplosMensaje, setEjemplosMensaje] = useState({});
  const [parametrosHeader, setParametrosHeader] = useState([]);
  const [ejemplosHeader, setEjemplosHeader] = useState({});

  // Detectar parámetros en el mensaje automáticamente
  useEffect(() => {
    const params = (mensaje.match(/\{\{(\d+)\}\}/g) || []).map(p => p.replace(/\{\{|\}\}/g, ''));
    const uniqueParams = [...new Set(params)].sort((a, b) => Number(a) - Number(b));
    setParametrosMensaje(uniqueParams);
    
    // Mantener ejemplos existentes, agregar vacíos para nuevos parámetros
    const newEjemplos = { ...ejemplosMensaje };
    uniqueParams.forEach(param => {
      if (!newEjemplos[param]) {
        newEjemplos[param] = '';
      }
    });
    setEjemplosMensaje(newEjemplos);
  }, [mensaje]);

  // Detectar parámetros en el header automáticamente
  useEffect(() => {
    const params = (header.match(/\{\{(\d+)\}\}/g) || []).map(p => p.replace(/\{\{|\}\}/g, ''));
    const uniqueParams = [...new Set(params)].sort((a, b) => Number(a) - Number(b));
    setParametrosHeader(uniqueParams);
    
    const newEjemplos = { ...ejemplosHeader };
    uniqueParams.forEach(param => {
      if (!newEjemplos[param]) {
        newEjemplos[param] = '';
      }
    });
    setEjemplosHeader(newEjemplos);
  }, [header]);

  useEffect(() => {
    fetchTemplates();
    syncMetaStatus();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/plantillas');
      setTemplates(res.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  const syncMetaStatus = async () => {
    try {
      setSyncing(true);
      const res = await axiosInstance.post('/plantillas/sync');
      
      if (res.data.success) {
        const stats = res.data.estadisticas;
        setSuccessMessage("Sincronización completada exitosamente");
        setSuccessDetails(
          `🆕 Creadas: ${stats.creadas}\n` +
          `✅ Actualizadas: ${stats.actualizadas}\n` +
          `📊 Total en Meta: ${stats.total_meta}\n` +
          `💾 Total en BD: ${stats.total_bd}` +
          (stats.errores > 0 ? `\n⚠️ Errores: ${stats.errores}` : '')
        );
        setShowSuccess(true);
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error sync:", error);
      alert(error.response?.data?.mensaje || "Error al sincronizar plantillas");
    } finally {
      setSyncing(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterNombre && !t.nombre.toLowerCase().includes(filterNombre.toLowerCase())) return false;
      if (filterEstadoMeta && t.estado_meta !== filterEstadoMeta) return false;
      return true;
    });
  }, [templates, filterNombre, filterEstadoMeta]);

  const handleOpenNew = () => {
    setEditTemplate(null);
    setNombreTemplate("");
    setMensaje("");
    setCategoria("MARKETING");
    setIdioma("es_PE");
    setHeader("");
    setFooter("");
    setBotones([]);
    setParametrosMensaje([]);
    setEjemplosMensaje({});
    setParametrosHeader([]);
    setEjemplosHeader({});
    setModalOpen(true);
  };

  const handleOpenEdit = (template) => {
    setEditTemplate(template);
    setNombreTemplate(template.nombre);
    setMensaje(template.mensaje_cliente);
    setCategoria(template.categoria || "MARKETING");
    setIdioma(template.idioma || "es_PE");
    setHeader(template.header || "");
    setFooter(template.footer || "");
    setBotones([]);
    setParametrosMensaje([]);
    setEjemplosMensaje({});
    setParametrosHeader([]);
    setEjemplosHeader({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombreTemplate.trim() || !mensaje.trim()) {
      alert("Complete nombre y mensaje");
      return;
    }

    // Validar formato del nombre (solo minúsculas, números y guiones bajos)
    if (!/^[a-z0-9_]+$/.test(nombreTemplate)) {
      alert("❌ El nombre solo puede contener letras minúsculas, números y guiones bajos (_)");
      return;
    }

    // Validar parámetros en el mensaje
    const parametrosEnMensaje = mensaje.match(/\{\{(\w+)\}\}/g);
    if (parametrosEnMensaje) {
      const parametros = parametrosEnMensaje.map(p => p.replace(/\{\{|\}\}/g, ''));
      
      // Verificar que sean solo números
      const tienenSoloNumeros = parametros.every(p => /^\d+$/.test(p));
      if (!tienenSoloNumeros) {
        alert("❌ Los parámetros deben ser numéricos.\nUse {{1}}, {{2}}, {{3}}, etc.\nNo use nombres como {{nombre}}");
        return;
      }

      // Verificar que no se repitan
      const parametrosUnicos = new Set(parametros);
      if (parametrosUnicos.size !== parametros.length) {
        alert("❌ Los parámetros no pueden repetirse.\nCada número debe aparecer solo una vez: {{1}}, {{2}}, {{3}}...");
        return;
      }

      // Verificar que sean consecutivos desde 1
      const numerosOrdenados = parametros.map(Number).sort((a, b) => a - b);
      for (let i = 0; i < numerosOrdenados.length; i++) {
        if (numerosOrdenados[i] !== i + 1) {
          alert(`❌ Los parámetros deben ser consecutivos desde {{1}}.\nFalta el parámetro {{${i + 1}}}`);
          return;
        }
      }

      // Validar que todos los parámetros tengan ejemplos
      for (const param of parametrosMensaje) {
        if (!ejemplosMensaje[param] || !ejemplosMensaje[param].trim()) {
          alert(`❌ Debe proporcionar un ejemplo para el parámetro {{${param}}}`);
          return;
        }
      }

      // 🚨 VALIDACIÓN DEL RATIO DE PARÁMETROS (Meta WhatsApp Business)
      const ratioParametros = parametrosMensaje.length / mensaje.length;
      const porcentajeRatio = (ratioParametros * 100).toFixed(1);
      
      console.log(`📊 Análisis: ${parametrosMensaje.length} parámetros, ${mensaje.length} caracteres, ratio: ${ratioParametros.toFixed(3)} (${porcentajeRatio}%)`);
      
      if (ratioParametros > 0.15) {
        const confirm = window.confirm(
          `⚠️ ADVERTENCIA: Ratio alto de parámetros (${porcentajeRatio}%)\n\n` +
          `Meta WhatsApp puede rechazar esta plantilla porque tiene demasiados parámetros (${parametrosMensaje.length}) para la longitud del mensaje (${mensaje.length} caracteres).\n\n` +
          `SOLUCIONES:\n` +
          `• Reduce el número de parámetros {{1}}, {{2}}\n` +
          `• Aumenta el texto del mensaje agregando más palabras\n` +
          `• Mantén el ratio por debajo del 15%\n\n` +
          `¿Quieres continuar de todos modos?`
        );
        if (!confirm) {
          return;
        }
      }
    }

    // Validar parámetros en header
    const validarParametros = (texto, campo) => {
      const params = texto.match(/\{\{(\w+)\}\}/g);
      if (params) {
        const nums = params.map(p => p.replace(/\{\{|\}\}/g, ''));
        if (!nums.every(p => /^\d+$/.test(p))) {
          alert(`❌ Los parámetros en ${campo} deben ser numéricos ({{1}}, {{2}}, etc.)`);
          return false;
        }
      }
      return true;
    };

    if (header && !validarParametros(header, "Header")) return;
    if (footer && !validarParametros(footer, "Footer")) return;

    // Validar ejemplos del header
    if (parametrosHeader.length > 0) {
      for (const param of parametrosHeader) {
        if (!ejemplosHeader[param] || !ejemplosHeader[param].trim()) {
          alert(`❌ Debe proporcionar un ejemplo para el parámetro {{${param}}} en el Header`);
          return;
        }
      }
    }

    // Construir ejemplos para enviar al backend
    const ejemplosMensajeArray = parametrosMensaje.map(p => ejemplosMensaje[p]);
    const ejemplosHeaderArray = parametrosHeader.length > 0 
      ? parametrosHeader.map(p => ejemplosHeader[p]) 
      : undefined;

    const templateData = {
      nombre: nombreTemplate,
      mensaje: mensaje,
      guardar_en_bd: true,
      categoria,
      idioma,
      header: header || undefined,
      footer: footer || undefined,
      botones: botones.length > 0 ? botones : undefined,
      ejemplos_mensaje: ejemplosMensajeArray.length > 0 ? ejemplosMensajeArray : undefined,
      ejemplos_header: ejemplosHeaderArray
    };

    try {
      setLoading(true);
      if (editTemplate) {
        const res = await axiosInstance.put('/plantillas', { ...templateData, id: editTemplate.id });
        if (res.data.success) {
          alert('✅ Plantilla actualizada exitosamente');
          await fetchTemplates();
        }
      } else {
        const res = await axiosInstance.post('/plantillas', templateData);
        if (res.data.success) {
          setSuccessMessage(res.data.mensaje || "Plantilla creada exitosamente");
          setSuccessDetails("📋 Estado: PENDING\n⏳ Tiempo de aprobación: 24-48 hrs");
          setShowSuccess(true);
          await fetchTemplates();
        }
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      console.log("🔍 Estructura del error:", JSON.stringify(error.response?.data, null, 2));
      
      // 🎨 Mostrar errores bonitos usando Meta's error_user_msg
      let errorMsg = "Error al guardar plantilla";
      let detalles = "";
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // 🔍 Revisar múltiples estructuras posibles
        console.log("🔍 Buscando error_user_msg en:", {
          "error_user_msg (directo)": responseData.error_user_msg,
          "detalles?.error?.error_user_msg": responseData.detalles?.error?.error_user_msg,
          "detalles?.error_user_msg": responseData.detalles?.error_user_msg
        });
        
        // Buscar error_user_msg en diferentes ubicaciones (priorizar directo)
        let errorUserMsg = null;
        let errorSubcode = null;
        
        if (responseData.error_user_msg) {
          errorUserMsg = responseData.error_user_msg;
          errorSubcode = responseData.error_subcode;
        } else if (responseData.detalles?.error?.error_user_msg) {
          errorUserMsg = responseData.detalles.error.error_user_msg;
          errorSubcode = responseData.detalles.error.error_subcode;
        } else if (responseData.detalles?.error_user_msg) {
          errorUserMsg = responseData.detalles.error_user_msg;
          errorSubcode = responseData.detalles.error_subcode;
        }
        
        if (errorUserMsg) {
          errorMsg = errorUserMsg;
          
          // Agregar contexto específico según el error
          if (errorSubcode === 2388293) {
            detalles = "💡 SOLUCIÓN:\n• Reduce los parámetros {{1}}, {{2}}\n• Agrega más texto al mensaje\n• Mantén ratio parámetros/texto < 15%";
          }
        }
        // Si no hay error_user_msg, usar el error normal
        else if (responseData.error) {
          errorMsg = responseData.error;
        }
        // Último recurso
        else if (responseData.detalles) {
          errorMsg = typeof responseData.detalles === 'string' ? responseData.detalles : JSON.stringify(responseData.detalles);
        }
      }
      
      // 🎨 Mostrar error bonito en lugar de alert
      setErrorMessage(errorMsg);
      setErrorDetails(detalles);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`¿Eliminar plantilla "${row.nombre}"?`)) {
      try {
        setLoading(true);
        // Enviar nombre_meta (el ID de Meta) para eliminar
        const res = await axiosInstance.delete('/plantillas', { 
          data: { nombre_meta: row.nombre_meta || row.id } 
        });
        if (res.data.success) {
          setSuccessMessage("Plantilla eliminada exitosamente");
          setSuccessDetails("La plantilla ha sido eliminada de Meta WhatsApp Business");
          setShowSuccess(true);
          await fetchTemplates();
        }
      } catch (error) {
        console.error("Error:", error);
        
        // Mostrar error bonito
        let errorMsg = "Error al eliminar";
        if (error.response?.data?.error_user_msg) {
          errorMsg = error.response.data.error_user_msg;
        } else if (error.response?.data?.detalles?.error?.error_user_msg) {
          errorMsg = error.response.data.detalles.error.error_user_msg;
        } else if (error.response?.data?.mensaje) {
          errorMsg = error.response.data.mensaje;
        } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        }
        
        setErrorMessage(errorMsg);
        setErrorDetails("");
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper 
        elevation={6} 
        sx={{ 
          background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.darkBlue} 100%)`,
          color: 'white', 
          borderRadius: 3, 
          p: 2.5, 
          mb: 3
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography 
              variant="h5" 
              fontWeight="600" 
              sx={{ mb: 0.5 }}
            >
              Gestión de Plantillas WhatsApp
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ opacity: 0.9 }}
            >
              Administra plantillas de mensajes con Meta Business API
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                variant="outlined" 
                startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />} 
                onClick={syncMetaStatus} 
                disabled={syncing} 
                size="small"
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Sincronizar
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleOpenNew} 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  color: colors.primaryBlue,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'white'
                  }
                }}
              >
                Nueva Plantilla
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          border: `1px solid ${colors.lightBlueBg}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={1}>
            <Typography 
              variant="body2" 
              fontWeight="600" 
              sx={{ color: colors.darkBlue }}
            >
              Filtros:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField 
              label="Buscar por nombre" 
              fullWidth 
              size="small"
              value={filterNombre} 
              onChange={(e) => setFilterNombre(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primaryBlue
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: colors.primaryBlue
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel 
                sx={{
                  '&.Mui-focused': {
                    color: colors.primaryBlue
                  }
                }}
              >
                Estado Meta
              </InputLabel>
              <Select value={filterEstadoMeta} onChange={(e) => setFilterEstadoMeta(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="APPROVED">Aprobada</MenuItem>
                <MenuItem value="PENDING">Pendiente</MenuItem>
                <MenuItem value="REJECTED">Rechazada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      <Paper 
        elevation={12} 
        sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          border: `1px solid ${colors.lightBlueBg}`
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: colors.primaryBlue, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" fontWeight="600">
            Plantillas de WhatsApp Business
          </Typography>
          <Chip 
            label={`${filteredTemplates.length} plantillas`}
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600
            }}
          />
        </Box>
        
        <Box sx={{ height: 500, p: 1 }}>
          <DataGrid 
            rows={filteredTemplates} 
            columns={[
              { 
                field: "id", 
                headerName: "ID", 
                width: 70,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell'
              },
              { 
                field: "nombre", 
                headerName: "Nombre", 
                flex: 1,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (params) => (
                  <Box sx={{ 
                    fontWeight: 500, 
                    color: colors.darkBlue
                  }}>
                    {params.value}
                  </Box>
                )
              },
              { 
                field: "mensaje_cliente", 
                headerName: "Mensaje", 
                flex: 2,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (params) => (
                  <Box sx={{ 
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: colors.darkGray
                  }}>
                    {params.value}
                  </Box>
                )
              },
              { 
                field: "categoria", 
                headerName: "Categoría", 
                width: 120,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (params) => (
                  <Chip 
                    label={params.value}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: params.value === 'MARKETING' ? colors.primaryBlue : colors.warning,
                      color: params.value === 'MARKETING' ? colors.primaryBlue : colors.warning,
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                )
              },
              { 
                field: "estado_meta", 
                headerName: "Estado", 
                width: 120,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (params) => {
                  const estado = params.value;
                  const getEstadoConfig = (estado) => {
                    switch (estado) {
                      case 'APPROVED':
                        return { color: colors.success, text: 'Aprobada' };
                      case 'PENDING':
                        return { color: colors.warning, text: 'Pendiente' };
                      case 'REJECTED':
                        return { color: colors.error, text: 'Rechazada' };
                      default:
                        return { color: colors.gray, text: estado || 'Desconocido' };
                    }
                  };
                  
                  const config = getEstadoConfig(estado);
                  return (
                    <Chip 
                      label={config.text}
                      size="small"
                      sx={{ 
                        bgcolor: config.color,
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    />
                  );
                }
              },
              { 
                field: "created_at", 
                headerName: "Creado", 
                width: 120,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (p) => (
                  <Box sx={{ color: colors.gray, fontSize: '0.8rem' }}>
                    {p.value ? new Date(p.value).toLocaleDateString('es-ES') : '-'}
                  </Box>
                )
              },
              { 
                field: "acciones", 
                headerName: "Acciones", 
                width: 120,
                headerClassName: 'custom-header',
                cellClassName: 'custom-cell',
                renderCell: (params) => (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenEdit(params.row)}
                      sx={{ 
                        color: colors.primaryBlue,
                        '&:hover': {
                          bgcolor: colors.lightBlueBg
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(params.row)}
                      sx={{ 
                        color: colors.error,
                        '&:hover': {
                          bgcolor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )
              }
            ]} 
            pageSizeOptions={[10, 25, 50]} 
            pagination 
            loading={loading}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .custom-header': {
                bgcolor: colors.lightBlueBg,
                color: colors.darkBlue,
                fontWeight: 700,
                fontSize: '0.95rem',
                borderBottom: `2px solid ${colors.primaryBlue}`
              },
              '& .custom-cell': {
                borderBottom: `1px solid ${colors.lightGray}`,
                '&:hover': {
                  bgcolor: colors.lightBlueBg + '30'
                }
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  bgcolor: colors.lightBlueBg + '20',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,115,145,0.15)'
                },
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              },
              '& .MuiDataGrid-columnSeparator': {
                display: 'none'
              },
              '& .MuiDataGrid-footerContainer': {
                bgcolor: colors.lightGray,
                borderTop: `2px solid ${colors.primaryBlue}`,
                '& .MuiTablePagination-root': {
                  color: colors.darkBlue
                }
              }
            }}
          />
        </Box>
      </Paper>

      {/* Modal para crear/editar plantilla */}
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: `linear-gradient(135deg, ${colors.primaryBlue} 0%, ${colors.darkBlue} 100%)`,
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {editTemplate ? 'Editar Plantilla' : 'Nueva Plantilla Meta WhatsApp'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                Las plantillas creadas en Meta requieren aprobación antes de poder usarse (24-48 hrs)
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Nombre de la plantilla"
                fullWidth
                value={nombreTemplate}
                onChange={(e) => setNombreTemplate(e.target.value)}
                helperText="Use solo letras minúsculas, números y guiones bajos. Ej: bienvenida_cliente"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <MenuItem value="MARKETING">Marketing</MenuItem>
                  <MenuItem value="UTILITY">Utilidad</MenuItem>
                  <MenuItem value="AUTHENTICATION">Autenticación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Idioma</InputLabel>
                <Select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="es_MX">Español (México)</MenuItem>
                  <MenuItem value="es_PE">Español (Perú)</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Contenido del mensaje" />
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Header (opcional)"
                fullWidth
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                helperText="Texto del encabezado (máx. 60 caracteres). Puede usar variables: {{1}}, {{2}}, etc."
                inputProps={{ maxLength: 60 }}
              />
            </Grid>

            {/* Ejemplos para parámetros del Header */}
            {parametrosHeader.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  📝 Detectados {parametrosHeader.length} parámetro(s) en el Header. Proporcione ejemplos:
                </Alert>
                <Grid container spacing={2}>
                  {parametrosHeader.map((param) => (
                    <Grid item xs={12} md={6} key={`header-${param}`}>
                      <TextField
                        label={`Ejemplo para {{${param}}} (Header)`}
                        fullWidth
                        value={ejemplosHeader[param] || ''}
                        onChange={(e) => setEjemplosHeader({ ...ejemplosHeader, [param]: e.target.value })}
                        placeholder={`Ej: ${param === '1' ? 'Juan Pérez' : 'Valor ' + param}`}
                        required
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Mensaje principal *"
                fullWidth
                multiline
                rows={4}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                helperText="Texto del cuerpo del mensaje. Puede usar variables: {{1}}, {{2}}, etc."
                required
              />
            </Grid>

            {/* Ejemplos para parámetros del Mensaje */}
            {parametrosMensaje.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  📝 Detectados {parametrosMensaje.length} parámetro(s) en el Mensaje. Proporcione ejemplos:
                </Alert>
                <Grid container spacing={2}>
                  {parametrosMensaje.map((param) => (
                    <Grid item xs={12} md={6} key={`mensaje-${param}`}>
                      <TextField
                        label={`Ejemplo para {{${param}}}`}
                        fullWidth
                        value={ejemplosMensaje[param] || ''}
                        onChange={(e) => setEjemplosMensaje({ ...ejemplosMensaje, [param]: e.target.value })}
                        placeholder={`Ej: ${param === '1' ? 'Juan Pérez' : param === '2' ? 'Maqui Sistemas' : 'Valor ' + param}`}
                        required
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Footer (opcional)"
                fullWidth
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                helperText="Texto del pie de página (máx. 60 caracteres)"
                inputProps={{ maxLength: 60 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Opciones" />
              </Divider>
            </Grid>

            {!editTemplate && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<CheckCircleIcon />}>
                  ✅ La plantilla se creará automáticamente en Meta WhatsApp Business y se guardará en tu base de datos local
                </Alert>
              </Grid>
            )}

            {!editTemplate && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  ⏳ Estado inicial: PENDING. Meta revisará y aprobará la plantilla en 24-48 hrs
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={loading || !nombreTemplate.trim() || !mensaje.trim()}
            sx={{ bgcolor: colors.primaryBlue }}
          >
            {loading ? <CircularProgress size={24} /> : (editTemplate ? 'Actualizar' : 'Crear Plantilla')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🎨 Snackbar para errores bonitos */}
      <Snackbar 
        open={showError} 
        autoHideDuration={8000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: 600,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            ❌ Error de Meta WhatsApp
          </Typography>
          <Typography variant="body2" gutterBottom>
            {errorMessage}
          </Typography>
          {errorDetails && (
            <Typography variant="body2" sx={{ 
              mt: 1, 
              p: 1, 
              bgcolor: 'rgba(0,0,0,0.05)', 
              borderRadius: 1,
              whiteSpace: 'pre-line'
            }}>
              {errorDetails}
            </Typography>
          )}
        </Alert>
      </Snackbar>

      {/* 🎉 Snackbar para mensajes de éxito */}
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={5000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          sx={{ 
            width: '100%', 
            maxWidth: 600,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            ✅ Operación Exitosa
          </Typography>
          <Typography variant="body2" gutterBottom>
            {successMessage}
          </Typography>
          {successDetails && (
            <Typography variant="body2" sx={{ 
              mt: 1, 
              p: 1, 
              bgcolor: 'rgba(0,0,0,0.05)', 
              borderRadius: 1,
              whiteSpace: 'pre-line'
            }}>
              {successDetails}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Container>
  );
}
