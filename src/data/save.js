/**
 * Data persistence - LocalStorage based save system with export/import.
 */

const SAVE_KEY = 'sleep_tight_save';

const defaultData = {
    highScore: 0,
    highScoreTime: 0,
    totalFliesSquashed: 0,
    totalGamesSessions: 0,
    bestFliesInOneSession: 0,
    settings: {
        soundEnabled: true,
        hapticsEnabled: true,
    },
    scores: [], // top 10 scores [{score, time, flies, date}]
};

export class SaveSystem {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings } };
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
        }
        return { ...defaultData };
    }

    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }

    /** Record a completed game session */
    recordSession(score, timeSurvived, fliesNeutralized) {
        this.data.totalGamesSessions++;
        this.data.totalFliesSquashed += fliesNeutralized;

        if (score > this.data.highScore) {
            this.data.highScore = score;
        }
        if (timeSurvived > this.data.highScoreTime) {
            this.data.highScoreTime = timeSurvived;
        }
        if (fliesNeutralized > this.data.bestFliesInOneSession) {
            this.data.bestFliesInOneSession = fliesNeutralized;
        }

        // Add to leaderboard
        this.data.scores.push({
            score: Math.round(score),
            time: Math.round(timeSurvived),
            flies: fliesNeutralized,
            date: new Date().toISOString()
        });
        // Keep top 10
        this.data.scores.sort((a, b) => b.score - a.score);
        this.data.scores = this.data.scores.slice(0, 10);

        this.save();
    }

    /** Export save data as JSON string */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /** Import save data from JSON string */
    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            this.data = { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings } };
            this.save();
            return true;
        } catch (e) {
            console.warn('Failed to import data:', e);
            return false;
        }
    }

    getHighScore() { return this.data.highScore; }
    getScores() { return this.data.scores; }
    getSettings() { return this.data.settings; }

    updateSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.save();
    }
}
