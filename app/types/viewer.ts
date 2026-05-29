export interface Position {
  x: number;
  y: number;
  z: number;
  h: number;
}

// 특정 시간(프레임)에 존재하는 모든 차량의 위치 모음
// 예: { "0": { x: 8.1, y: 49.9, z: -0.04, h: 1.56 }, "1": { ... } }
export interface TimeFrameData {
  [vehicleId: string]: Position;
}

// 전체 궤적 데이터 (시간이 키값)
// 예: { "0.0": { "0": {...}, "1": {...} }, "0.033": { ... } }
export interface TrajectoryData {
  [timeKey: string]: TimeFrameData;
}

export type LiteralUnion<T extends string> = T | (string & {});

export type BooleanString = "true" | "false";
export type FractionalCloudCover = LiteralUnion<"zeroOktas">;
export type PrecipitationType = LiteralUnion<"snow">;
export type RoadWetness = LiteralUnion<"wetWithPuddles">;

export interface Environment {
  TimeOfDay: {
    animation: BooleanString;
    dateTime: string; // ISO datetime string
  };
  Weather: {
    atmosphericPressure: string;
    fractionalCloudCover: FractionalCloudCover;
    temperature: string;
    Sun: {
      azimuth: string;
      elevation: string;
      illuminance: string;
    };
    Fog: {
      visualRange: string;
    };
    Precipitation: {
      precipitationIntensity: string;
      precipitationType: PrecipitationType;
    };
    Wind: {
      direction: string;
      speed: string;
    };
  };
  RoadCondition: {
    frictionScaleFactor: string;
    wetness: RoadWetness;
  };
}

export interface ViewerData {
  scenario: TrajectoryData;
  models: Record<string, string>;
  map: string;
  Environment: Environment;
}
