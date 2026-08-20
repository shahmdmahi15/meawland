"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastPoliceStation,
  SteadfastPoliceStationsResponse,
} from "@/actions/steadfast/types";

/**
 * Retrieves the list of supported police stations / delivery hubs from Steadfast.
 * Endpoint: GET /police_stations
 */
export async function getSteadfastPoliceStationsAction(): Promise<{
  success: boolean;
  message?: string;
  police_stations?: SteadfastPoliceStation[];
  data?: SteadfastPoliceStationsResponse;
}> {
  try {
    const result = await steadfastRequest<
      SteadfastPoliceStation[] | SteadfastPoliceStationsResponse
    >("/police_stations", { method: "GET" });

    if (!result.success || !result.data) {
      return {
        success: false,
        message:
          result.message || "Failed to retrieve Steadfast police stations.",
      };
    }

    let stations: SteadfastPoliceStation[] = [];
    if (Array.isArray(result.data)) {
      stations = result.data;
    } else if (
      result.data.police_stations &&
      Array.isArray(result.data.police_stations)
    ) {
      stations = result.data.police_stations;
    } else if (result.data.data && Array.isArray(result.data.data)) {
      stations = result.data.data;
    }

    return {
      success: true,
      police_stations: stations,
      data: Array.isArray(result.data)
        ? { status: 200, police_stations: stations }
        : result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetPoliceStations] Error:", error);
    return {
      success: false,
      message: "Unexpected error retrieving Steadfast police stations.",
    };
  }
}
