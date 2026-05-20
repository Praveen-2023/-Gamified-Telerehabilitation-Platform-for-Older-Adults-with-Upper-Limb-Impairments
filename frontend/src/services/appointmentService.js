import api from "./api";

export const appointmentService = {
  setAvailability: async ({ startTime, endTime, slotMinutes }) =>
    (
      await api.put("/appointments/availability", {
        startTime,
        endTime,
        slotMinutes,
      })
    ).data,
  getAvailability: async ({ doctorId, date }) =>
    (
      await api.get("/appointments/availability", {
        params: { doctorId, date },
      })
    ).data,
  book: async ({ doctorId, date, startTime, endTime }) =>
    (
      await api.post("/appointments/book", {
        doctorId,
        date,
        startTime,
        endTime,
      })
    ).data,
  cancel: async (id) => (await api.put(`/appointments/cancel/${id}`)).data,
  listDoctorAppointments: async ({ start, end }) =>
    (await api.get("/appointments/doctor", { params: { start, end } })).data,
};
