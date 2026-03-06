import { BaseAdapter } from '../base.js';
import { ValidationError, ParseError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  AddressSearchParams,
  AddressResult,
  AddressCoordinateParams,
  AddressCoordinate,
  EnglishAddressResult,
  RawJusoApiResponse,
  RawJusoItem,
  RawJusoCoordItem,
  RawJusoEngItem,
} from './types.js';

const BASE_URL = 'business.juso.go.kr';
const DEFAULT_TTL = 604800; // 7 days
const MIN_KEYWORD_LENGTH = 2;

/**
 * Address adapter for Ministry of the Interior and Safety (행정안전부) API.
 *
 * Uses `confmKey` authentication instead of `serviceKey`.
 * Base URL: business.juso.go.kr
 *
 * Provides road name address search, coordinate lookup, and English address search.
 */
export class AddressAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'address';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Search for road name addresses by keyword. */
  async search(
    params: AddressSearchParams,
  ): Promise<ApiResponse<AddressResult[]>> {
    this.validateKeyword(params.keyword);

    const result = await this.request<RawJusoApiResponse<RawJusoItem>>({
      path: '/addrlink/addrLinkApi.do',
      serviceKeyParam: 'confmKey',
      params: {
        keyword: params.keyword,
        currentPage: params.currentPage ?? 1,
        countPerPage: params.countPerPage ?? 10,
        resultType: 'json',
      },
    });

    const raw = this.extractJusoResponse(result.data);

    return {
      ...result,
      data: (raw.results.juso ?? []).map((item) => this.normalizeAddress(item)),
      pagination: {
        currentPage: Number(raw.results.common.currentPage),
        totalPages: Math.ceil(
          Number(raw.results.common.totalCount) /
            Number(raw.results.common.countPerPage),
        ),
        totalCount: Number(raw.results.common.totalCount),
        pageSize: Number(raw.results.common.countPerPage),
      },
    };
  }

  /** Get coordinates (latitude/longitude) for a specific address. */
  async getCoordinate(
    params: AddressCoordinateParams,
  ): Promise<ApiResponse<AddressCoordinate[]>> {
    const result = await this.request<RawJusoApiResponse<RawJusoCoordItem>>({
      path: '/addrlink/addrCoordApi.do',
      serviceKeyParam: 'confmKey',
      params: {
        admCd: params.admCd,
        rnMgtSn: params.rnMgtSn,
        udrtYn: params.udrtYn,
        buldMnnm: params.buldMnnm,
        buldSlno: params.buldSlno,
        resultType: 'json',
      },
    });

    const raw = this.extractJusoResponse(result.data);

    return {
      ...result,
      data: (raw.results.juso ?? []).map((item) =>
        this.normalizeCoordinate(item),
      ),
    };
  }

  /** Search for English addresses by keyword. */
  async searchEnglish(
    params: AddressSearchParams,
  ): Promise<ApiResponse<EnglishAddressResult[]>> {
    this.validateKeyword(params.keyword);

    const result = await this.request<RawJusoApiResponse<RawJusoEngItem>>({
      path: '/addrlink/addrEngApi.do',
      serviceKeyParam: 'confmKey',
      params: {
        keyword: params.keyword,
        currentPage: params.currentPage ?? 1,
        countPerPage: params.countPerPage ?? 10,
        resultType: 'json',
      },
    });

    const raw = this.extractJusoResponse(result.data);

    return {
      ...result,
      data: (raw.results.juso ?? []).map((item) =>
        this.normalizeEnglishAddress(item),
      ),
      pagination: {
        currentPage: Number(raw.results.common.currentPage),
        totalPages: Math.ceil(
          Number(raw.results.common.totalCount) /
            Number(raw.results.common.countPerPage),
        ),
        totalCount: Number(raw.results.common.totalCount),
        pageSize: Number(raw.results.common.countPerPage),
      },
    };
  }

  /**
   * Convenience method: get postal code for a given keyword.
   * Returns the first matching postal code, or undefined if none found.
   */
  async getPostalCode(keyword: string): Promise<string | undefined> {
    const result = await this.search({
      keyword,
      countPerPage: 1,
    });

    return result.data[0]?.postalCode;
  }

  /** Validate keyword meets minimum length requirement. */
  private validateKeyword(keyword: string): void {
    if (!keyword || keyword.trim().length < MIN_KEYWORD_LENGTH) {
      throw new ValidationError(
        `Search keyword must be at least ${MIN_KEYWORD_LENGTH} characters, got "${keyword}"`,
        { field: 'keyword' },
      );
    }
  }

  /**
   * Extract and validate juso.go.kr response.
   * Checks errorCode and returns the typed response.
   */
  private extractJusoResponse<T>(
    data: RawJusoApiResponse<T>,
  ): RawJusoApiResponse<T> {
    const response = data;

    if (!response?.results?.common) {
      throw new ParseError('Unexpected juso.go.kr response format', {
        rawResponse: JSON.stringify(data),
      });
    }

    const errorCode = response.results.common.errorCode;
    if (errorCode !== '0') {
      throw new ParseError(
        `Juso API error (${errorCode}): ${response.results.common.errorMessage}`,
        { rawResponse: JSON.stringify(data) },
      );
    }

    return response;
  }

  private normalizeAddress(item: RawJusoItem): AddressResult {
    return {
      roadAddress: item.roadAddr,
      jibunAddress: item.jibunAddr,
      postalCode: item.zipNo,
      buildingName: item.bdNm || undefined,
      siNm: item.siNm,
      sggNm: item.sggNm,
      emdNm: item.emdNm,
      roadName: item.rn,
      buildingNumber: item.buldMnnm,
      buildingSubNumber: item.buldSlno !== '0' ? item.buldSlno : undefined,
      admCd: item.admCd,
      rnMgtSn: item.rnMgtSn,
      udrtYn: item.udrtYn,
    };
  }

  private normalizeCoordinate(item: RawJusoCoordItem): AddressCoordinate {
    return {
      roadAddress: item.bdNm ?? '',
      latitude: parseFloat(item.entY),
      longitude: parseFloat(item.entX),
      admCd: item.admCd,
      rnMgtSn: item.rnMgtSn,
    };
  }

  private normalizeEnglishAddress(item: RawJusoEngItem): EnglishAddressResult {
    return {
      roadAddress: item.roadAddr,
      jibunAddress: item.jibunAddr,
      postalCode: item.zipNo,
      siNm: item.siNm,
      sggNm: item.sggNm,
      emdNm: item.emdNm,
      roadName: item.rn,
      buildingNumber: item.buldMnnm,
      buildingSubNumber: item.buldSlno !== '0' ? item.buldSlno : undefined,
    };
  }
}
