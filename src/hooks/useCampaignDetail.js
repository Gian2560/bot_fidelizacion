import { useState, useEffect } from "react";
import { 
  getCampaignById, 
  removeClientFromCampaign, 
  uploadClients, 
  sendCampaignMessages 
} from "../../services/campaignService";
import { Snackbar, Alert } from "@mui/material"; 

const useCampaignDetail = (id) => {
  const [campaign, setCampaign] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [campaignStats, setCampaignStats] = useState(null);
  const [sendingInProgress, setSendingInProgress] = useState(false);

  const fetchCampaignDetail = async () => {
    setLoading(true);
    try {
      const { campanha_id, nombre_campanha, fecha_creacion, fecha_fin, estado_campanha, 
              mensaje_cliente, template, clientes, pagination: pagData } = await getCampaignById(id, pagination.page, pagination.pageSize);

      // Actualiza la información de la campaña
      setCampaign({
        campanha_id,
        nombre_campanha,
        fecha_creacion,
        fecha_fin,
        estado_campanha,
        mensaje_cliente,
        template
      });

      // Actualiza la lista de clientes y la paginación
      setClients(clientes);
      setPagination((prev) => ({
        ...prev,
        total: pagData.total,
        page: pagData.page,
        pageSize: pagData.pageSize,
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignDetail();
    console.log("clientes",clients)
  }, [id, pagination.page, pagination.pageSize]);

  return {
    campaign,
    clients,
    loading,
    error,
    pagination,
    setPagination,
    fetchCampaignDetail,
    handleAddClient: async (clientId) => {
      await addClientToCampaign(id, clientId);
      fetchCampaignDetail();
    },
    handleRemoveClient: async (clientId) => {
      await removeClientFromCampaign(id, clientId);
      fetchCampaignDetail();
    },
    handleUploadClients: async (file) => {
      await uploadClients(id, file);
      fetchCampaignDetail();
    },
    handleSendCampaign: async () => {
      try {
        setSendingInProgress(true);
        setSnackbarMessage("🚀 Iniciando envío de campaña...");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);

        const response = await sendCampaignMessages(id);
        
        // Extraer estadísticas de la respuesta optimizada
        const { summary } = response;
        setCampaignStats(summary);

        // Crear mensaje detallado basado en los resultados
        let detailedMessage = "";
        let severity = "success";

        if (summary.sent > 0 && summary.failed === 0) {
          // Todos exitosos
          detailedMessage = `🎉 ¡Campaña completada exitosamente!
✅ ${summary.sent} mensajes enviados
⚡ Velocidad: ${summary.performance.messagesPerSecond} msg/seg
⏱️ Tiempo: ${summary.performance.totalTimeMinutes} min`;
          severity = "success";
        } else if (summary.sent > 0 && summary.failed > 0) {
          // Parcialmente exitoso
          detailedMessage = `⚠️ Campaña completada con algunos errores
✅ Exitosos: ${summary.sent}/${summary.total}
❌ Fallidos: ${summary.failed}/${summary.total}
📊 Tasa de éxito: ${summary.performance.successRate}%
⚡ Velocidad: ${summary.performance.messagesPerSecond} msg/seg`;
          severity = "warning";
        } else {
          // Todos fallaron
          detailedMessage = `❌ Error crítico en el envío
💥 ${summary.failed} mensajes fallaron
🔍 Revisa la configuración API`;
          severity = "error";
        }

        // Agregar desglose de errores si existen (solo en mensajes de advertencia/error)
        if (severity !== "success" && summary.errorBreakdown && Object.keys(summary.errorBreakdown).length > 0) {
          const errorTypes = Object.entries(summary.errorBreakdown).slice(0, 3); // Máximo 3 tipos
          if (errorTypes.length > 0) {
            detailedMessage += `\n\n🔍 Principales errores:`;
            errorTypes.forEach(([errorType, count]) => {
              const errorMessages = {
                'rejected': 'Rechazados',
                'unauthorized': 'Sin autorización',
                'rate_limited': 'Rate limit',
                'server_error': 'Error servidor',
                'network_failed': 'Error red',
                'failed': 'Error general'
              };
              detailedMessage += `\n• ${errorMessages[errorType] || errorType}: ${count}`;
            });
          }
        }

        setSnackbarMessage(detailedMessage);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);

        // Actualizar la campaña después del envío
        setTimeout(() => {
          fetchCampaignDetail();
        }, 1000);

      } catch (err) {
        console.error("Error en envío de campaña:", err);
        setSnackbarMessage(`❌ Error crítico en el envío:\n${err.message}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setSendingInProgress(false);
      }
    },
    snackbar: (
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={sendingInProgress ? null : 8000} // No auto-hide mientras está enviando
        onClose={() => !sendingInProgress && setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ maxWidth: '500px' }}
      >
        <Alert 
          onClose={() => !sendingInProgress && setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ 
            width: "100%",
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line', // Permite saltos de línea
              fontSize: '14px',
              lineHeight: 1.4
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    ),
    // Exportar estadísticas para uso en componentes
    campaignStats,
    sendingInProgress
  };
};

export default useCampaignDetail;
