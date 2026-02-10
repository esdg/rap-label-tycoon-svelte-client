export interface RestingType {
	id: string;
	name: string;
	description: string;
	minimumDuration: string;
	maximumDuration: string;
	energyRestoredPerHour: number;
	baseBudgetPerHour: number;
	illustrationUrl: string | null;
}
