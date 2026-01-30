export interface Player {
    id: string;
    firebaseUserId: string;
    username: string;
    email: string;
    createdAt: string;
    lastLogin: string;
    labelIds: string[];
    scoutingSkill: number;
}

// Request type for creating a new player
export interface CreatePlayerRequest {
    firebaseUserId: string;
    username: string;
    email: string;
}
