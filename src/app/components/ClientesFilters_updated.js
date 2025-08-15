"use client";

import { useState } from "react";
import { TextField, MenuItem, Button, Grid, FormControl, InputLabel, Select } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { es } from "date-fns/locale"; // 📌 Asegura el idioma correcto para español
import { startOfDay, endOfDay, subDays } from "date-fns";

const presets = [
  { label: "Todos", value: "all" },
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "7" },
  { label: "Últimos 30 días", value: "30" },
  { label: "Este mes", value: "month" },
  { label: "Personalizado", value: "custom" },
];

// Estados actualizados
const ESTADOS_DISPONIBLES = [
  "Comunicacion inmediata",
  "Gestion de contrato",
  "Negociacion de pago",
  "Duda agresiva no resuelta",
  "Duda no resuelta",
  "Enojado",
  "No interesado",
  "Promesa de pago",
  "Duda resuelta"
];

const ESTADOS_ASESOR_DISPONIBLES = [
  "Seguimiento - Duda no resuelta",
  "No interesado",
  "Promesa de Pago",
  "Seguimiento - Duda resuelta"
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
      // Si se selecciona "Todos", no se establece ningún filtro de fecha
      newStart = undefined;
      newEnd = undefined;
    } else {
      return; // Si es "custom", no cambia fechas hasta que el usuario elija
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    setFilters((prev) => ({
      ...prev,
      fechaInicio: newStart ? newStart.toISOString() : "",
      fechaFin: newEnd ? newEnd.toISOString() : "",
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Grid container spacing={2} alignItems="center" sx={{ padding: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Buscar..."
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Estado"
            size="small"
            value={filters.estado || "Todos"}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value === "Todos" ? "" : e.target.value })}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            {ESTADOS_DISPONIBLES.map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Rango de Fechas</InputLabel>
            <Select
              value={preset}
              onChange={handlePresetChange}
              label="Rango de Fechas"
              sx={{ borderRadius: "8px", backgroundColor: "#f9f9f9" }}
            >
              {presets.map((preset) => (
                <MenuItem key={preset.value} value={preset.value}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtro de Estado Asesor */}
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Estado Asesor"
            size="small"
            value={filters.estadoAsesor || "Todos"}
            onChange={(e) => setFilters({ ...filters, estadoAsesor: e.target.value === "Todos" ? "" : e.target.value })}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            {ESTADOS_ASESOR_DISPONIBLES.map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Interacción con Bot"
            size="small"
            value={filters.interaccionBot || "Todos"} // Valor por defecto "Todos"
            onChange={(e) => setFilters({ ...filters, interaccionBot: e.target.value === "Todos" ? "" : e.target.value })}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="Con interacción">Con interacción</MenuItem>
            <MenuItem value="Sin interacción">Sin interacción</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Estado Pago"
            size="small"
            value={filters.estadoPago || "Todos"}
            onChange={(e) => setFilters({ ...filters, estadoPago: e.target.value === "Todos" ? "" : e.target.value })}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="pago">Con Pago</MenuItem>
            <MenuItem value="no_pago">Sin Pago</MenuItem>
          </TextField>
        </Grid>

        {preset === "custom" && (
          <>
            <Grid item xs={12} sm={6}>
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
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha Fin"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                  setFilters((prev) => ({
                    ...prev,
                    fechaFin: newValue ? newEnd.toISOString() : "",
                  }));
                }}
                format="dd/MM/yyyy"
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={4}>
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
                sx: {
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={() => {
              setPreset("today");
              setStartDate(startOfDay(new Date()));
              setEndDate(endOfDay(new Date()));
              setFilters({
                search: "",
                estado: "",
                estadoAsesor: "",
                interaccionBot: "",
                estadoPago: "",
                fechaInicio: "",
                fechaFin: "",
                fechaRegistro: "",
              });
            }}
            sx={{
              backgroundColor: "#007391",
              "&:hover": { backgroundColor: "#005c6b" },
              padding: "8px 20px",
              borderRadius: "2px",
              fontWeight: "bold",
            }}
          >
            LIMPIAR
          </Button>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}
