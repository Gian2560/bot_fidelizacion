"use client";

import { useState } from "react";
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
  Card,
  CardContent,
  Stack,
  Button,
  Divider,
  Box,
} from "@mui/material";

import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function CampaignPage() {
  const [campaignName, setCampaignName] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [columns, setColumns] = useState([]);
  const [template, setTemplate] = useState("");
  const [clientSegment, setClientSegment] = useState("");
  const [cluster, setCluster] = useState("");
  const [strategy, setStrategy] = useState("");
  const [variable1, setVariable1] = useState("");
  const [variable2, setVariable2] = useState("");
  const [sendDate, setSendDate] = useState(null);
  const [sendTime, setSendTime] = useState(null);

  // Datos simulados
  const databases = ["Database1", "Database2", "Database3"];
  const columnsOptions = {
    Database1: ["Name", "Segment", "Cluster", "Strategy"],
    Database2: ["ClientID", "Email", "DebtAmount", "PaymentHistory"],
    Database3: ["CustomerName", "Region", "BalanceDue", "LastPaymentDate"],
  };
  const templates = [
    { name: "Template 1", message: "Hola {{1}}, tu deuda es {{2}}. Por favor, paga antes del {{3}}." },
    { name: "Template 2", message: "Estimado {{1}}, tu pago está pendiente de {{2}}. Recuerda que el plazo es hasta {{3}}." },
  ];
  const segments = ["Segment 1", "Segment 2", "Segment 3", "Segment 4"];
  const clusters = ["Cluster 1", "Cluster 2", "Cluster 3"];
  const strategies = ["Strategy 1", "Strategy 2", "Strategy 3"];
  const variables = ["Variable 1", "Variable 2", "Variable 3"];

  const handleSubmit = () => {
    console.log({
      campaignName,
      selectedDatabase,
      columns,
      template,
      clientSegment,
      cluster,
      strategy,
      variable1,
      variable2,
      sendDate,
      sendTime,
    });
    alert("Campaña creada con éxito");
  };

  // Colores base para usar en estilos
  const colors = {
    primaryBlue: "#007391",
    darkBlue: "#254e59",
    yellowAccent: "#FFD54F", // amarillo suave
    lightBlueBg: "#E3F2FD", // azul claro para fondo preview
    white: "#fff",
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          mb: 6,
          bgcolor: "#F0F7FA",
          borderRadius: 3,
          boxShadow: 3,
          p: { xs: 2, sm: 4 },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: colors.primaryBlue,
            fontWeight: "700",
            mb: 4,
            textAlign: "center",
            letterSpacing: "0.05em",
          }}
        >
          Crear Campaña
        </Typography>

        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            bgcolor: colors.white,
          }}
        >
          {/* DATOS BASICOS */}
          <Typography
            variant="h6"
            sx={{ color: colors.darkBlue, fontWeight: "700", mb: 3, borderBottom: `3px solid ${colors.primaryBlue}`, pb: 1 }}
          >
            Datos Básicos
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre de la campaña"
                fullWidth
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                sx={{ bgcolor: colors.white, borderRadius: 2 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Base de Datos</InputLabel>
                <Select
                  value={selectedDatabase}
                  onChange={(e) => {
                    setSelectedDatabase(e.target.value);
                    setColumns(columnsOptions[e.target.value] || []);
                  }}
                  label="Base de Datos"
                  sx={{
                    bgcolor: colors.white,
                    borderRadius: 2,
                    "& .MuiSelect-select": { fontWeight: 600 },
                  }}
                >
                  {databases.map((db) => (
                    <MenuItem key={db} value={db}>
                      {db}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedDatabase}>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Columnas</InputLabel>
                <Select
                  multiple
                  value={columns}
                  onChange={(e) => setColumns(e.target.value)}
                  label="Columnas"
                  sx={{
                    bgcolor: colors.white,
                    borderRadius: 2,
                    "& .MuiSelect-select": { fontWeight: 600 },
                  }}
                >
                  {(columnsOptions[selectedDatabase] || []).map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 5 }} />

          {/* SEGMENTACION */}
          <Typography
            variant="h6"
            sx={{ color: colors.darkBlue, fontWeight: "700", mb: 3, borderBottom: `3px solid ${colors.primaryBlue}`, pb: 1 }}
          >
            Segmentación
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Segmento</InputLabel>
                <Select
                  value={clientSegment}
                  onChange={(e) => setClientSegment(e.target.value)}
                  label="Segmento"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {segments.map((seg) => (
                    <MenuItem key={seg} value={seg}>
                      {seg}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Cluster</InputLabel>
                <Select
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value)}
                  label="Cluster"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {clusters.map((cl) => (
                    <MenuItem key={cl} value={cl}>
                      {cl}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Estrategia</InputLabel>
                <Select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  label="Estrategia"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {strategies.map((str) => (
                    <MenuItem key={str} value={str}>
                      {str}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 5 }} />

          {/* VARIABLES */}
          <Typography
            variant="h6"
            sx={{ color: colors.darkBlue, fontWeight: "700", mb: 3, borderBottom: `3px solid ${colors.primaryBlue}`, pb: 1 }}
          >
            Variables adicionales
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Variable 1</InputLabel>
                <Select
                  value={variable1}
                  onChange={(e) => setVariable1(e.target.value)}
                  label="Variable 1"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {variables.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Variable 2</InputLabel>
                <Select
                  value={variable2}
                  onChange={(e) => setVariable2(e.target.value)}
                  label="Variable 2"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {variables.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 5 }} />

          {/* PLANTILLA Y VISTA PREVIA */}
          <Typography
            variant="h6"
            sx={{ color: colors.darkBlue, fontWeight: "700", mb: 3, borderBottom: `3px solid ${colors.primaryBlue}`, pb: 1 }}
          >
            Plantilla de Mensaje
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.darkBlue, fontWeight: 600 }}>Seleccionar Plantilla</InputLabel>
                <Select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  label="Seleccionar Plantilla"
                  sx={{ bgcolor: colors.white, borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {templates.map((t) => (
                    <MenuItem key={t.name} value={t.name}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              {template && (
                <Card
                  sx={{
                    bgcolor: colors.lightBlueBg,
                    p: 3,
                    minHeight: 140,
                    borderRadius: 3,
                    border: `1.5px solid ${colors.primaryBlue}`,
                    boxShadow: "0 4px 12px rgba(0, 115, 145, 0.15)",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" mb={1} color={colors.darkBlue}>
                    Vista previa
                  </Typography>
                  <Typography variant="body1" color={colors.darkBlue}>
                    {templates.find((t) => t.name === template)?.message}
                  </Typography>
                </Card>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ mb: 5 }} />

          {/* FECHA Y HORA */}
          <Typography
            variant="h6"
            sx={{ color: colors.darkBlue, fontWeight: "700", mb: 3, borderBottom: `3px solid ${colors.primaryBlue}`, pb: 1 }}
          >
            Fecha y Hora de Envío
          </Typography>

          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Envío"
                value={sendDate}
                onChange={setSendDate}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{
                      bgcolor: colors.white,
                      borderRadius: 2,
                      "& .MuiInputBase-input": { fontWeight: 600 },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Hora de Envío"
                value={sendTime}
                onChange={setSendTime}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{
                      bgcolor: colors.white,
                      borderRadius: 2,
                      "& .MuiInputBase-input": { fontWeight: 600 },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box textAlign="center" mt={6}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: colors.yellowAccent,
                color: colors.darkBlue,
                fontWeight: "700",
                px: 6,
                py: 1.5,
                borderRadius: 3,
                "&:hover": {
                  bgcolor: "#FFC107",
                },
              }}
              onClick={handleSubmit}
            >
              Crear Campaña
            </Button>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
