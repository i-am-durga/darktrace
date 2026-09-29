export type IngestionState = {
  message?: string;
  error?: boolean;
  counts?: {
    actorsCreated: number;
    observationsCreated: number;
    observationsSkipped: number;
    evidenceCreated: number;
  };
};
