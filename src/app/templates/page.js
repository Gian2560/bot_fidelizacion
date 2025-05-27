"use client";

import React, { useState, useMemo } from "react";
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const colors = {
  primaryBlue: "#007391",
  darkBlue: "#254e59",
  white: "#fff",
  errorRed: "#E53E3E",
  lightBlueBg: "#E3F2FD",
};

const initialTemplates = [
  {
    id: 1,
    nombre_template: "Plantilla 1",
    mensaje: "Hola {{1}}, tu deuda es {{2}}.",
    parametro: 2,
    created_at: "2024-01-01 10:00",
    template_content_sid: "abc123",
  },
  {
    id: 2,
    nombre_template: "Plantilla 2",
    mensaje: "Estimado {{1}}, su pago está pendiente de {{2}}.",
    parametro: 2,
    created_at: "2024-02-01 11:30",
    template_content_sid: "def456",
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(initialTemplates);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Form fields
  const [nombreTemplate, setNombreTemplate] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [parametro, setParametro] = useState(1);
  const [templateContentSid, setTemplateContentSid] = useState("");

  // Filtros estado local
  const [filterNombre, setFilterNombre] = useState("");
  const [filterParam, setFilterParam] = useState("");

  // Filtrado memoizado para DataGrid rows
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterNombre && !t.nombre_template.toLowerCase().includes(filterNombre.toLowerCase())) return false;
      if (filterParam && String(t.parametro) !== filterParam) return false;
      return true;
    });
  }, [templates, filterNombre, filterParam]);

  // Abrir modal crear
  const handleOpenNew = () => {
    setEditTemplate(null);
    setNombreTemplate("");
    setMensaje("");
    setParametro(1);
    setTemplateContentSid("");
    setModalOpen(true);
  };

  // Abrir modal editar
  const handleOpenEdit = (template) => {
    setEditTemplate(template);
    setNombreTemplate(template.nombre_template);
    setMensaje(template.mensaje);
    setParametro(template.parametro);
    setTemplateContentSid(template.template_content_sid);
    setModalOpen(true);
  };

  // Guardar plantilla (crear o editar)
  const handleSave = () => {
    if (!nombreTemplate.trim() || !mensaje.trim() || !templateContentSid.trim()) {
      alert("Por favor complete todos los campos");
      return;
    }
    if (editTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editTemplate.id
            ? {
                ...t,
                nombre_template: nombreTemplate,
                mensaje,
                parametro,
                template_content_sid: templateContentSid,
              }
            : t
        )
      );
    } else {
      const newId = templates.length ? Math.max(...templates.map((t) => t.id)) + 1 : 1;
      setTemplates((prev) => [
        ...prev,
        {
          id: newId,
          nombre_template: nombreTemplate,
          mensaje,
          parametro,
          template_content_sid: templateContentSid,
          created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      ]);
    }
    setModalOpen(false);
  };

  // Eliminar plantilla
  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de eliminar esta plantilla?")) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Valores únicos de parámetros para filtro
  const uniqueParametros = [...new Set(templates.map((t) => String(t.parametro)))];

  // Columnas para DataGrid
  const columns = [
    { field: "id", headerName: "ID", width: 70, headerAlign: "center", align: "center" },
    {
      field: "nombre_template",
      headerName: "Nombre Plantilla",
      flex: 1,
      headerAlign: "center",
      align: "left",
    },
    {
      field: "mensaje",
      headerName: "Mensaje",
      flex: 2,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box
          sx={{
            maxWidth: 300,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={params.value}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "parametro",
      headerName: "Parámetros",
      width: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "template_content_sid",
      headerName: "Template Content SID",
      width: 180,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "created_at",
      headerName: "Creado En",
      width: 160,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 140,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <IconButton
            color="primary"
            size="small"
            aria-label="Editar plantilla"
            onClick={() => handleOpenEdit(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            aria-label="Eliminar plantilla"
            onClick={() => handleDelete(params.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography
        variant="h3"
        sx={{ color: colors.primaryBlue, fontWeight: "700", mb: 4, textAlign: "center" }}
      >
        Gestión de Plantillas
      </Typography>

      {/* FILTROS */}
      <Paper
        elevation={6}
        sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: colors.white, boxShadow: 3 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Buscar por nombre"
              fullWidth
              value={filterNombre}
              onChange={(e) => setFilterNombre(e.target.value)}
              sx={{ bgcolor: colors.lightBlueBg, borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Número de parámetros</InputLabel>
              <Select
                value={filterParam}
                label="Número de parámetros"
                onChange={(e) => setFilterParam(e.target.value)}
                sx={{ bgcolor: colors.lightBlueBg, borderRadius: 2 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {uniqueParametros.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} textAlign="right">
            <Button variant="contained" color="primary" onClick={handleOpenNew}>
              + Nueva Plantilla
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA */}
      <Paper
        elevation={6}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: colors.white,
          boxShadow: 3,
          height: 600,
          width: "100%",
        }}
      >
        <DataGrid
          rows={filteredTemplates}
          columns={columns}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          disableRowSelectionOnClick
          pagination
          sx={{
            borderRadius: 3,
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.lightBlueBg,
              color: colors.darkBlue,
              fontWeight: "700",
            },
            "& .MuiDataGrid-cell": {
              color: colors.darkBlue,
              fontWeight: 600,
            },
            "& .MuiTablePagination-root": {
              color: colors.darkBlue,
            },
          }}
        />
      </Paper>

      {/* Modal Crear / Editar */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTemplate ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nombre de la plantilla"
                fullWidth
                value={nombreTemplate}
                onChange={(e) => setNombreTemplate(e.target.value)}
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Mensaje"
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Número de Parámetros"
                type="number"
                fullWidth
                inputProps={{ min: 0, max: 10 }}
                value={parametro}
                onChange={(e) => setParametro(Number(e.target.value))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Template Content SID"
                fullWidth
                value={templateContentSid}
                onChange={(e) => setTemplateContentSid(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editTemplate ? "Guardar Cambios" : "Crear Plantilla"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
