export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string | null;
  capacity: number;
  driverName: string | null;
  driverPhone: string | null;
  driverUserId: string | null;
}

export interface Route {
  id: string;
  name: string;
  vehicleId: string | null;
  vehicleNumber?: string;
}

export interface Stop {
  id: string;
  routeId: string;
  name: string;
  stopOrder: number;
}

export interface StudentTransport {
  id: string;
  studentId: string;
  studentName?: string;
  routeId: string;
  routeName?: string;
  stopId: string;
  stopName?: string;
}
