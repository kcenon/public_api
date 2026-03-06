/** Business registration status enum. */
export type BusinessStatusType =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'NOT_FOUND';

/** Parameters for business status check. */
export interface BusinessStatusParams {
  /** Business registration numbers (up to 100). */
  businessNumbers: string[];
}

/** Normalized business status result. */
export interface BusinessStatus {
  /** Business registration number (10 digits). */
  businessNumber: string;
  /** Normalized status. */
  status: BusinessStatusType;
  /** Raw status code from API. */
  statusCode: string;
  /** Tax type description. */
  taxType: string;
  /** Tax type change date (YYYYMMDD). */
  taxTypeChangeDate?: string;
  /** Invoice apply date (YYYYMMDD). */
  invoiceApplyDate?: string;
}

/** Parameters for business authenticity verification. */
export interface BusinessValidateParams {
  /** Businesses to verify. */
  businesses: BusinessValidateItem[];
}

/** Single business verification item. */
export interface BusinessValidateItem {
  /** Business registration number (10 digits). */
  businessNumber: string;
  /** Business start date (YYYYMMDD). */
  startDate: string;
  /** Representative name. */
  representativeName: string;
  /** Company name (optional). */
  companyName?: string;
}

/** Business validation result. */
export interface BusinessValidation {
  /** Business registration number. */
  businessNumber: string;
  /** Whether the information matches. */
  valid: boolean;
  /** Validation status from API. */
  requestCount: number;
  /** Status code. */
  statusCode: string;
}

/** Raw API response for status check. */
export interface RawBusinessStatusItem {
  b_no: string;
  b_stt: string;
  b_stt_cd: string;
  tax_type: string;
  tax_type_change_dt?: string;
  invoice_apply_dt?: string;
}

/** Raw API response for validation. */
export interface RawBusinessValidationItem {
  b_no: string;
  valid: string;
  request_cnt: number;
  status: { b_stt_cd: string };
}
