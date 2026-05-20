import api from "./api";

export const gameService = {
  saveGameSession: async (sessionData) =>
    (await api.post("/game/save-session", sessionData)).data,
  getLevelSpan: async (userId) => {
    const url = userId ? `/game/levelspan/${userId}` : "/game/levelspan";
    return (await api.get(url)).data;
  },
  updateLevelSpan: async (userId, levelspan) =>
    (await api.put(`/game/levelspan/${userId}`, { levelspan })).data,
  getDetailedAnalytics: async (userId, gameType) =>
    (await api.get(`/game/analytics/${userId}`, { params: { gameType } })).data,
  getBasicStats: async (userId, gameType) => {
    const url = userId ? `/game/stats/${userId}` : "/game/stats";
    return (await api.get(url, { params: { gameType } })).data;
  },
};
