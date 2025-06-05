// lib/dummyData.js
export const databases = [
  { id: "Database1", name: "Base de Datos 1" },
  { id: "Database2", name: "Base de Datos 2" },
  { id: "Database3", name: "Base de Datos 3" },
];

export const columnsOptions = {
  Database1: ["Name", "Phone", "State", "Reason", "CommercialAction", "Manager", "Actions", "Segment", "Cluster", "Strategy"],
  Database2: ["ClientID", "Email", "Phone", "State", "Reason", "CommercialAction", "Manager", "Actions", "Segment", "Cluster", "Strategy"],
  Database3: ["CustomerName", "Phone", "State", "Reason", "CommercialAction", "Manager", "Actions", "Segment", "Cluster", "Strategy"],
};

// Datos simulados de clientes con los números de teléfono en formato +51 9XXXXXXXX
export const clients = {
  Database1: [
    {
      id: 1,
      name: "Yomira",
      phone: "+51941729891", // Número con prefijo +51 y 9 dígitos
      state: "Activo",
      reason: "Deuda pendiente",
      commercialAction: "Enviar recordatorio",
      manager: "Gestor A",
      actions: "Llamada realizada",
      segment: "Segment 1",
      cluster: "Cluster 1",
      strategy: "Strategy 1",
    },
    {
      id: 2,
      name: "Daniel",
      phone: "+51993538942", // Número con prefijo +51 y 9 dígitos
      state: "Inactivo",
      reason: "No respondió",
      commercialAction: "Llamar nuevamente",
      manager: "Gestor B",
      actions: "Correo enviado",
      segment: "Segment 2",
      cluster: "Cluster 2",
      strategy: "Strategy 2",
    },
  ],
  Database2: [
    {
      id: 3,
      name: "Cliente 3",
      phone: "+51 955123456", // Número con prefijo +51 y 9 dígitos
      state: "Activo",
      reason: "Pago pendiente",
      commercialAction: "Enviar mensaje",
      manager: "Gestor C",
      actions: "Llamada no atendida",
      segment: "Segment 1",
      cluster: "Cluster 1",
      strategy: "Strategy 1",
    },
    {
      id: 4,
      name: "Cliente 4",
      phone: "+51 977654321", // Número con prefijo +51 y 9 dígitos
      state: "Inactivo",
      reason: "Solicitó información",
      commercialAction: "Enviar propuesta",
      manager: "Gestor D",
      actions: "Correo enviado",
      segment: "Segment 3",
      cluster: "Cluster 2",
      strategy: "Strategy 2",
    },
  ],
  Database3: [
    {
      id: 5,
      name: "Cliente 5",
      phone: "+51 944123456", // Número con prefijo +51 y 9 dígitos
      state: "Activo",
      reason: "Pago parcial",
      commercialAction: "Revisar saldo",
      manager: "Gestor E",
      actions: "Llamada realizada",
      segment: "Segment 2",
      cluster: "Cluster 3",
      strategy: "Strategy 2",
    },
    {
      id: 6,
      name: "Cliente 6",
      phone: "+51 996654321", // Número con prefijo +51 y 9 dígitos
      state: "Inactivo",
      reason: "Falta de contacto",
      commercialAction: "Reintentar contacto",
      manager: "Gestor F",
      actions: "Correo de seguimiento",
      segment: "Segment 4",
      cluster: "Cluster 1",
      strategy: "Strategy 3",
    },
  ],
};
