export type SavingPace = 'RELAXED' | 'BALANCED' | 'AGGRESIVE';
export type InterventionLevel = 'NOTIFY' | 'GENTLE' | 'HARD';
export type FocusMode = 'SAVE_MORE' | 'REDUCE_SPENDING' | 'TRACK_ONLY';

// Old types preserved for backwards compatibility/minimizing compiler issues if imported elsewhere
export type UserRole = 'BUSINESS_OWNER' | 'FREELANCER' | 'OFFICE_WORKER' | 'STUDENT';
export type LivingStatus = 'DORM' | 'OWN_HOUSE' | 'RENT_ROOM' | 'WITH_FAMILY';
export type IncomeLevel = 'HIGH' | 'LOW' | 'MEDIUM';
export type TransportMode = 'BUS' | 'CAR' | 'MOTORBIKE' | 'RIDE_HAILING';
export type SpendingStyle = 'BALANCED' | 'FRUGAL' | 'SPENDER';
export type WorkStyle = 'HYBRID' | 'NONE' | 'ONSITE' | 'PART_TIME' | 'REMOTE';
export type FamilyStatus = 'MARRIED' | 'SINGLE';
export type StudyIntensity = 'COURSE_HEAVY' | 'NORMAL';
export type HealthNeed = 'HIGH' | 'LOW' | 'NORMAL';

export interface UserFinancialProfileResponse {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  autoInvestSurplus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserFinancialProfileRequest {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  autoInvestSurplus: boolean;
}

export interface UpdateUserFinancialProfileRequest {
  income?: number;
  savingPace?: SavingPace;
  interventionLevel?: InterventionLevel;
  focusMode?: FocusMode;
  autoInvestSurplus?: boolean;
}

export interface CheckResponseUserFinancialProfileResponse {
  success: boolean;
  message: string;
  data: UserFinancialProfileResponse;
  errorCode?: string;
}
