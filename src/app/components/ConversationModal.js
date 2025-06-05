// import {
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogActions,
//     Button,
//     CircularProgress,
//     Typography,
//     Paper,
//     List,
//     ListItem,
//     ListItemText,
//     Grid,
//     Box,
// } from "@mui/material";

// import React from "react";

// const ConversationModal = ({
//     open,
//     onClose,
//     conversationLoading,
//     conversationData,
//     selectedConversation,
//     setSelectedConversation
// }) => {
//     return (
//         <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
//             <DialogTitle>Conversación del Cliente</DialogTitle>
//             <DialogContent>
//                 {conversationLoading ? (
//                     <Box display="flex" justifyContent="center" alignItems="center" height="200px">
//                         <CircularProgress />
//                     </Box>
//                 ) : conversationData ? (
//                     <Grid container spacing={2}>
//                           <Grid item xs={12} md={4}>
//         <Paper elevation={2} sx={{ p: 2, overflowY: "auto" }}>
//             <Typography variant="subtitle1" gutterBottom>
//                 Historial de Conversaciones
//             </Typography>
//             <List sx={{ maxHeight: "450px", overflowY: "auto" }}>
              
//                 {conversationData.map((conv, index) => (
//                     <ListItem
//                         key={conv.conversacion_id}
//                         component="button"
//                         selected={selectedConversation === index}
//                         onClick={() => setSelectedConversation(index)}
//                     >
//                         <ListItemText
//                             primary={`Conversación ${index + 1}`}
//                             secondary={new Date(conv.ultima_interaccion).toLocaleString()}
//                         />
//                     </ListItem>
//                 ))}
//             </List>
//         </Paper>
//     </Grid>

//                         <Grid item xs={12} md={8}>
//                             <Paper elevation={2} sx={{ p: 2, height: "500px", overflowY: "auto" }}>
//                             {conversationData[selectedConversation]?.interacciones.map((message, index) => (
//   <React.Fragment key={message._id || `interaccion-${index}`}>
//     {/* Mensaje del cliente */}
//     {message.mensaje_cliente && (
//       <Box className="mb-4 flex justify-end">
//         <Box className="p-3 rounded-lg max-w-[70%] bg-green-100 text-green-800">
//           <Typography variant="body1">
//             {message.mensaje_cliente}
//           </Typography>
//           <Typography variant="caption" className="mt-1 text-gray-500">
//             {message.fecha
//               ? new Date(message.fecha).toLocaleString("es-ES", {
//                   weekday: "long",
//                   year: "numeric",
//                   month: "long",
//                   day: "numeric",
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 })
//               : "Fecha no disponible"}
//           </Typography>
//         </Box>
//       </Box>
//     )}

//     {/* Mensaje del chatbot */}
//     {message.mensaje_chatbot && (
//       <Box className="mb-4 flex justify-start">
//         <Box className="p-3 rounded-lg max-w-[70%] bg-blue-100 text-blue-800">
//           <Typography variant="body1">
//             {message.mensaje_chatbot}
//           </Typography>
//           <Typography variant="caption" className="mt-1 text-gray-500">
//             {message.fecha
//               ? new Date(message.fecha).toLocaleString("es-ES", {
//                   weekday: "long",
//                   year: "numeric",
//                   month: "long",
//                   day: "numeric",
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 })
//               : "Fecha no disponible"}
//           </Typography>
//         </Box>
//       </Box>
//     )}
//   </React.Fragment>
// ))}

//                             </Paper>
//                         </Grid>
//                     </Grid>
//                 ) : (
//                     <Typography>No hay datos de conversación disponibles.</Typography>
//                 )}
//             </DialogContent>
//             <DialogActions>
//                 <Button onClick={onClose}>Cerrar</Button>
//             </DialogActions>
//         </Dialog>
//     );
// };

// export default ConversationModal;
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Grid,
  Box,
} from "@mui/material";

import React from "react";

const ConversationModal = ({
  open,
  onClose,
  conversationLoading,
  conversationData,
  selectedConversation,
  setSelectedConversation
}) => {
  
return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
          <DialogTitle>Conversación del Cliente</DialogTitle>
          <DialogContent>
              {conversationLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                      <CircularProgress />
                  </Box>
              ) : conversationData ? (
                  <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
      <Paper elevation={2} sx={{ p: 2, overflowY: "auto" }}>
          <Typography variant="subtitle1" gutterBottom>
              Historial de Conversaciones
          </Typography>
          <List sx={{ maxHeight: "450px", overflowY: "auto" }}>
              <ListItemText
                primary={`Conversación 1`}
                //secondary={new Date(conv.ultima_interaccion).toLocaleString()}
              />
          </List>
      </Paper>
  </Grid>

                      <Grid item xs={12} md={8}>
                          <Paper elevation={2} sx={{ p: 2, height: "500px", overflowY: "auto" }}>
                          {conversationData?.map((message, index) => (
                            
                              <React.Fragment key={message._id || `interaccion-${index}`}>
                                
                                {/* Mensaje del cliente */}
                                {message.sender && (
                                  <Box className="mb-4 flex justify-end">
                                    <Box className="p-3 rounded-lg max-w-[70%] bg-green-100 text-green-800">
                                      <Typography variant="body1">
                                        {message.mensaje}
                                      </Typography>
                                      <Typography variant="caption" className="mt-1 text-gray-500">
                                        {message.fecha} 
                                      </Typography>


                                    </Box>
                                  </Box>
                                )}

                                {/* Mensaje del chatbot */}
                                {!message.sender && (
                                  <Box className="mb-4 flex justify-start"> 
                                    <Box className="p-3 rounded-lg max-w-[70%] bg-blue-100 text-blue-800">
                                      <Typography variant="body1">
                                        {message.mensaje}
                                      </Typography>
                                      <Typography variant="caption" className="mt-1 text-gray-500">
                                        {message.fecha} 
                                      </Typography>


                                    </Box>
                                  </Box>
                                )}
                              </React.Fragment>
                              ))}

                          </Paper>
                      </Grid>
                  </Grid>
              ) : (
                  <Typography>No hay datos de conversación disponibles.</Typography>
              )}
          </DialogContent>
          <DialogActions>
              <Button onClick={onClose}>Cerrar</Button>
          </DialogActions>
      </Dialog>
  );
};

export default ConversationModal;