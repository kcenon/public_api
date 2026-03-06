import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  BusArrivalParams,
  BusArrival,
  BusStopSearchParams,
  BusStop,
  BusRouteParams,
  BusRoute,
  RawBusArrivalItem,
  RawBusStopItem,
  RawBusRouteItem,
} from './types.js';

const BASE_URL = 'apis.data.go.kr/1613000';
const DEFAULT_TTL = 30; // 30 seconds for real-time data

/**
 * Transport adapter for Ministry of Land, Infrastructure and Transport
 * (국토교통부) public transport API.
 *
 * Provides real-time bus arrival information, bus stop search, and route info.
 * Uses a short cache TTL (30s) due to real-time nature of the data.
 */
export class TransportAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'transport';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Get real-time bus arrival information for a bus stop. */
  async getBusArrival(
    params: BusArrivalParams,
  ): Promise<ApiResponse<BusArrival[]>> {
    this.validateCityCode(params.cityCode);
    this.validateNodeId(params.nodeId);

    const result = await this.request<RawBusArrivalItem[]>({
      path: '/BusSttnInfoInqireService/getSttnAcctoArvlPrearngeInfoList',
      params: {
        cityCode: params.cityCode,
        nodeId: params.nodeId,
      },
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeArrival(item))
        : [],
    };
  }

  /** Search bus stops by name. */
  async searchBusStop(
    params: BusStopSearchParams,
  ): Promise<ApiResponse<BusStop[]>> {
    this.validateCityCode(params.cityCode);

    if (!params.nodeName || params.nodeName.trim().length === 0) {
      throw new ValidationError('Stop name keyword is required', {
        field: 'nodeName',
      });
    }

    const result = await this.request<RawBusStopItem[]>({
      path: '/BusSttnInfoInqireService/getSttnNoList',
      params: {
        cityCode: params.cityCode,
        nodeNm: params.nodeName,
      },
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeStop(item))
        : [],
    };
  }

  /** Get bus route information. */
  async getBusRoute(params: BusRouteParams): Promise<ApiResponse<BusRoute[]>> {
    this.validateCityCode(params.cityCode);

    if (!params.routeId || params.routeId.trim().length === 0) {
      throw new ValidationError('Route ID is required', {
        field: 'routeId',
      });
    }

    const result = await this.request<RawBusRouteItem[]>({
      path: '/BusRouteInfoInqireService/getRouteInfoIem',
      params: {
        cityCode: params.cityCode,
        routeId: params.routeId,
      },
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeRoute(item))
        : [],
    };
  }

  private validateCityCode(cityCode: number): void {
    if (!Number.isInteger(cityCode) || cityCode <= 0) {
      throw new ValidationError(
        `City code must be a positive integer, got ${cityCode}`,
        { field: 'cityCode' },
      );
    }
  }

  private validateNodeId(nodeId: string): void {
    if (!nodeId || nodeId.trim().length === 0) {
      throw new ValidationError('Node ID is required', {
        field: 'nodeId',
      });
    }
  }

  private normalizeArrival(item: RawBusArrivalItem): BusArrival {
    return {
      routeNumber: String(item.routeno),
      routeId: item.routeid,
      arrivalTime: item.arrtime,
      remainingStops: item.arrprevstationcnt,
      vehicleType: item.vehicletp ?? '',
      currentStation: item.nodenm ?? '',
    };
  }

  private normalizeStop(item: RawBusStopItem): BusStop {
    return {
      nodeId: item.nodeid,
      nodeName: item.nodenm,
      latitude: item.gpslati,
      longitude: item.gpslong,
      cityCode: item.citycode,
    };
  }

  private normalizeRoute(item: RawBusRouteItem): BusRoute {
    return {
      routeId: item.routeid,
      routeNumber: String(item.routeno),
      routeType: item.routetp ?? '',
      startNodeName: item.startnodenm ?? '',
      endNodeName: item.endnodenm ?? '',
      cityCode: item.citycode,
    };
  }
}
