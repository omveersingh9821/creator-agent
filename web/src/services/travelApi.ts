import { TRAVEL_AGENT_ENDPOINT } from "../constants/config";

export const travelApi = {
  async searchTravel(query: string) {
    const response = await fetch(TRAVEL_AGENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to search travel options";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors for non-JSON responses
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};
