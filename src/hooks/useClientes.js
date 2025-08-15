import { useState, useEffect, useRef } from "react";
import { fetchClientes, fetchConversacion, getGestores ,updateCliente } from "../../services/clientesService";
import {useSession } from "next-auth/react";

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openConversationModal, setOpenConversationModal] = useState(false);
  const [cliente, setCliente] = useState(null);
  const { data: session, status } = useSession();
  const [conversationData, setConversationData] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [gestores,setGestores] = useState([]);
  const gestoresLoaded = useRef(false);
  const initialLoadDone = useRef(false);
  const [filters, setFilters] = useState({
    search: "",
    estado: "Todos",
    bound: "Todos",
    fechaInicio: "",
    fechaFin: "",
    fechaRegistro: "",
  });

  const [pagination, setPagination] = useState({ 
    page: 0,        // Material-UI usa 0-based indexing
    pageSize: 10
  });
  const [sortModel, setSortModel] = useState([]);  

  // Cargar gestores solo una vez
  useEffect(() => {
    const loadGestores = async () => {
      if (gestoresLoaded.current) return;
      
      try {
        const gestoresData = await getGestores();
        setGestores(gestoresData);
        console.log("gestores", gestoresData);
        gestoresLoaded.current = true;
      } catch (error) {
        console.error("Error cargando gestores:", error);
      }
    };
    
    loadGestores();
  }, []);

  // Cargar clientes cuando cambien filtros, paginación, sortModel o al inicio
  useEffect(() => {
    const loadClientes = async () => {
      // No hacer fetch si la sesión aún está cargando
      if (status === "loading") return;
      
      // Marcar que la carga inicial ya se hizo
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
      
      setLoading(true);
      try {
        // Convertir página de Material-UI (0-based) a API (1-based)
        const apiPage = pagination.page + 1;
        const data = await fetchClientes({ 
          page: apiPage, 
          pageSize: pagination.pageSize, 
          filters, 
          sortModel, 
          name: session?.user?.name,
          role: session?.user?.role
        });
        setClientes(data.clientes);
        console.log("clientes", data.clientes);
        setTotalClientes(data.total);
      } catch (error) {
        console.error("Error cargando clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Cargar clientes cuando la sesión esté lista (inicial o cambios)
    if (status !== "loading") {
      loadClientes();
    }
  }, [filters, pagination.page, pagination.pageSize, sortModel, status, session?.user?.name, session?.user?.role]);  

  // 🔹 Función para manejar el modal de acción comercial
  const handleAccionComercial = (cliente) => {
    setCliente(cliente);
    setOpenModal(true);
  };

  // 🔹 Función para manejar el cierre del modal
  const handleClose = () => {
    setOpenModal(false);
    setCliente(null);
  };

  // 🔹 Función para obtener la conversación del cliente
  const handleVerConversacion = async (clienteId) => {
    setConversationLoading(true);
    setOpenConversationModal(true);

    try {
      const data = await fetchConversacion(clienteId);
      setConversationData(data);
    } catch (error) {
      console.error("Error al obtener la conversación:", error);
      setConversationData(null);
    } finally {
      setConversationLoading(false);
    }
  };

  // 🔹 Función para cerrar el modal de conversación
  const handleCloseConversation = () => {
    setOpenConversationModal(false);
    setConversationData(null);
    setSelectedConversation(0);
  };

  const handleSaveCliente = async (clienteData) => {
    setLoading(true);
    try {
      await updateCliente(clienteData);

      // 🔄 Actualizar la lista en el frontend
      setClientes((prevClientes) =>
        prevClientes.map((c) => (c.id === clienteData.id ? { ...c, ...clienteData } : c))
      );
    } catch (error) {
      console.error("❌ Error al actualizar cliente:", error);
    } finally {
      setLoading(false);
      setOpenModal(false);
    }
  };

  return {
    clientes,
    totalClientes,
    gestores,
    loading, 
    filters,
    setFilters,
    pagination, 
    setPagination, 
    sortModel, 
    setSortModel, 
    openModal,
    openConversationModal,
    cliente, 
    conversationData,
    conversationLoading,
    selectedConversation,
    setSelectedConversation,
    handleAccionComercial,
    handleVerConversacion,
    handleClose,
    handleCloseConversation,
    handleSaveCliente
  };
}
