import api from "./api";

export const reminderService = {
  create: async (payload) => (await api.post("/reminders", payload)).data,
  listForPatient: async (patientId) => {
    const url = patientId ? `/reminders/${patientId}` : "/reminders";
    return (await api.get(url)).data;
  },
  complete: async (id) => (await api.put(`/reminders/complete/${id}`)).data,
  update: async (id, payload) =>
    (await api.put(`/reminders/${id}`, payload)).data,
};
