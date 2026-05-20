import api from "./api";

export const userService = {
  createUser: async (userData) =>
    (await api.post("/users/create", userData)).data,
  getMyPatients: async () => (await api.get("/users/my-patients")).data,
  getUserDetails: async (userId) => (await api.get(`/users/${userId}`)).data,

  // NEW: get full user details (userId optional - fetches current user if not provided)
  getUserFullDetails: async (userId) => {
    const url = userId
      ? `/users/full-details/${userId}`
      : "/users/full-details";
    return (await api.get(url)).data;
  },
  assignPatient: async ({ caretakerId, patientId }) =>
    (await api.post("/users/assign-patient", { caretakerId, patientId })).data,
  unassignPatient: async ({ caretakerId, patientId }) =>
    (await api.post("/users/unassign-patient", { caretakerId, patientId }))
      .data,
  getCaretakerPatients: async () =>
    (await api.get("/users/caretaker/patients")).data,
};
