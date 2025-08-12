import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Grid
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Speed,
  Timer,
  TrendingUp,
  Assessment
} from "@mui/icons-material";

const CampaignStatsCard = ({ campaignStats, sendingInProgress }) => {
  if (!campaignStats && !sendingInProgress) return null;

  const {
    total = 0,
    sent = 0,
    failed = 0,
    performance = {},
    errorBreakdown = {},
    configuration = {}
  } = campaignStats || {};

  const successRate = total > 0 ? ((sent / total) * 100).toFixed(1) : 0;

  // Colores basados en la tasa de éxito
  const getStatusColor = () => {
    if (sendingInProgress) return "#2196f3";
    if (successRate >= 90) return "#4caf50";
    if (successRate >= 70) return "#ff9800";
    return "#f44336";
  };

  const statusColor = getStatusColor();

  return (
    <Card 
      sx={{ 
        mt: 3, 
        boxShadow: 3,
        border: `2px solid ${statusColor}`,
        bgcolor: "white"
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Assessment sx={{ color: statusColor, mr: 1, fontSize: 28 }} />
          <Typography variant="h5" fontWeight="bold" color={statusColor}>
            {sendingInProgress ? "📡 Enviando Campaña..." : "📊 Estadísticas de Campaña"}
          </Typography>
        </Box>

        {sendingInProgress ? (
          <Box>
            <Typography variant="body1" mb={2}>
              🚀 La campaña se está enviando con configuración optimizada...
            </Typography>
            <LinearProgress sx={{ height: 8, borderRadius: 5 }} />
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                ⚙️ Configuración: {configuration.messagesPerSecond || 50} msg/seg, 
                Lotes de {configuration.batchSize || 100}, 
                {configuration.concurrentBatches || 3} paralelos
              </Typography>
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Estadísticas Principales */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" color="#007391" mb={2}>
                  📈 Resultados del Envío
                </Typography>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle sx={{ color: "#4caf50", mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Exitosos:</strong> {sent.toLocaleString()} mensajes
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <Error sx={{ color: "#f44336", mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Fallidos:</strong> {failed.toLocaleString()} mensajes
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUp sx={{ color: statusColor, mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Tasa de Éxito:</strong> 
                    <Chip 
                      label={`${successRate}%`} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        bgcolor: statusColor, 
                        color: "white",
                        fontWeight: "bold"
                      }} 
                    />
                  </Typography>
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(successRate)} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: "#e0e0e0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: statusColor
                    }
                  }} 
                />
              </Box>
            </Grid>

            {/* Métricas de Rendimiento */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" color="#007391" mb={2}>
                  ⚡ Rendimiento
                </Typography>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <Speed sx={{ color: "#2196f3", mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Velocidad:</strong> {performance.messagesPerSecond || 0} msg/seg
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <Timer sx={{ color: "#ff9800", mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Tiempo Total:</strong> {performance.totalTimeMinutes || 0} minutos
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mt={2}>
                  🎯 <strong>Total procesado:</strong> {total.toLocaleString()} mensajes
                </Typography>
              </Box>
            </Grid>

            {/* Desglose de Errores */}
            {Object.keys(errorBreakdown).length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="#f44336" mb={2}>
                  🔍 Desglose de Errores
                </Typography>
                
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {Object.entries(errorBreakdown).map(([errorType, count]) => {
                    const errorLabels = {
                      'rejected': 'Rechazados por Meta',
                      'unauthorized': 'Sin autorización',
                      'rate_limited': 'Límite excedido',
                      'server_error': 'Error de servidor',
                      'network_failed': 'Fallo de red',
                      'failed': 'Error general'
                    };

                    const errorColors = {
                      'rejected': '#f44336',
                      'unauthorized': '#e91e63',
                      'rate_limited': '#ff9800',
                      'server_error': '#9c27b0',
                      'network_failed': '#607d8b',
                      'failed': '#795548'
                    };

                    return (
                      <Chip
                        key={errorType}
                        label={`${errorLabels[errorType] || errorType}: ${count}`}
                        variant="outlined"
                        sx={{
                          borderColor: errorColors[errorType] || '#666',
                          color: errorColors[errorType] || '#666'
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>
            )}

            {/* Configuración Utilizada */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="#007391" mb={2}>
                ⚙️ Configuración Utilizada
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                <Chip 
                  label={`${configuration.messagesPerSecond || 50} msg/seg`} 
                  variant="outlined" 
                  color="primary" 
                />
                <Chip 
                  label={`Lotes de ${configuration.batchSize || 100}`} 
                  variant="outlined" 
                  color="primary" 
                />
                <Chip 
                  label={`${configuration.concurrentBatches || 3} paralelos`} 
                  variant="outlined" 
                  color="primary" 
                />
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignStatsCard;
