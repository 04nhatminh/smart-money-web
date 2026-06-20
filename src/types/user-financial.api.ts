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
  id: string;
  userId: string;
  role: UserRole;
  living_status: LivingStatus;
  income_level: IncomeLevel;
  transport_mode: TransportMode;
  spending_style: SpendingStyle;
  work_style: WorkStyle;
  family_status: FamilyStatus;
  study_intensity: StudyIntensity;
  health_need: HealthNeed;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserFinancialProfileRequest {
  role: UserRole;
  living_status: LivingStatus;
  income_level: IncomeLevel;
  transport_mode: TransportMode;
  spending_style: SpendingStyle;
  work_style: WorkStyle;
  family_status: FamilyStatus;
  study_intensity: StudyIntensity;
  health_need: HealthNeed;
}

export interface UpdateUserFinancialProfileRequest {
  role?: UserRole;
  living_status?: LivingStatus;
  income_level?: IncomeLevel;
  transport_mode?: TransportMode;
  spending_style?: SpendingStyle;
  work_style?: WorkStyle;
  family_status?: FamilyStatus;
  study_intensity?: StudyIntensity;
  health_need?: HealthNeed;
}

export interface CheckResponseUserFinancialProfileResponse {
  success: boolean;
  message: string;
  data: UserFinancialProfileResponse;
  errorCode?: string;
}
