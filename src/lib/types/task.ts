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

export interface TaskResponse {
    id: string;
    labelId: string;
    scopeId: string;
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

export interface TaskResults {
    success: boolean;
    details: string;
}