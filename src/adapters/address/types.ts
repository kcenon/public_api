/** Parameters for address search. */
export interface AddressSearchParams {
  /** Search keyword (minimum 2 characters). */
  keyword: string;
  /** Page number (default: 1). */
  currentPage?: number;
  /** Results per page (default: 10). */
  countPerPage?: number;
}

/** Parameters for coordinate lookup. */
export interface AddressCoordinateParams {
  /** Road name address to get coordinates for. */
  admCd: string;
  /** Road name management serial number. */
  rnMgtSn: string;
  /** Building management serial number. */
  udrtYn: string;
  /** Building main number. */
  buldMnnm: string;
  /** Building sub number. */
  buldSlno: string;
}

/** Normalized address search result. */
export interface AddressResult {
  /** Full road name address. */
  roadAddress: string;
  /** Lot number (jibun) address. */
  jibunAddress: string;
  /** 5-digit postal code. */
  postalCode: string;
  /** Building name. */
  buildingName?: string;
  /** City/Province name. */
  siNm: string;
  /** District name. */
  sggNm: string;
  /** Town name. */
  emdNm: string;
  /** Road name. */
  roadName: string;
  /** Building main number. */
  buildingNumber: string;
  /** Building sub number. */
  buildingSubNumber?: string;
  /** Administrative district code. */
  admCd?: string;
  /** Road name management serial number. */
  rnMgtSn?: string;
  /** Underground flag. */
  udrtYn?: string;
}

/** Normalized coordinate result. */
export interface AddressCoordinate {
  /** Road name address. */
  roadAddress: string;
  /** Latitude (WGS84). */
  latitude: number;
  /** Longitude (WGS84). */
  longitude: number;
  /** Administrative district code. */
  admCd: string;
  /** Road name management serial number. */
  rnMgtSn: string;
}

/** Normalized English address result. */
export interface EnglishAddressResult {
  /** Full road name address in English. */
  roadAddress: string;
  /** Lot number (jibun) address in English. */
  jibunAddress: string;
  /** 5-digit postal code. */
  postalCode: string;
  /** City/Province name in English. */
  siNm: string;
  /** District name in English. */
  sggNm: string;
  /** Town name in English. */
  emdNm: string;
  /** Road name in English. */
  roadName: string;
  /** Building main number. */
  buildingNumber: string;
  /** Building sub number. */
  buildingSubNumber?: string;
}

/** Raw API common response header from juso.go.kr. */
export interface RawJusoCommon {
  totalCount: string;
  currentPage: string;
  countPerPage: string;
  errorCode: string;
  errorMessage: string;
}

/** Raw address item from juso.go.kr search API. */
export interface RawJusoItem {
  roadAddr: string;
  roadAddrPart1: string;
  roadAddrPart2?: string;
  jibunAddr: string;
  engAddr?: string;
  zipNo: string;
  admCd: string;
  rnMgtSn: string;
  bdMgtSn: string;
  detBdNmList?: string;
  bdNm?: string;
  bdKdcd?: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
  liNm?: string;
  rn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
  mtYn?: string;
  lnbrMnnm?: string;
  lnbrSlno?: string;
  emdNo?: string;
}

/** Raw coordinate item from juso.go.kr coordinate API. */
export interface RawJusoCoordItem {
  admCd: string;
  rnMgtSn: string;
  bdMgtSn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
  entX: string;
  entY: string;
  bdNm?: string;
}

/** Raw English address item from juso.go.kr English API. */
export interface RawJusoEngItem {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
  rn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
}

/** Raw juso.go.kr API response wrapper. */
export interface RawJusoApiResponse<T> {
  results: {
    common: RawJusoCommon;
    juso: T[] | null;
  };
}
