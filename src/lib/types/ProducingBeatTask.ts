import type { RapMusicStyle } from "./musicStyles";
import type { TaskResults } from "./task";

// Request type for creating a new beat
export interface CreateBeatRequest {
    NumberOfBeats: number;
    beatmakerId: string;
    productionStyles: RapMusicStyle[];
}

export interface ScoutingArtistsResults extends TaskResults {
    ProducedBeatsIds: string[];
}

export interface ProducingBeatTaskResponse extends ScoutingArtistsResults {

}