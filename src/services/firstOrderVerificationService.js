import { auth } from "@/firebase/firebaseConfig";
import { getApiBase } from "@/lib/apiConfig";

const authHeaders = async () => {
  const token = await auth.currentUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleJson = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error || "Request failed";
    const error = new Error(message);
    error.code = data?.code;
    throw error;
  }
  return data;
};

export const finalizeOrderSecurely = async (payload) => {
  const response = await fetch(`${getApiBase()}/api/orders/finalize`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleJson(response);
};
