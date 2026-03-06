/** Deal type classification. */
export type DealType = 'SALE' | 'JEONSE' | 'MONTHLY_RENT';

/** Parameters for real estate transaction query. */
export interface RealEstateParams {
  /** Legal district code (법정동코드, 5 digits). */
  lawdCd: string;
  /** Deal year-month in YYYYMM format. */
  dealYmd: string;
  /** Page number (default: 1). */
  pageNo?: number;
  /** Number of rows per page (default: 100). */
  numOfRows?: number;
}

/** Normalized apartment/officetel transaction result. */
export interface RealEstateTransaction {
  /** Apartment/building name. */
  name: string;
  /** Transaction price in KRW (won). */
  price: number;
  /** Formatted price string (e.g., "1억 2,500만원"). */
  priceFormatted: string;
  /** Exclusive area in m2. */
  area: number;
  /** Floor number. */
  floor: number;
  /** Deal date in YYYY-MM-DD format. */
  dealDate: string;
  /** Year of construction. */
  buildYear: number;
  /** Road name address (if available). */
  roadAddress?: string;
  /** Legal district code. */
  lawdCd: string;
  /** Deal type. */
  dealType: DealType;
  /** Deposit amount in KRW (for rentals). */
  deposit?: number;
  /** Monthly rent in KRW (for monthly rent). */
  monthlyRent?: number;
}

/** Raw apartment sale item from API. */
export interface RawApartmentSaleItem {
  aptNm: string;
  dealAmount: string;
  excluUseAr: string | number;
  floor: string | number;
  dealYear: string | number;
  dealMonth: string | number;
  dealDay: string | number;
  buildYear: string | number;
  roadNm?: string;
  roadNmBonbun?: string | number;
  roadNmBubun?: string | number;
  sggCd: string;
  umdCd?: string;
}

/** Raw apartment rental item from API. */
export interface RawApartmentRentalItem {
  aptNm: string;
  deposit: string;
  monthlyRentAmount: string;
  excluUseAr: string | number;
  floor: string | number;
  dealYear: string | number;
  dealMonth: string | number;
  dealDay: string | number;
  buildYear: string | number;
  roadNm?: string;
  roadNmBonbun?: string | number;
  roadNmBubun?: string | number;
  sggCd: string;
  umdCd?: string;
}

/** Raw officetel sale item from API. */
export interface RawOfficetelSaleItem {
  offiNm: string;
  dealAmount: string;
  excluUseAr: string | number;
  floor: string | number;
  dealYear: string | number;
  dealMonth: string | number;
  dealDay: string | number;
  buildYear: string | number;
  roadNm?: string;
  roadNmBonbun?: string | number;
  roadNmBubun?: string | number;
  sggCd: string;
  umdCd?: string;
}
