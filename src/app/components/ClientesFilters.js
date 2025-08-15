"use client";

import { useState } from "react";
import { 
  TextField, 
  MenuItem, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select,
  Box,
  Paper,
  Typography,
  Chip,
  Divider
} from "@mui/material";
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { es } from "date-fns/locale";
import { startOfDay, endOfDay, subDays } from "date-fns";

const presets = [
  { label: "Todos", value: "all" },
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "7" },
  { label: "Últimos 30 días", value: "30" },
  { label: "Este mes", value: "month" },
  { label: "Personalizado", value: "custom" },
];

export default function ClientesFilters({ filters, setFilters }) {
  const [preset, setPreset] = useState("all");
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));

  const handlePresetChange = (event) => {
    const value = event.target.value;
    setPreset(value);

    let newStart, newEnd;
    if (value === "today") {
      newStart = startOfDay(new Date());
      newEnd = endOfDay(new Date());
    } else if (value === "7" || value === "30") {
      newStart = startOfDay(subDays(new Date(), parseInt(value, 10)));
      newEnd = endOfDay(new Date());
    } else if (value === "month") {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      newStart = startOfDay(firstDay);
      newEnd = endOfDay(new Date());
    } else if (value === "all") {
      newStart = undefined;
      newEnd = undefined;
    } else {
      return;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    setFilters((prev) => ({
      ...prev,
      fechaInicio: newStart ? newStart.toISOString() : "",
      fechaFin: newEnd ? newEnd.toISOString() : "",
    }));
  };

  const handleReset = () => {
    setPreset("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setFilters({
      search: "",
      estado: "Todos",
      accionComercial: "Todos",
      interaccionBot: "Todos",
      fechaInicio: "",
      fechaFin: "",
      fechaRegistro: null,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.estado && filters.estado !== "Todos") count++;
    if (filters.accionComercial && filters.accionComercial !== "Todos") count++;
    if (filters.interaccionBot && filters.interaccionBot !== "Todos") count++;
    if (filters.fechaInicio || filters.fechaFin) count++;
    if (filters.fechaRegistro) count++;
    return count;
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'white',
      borderRadius: 2,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#007391',
        },
      },
      '&.Mui-focused': {
        backgroundColor: 'white',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#007391',
          borderWidth: 2,
        },
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3
        }}
      >
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #007391 0%, #005c6b 100%)',
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <FilterIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Filtros de Búsqueda
          </Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip 
              label={`${getActiveFiltersCount()} activos`}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 500
              }}
            />
          )}
        <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<ClearIcon />}
              sx={{
                borderColor: '#ffffffff',
                color: '#ffffffff',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fafcffff',
                  color: '#000000ff',
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              Limpiar Filtros
            </Button>
        </Box>

        {/* Filters Content */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Búsqueda */}
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                label="Buscar cliente..."
                size="small"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={fieldStyles}
              />
            </Grid>

            {/* Estado */}
            <Grid item xs={12} md={6} lg={4}>
  <TextField
    select
    label="Estado del Cliente"
    size="small"
    value={filters.estado}
    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
    fullWidth
    variant="outlined"
    sx={fieldStyles}
  >
    <MenuItem value="Todos">
      <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Todos los estados
      </Typography>
    </MenuItem>

    <MenuItem value="Comunicacion inmediata">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Comunicación inmediata" size="small" color="primary" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Gestion de contrato">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Gestión de contrato" size="small" color="secondary" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Negociacion de pago">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Negociación de pago" size="small" color="success" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Duda agresiva no resuelta">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Duda agresiva no resuelta" size="small" color="error" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Duda no resuelta">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Duda no resuelta" size="small" color="warning" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Enojado">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Enojado" size="small" color="error" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="No interesado">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="No interesado" size="small" color="error" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Promesa de pago">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Promesa de pago" size="small" color="success" variant="outlined" />
      </Box>
    </MenuItem>

    <MenuItem value="Duda resuelta">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label="Duda resuelta" size="small" color="info" variant="outlined" />
      </Box>
    </MenuItem>
  </TextField>
</Grid>

            {/* Rango de Fechas */}
            <Grid item xs={12} md={6} lg={4}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Rango de Fechas</InputLabel>
                <Select
                  value={preset}
                  onChange={handlePresetChange}
                  label="Rango de Fechas"
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#007391',
                      },
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#007391',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {presets.map((preset) => (
                    <MenuItem key={preset.value} value={preset.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {preset.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Estado Asesor */}
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                select
                label="Estado Asesor"
                size="small"
                value={filters.accionComercial || "Todos"}
                onChange={(e) => setFilters({ ...filters, accionComercial: e.target.value })}
                fullWidth
                variant="outlined"
                sx={fieldStyles}
              >
                <MenuItem value="Todos">
                  <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Todos los asesores
                  </Typography>
                </MenuItem>
                <MenuItem value="Seguimiento - Duda no resuelta">Seguimiento - Duda no resuelta</MenuItem>
                <MenuItem value="No interesado">No interesado</MenuItem>
                <MenuItem value="Promesa de Pago">Promesa de Pago</MenuItem>
                <MenuItem value="Seguimiento - Duda resuelta">Seguimiento - Duda resuelta</MenuItem>
              </TextField>
            </Grid>

            {/* Interacción con Bot */}
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                select
                label="Interacción con Bot"
                size="small"
                value={filters.interaccionBot || "Todos"}
                onChange={(e) => setFilters({ ...filters, interaccionBot: e.target.value })}
                fullWidth
                variant="outlined"
                sx={fieldStyles}
              >
                <MenuItem value="Todos">
                  <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Todas las interacciones
                  </Typography>
                </MenuItem>
                <MenuItem value="Con interacción">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Con interacción" size="small" color="success" variant="outlined" />
                  </Box>
                </MenuItem>
                <MenuItem value="Sin interacción">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Sin interacción" size="small" color="default" variant="outlined" />
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Fecha de Registro */}
            <Grid item xs={12} md={6} lg={4}>
              <DatePicker
                label="Fecha de Registro"
                views={['year', 'month']}
                value={filters.fechaRegistro || null}
                onChange={(newValue) => {
                  setFilters((prev) => ({
                    ...prev,
                    fechaRegistro: newValue || null,
                  }));
                }}
                format="MMMM yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    variant: "outlined",
                    sx: fieldStyles,
                  },
                }}
              />
            </Grid>

            {/* Fechas Personalizadas */}
            {preset === "custom" && (
              <>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={startDate}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                      setFilters((prev) => ({
                        ...prev,
                        fechaInicio: newValue ? newValue.toISOString() : "",
                      }));
                    }}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        variant: "outlined",
                        sx: fieldStyles,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha Fin"
                    value={endDate}
                    onChange={(newValue) => {
                      setEndDate(newValue);
                      setFilters((prev) => ({
                        ...prev,
                        fechaFin: newValue ? newValue.toISOString() : "",
                      }));
                    }}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        variant: "outlined",
                        sx: fieldStyles,
                      },
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>

        </Box>
      </Paper>
    </LocalizationProvider>
  );
}