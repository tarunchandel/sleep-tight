/**
 * Data persistence - LocalStorage based save system with export/import.
 * Supports coins, purchased items, and game settings.
 */

const SAVE_KEY = 'sleep_tight_save';

const defaultData = {
    highScore: 0,
    highScoreTime: 0,
    totalFliesSquashed: 0,
    totalGamesSessions: 0,
    bestFliesInOneSession: 0,
    coins: 0,
    purchasedItems: [],  // Array of item IDs
    itemLevels: {},      // itemId -> level (1-indexed)
    equippedItems: [],   // Array of item IDs currently active
    settings: {
        soundEnabled: true,
        hapticsEnabled: true,
    },
    scores: [], // top 10 scores [{score, time, flies, date, coinsEarned}]
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
                return {
                    ...defaultData,
                    ...parsed,
                    settings: { ...defaultData.settings, ...(parsed.settings || {}) },
                    purchasedItems: parsed.purchasedItems || [],
                    itemLevels: parsed.itemLevels || {},
                    equippedItems: parsed.equippedItems || [],
                };
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
    recordSession(score, timeSurvived, fliesNeutralized, coinsEarned = 0) {
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

        // Add coins earned this session
        this.data.coins += coinsEarned;

        // Add to leaderboard
        this.data.scores.push({
            score: Math.round(score),
            time: Math.round(timeSurvived),
            flies: fliesNeutralized,
            coinsEarned,
            date: new Date().toISOString()
        });
        // Keep top 10
        this.data.scores.sort((a, b) => b.score - a.score);
        this.data.scores = this.data.scores.slice(0, 10);

        this.save();
    }

    /** Add coins to balance */
    addCoins(amount) {
        this.data.coins += amount;
        this.save();
    }

    /** Spend coins (returns true if successful) */
    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    /** Get current coin balance */
    getCoins() {
        return this.data.coins;
    }

    /** Purchase an item */
    purchaseItem(itemId, price) {
        if (this.data.coins < price) return false;
        if (this.data.purchasedItems.includes(itemId)) return false;

        this.data.coins -= price;
        this.data.purchasedItems.push(itemId);
        this.data.itemLevels[itemId] = 1;
        // Auto-equip on purchase
        if (!this.data.equippedItems.includes(itemId)) {
            this.data.equippedItems.push(itemId);
        }
        this.save();
        return true;
    }

    /** Upgrade an item level */
    upgradeItem(itemId, price) {
        if (this.data.coins < price) return false;
        if (!this.data.purchasedItems.includes(itemId)) return false;

        const currentLevel = this.data.itemLevels[itemId] || 1;
        this.data.coins -= price;
        this.data.itemLevels[itemId] = currentLevel + 1;
        this.save();
        return true;
    }

    /** Get the current level of an item */
    getItemLevel(itemId) {
        if (!this.data.purchasedItems.includes(itemId)) return 0;
        return this.data.itemLevels[itemId] || 1;
    }

    /** Get mapping of all purchased item levels */
    getItemLevels() {
        return { ...this.data.itemLevels };
    }

    /** Toggle equip/unequip an item */
    toggleEquip(itemId) {
        if (!this.data.purchasedItems.includes(itemId)) return false;
        const idx = this.data.equippedItems.indexOf(itemId);
        if (idx >= 0) {
            this.data.equippedItems.splice(idx, 1);
        } else {
            this.data.equippedItems.push(itemId);
        }
        this.save();
        return true;
    }

    /** Check if an item is purchased */
    isItemPurchased(itemId) {
        return this.data.purchasedItems.includes(itemId);
    }

    /** Check if an item is equipped */
    isItemEquipped(itemId) {
        return this.data.equippedItems.includes(itemId);
    }

    /** Get all equipped item IDs */
    getEquippedItems() {
        return [...this.data.equippedItems];
    }

    /** Get all purchased item IDs */
    getPurchasedItems() {
        return [...this.data.purchasedItems];
    }

    /** Export save data as JSON string */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /** Import save data from JSON string */
    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            this.data = {
                ...defaultData,
                ...parsed,
                settings: { ...defaultData.settings, ...(parsed.settings || {}) },
                purchasedItems: parsed.purchasedItems || [],
                itemLevels: parsed.itemLevels || {},
                equippedItems: parsed.equippedItems || [],
            };
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
