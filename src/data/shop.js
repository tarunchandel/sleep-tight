/**
 * Shop System - Coin economy + purchasable power-ups (goodies).
 * Coins are earned by surviving time milestones during gameplay.
 * Goodies persist across sessions and provide in-game bonuses.
 */

/** All available shop items with their effects */
export const SHOP_ITEMS = [
    {
        id: 'bug_zapper',
        name: 'Bug Zapper',
        emoji: '⚡',
        price: 50,
        maxLevel: 3,
        upgradePrices: [100, 200],
        description: 'Auto-zaps a fly periodically',
        longDescription: 'A tiny electric zapper that automatically eliminates one fly periodically! Upgrades reduce the cooldown.',
        color: '#FFD700',
        glow: 'rgba(255, 215, 0, 0.4)',
    },
    {
        id: 'sleep_shield',
        name: 'Sleep Shield',
        emoji: '🛡️',
        price: 75,
        maxLevel: 3,
        upgradePrices: [150, 300],
        description: 'Sleep drains 30% slower',
        longDescription: 'A magical shield that keeps the baby sleeping deeper. Upgrades further slow down sleep drain.',
        color: '#44AAFF',
        glow: 'rgba(68, 170, 255, 0.4)',
    },
    {
        id: 'lavender_aura',
        name: 'Lavender Aura',
        emoji: '🌿',
        price: 100,
        maxLevel: 3,
        upgradePrices: [200, 400],
        description: 'Repels flies from baby',
        longDescription: 'Soothing lavender keeps flies at a distance. Upgrades make flies even more hesitant to approach.',
        color: '#AA77DD',
        glow: 'rgba(170, 119, 221, 0.4)',
    },
    {
        id: 'quick_hands',
        name: 'Quick Hands',
        emoji: '👋',
        price: 60,
        maxLevel: 3,
        upgradePrices: [120, 240],
        description: 'Easier to squash flies',
        longDescription: 'Lightning-fast reflexes! Upgrades increase hit radius and further reduce fly dodge chance.',
        color: '#FF6B6B',
        glow: 'rgba(255, 107, 107, 0.4)',
    },
    {
        id: 'teddy_guard',
        name: 'Teddy Guard',
        emoji: '🧸',
        price: 120,
        maxLevel: 3,
        upgradePrices: [240, 480],
        description: 'Teddy swats flies away',
        longDescription: 'A brave teddy bear that shoos flies away! Upgrades reduce the swat cooldown.',
        color: '#C08040',
        glow: 'rgba(192, 128, 64, 0.4)',
    },
    {
        id: 'lullaby_boost',
        name: 'Lullaby Boost',
        emoji: '🎵',
        price: 80,
        maxLevel: 3,
        upgradePrices: [160, 320],
        description: 'Sleep recovers 50% faster',
        longDescription: 'A soothing lullaby helps the baby recover sleep! Upgrades increase the recovery speed.',
        color: '#77DDAA',
        glow: 'rgba(119, 221, 170, 0.4)',
    },
    {
        id: 'midnight_snack',
        name: 'Midnight Snack',
        emoji: '🍪',
        price: 150,
        maxLevel: 3,
        upgradePrices: [300, 500],
        description: 'Increases max sleep meter',
        longDescription: 'A late-night snack for the baby! Increases the maximum capacity of the sleep meter (120/140/160%).',
        color: '#FFCC66',
        glow: 'rgba(255, 204, 102, 0.4)',
    },
    {
        id: 'golden_diaper',
        name: 'Golden Diaper',
        emoji: '✨',
        price: 200,
        maxLevel: 3,
        upgradePrices: [400, 800],
        description: 'Earn more coins per run',
        longDescription: 'So shiny! Multiplies the coins you earn from survival milestones (1.5x / 2.0x / 3.0x).',
        color: '#FFE88C',
        glow: 'rgba(255, 232, 140, 0.4)',
    },
    {
        id: 'fan_breeze',
        name: 'Fan Breeze',
        emoji: '🌬️',
        price: 90,
        maxLevel: 3,
        upgradePrices: [180, 360],
        description: 'Slows down fly approach',
        longDescription: 'A gentle fan breeze that makes it harder for flies to fly towards the baby (15/30/45% slower speed).',
        color: '#A0E0FF',
        glow: 'rgba(160, 224, 255, 0.4)',
    },
    {
        id: 'sonic_pacifier',
        name: 'Sonic Pacifier',
        emoji: '🤫',
        price: 180,
        maxLevel: 3,
        upgradePrices: [360, 720],
        description: 'Freeze sleep drain (Manual)',
        longDescription: 'Tap the pacifier icon to stop the sleep meter from draining for 5/8/12 seconds. Has a 40s cooldown.',
        color: '#8C9EFF',
        glow: 'rgba(140, 158, 255, 0.4)',
    },
    {
        id: 'sticky_trap',
        name: 'Sticky Trap',
        emoji: '🪤',
        price: 130,
        maxLevel: 3,
        upgradePrices: [260, 520],
        description: 'Traps flies periodically',
        longDescription: 'Every few seconds, a sticky trap appears and catches the next fly that touches it.',
        color: '#D4A017',
        glow: 'rgba(212, 160, 23, 0.4)',
    },
    {
        id: 'coin_magnet',
        name: 'Coin Magnet',
        emoji: '🧲',
        price: 110,
        maxLevel: 3,
        upgradePrices: [220, 440],
        description: 'Attracts bonus coins',
        longDescription: 'Attracts "Bonus Coins" that occasionally float across the nursery. Upgrades increase attract range.',
        color: '#FF4D4D',
        glow: 'rgba(255, 77, 77, 0.4)',
    },
];

/**
 * Coin milestones - seconds survived → coins earned.
 * Players get coins at each milestone they pass.
 */
export const COIN_MILESTONES = [
    { time: 15, coins: 5, message: '🪙 +5 coins! (15s survived)' },
    { time: 30, coins: 8, message: '🪙 +8 coins! (30s survived)' },
    { time: 60, coins: 12, message: '🪙 +12 coins! (1 min survived!)' },
    { time: 90, coins: 15, message: '🪙 +15 coins! (1:30 survived!)' },
    { time: 120, coins: 20, message: '🪙 +20 coins! (2 min survived!!)' },
    { time: 180, coins: 30, message: '🪙 +30 coins! (3 min! Legend!!)' },
    { time: 240, coins: 40, message: '🪙 +40 coins! (4 min! GOD MODE!)' },
    { time: 300, coins: 50, message: '🪙 +50 coins! (5 MIN! INSANE!!)' },
];

/**
 * Get the total coins earned for a given survival time.
 */
export function calculateCoinsEarned(timeSurvived) {
    let total = 0;
    for (const milestone of COIN_MILESTONES) {
        if (timeSurvived >= milestone.time) {
            total += milestone.coins;
        }
    }
    return total;
}

/**
 * Get the list of milestone indices that have been reached.
 */
export function getMilestonesReached(timeSurvived) {
    return COIN_MILESTONES
        .map((m, i) => ({ ...m, index: i }))
        .filter(m => timeSurvived >= m.time);
}
