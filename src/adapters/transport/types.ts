/** Parameters for bus arrival query. */
export interface BusArrivalParams {
  /** City code (e.g., 11 for Seoul). */
  cityCode: number;
  /** Bus stop node ID. */
  nodeId: string;
}

/** Parameters for bus stop search. */
export interface BusStopSearchParams {
  /** City code. */
  cityCode: number;
  /** Search keyword (stop name). */
  nodeName: string;
}

/** Parameters for bus route info query. */
export interface BusRouteParams {
  /** City code. */
  cityCode: number;
  /** Bus route ID. */
  routeId: string;
}

/** Normalized bus arrival result. */
export interface BusArrival {
  /** Bus route number (displayed name). */
  routeNumber: string;
  /** Bus route ID. */
  routeId: string;
  /** Estimated arrival time in seconds. */
  arrivalTime: number;
  /** Number of remaining stops. */
  remainingStops: number;
  /** Vehicle type description. */
  vehicleType: string;
  /** Current station of the bus. */
  currentStation: string;
}

/** Normalized bus stop result. */
export interface BusStop {
  /** Stop node ID. */
  nodeId: string;
  /** Stop name. */
  nodeName: string;
  /** Latitude (WGS84). */
  latitude: number;
  /** Longitude (WGS84). */
  longitude: number;
  /** City code. */
  cityCode: number;
}

/** Normalized bus route result. */
export interface BusRoute {
  /** Route ID. */
  routeId: string;
  /** Route number (displayed name). */
  routeNumber: string;
  /** Route type description. */
  routeType: string;
  /** Start stop name. */
  startNodeName: string;
  /** End stop name. */
  endNodeName: string;
  /** City code. */
  cityCode: number;
}

/** Raw bus arrival item from API. */
export interface RawBusArrivalItem {
  routeno: string | number;
  routeid: string;
  arrtime: number;
  arrprevstationcnt: number;
  vehicletp?: string;
  nodenm?: string;
}

/** Raw bus stop item from API. */
export interface RawBusStopItem {
  nodeid: string;
  nodenm: string;
  gpslati: number;
  gpslong: number;
  citycode: number;
}

/** Raw bus route item from API. */
export interface RawBusRouteItem {
  routeid: string;
  routeno: string | number;
  routetp?: string;
  startnodenm?: string;
  endnodenm?: string;
  citycode: number;
}
