import api from "./api";

export const chatService = {
  ensureChat: async (participantIds, type) =>
    (await api.post("/chat/ensure", { participantIds, type })).data,
  listMyChats: async () => (await api.get("/chat")).data,
  sendMessage: async (chatId, text) =>
    (await api.post("/chat/send", { chatId, text })).data,
  getMessages: async (chatId) =>
    (await api.get(`/chat/${chatId}/messages`)).data,
};
