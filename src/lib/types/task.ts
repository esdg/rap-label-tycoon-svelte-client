export enum TaskType {
    Scouting = 0,
    ProducingBeats = 1,
    SigningContract = 2,
    RecordingRelease = 3,
    PublishingRelease = 4,
    MarketingCampaign = 5,
    Training = 6,
    ProducingRelease = 7,
}

// Enum for task status
export enum TaskStatus {
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3,
    Claimed = 4
}

export interface TaskCostPrediction {
    budgetRequired: number;
    duration: string;
    staminaCost: number;
}

// Enum for task creation errors (matches backend enum order)
export enum TaskCreationErrorType {
    NotFound = 0,
    ValidationError = 1,
    InsufficientBudget = 2,
    WorkerBusy = 3,
    TaskLimitReached = 4,
    ActiveContractExists = 5,
    WorkerExhausted = 6
}

// Error response structure from API
export interface TaskCreationErrorResponse {
    code: number;
    message: string;
}

// Base task response - common fields for all task types
export interface TaskResponse {
    id: string;
    labelId: string;
    workerId: string;
    taskType: TaskType;
    name: string;
    description: string;
    budgetRequired: number;
    staminaCost: number;
    startTime: string;
    endTime: string;
    claimedAt: string | null;
    createdAt: string;
    updatedAt: string;
    status: TaskStatus;
    results: TaskResults | null;
}

// Scouting task - has scopeId for the scouting scope
export interface ScoutingTaskResponse extends TaskResponse {
    taskType: TaskType.Scouting;
    scopeId: string;
    results: ScoutingTaskResults | null;
}

// Signing contract task - has contractId for the associated contract
export interface SigningContractTaskResponse extends TaskResponse {
    taskType: TaskType.SigningContract;
    contractId: string;
    results: SigningContractTaskResults | null;
}

// Union type for all specific task responses
export type AnyTaskResponse = ScoutingTaskResponse | SigningContractTaskResponse | TaskResponse;

// Base results
export interface TaskResults {
    success: boolean;
    details: string;
}

// Scouting results
export interface ScoutingTaskResults extends TaskResults {
    $type: string; // "rapper" or "beatmaker"
    discoveredArtistsIds: string[];
}

// Signing contract results
export interface SigningContractTaskResults extends TaskResults {
    $type: string; // "signing_contract"
    contractId: string;
}