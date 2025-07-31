
"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { useState } from "react";
import { useDashboardData } from "../../hooks/useDashboardData";



export default function Dashboard() {
  // Estado para filtros
  const [segmentacion, setSegmentacion] = useState("");
  const [tiposClientes, setTiposClientes] = useState([]);

  const segmentaciones = ["Alta", "MEDIA", "BAJA"];
  // Opciones de tipos de cliente: value = backend, label = abreviado
  const tiposClientesOptions = [
    { value: "emprendedores juridicos", label: "Emp. Jur." },
    { value: "profesionales dependientes", label: "Prof. Dep." },
    { value: "Profesionales independientes jovenes", label: "Indep. Joven" },
    { value: "Profesionales independientes mayores ", label: "Indep. Mayor" },
  ];

  // Manejar selección de segmentación (solo uno)
  const handleSegmentacion = (seg) => setSegmentacion(seg);

  // Manejar selección múltiple de tipos de cliente
  const handleTipoCliente = (tipo) => {
    setTiposClientes((prev) =>
      prev.includes(tipo)
        ? prev.filter((t) => t !== tipo)
        : [...prev, tipo]
    );
  };

  const { loading, kpisConvencional, kpisRetadora, chartData } = useDashboardData(segmentacion, tiposClientes);
  // Puedes pasar segmentacion y tiposClientes al hook o API aquí
  return (
    <Box sx={{ p: { xs: 0.5, md: 2 }, bgcolor: "#f3f4f6", minHeight: "100vh", width: "100%", boxSizing: "border-box", maxWidth: 1400, mx: "auto" }}>
      {/* Título Principal */}
      <Box textAlign="center" mb={1.5}>
        <Typography variant="h4" fontWeight={800} color="#007391">
          Dashboard de Recaudación
        </Typography>
      </Box>

      {/* Filtros compactos */}
      <Grid container spacing={4} justifyContent="center" mb={2} gap={10}>
        <Grid item>
          <Typography variant="h7" fontWeight={700} color="#254e59" mb={1}>
            Segmentación
          </Typography>
          <Box display="flex" gap={1.5}>
            {segmentaciones.map((seg) => (
              <Button
                key={seg}
                variant={segmentacion === seg ? "contained" : "outlined"}
                size="small"
                sx={{
                  bgcolor: segmentacion === seg ? "#007391" : "#e0e0e0",
                  color: segmentacion === seg ? "#fff" : "#000",
                  boxShadow: segmentacion === seg ? undefined : "none",
                  '&:hover': { bgcolor: segmentacion === seg ? "#005c6b" : "#d5d5d5" },
                  py: 0.5, px: 1.5
                }}
                onClick={() => handleSegmentacion(seg)}
              >
                {seg}
              </Button>
            ))}
          </Box>
        </Grid>

        <Grid item>
          <Typography variant="h7" fontWeight={700} color="#254e59" mb={1} textAlign="center">
            Tipos Clientes
          </Typography>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            {tiposClientesOptions.map((tipo) => (
              <Button
                key={tipo.value}
                variant={tiposClientes.includes(tipo.value) ? "contained" : "outlined"}
                size="small"
                sx={{
                  bgcolor: tiposClientes.includes(tipo.value) ? "#007391" : "#fff",
                  color: tiposClientes.includes(tipo.value) ? "#fff" : "#000",
                  borderColor: "#ccc",
                  boxShadow: tiposClientes.includes(tipo.value) ? undefined : "none",
                  py: 0.5, px: 1.5
                }}
                onClick={() => handleTipoCliente(tipo.value)}
              >
                {tipo.label}
              </Button>
            ))}
          </Box>
        </Grid>
      </Grid>



      {/* KPIs */}
      <Box mb={4} >
        {/* KPIs Convencional */}
        <Box mb={3}>
          <Typography
            variant="h7"
            fontWeight={600}
            color="#254e59"
            mb={1.5}
          >
            Estrategia Convencional
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={10}>
            {loading ? (
              <Typography>Cargando KPIs...</Typography>
            ) : (
              kpisConvencional.map(([label, value], index) => (
                <Paper
                  key={index}
                  sx={{
                    px: 1.5,
                    py: 1,
                    minWidth: 120,
                    borderRadius: 1.5,
                    boxShadow: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} color="#254e59" fontSize={12}>
                    {label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={500} color="#007391">
                    {value}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        </Box>

        {/* KPIs Retadora */}
        <Box>
          <Typography
            variant="h7"
            fontWeight={600}
            color="#254e59"
            mb={1.5}
          >
            Estrategia Retadora
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={10}>
            {loading ? (
              <Typography>Cargando KPIs...</Typography>
            ) : (
              kpisRetadora.map(([label, value], index) => (
                <Paper
                  key={index}
                  sx={{
                    px: 1.5,
                    py: 1,
                    minWidth: 120,
                    borderRadius: 1.5,
                    boxShadow: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} color="#254e59" fontSize={12}>
                    {label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={500} color="#00BFFF">
                    {value}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        </Box>
      </Box>


      {/* Gráfico ocupa más espacio */}
      <Paper sx={{ height: { xs: 250, md: '50vh', lg: '55vh' }, p: 1, borderRadius: 2, boxShadow: 2, maxWidth: 1400, mx: "auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography>Cargando gráfico...</Typography>
            </Box>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke="#333" fontSize={12} />
              <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} stroke="#333" fontSize={12} />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#ccc', color: '#000' }}
                labelStyle={{ color: '#000' }}
                itemStyle={{ color: '#000' }}
              />
              <Legend wrapperStyle={{ color: '#000', fontSize: 13 }} />
              <Line
                type="monotone"
                dataKey="convencional"
                stroke="#8884d8"
                name="Convencional"
                dot={{ r: 4, fill: 'white', stroke: '#8884d8', strokeWidth: 2 }}
                strokeWidth={2}
                label={{ position: "top", formatter: (v) => `${v}%`, dy: +24 }}
              />
              <Line
                type="monotone"
                dataKey="retadora"
                stroke="#00BFFF"
                name="Retadora"
                dot={{ r: 4, fill: 'white', stroke: '#00BFFF', strokeWidth: 2 }}
                strokeWidth={2}
                label={{ position: "down", formatter: (v) => `${v}%`, dy: -12 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
