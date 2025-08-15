import { useState, useEffect, useCallback } from "react";
import { 
  getCampaigns, 
  getTemplates, 
  createCampaign, 
  updateCampaign, // ✅ Función para actualizar campaña
  deleteCampaign
} from "../../services/campaignService";

const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]); 
  const [templates, setTemplates] = useState([]); 
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [sortModel, setSortModel] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        // 🔹 Pasar correctamente page y pageSize al service
        const { campaigns, totalCount } = await getCampaigns(pagination.page, pagination.pageSize);
        const formattedCampaigns = campaigns.map((campaign) => ({
            ...campaign,
            id: campaign.campanha_id, 
            nombre: campaign.nombre_campanha, 
            estado: campaign.estado_campanha,
            fechaCreacion: campaign.fecha_creacion ? 
                new Date(campaign.fecha_creacion).toLocaleDateString('es-ES') : 'N/A',
            // 🔹 Agregar información sobre si puede ser eliminada
            puedeEliminar: !campaign.cliente_campanha?.some(
                cc => cc.fecha_envio !== null || 
                cc.estado_mensaje === 'enviado' ||
                cc.estado_mensaje === 'delivered' ||
                cc.estado_mensaje === 'read'
            )
        }));

        setCampaigns(formattedCampaigns);
        setPagination((prev) => ({ ...prev, total: totalCount || 0 }));
    } catch (err) {
        console.error("Error fetching campaigns:", err);
        setError("Error al obtener campañas");
        setCampaigns([]);
    } finally {
        setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchTemplates();
    fetchCampaigns();
  }, [fetchCampaigns]);

  const fetchTemplates = async () => {
    try {
      const templatesData = await getTemplates();
      setTemplates(templatesData || []);
      console.log("estostk esal ewrteamta",templatesData);
    } catch (err) {
      console.error("Error al obtener templates:", err);
    }
  };

  const handleCreateCampaign = async (data) => {
    try {
      if (selectedCampaign) {
        // ✅ Si hay una campaña seleccionada, actualizamos
        await updateCampaign(selectedCampaign.id, data);
      } else {
        // ✅ Si no, creamos una nueva
        await createCampaign(data);
      }
      fetchCampaigns();
      setOpenModal(false);
    } catch (err) {
      console.error("Error al guardar campaña:", err);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      // 🔹 Confirmación antes de eliminar
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        setError("Campaña no encontrada");
        return;
      }

      if (!confirm(`¿Estás seguro de que deseas eliminar la campaña "${campaign.nombre_campanha}"?`)) {
        return;
      }

      setLoading(true);
      await deleteCampaign(campaignId);
      
      // 🔹 Refrescar la lista después de eliminar
      await fetchCampaigns();
      
      // 🔹 Mostrar mensaje de éxito (puedes implementar un toast aquí)
      console.log("Campaña eliminada exitosamente");
      
    } catch (err) {
      console.error("Error al eliminar campaña:", err);
      setError(err.message || "Error al eliminar la campaña");
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCampaign(null);
    setOpenModal(true);
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setSelectedCampaign(null);
  };

  return {
    campaigns,
    templates,
    pagination,
    setPagination,
    sortModel,
    setSortModel,
    openModal,
    selectedCampaign,
    handleCreate,  
    handleEdit,
    handleClose,
    fetchCampaigns,
    fetchTemplates,
    handleCreateCampaign,
    handleDeleteCampaign,
    loading,
    error,
  };
};

export default useCampaigns;
