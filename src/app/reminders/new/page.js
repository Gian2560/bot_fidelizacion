"use client";

import { useState, useEffect } from "react";
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
  Button,
  Divider,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Pagination
} from "@mui/material";
import axiosInstance from "../../../../services/api"; // Tu instancia de axios configurada
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { clients, databases, columnsOptions } from "../../../../dummyData"; // Datos simulados
import { useRouter } from "next/navigation"; // Hook para navegación
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
  const [templates, setTemplates] = useState([]); // Para almacenar las plantillas obtenidas
  const [selectedClients, setSelectedClients] = useState([]); // Clientes seleccionados
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(5); // Número de clientes por página

  // Datos de clientes por base de datos
  const [filteredClients, setFilteredClients] = useState([]);
  const router = useRouter(); // Hook para navegación
  // Cargar plantillas desde el backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axiosInstance.get("/plantillas"); // Solicitud GET al endpoint de plantillas
        setTemplates(response.data); // Guarda las plantillas en el estado
      } catch (error) {
        console.error("Error al obtener plantillas:", error);
      }
    };
    fetchTemplates();
  }, []);
  // Filtrar clientes de acuerdo a la base de datos seleccionada
  useEffect(() => {
    console.log("Base de datos seleccionada:", selectedDatabase);
    const currentClients = clients[selectedDatabase] || [];
    console.log("Clientes encontrados:", currentClients);
    console.log("Todas las bases de datos disponibles:", Object.keys(clients));
    setFilteredClients(currentClients);
    // Resetear página a 1 cuando cambie la base de datos
    setCurrentPage(1);
    // Limpiar selección de clientes al cambiar de base de datos
    setSelectedClients([]);
  }, [selectedDatabase]);

  // Función para manejar el cambio en la selección de la plantilla
  const handleTemplateChange = (event) => {
    const selectedTemplate = event.target.value;
    setTemplate(selectedTemplate);
  };

  // Función para manejar la selección de clientes
  const handleClientSelection = (event, client) => {
    if (event.target.checked) {
      setSelectedClients([...selectedClients, client]);
    } else {
      setSelectedClients(selectedClients.filter((item) => item.id !== client.id));
    }
  };

  // Cambiar de página en la paginación
  const handleChangePage = (event, value) => {
    setCurrentPage(value);
  };

  // Paginar los clientes para la vista
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

  // Función para manejar el envío del formulario y crear la campaña
const handleSubmit = async () => {
  // Convertir sendDate a un formato adecuado para el backend
  const formattedDate = sendDate ? sendDate.toISOString() : null;

  const campaignData = {
    nombre_campanha: campaignName,
    descripcion: "Descripción de la campaña",
    template_id: template,
    fecha_fin: formattedDate, // Enviar la fecha formateada
    clients: selectedClients, // Clientes seleccionados
  };

  // Verifica el payload antes de enviarlo
  console.log("Datos a enviar:", campaignData);

  try {
    const response = await axiosInstance.post("/campaings/add-clients", campaignData);
    console.log("Campaña y clientes creados con éxito:", response.data);
    alert("Campaña creada con éxito");
    router.push("/campaigns"); // Redirigir a la lista de campañas
  } catch (error) {
    console.error("Error al crear la campaña:", error);
    alert("Hubo un error al crear la campaña");
  }
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
            color: "#007391",
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
            bgcolor: "#fff",
          }}
        >
          {/* DATOS BASICOS */}
          <Typography
            variant="h6"
            sx={{ color: "#254e59", fontWeight: "700", mb: 3, borderBottom: `3px solid #007391`, pb: 1 }}
          >
            Datos Básicos
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre de la campaña" fullWidth value={campaignName} onChange={(e) => setCampaignName(e.target.value)} sx={{ bgcolor: "#fff", borderRadius: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#254e59", fontWeight: 600 }}>Base de Datos</InputLabel>                <Select
                  value={selectedDatabase}
                  onChange={(e) => {
                    setSelectedDatabase(e.target.value);
                    setColumns(columnsOptions[e.target.value] || []);
                  }}
                  label="Base de Datos"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 2,
                    "& .MuiSelect-select": { fontWeight: 600 },
                  }}
                >
                  {databases.map((db) => (
                    <MenuItem key={db.id} value={db.id}>
                      {db.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>          {/* Mostrar tabla de clientes seleccionados */}
          <Typography
            variant="h6"
            sx={{ color: "#254e59", fontWeight: "700", mb: 3, borderBottom: `3px solid #007391`, pb: 1 }}
          >
            Selecciona los clientes
          </Typography>

          {/* Botones de selección */}
          {filteredClients.length > 0 && (
            <Box mb={2}>
              <Button
                variant="outlined"
                size="small"
                sx={{ mr: 2 }}
                onClick={() => {
                  setSelectedClients(filteredClients);
                }}
              >
                Seleccionar todos
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedClients([])}
              >
                Deseleccionar todos
              </Button>
            </Box>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Seleccionar</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Checkbox
                        onChange={(e) => handleClientSelection(e, client)}
                        checked={selectedClients.some((selectedClient) => selectedClient.id === client.id)}
                      />
                    </TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.state}</TableCell>
                    <TableCell>{client.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          <Pagination
            count={Math.ceil(filteredClients.length / clientsPerPage)}
            page={currentPage}
            onChange={handleChangePage}
            sx={{ mt: 2 }}
          />

          <Divider sx={{ mb: 5 }} />

          {/* PLANTILLA Y VISTA PREVIA */}
          <Typography
            variant="h6"
            sx={{ color: "#254e59", fontWeight: "700", mb: 3, borderBottom: `3px solid #007391`, pb: 1 }}
          >
            Plantilla de Mensaje
          </Typography>

          <Grid container spacing={4} mb={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#254e59", fontWeight: 600 }}>Seleccionar Plantilla</InputLabel>
                <Select
                  value={template}
                  onChange={handleTemplateChange}
                  label="Seleccionar Plantilla"
                  sx={{ bgcolor: "#fff", borderRadius: 2, "& .MuiSelect-select": { fontWeight: 600 } }}
                >
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.nombre_template}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              {template && (
                <Card
                  sx={{
                    bgcolor: "#E3F2FD",
                    p: 3,
                    minHeight: 140,
                    borderRadius: 3,
                    border: "1.5px solid #007391",
                    boxShadow: "0 4px 12px rgba(0, 115, 145, 0.15)",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" mb={1} color="#254e59">
                    Vista previa
                  </Typography>
                  <Typography variant="body1" color="#254e59">
                    {templates.find((t) => t.id === template)?.mensaje}
                  </Typography>
                </Card>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ mb: 5 }} />

          {/* FECHA Y HORA */}
          <Typography
            variant="h6"
            sx={{ color: "#254e59", fontWeight: "700", mb: 3, borderBottom: `3px solid #007391`, pb: 1 }}
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
                      bgcolor: "#fff",
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
                      bgcolor: "#fff",
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
                bgcolor: "#FFD54F",
                color: "#254e59",
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
