export type PunchStatus = 'open' | 'complete';

export interface PunchRecord {
  id: string;
  teacherId: string;
  punchDate: string;
  punchIn: string | null;
  punchOut: string | null;
  workingMinutes: number | null;
  status: PunchStatus;
  latitude: number | null;
  longitude: number | null;
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export interface CorrectionRequest {
  id: string;
  teacherId: string;
  teacherName?: string;
  punchDate: string;
  requestedPunchIn: string | null;
  requestedPunchOut: string | null;
  reason: string;
  status: CorrectionStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export interface GeofenceSettings {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}
