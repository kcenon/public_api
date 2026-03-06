import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  RealEstateParams,
  RealEstateTransaction,
  DealType,
  RawApartmentSaleItem,
  RawApartmentRentalItem,
  RawOfficetelSaleItem,
} from './types.js';

const BASE_URL = 'apis.data.go.kr/1613000';
const DEFAULT_TTL = 86400; // 24 hours
const LAWD_CD_PATTERN = /^\d{5}$/;
const DEAL_YMD_PATTERN = /^\d{6}$/;

/**
 * Real Estate adapter for Ministry of Land, Infrastructure and Transport
 * (국토교통부) real estate transaction API.
 *
 * Provides apartment sale/lease and officetel transaction data.
 * Prices are parsed from comma-separated 만원 strings to KRW.
 */
export class RealEstateAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'real-estate';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Get apartment sale transactions for a district and month. */
  async getApartmentSales(
    params: RealEstateParams,
  ): Promise<ApiResponse<RealEstateTransaction[]>> {
    this.validateRealEstateParams(params);

    const result = await this.request<RawApartmentSaleItem[]>({
      path: '/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
      params: {
        LAWD_CD: params.lawdCd,
        DEAL_YMD: params.dealYmd,
      },
      pageNo: params.pageNo,
      numOfRows: params.numOfRows ?? 100,
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeSale(item, params.lawdCd))
        : [],
    };
  }

  /** Get apartment rental (전월세) transactions. */
  async getApartmentRentals(
    params: RealEstateParams,
  ): Promise<ApiResponse<RealEstateTransaction[]>> {
    this.validateRealEstateParams(params);

    const result = await this.request<RawApartmentRentalItem[]>({
      path: '/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
      params: {
        LAWD_CD: params.lawdCd,
        DEAL_YMD: params.dealYmd,
      },
      pageNo: params.pageNo,
      numOfRows: params.numOfRows ?? 100,
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeRental(item, params.lawdCd))
        : [],
    };
  }

  /** Get officetel sale transactions. */
  async getOfficeSales(
    params: RealEstateParams,
  ): Promise<ApiResponse<RealEstateTransaction[]>> {
    this.validateRealEstateParams(params);

    const result = await this.request<RawOfficetelSaleItem[]>({
      path: '/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
      params: {
        LAWD_CD: params.lawdCd,
        DEAL_YMD: params.dealYmd,
      },
      pageNo: params.pageNo,
      numOfRows: params.numOfRows ?? 100,
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) =>
            this.normalizeOfficetelSale(item, params.lawdCd),
          )
        : [],
    };
  }

  /**
   * Parse a price string from the API (만원 unit with commas) to KRW (원).
   * e.g., "12,500" → 125000000 (12500 만원 = 125,000,000 원)
   */
  static parsePrice(priceStr: string): number {
    const cleaned = priceStr.replace(/,/g, '').trim();
    const manWon = parseInt(cleaned, 10);
    return isNaN(manWon) ? 0 : manWon * 10000;
  }

  /**
   * Format a KRW amount to Korean price display.
   * e.g., 125000000 → "1억 2,500만원"
   */
  static formatPrice(amount: number): string {
    const manWon = Math.round(amount / 10000);

    if (manWon === 0) return '0원';

    const eok = Math.floor(manWon / 10000);
    const remainManWon = manWon % 10000;

    if (eok > 0 && remainManWon > 0) {
      return `${eok.toLocaleString()}억 ${remainManWon.toLocaleString()}만원`;
    }
    if (eok > 0) {
      return `${eok.toLocaleString()}억원`;
    }
    return `${remainManWon.toLocaleString()}만원`;
  }

  private validateRealEstateParams(params: RealEstateParams): void {
    if (!LAWD_CD_PATTERN.test(params.lawdCd)) {
      throw new ValidationError(
        `LAWD_CD must be exactly 5 digits, got "${params.lawdCd}"`,
        { field: 'lawdCd' },
      );
    }

    if (!DEAL_YMD_PATTERN.test(params.dealYmd)) {
      throw new ValidationError(
        `Deal date must be in YYYYMM format (6 digits), got "${params.dealYmd}"`,
        { field: 'dealYmd' },
      );
    }
  }

  private buildDealDate(
    year: string | number,
    month: string | number,
    day: string | number,
  ): string {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildRoadAddress(item: {
    roadNm?: string;
    roadNmBonbun?: string | number;
    roadNmBubun?: string | number;
  }): string | undefined {
    if (!item.roadNm) return undefined;
    const bonbun = String(item.roadNmBonbun ?? '');
    const bubun = String(item.roadNmBubun ?? '');
    const number = bubun && bubun !== '0' ? `${bonbun}-${bubun}` : bonbun;
    return `${item.roadNm} ${number}`.trim();
  }

  private normalizeSale(
    item: RawApartmentSaleItem,
    lawdCd: string,
  ): RealEstateTransaction {
    const price = RealEstateAdapter.parsePrice(item.dealAmount);
    return {
      name: item.aptNm,
      price,
      priceFormatted: RealEstateAdapter.formatPrice(price),
      area: parseFloat(String(item.excluUseAr)),
      floor: parseInt(String(item.floor), 10),
      dealDate: this.buildDealDate(item.dealYear, item.dealMonth, item.dealDay),
      buildYear: parseInt(String(item.buildYear), 10),
      roadAddress: this.buildRoadAddress(item),
      lawdCd,
      dealType: 'SALE',
    };
  }

  private normalizeRental(
    item: RawApartmentRentalItem,
    lawdCd: string,
  ): RealEstateTransaction {
    const deposit = RealEstateAdapter.parsePrice(item.deposit);
    const monthlyRent = RealEstateAdapter.parsePrice(item.monthlyRentAmount);
    const dealType: DealType = monthlyRent > 0 ? 'MONTHLY_RENT' : 'JEONSE';

    return {
      name: item.aptNm,
      price: deposit,
      priceFormatted: RealEstateAdapter.formatPrice(deposit),
      area: parseFloat(String(item.excluUseAr)),
      floor: parseInt(String(item.floor), 10),
      dealDate: this.buildDealDate(item.dealYear, item.dealMonth, item.dealDay),
      buildYear: parseInt(String(item.buildYear), 10),
      roadAddress: this.buildRoadAddress(item),
      lawdCd,
      dealType,
      deposit,
      monthlyRent: monthlyRent > 0 ? monthlyRent : undefined,
    };
  }

  private normalizeOfficetelSale(
    item: RawOfficetelSaleItem,
    lawdCd: string,
  ): RealEstateTransaction {
    const price = RealEstateAdapter.parsePrice(item.dealAmount);
    return {
      name: item.offiNm,
      price,
      priceFormatted: RealEstateAdapter.formatPrice(price),
      area: parseFloat(String(item.excluUseAr)),
      floor: parseInt(String(item.floor), 10),
      dealDate: this.buildDealDate(item.dealYear, item.dealMonth, item.dealDay),
      buildYear: parseInt(String(item.buildYear), 10),
      roadAddress: this.buildRoadAddress(item),
      lawdCd,
      dealType: 'SALE',
    };
  }
}
