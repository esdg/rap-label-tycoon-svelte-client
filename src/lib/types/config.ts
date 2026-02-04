import type { ScoutingScope } from './scoutingArtistsTask';
import type { RapMusicStyle } from './musicStyles';

export interface SkillRange {
    min: number;
    max: number;
}

interface BaseArchetype {
    id: string;
    name: string;
    description: string;
    rarity: number;
    rapMusicStyles: RapMusicStyle[];
    basePersonalSkills: {
        charisma: SkillRange;
        toughness: SkillRange;
        stability: SkillRange;
    };
    personalSkillsByRank: {
        charisma: SkillRange;
        toughness: SkillRange;
        stability: SkillRange;
    };
}

export interface RapperArchetype extends BaseArchetype {
    $type: 'rapper-archetype';
    baseSongWritingSkills: {
        storytelling: SkillRange;
        rhymeScheme: SkillRange;
        wordplay: SkillRange;
        writingSpeed: SkillRange;
        chorusCrafting: SkillRange;
        verseStructure: SkillRange;
    };
    songWritingSkillsByRank: {
        storytelling: SkillRange;
        rhymeScheme: SkillRange;
        wordplay: SkillRange;
        writingSpeed: SkillRange;
        chorusCrafting: SkillRange;
        verseStructure: SkillRange;
    };
    baseInterpretationSkills: {
        emotionalExpression: SkillRange;
        stagePresence: SkillRange;
        vocalControl: SkillRange;
        improvisation: SkillRange;
    };
    interpretationSkillsByRank: {
        emotionalExpression: SkillRange;
        stagePresence: SkillRange;
        vocalControl: SkillRange;
        improvisation: SkillRange;
    };
}

export interface BeatmakerArchetype extends BaseArchetype {
    $type: 'beatmaker-archetype';
    baseBeatmakingSkills: {
        composing: SkillRange;
        melody: SkillRange;
        drumProgramming: SkillRange;
        sampling: SkillRange;
    };
    beatmakingSkillsByRank: {
        composing: SkillRange;
        melody: SkillRange;
        drumProgramming: SkillRange;
        sampling: SkillRange;
    };
}

export type ArtistArchetype = RapperArchetype | BeatmakerArchetype;

export interface ArtistRank {
    id: string;
    name: string;
    description: string;
    requiredXp: number;
    additionalPerks: number;
}

export interface ReleaseType {
    id: string;
    name: string;
    description: string;
    minTracks: number;
    maxTracks: number;
    baseDurationMinutes: number;
    baseBudget: number;
    minTrackDurationSeconds: number;
    maxTrackDurationSeconds: number;
}

export interface AppConfig {
    apiBaseUrl: string;
    artistArchetypes: ArtistArchetype[];
    artistRanks: ArtistRank[];
    releaseTypes: ReleaseType[];
    scoutingScopes: ScoutingScope[];
}
