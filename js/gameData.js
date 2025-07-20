// Game Data Definitions

export const rarities = {
  Common: { color: '#e2e8f0', levelBoost: 0, goldMultiplier: 1 },
  Uncommon: { color: '#48bb78', levelBoost: 5, goldMultiplier: 2 },
  Rare: { color: '#63b3ed', levelBoost: 10, goldMultiplier: 5 },
  Epic: { color: '#9f7aea', levelBoost: 15, goldMultiplier: 10 },
  Legendary: { color: '#f6ad55', levelBoost: 25, goldMultiplier: 20 },
};

export const levelZones = [
  { name: 'Ashfen', minLevel: 1, maxLevel: 10, enemyNames: ['Howler', 'Bogboar', 'Cindling'] },
  { name: 'Eastgale', minLevel: 10, maxLevel: 20, enemyNames: ['Wretch', 'Jackal', 'Cairnkin'] },
  { name: 'Dawnnmere', minLevel: 20, maxLevel: 30, enemyNames: ['Sunborn', 'Willow', 'Hollowed'] },
  { name: 'Frostheath', minLevel: 30, maxLevel: 40, enemyNames: ['Sporeback', 'Creeper', 'Leechkin'] },
  { name: 'Miredeep', minLevel: 40, maxLevel: 50, enemyNames: ['Sinkmaw', 'Lantern', 'Snapper'] },
  { name: 'Hallowmere', minLevel: 50, maxLevel: 60, enemyNames: ['Revenant', 'Scrollkin', 'Saintless '] },
  { name: 'Embercrest', minLevel: 60, maxLevel: 70, enemyNames: ['Scourge', 'Ashchant', 'Cinderrake'] },
  { name: 'Voidwell', minLevel: 70, maxLevel: 80, enemyNames: ['Unshaper', 'Flicker', 'Watcher'] },
  { name: 'Crimvale', minLevel: 80, maxLevel: 90, enemyNames: ['Gorehide', 'Thornsoul', 'Warden'] },
  { name: 'Aurelia', minLevel: 90, maxLevel: 100, enemyNames: ['Gildborn ', 'Exultant', 'Mirrorkin'] },
  { name: 'Shardspire', minLevel: 100, maxLevel: Infinity, enemyNames: ['Fracture', 'Chrono', 'Eversplit'] }
];

export const statAffixes = {
    'of the Tiger': { stats: { criticalChance: true, haste: true } },
    'of the Wolf': { stats: { criticalChance: true, mastery: true } },
    'of the Eagle': { stats: { haste: true, mastery: true } }
};

export const rarityChances = [
  { rarity: 'Common', chance: 72 },
  { rarity: 'Uncommon', chance: 25 },
  { rarity: 'Rare', chance: 2.5 },
  { rarity: 'Epic', chance: 0.49 },
  { rarity: 'Legendary', chance: 0.01 },
];

export const items = {
  Coin: { name: 'Coin', type: 'currency' },
  'Iron Sword': { name: 'Iron Sword', type: 'weapon', baseStatValue: 1 },
  'Iron Dagger': { name: 'Iron Dagger', type: 'dagger', baseStatValue: 1 },
  'Iron Helmet': { name: 'Iron Helmet', type: 'head', baseStatValue: 1 },
  'Iron Pauldrons': { name: 'Iron Pauldrons', type: 'shoulders', baseStatValue: 1 },
  'Iron Chestplate': { name: 'Iron Chestplate', type: 'chest', baseStatValue: 1 },
  'Iron Greaves': { name: 'Iron Greaves', type: 'legs', baseStatValue: 1 },
  'Iron Boots': { name: 'Iron Boots', type: 'feet', baseStatValue: 1 }
};

export const lootTable = [
  { item: items['Coin'], minQuantity: 3, maxQuantity: 8, dropChance: 5 },
  { item: items['Iron Sword'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Dagger'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Helmet'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Pauldrons'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Chestplate'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Greaves'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 },
  { item: items['Iron Boots'], minQuantity: 1, maxQuantity: 1, dropChance: 0.5 }
];
