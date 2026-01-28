// Enum for music styles matching the API
export enum RapMusicStyle {
    BoomBap = 0, // Sample-heavy, 90s drums
    Trap = 1, // 808s, fast hi-hats
    SynthWave = 2, // Melodic, 80s influenced
    LoFi = 3, // Dusty, chill, jazz-heavy
    Industrial = 4, // Aggressive, distorted, experimental
    Orchestral = 5, // Cinematic, string-heavy
    Drill = 6, // Dark, sliding 808s, aggressive hi-hats
    Afrobeat = 7, // Rhythmic, percussive, African influences
    Grime = 8, // Raw, energetic, UK urban style
    CloudRap = 9, // Ethereal, dreamy, ambient
    Crunk = 10, // High-energy, party-focused, heavy bass
    G_Funk = 11, // Funky, melodic, West Coast style
    AlternativeHipHop = 12 // Eclectic, non-mainstream, experimental
}

// Mapping of enum values to display names
export const RapMusicStyleNames: Record<RapMusicStyle, string> = {
    [RapMusicStyle.BoomBap]: 'Boom Bap',
    [RapMusicStyle.Trap]: 'Trap',
    [RapMusicStyle.SynthWave]: 'SynthWave',
    [RapMusicStyle.LoFi]: 'Lo-Fi',
    [RapMusicStyle.Industrial]: 'Industrial',
    [RapMusicStyle.Orchestral]: 'Orchestral',
    [RapMusicStyle.Drill]: 'Drill',
    [RapMusicStyle.Afrobeat]: 'Afrobeat',
    [RapMusicStyle.Grime]: 'Grime',
    [RapMusicStyle.CloudRap]: 'Cloud Rap',
    [RapMusicStyle.Crunk]: 'Crunk',
    [RapMusicStyle.G_Funk]: 'G-Funk',
    [RapMusicStyle.AlternativeHipHop]: 'Alternative Hip Hop'
};
