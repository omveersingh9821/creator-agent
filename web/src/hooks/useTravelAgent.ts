import { useMutation } from "@tanstack/react-query";
import { travelApi } from "../services/travelApi.ts";

export interface Flight {
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  stops: number;
}

export interface Hotel {
  name: string;
  stars: number;
  rating: number;
  price_per_night: number;
  amenities: string[];
}

export interface TravelItinerary {
  ai_summary: string;
  flights: Flight[];
  hotels: Hotel[];
}

export function useTravelAgent() {
  return useMutation({
    mutationFn: async (query: string) => {
      const data = await travelApi.searchTravel(query);
      return data as TravelItinerary;
    },
  });
}

export function useBookFlight() {
  return useMutation({
    mutationFn: async (flight: Flight) => {
      const data = await travelApi.bookFlight(flight);
      return data;
    },
  });
}
