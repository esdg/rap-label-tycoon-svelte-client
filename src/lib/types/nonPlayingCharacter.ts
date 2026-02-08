// Request type for creating a new player
export interface NonPlayableCharacter {
	$type: string;
	id: string;
	firstName: string;
	lastName: string;
	sex: string;
	birthDate: string;
	deathDate: string;
	retirementDate: string;
	personalSkills: {
		charisma: number;
		toughness: number;
		stability: number;
	};
	address: string;
	city: string;
	country: string;
	rarity: number;
	profileImage: string;
	ethnicity: string;
	vitalityStats: {
		stamina: number;
		maxStamina: number;
		happiness: number;
		maxHappiness: number;
		staminaPercent: number;
		happinessPercent: number;
		isExhausted: boolean;
		canPerformTasks: boolean;
	};
	rating: number;
	createdAt: string;
	updatedAt: string;
}

export interface Artist extends NonPlayableCharacter {
	stageName: string;
	bio: string;
	backgroundStory: string;
	physicalDescription: string;
	fans: number;
	streetCredibility: number;
	archetypeId: string;
	rankId: string;
	experience: number;
	rapMusicStyles: number[];
	taskIds: string[];
	reputation: number;
	hype: number;
}

export interface Rapper extends Artist {
	songWritingSkills: {
		storytelling: number;
		rhymeScheme: number;
		wordplay: number;
		writingSpeed: number;
		chorusCrafting: number;
		verseStructure: number;
	};
	interpretationSkills: {
		emotionalExpression: number;
		stagePresence: number;
		vocalControl: number;
		improvisation: number;
	};
}

export interface Beatmaker extends Artist {
	beatmakingSkills: {
		composing: number;
		melody: number;
		drumProgramming: number;
		sampling: number;
	};
	producedBeatsIds: string[];
}
