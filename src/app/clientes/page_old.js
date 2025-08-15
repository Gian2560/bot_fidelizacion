"use client";
import { useClientes } from "@/hooks/useClientes";
import ClientesFilters from "../components/ClientesFilters";
import CustomDataGrid from "../components/CustomDataGrid";
import { columnsClientes } from "@/constants/columnsClientes";
import { Typography } from "@mui/material";
import ActionComercialModal from "../components/ActionComercialModal";
import ConversationModal from "../components/ConversationModal";

export default function ClientesPage() {
  const {
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
    handleClose,
    handleVerConversacion,
    handleCloseConversation,
    handleSaveCliente,
  } = useClientes();

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <Typography variant="h4" gutterBottom sx={{ color: "#1A202C" }}>
        Filtros
      </Typography>
      
      {/* 🔹 Filtros de búsqueda */}
      <ClientesFilters filters={filters} setFilters={setFilters} />
      
      {/* 🔹 Tabla de Clientes */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <CustomDataGrid
          rows={clientes}
          columns={columnsClientes(handleAccionComercial, handleVerConversacion)}
          totalRows={totalClientes}
          pagination={pagination}
          setPagination={setPagination}
          sortModel={sortModel}
          setSortModel={setSortModel}
        />
      )}

      {/* 🔹 Modal de Acción Comercial */}
      <ActionComercialModal open={openModal} onClose={handleClose} cliente={cliente} gestores={gestores} onSave={handleSaveCliente} />

      {/* 🔹 Modal de Conversación */}
      <ConversationModal
        open={openConversationModal}
        onClose={handleCloseConversation}
        conversationLoading={conversationLoading}
        conversationData={conversationData}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
    </main>
  );
}