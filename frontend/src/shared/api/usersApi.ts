import { request } from "./request";

export interface EligibleUser {
  id: number;
  username: string;
  email: string | null;
}

export const usersApi = {
  eligible: (role: "Picker" | "Packer" | "Delivery Boy") =>
    request<EligibleUser[]>({ method: "GET", url: "/api/users/eligible", params: { role } }),
};
