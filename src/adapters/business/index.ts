import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  BusinessStatusParams,
  BusinessStatus,
  BusinessStatusType,
  BusinessValidateParams,
  BusinessValidation,
  RawBusinessStatusItem,
  RawBusinessValidationItem,
} from './types.js';

const BASE_URL = 'api.odcloud.kr';
const DEFAULT_TTL = 86400; // 24 hours
const MAX_BATCH_SIZE = 100;
const BIZ_NUMBER_PATTERN = /^\d{10}$/;

/** Status code mapping from API to normalized enum. */
const STATUS_MAP: Record<string, BusinessStatusType> = {
  '01': 'ACTIVE',
  '02': 'SUSPENDED',
  '03': 'CLOSED',
};

/**
 * Business Registration adapter for National Tax Service (국세청) API.
 *
 * Uses POST requests to api.odcloud.kr, unlike other adapters that use GET.
 * Supports batch queries up to 100 business numbers.
 */
export class BusinessAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'business';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Check business registration status for one or more numbers. */
  async getStatus(
    params: BusinessStatusParams,
  ): Promise<ApiResponse<BusinessStatus[]>> {
    const numbers = params.businessNumbers.map((n) => this.normalizeNumber(n));
    this.validateBatch(numbers);

    const result = await this.request<{
      data: RawBusinessStatusItem[];
    }>({
      path: '/api/nts-businessman/v1/status',
      params: {
        b_no: numbers.join(','),
      },
    });

    const statuses = Array.isArray(result.data)
      ? (result.data as unknown as RawBusinessStatusItem[])
      : ((result.data as { data: RawBusinessStatusItem[] }).data ?? []);

    return {
      ...result,
      data: statuses.map((item) => this.normalizeStatus(item)),
    };
  }

  /** Verify business authenticity by matching registration info. */
  async validate(
    params: BusinessValidateParams,
  ): Promise<ApiResponse<BusinessValidation[]>> {
    this.validateBatch(
      params.businesses.map((b) => this.normalizeNumber(b.businessNumber)),
    );

    for (const biz of params.businesses) {
      if (!biz.startDate || !/^\d{8}$/.test(biz.startDate)) {
        throw new ValidationError(
          `startDate must be in YYYYMMDD format, got "${biz.startDate}"`,
          { field: 'startDate' },
        );
      }
      if (!biz.representativeName) {
        throw new ValidationError('representativeName is required', {
          field: 'representativeName',
        });
      }
    }

    const result = await this.request<{
      data: RawBusinessValidationItem[];
    }>({
      path: '/api/nts-businessman/v1/validate',
      params: {
        businesses: params.businesses
          .map((b) => this.normalizeNumber(b.businessNumber))
          .join(','),
      },
    });

    const validations = Array.isArray(result.data)
      ? (result.data as unknown as RawBusinessValidationItem[])
      : ((result.data as { data: RawBusinessValidationItem[] }).data ?? []);

    return {
      ...result,
      data: validations.map((item) => this.normalizeValidation(item)),
    };
  }

  /** Strip hyphens and validate business number format. */
  private normalizeNumber(number: string): string {
    const stripped = number.replace(/-/g, '');
    if (!BIZ_NUMBER_PATTERN.test(stripped)) {
      throw new ValidationError(
        `Invalid business number format: "${number}". Expected 10 digits (e.g., "1234567890" or "123-45-67890")`,
        { field: 'businessNumber' },
      );
    }
    return stripped;
  }

  /** Validate batch size. */
  private validateBatch(numbers: string[]): void {
    if (numbers.length === 0) {
      throw new ValidationError('At least one business number is required', {
        field: 'businessNumbers',
      });
    }
    if (numbers.length > MAX_BATCH_SIZE) {
      throw new ValidationError(
        `Batch size cannot exceed ${MAX_BATCH_SIZE}, got ${numbers.length}`,
        { field: 'businessNumbers' },
      );
    }
  }

  private normalizeStatus(item: RawBusinessStatusItem): BusinessStatus {
    return {
      businessNumber: item.b_no,
      status: STATUS_MAP[item.b_stt_cd] ?? 'NOT_FOUND',
      statusCode: item.b_stt_cd,
      taxType: item.tax_type ?? '',
      taxTypeChangeDate: item.tax_type_change_dt || undefined,
      invoiceApplyDate: item.invoice_apply_dt || undefined,
    };
  }

  private normalizeValidation(
    item: RawBusinessValidationItem,
  ): BusinessValidation {
    return {
      businessNumber: item.b_no,
      valid: item.valid === '01',
      requestCount: item.request_cnt,
      statusCode: item.status?.b_stt_cd ?? '',
    };
  }
}
