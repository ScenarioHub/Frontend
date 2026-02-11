export interface UploadResponse {
  postId: number;
  scenarioId: number;
  uploaderId: number;
  tags: string[];
}

export interface DataWithJobIdResponse {
  description: string;
  mapId: number;
  scenarioId: number;
  filePath: string;
}

export interface UploadResponseFromGenerator extends DataWithJobIdResponse {
  postId: number;
}
