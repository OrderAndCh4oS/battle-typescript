interface CoreStats {
    intelligence: number;
    strength: number;
    dexterity: number;
}

interface Actor extends CoreStats {
    mainHand: Weapon;
    offHand: Weapon | Shield;
    armour: Armour;
}

enum EdgeType {
    blunt,
    pierce,
    slash
}

enum ArmourType {
    none, // armour reduction 0
    padded, // armour reduction effectiveness blunt: 100%, slash: 80%, pierce: 50%
    leather, // armour reduction effectiveness blunt: 85%, slash: 100%, pierce: 66%
    mail, // armour reduction effectiveness blunt: 90%, slash: 100%, pierce: 75%
    plate// armour reduction effectiveness blunt: 95%, slash: 100%, pierce: 85%
}

interface Weapon {
    name: string;
    damage: number;
    weight: number;
    edge: EdgeType;
    price: number;
}

interface Shield {
    name: string;
    blockChance: number;
    weight: number;
    durability: number;
    price: number
}

interface Armour {
    name: string;
    value: number;
    weight: number;
    material: ArmourType;
    price: number
}

interface Combatant {
    character: Character;
    attacks: number;
    attackRemainder: number;
    weight: number;
    initiative: number;
    health: number;
    roundStats: RoundStats;
}

interface RoundStats {
    attacks: AttackStats[];
    dodges: DodgeStats[];
    blocks: BlockStats[];
    wounds: WoundStats[];
    winner: boolean | null;
}

interface AttackStats {
    baseChance: number;
    weightChanceReduction: number;
    chance: number;
    rolled: number;
    isSuccessful: boolean;
    criticalHitStats?: CriticalHitStats;
    damageStats?: DamageStats;
    wasDodged?: boolean;
    hand: string
}

interface CriticalHitStats {
    chance: number;
    rolled: number;
    isSuccessful: boolean;
}

interface BlockStats {
    chance: number;
    rolled: number;
    damage: number;
    isSuccessful: boolean;
}

interface DamageStats {
    damageCaused: number;
    againstArmourType: ArmourType;
    damageBlockedByArmour: number;
}

interface DodgeStats {
    baseChance: number;
    weightChanceReduction: number;
    chance: number;
    rolled: number;
    isSuccessful: boolean;
}

interface WoundStats {
    weapon: Weapon;
    armour: Armour;
    attackerStrength: number;
    isCriticalDamage: boolean;
    damageTaken: number;
    damageBlockedByArmour: number;
}

interface Character {
    name: string;
    gold: number;
    experience: number;
    actor: Actor;
    wins: number;
    losses: number;
}

interface BattleResults {
    character?: Character;
    results: CombatantStats[];
}

interface CombatantStats {
    attackRateStats: AttackRateStats,
    dodgeStats: DodgeCheckStats,
    blockStats: BlockCheckStats
}

interface CheckStats {
    name: string,
    count: number,
    successCount: number,
    successRate: number
}

interface AttackRateStats extends CheckStats {
    totalDamage: number;
    averageDamage: number;
    totalDamageGiven: number;
    averageDamageGiven: number;
    criticalHitSuccessRate: number;
    criticalHitSuccessCount: number
}

interface DodgeCheckStats extends CheckStats {

}

interface BlockCheckStats extends CheckStats {

}

const capitalise = (str?: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const getAttacks = (actor: Actor, attackRemainder: number = 0): { attacks: number, attackRemainder: number } => {
    let attacks = Math.max(0, Math.round((actor.dexterity + attackRemainder - getWeight(actor)) / 33));
    attackRemainder = Math.max(0, (actor.dexterity + attackRemainder - getWeight(actor))) % 33;
    return {attacks, attackRemainder}
}

const getHealth = (actor: Actor): number => actor.strength * 2;

const getOffhandWeight = (offHand: Weapon | Shield) => {
    if ('damage' in offHand) return offHand.weight;
    if (offHand.durability > 0) return offHand.weight;
    return 0;
};

const getWeight = (actor: Actor) =>
    Math.max(0, (actor.armour.weight + actor.mainHand.weight + getOffhandWeight(actor.offHand)) - (actor.strength / 2));

const getInitiative = (actor: Actor, remainder: number): number => actor.intelligence - getWeight(actor) + (actor.dexterity / 4) + remainder;

const getRoll = () => Math.round(Math.random() * 100)

const getBluntEdgeArmourReduction = (armour: Armour): number => {
    switch (armour.material) {
        case ArmourType.none:
            return armour.value
        case ArmourType.padded:
            return armour.value
        case ArmourType.leather:
            return armour.value * 0.85
        case ArmourType.mail:
            return armour.value * 0.9
        case ArmourType.plate:
            return armour.value * 0.95
    }
};

const getPierceEdgeArmourReduction = (armour: Armour): number => {
    switch (armour.material) {
        case ArmourType.none:
            return armour.value
        case ArmourType.padded:
            return armour.value * 0.5
        case ArmourType.leather:
            return armour.value * 0.66
        case ArmourType.mail:
            return armour.value * 0.75
        case ArmourType.plate:
            return armour.value * 0.85
    }
};

// none, // armour reduction 0
// padded, // armour reduction effectiveness blunt: 100%, slash: 80%, pierce: 50%
// leather, // armour reduction effectiveness blunt: 85%, slash: 100%, pierce: 66%
// mail, // armour reduction effectiveness blunt: 90%, slash: 100%, pierce: 75%
// plate// armour reduction effectiveness blunt: 95%, slash: 100%, pierce: 85%

const getSlashEdgeArmourReduction = (armour: Armour): number => {
    switch (armour.material) {
        case ArmourType.none:
            return armour.value
        case ArmourType.padded:
            return armour.value * 0.75
        case ArmourType.leather:
            return armour.value
        case ArmourType.mail:
            return armour.value
        case ArmourType.plate:
            return armour.value
    }
};

const getArmourReduction = (armour: Armour, weapon: Weapon) => {
    switch (weapon.edge) {
        case EdgeType.blunt:
            return getBluntEdgeArmourReduction(armour);
        case EdgeType.pierce:
            return getPierceEdgeArmourReduction(armour);
        case EdgeType.slash:
            return getSlashEdgeArmourReduction(armour);
    }
}

const makeCombatant = (character: Character) => {
    const {attacks, attackRemainder} = getAttacks(character.actor);
    const health = getHealth(character.actor);
    const initiative = getInitiative(character.actor, attackRemainder);
    const weight = getWeight(character.actor);
    return {
        character,
        attacks,
        attackRemainder,
        weight,
        initiative,
        health,
        roundStats: makeRoundStats()
    };
}

const updateCombatant = (combatant: Combatant) => {
    const {attacks, attackRemainder} = getAttacks(combatant.character.actor, combatant.attackRemainder)
    combatant.attacks = attacks;
    combatant.attackRemainder = attackRemainder;
    combatant.initiative = getInitiative(combatant.character.actor, combatant.attackRemainder);
    combatant.weight = getWeight(combatant.character.actor);
}

const makeRoundStats = (): RoundStats => ({
    attacks: [],
    dodges: [],
    blocks: [],
    wounds: [],
    winner: null
});

const makeAttackStats = (
    chance: number,
    rolled: number,
    isSuccessful: boolean,
    baseChance: number,
    weightChanceReduction: number,
    hand: string
): AttackStats => ({
    baseChance,
    weightChanceReduction,
    chance,
    rolled,
    isSuccessful,
    hand
});

const makeDodgeStats = (
    chance: number,
    rolled: number,
    isSuccessful: boolean,
    baseChance: number,
    weightChanceReduction: number
): DodgeStats => ({
    baseChance,
    weightChanceReduction,
    chance,
    rolled,
    isSuccessful
});

const makeCriticalHitStats = (
    chance: number,
    rolled: number,
    isSuccessful: boolean
): CriticalHitStats => ({
    chance,
    rolled,
    isSuccessful
});

const makeBlockStats = (
    chance: number,
    rolled: number,
    damage: number,
    isSuccessful: boolean
): BlockStats => ({
    chance,
    rolled,
    damage,
    isSuccessful
});

const makeDamageStats = (
    damageCaused: number,
    againstArmourType: ArmourType,
    damageBlockedByArmour: number
): DamageStats => ({
    damageCaused,
    againstArmourType,
    damageBlockedByArmour
});

const makeWoundStats = (
    weapon: Weapon,
    armour: Armour,
    attackerStrength: number,
    isCriticalDamage: boolean,
    damageTaken: number,
    damageBlockedByArmour: number,
): WoundStats => ({
    weapon,
    armour,
    attackerStrength,
    isCriticalDamage,
    damageTaken,
    damageBlockedByArmour,
});

const getAttackHitChance = (attacker: Character, defender: Character) => {
    const dexHitChance = (attacker.actor.dexterity - defender.actor.dexterity) / 10;
    const intHitChance = (attacker.actor.intelligence - defender.actor.intelligence) / 10;
    return Math.round(50 - dexHitChance + intHitChance);
};

const getDodgeChance = (defender: Character, attacker: Character) => {
    const dexDodgeChance = (defender.actor.dexterity - attacker.actor.dexterity) / 10;
    const intDodgeChance = (defender.actor.intelligence - attacker.actor.intelligence) / 10;
    return Math.round(66 - dexDodgeChance + intDodgeChance);
};

const getCriticalHitChance = (attacker: Character, defender: Character) => 90 - ((attacker.actor.intelligence - defender.actor.intelligence) / 10);

const getDamage = (attacker: Combatant, defender: Combatant, weapon: Weapon) => {
    const criticalHitChance = getCriticalHitChance(attacker.character, defender.character);
    const criticalHitRoll = getRoll();
    const isCriticalHit = criticalHitRoll > criticalHitChance;
    let damage = getBaseDamage(attacker.character, weapon);
    damage += isCriticalHit ? damage / 2 : 0;
    damage = Math.round(damage);
    return {criticalHitChance, criticalHitRoll, isCriticalHit, damage}
}

const getDamageVariability = (baseDamage: number, attacker: Character) =>
    Math.random() * baseDamage / ("damage" in attacker.actor.offHand ? 4 : 5);

const getBaseDamage = (attacker: Character, weapon: Weapon) => {
    const strengthModifier = (attacker.actor.strength / 5) * ("damage" in attacker.actor.offHand ? 0.5 : 1);
    const baseDamage = weapon.damage + strengthModifier;
    return baseDamage - getDamageVariability(baseDamage, attacker);
}

const performAttack = (attacker: Combatant, defender: Combatant) => {
    const baseHitChance = getAttackHitChance(attacker.character, defender.character);
    const weightHitChanceReduction = getWeight(defender.character.actor) / 10;

    const hitRoll = getRoll();
    const hitChance = baseHitChance + weightHitChanceReduction;
    const isHit = hitRoll > hitChance;

    return {hitChance, baseHitChance, weightHitChanceReduction, hitRoll, isHit};
};

const attemptDodge = (defender: Combatant, attacker: Combatant) => {
    const baseDodgeChance = getDodgeChance(defender.character, attacker.character);
    const weightDodgeChanceReduction = getWeight(defender.character.actor) / 10;

    const dodgeRoll = getRoll();
    const dodgeChance = baseDodgeChance + weightDodgeChanceReduction;
    const isDodge = dodgeRoll > dodgeChance;

    return {dodgeChance, baseDodgeChance, weightDodgeChanceReduction, dodgeRoll, isDodge};
};

const getRoundAttackerDefender = (combatantOne: Combatant, combatantTwo: Combatant) =>
    combatantOne.initiative > combatantTwo.initiative
        ? [combatantOne, combatantTwo]
        : [combatantTwo, combatantOne];

function blockCheck(defender: Combatant) {
    const blockRoll = getRoll();
    const blockChance = "blockChance" in defender.character.actor.offHand
        ? 100 - defender.character.actor.offHand.blockChance
        : 0;
    return {blockRoll, blockChance};
}

function attack(attacker: Combatant, defender: Combatant, weapon: Weapon, hand: 'mainHand' | 'offHand') {
    const {hitChance, hitRoll, isHit, baseHitChance, weightHitChanceReduction} = performAttack(attacker, defender);
    console.log(`${attacker.character.name} attack roll: required ${hitChance}, rolled ${hitRoll}`);
    console.log(isHit ? 'Hit success' : 'Missed');
    const attackStats: AttackStats = makeAttackStats(hitChance, hitRoll, isHit, baseHitChance, weightHitChanceReduction, hand);
    const {dodgeChance, dodgeRoll, isDodge, baseDodgeChance, weightDodgeChanceReduction} = attemptDodge(defender, attacker);
    console.log(`${defender.character.name} dodge roll: required ${dodgeChance}, rolled ${dodgeRoll}`);
    console.log(isDodge ? 'Dodge success' : 'Dodge failure');
    attackStats.wasDodged = isDodge;
    const dodgeStats: DodgeStats = makeDodgeStats(dodgeChance, dodgeRoll, isDodge, baseDodgeChance, weightDodgeChanceReduction);
    if (isHit && !isDodge) {
        // Todo: apply armour reduction based on weapon/armour type
        const {criticalHitChance, criticalHitRoll, isCriticalHit, damage} = getDamage(attacker, defender, weapon);
        const armourReduction = getArmourReduction(defender.character.actor.armour, attacker.character.actor.mainHand);

        console.log(`${attacker.character.name} critical hit roll: required ${criticalHitChance}, rolled ${criticalHitRoll}`);
        console.log(isCriticalHit ? 'Critical hit success' : 'Critical hit failure');
        attackStats.criticalHitStats = makeCriticalHitStats(criticalHitChance, criticalHitRoll, isCriticalHit);

        let isBlock = false;

        if ('blockChance' in defender.character.actor.offHand && defender.character.actor.offHand.durability > 0) {
            const {blockRoll, blockChance} = blockCheck(defender);
            isBlock = blockRoll > blockChance;
            defender.character.actor.offHand.durability -= damage;
            console.log(`${defender.character.name} block roll: required ${blockChance}, rolled ${blockRoll}`);
            console.log(isBlock ? 'Block success' : 'Block failure');
            const blockStats = makeBlockStats(blockChance, blockRoll, damage, isBlock);
            defender.roundStats.blocks.push(blockStats);
        }

        if (!isBlock) {
            defender.health -= damage - armourReduction;
            console.log(`${attacker.character.name} dealt ${isCriticalHit ? 'critical damage' : 'damage'}: ${damage}`);
            console.log(`${defender.character.name} health: ${defender.health}`);
            attackStats.damageStats = makeDamageStats(damage, defender.character.actor.armour.material, armourReduction);
        }

        const woundStats = makeWoundStats(weapon, defender.character.actor.armour, attacker.character.actor.strength, isCriticalHit, damage, armourReduction);
        defender.roundStats.wounds.push(woundStats);
    }

    attacker.roundStats.attacks.push(attackStats);
    defender.roundStats.dodges.push(dodgeStats);
}

const battle = (characterOne: Character, characterTwo: Character) => {
    let combatantOne = makeCombatant(characterOne),
        combatantTwo = makeCombatant(characterTwo);
    let attacker, defender;
    [attacker, defender] = getRoundAttackerDefender(combatantOne, combatantTwo);
    let winner;
    let turn = 1;
    while (true) {
        console.log('---Attack Start---');
        // Todo: implement some form of action command chain
        console.log(`${attacker.character.name}\nattacks: ${attacker.attacks},\nremainder: ${attacker.attackRemainder}\ninitiative: ${attacker.initiative}\nweight: ${attacker.weight}\nhealth: ${attacker.health}`);
        console.log(`${defender.character.name}\nattacks: ${defender.attacks},\nremainder: ${defender.attackRemainder}\ninitiative: ${defender.initiative}\nweight: ${defender.weight}\nhealth: ${defender.health}`);
        console.log('.................');

        attacker.attacks--;
        const weapon = attacker.character.actor.mainHand;
        attack(attacker, defender, weapon, 'mainHand');
        if('damage' in attacker.character.actor.offHand) {
            attack(attacker, defender, weapon, 'offHand');
        }
        if (defender.health <= 0) {
            winner = attacker.character.name;
            attacker.character.wins += 1;
            attacker.character.experience += 200;
            defender.character.experience += 75;
            attacker.character.gold += 10;
            defender.character.gold += 5;
            defender.character.losses += 1;
            console.log(`${attacker.character.name} wins`);
            console.log(`${attacker.character.name} health: ${attacker.health}`);
            console.log(`${defender.character.name} health: ${defender.health}`);
            break;
        }

        // Todo: split attacks more evenly
        if (attacker.attacks < defender.attacks) {
            [attacker, defender] = [defender, attacker];
        }

        if (attacker.attacks === 0 && defender.attacks === 0) {
            console.log(`+++++Turn ${turn} End+++++`);
            turn++;
            updateCombatant(combatantOne);
            updateCombatant(combatantTwo);
            [attacker, defender] = getRoundAttackerDefender(combatantOne, combatantTwo);
        }
    }
    return [combatantOne, combatantTwo];
}

/**
 * Weapons
 */

const club: Weapon = {
    name: 'club',
    edge: EdgeType.blunt,
    damage: 8,
    weight: 6,
    price: 3
}

const dagger: Weapon = {
    name: 'dagger',
    edge: EdgeType.pierce,
    damage: 10,
    weight: 5,
    price: 8
}

const cudgel: Weapon = {
    name: 'cudgel',
    edge: EdgeType.blunt,
    damage: 28,
    weight: 16,
    price: 20
}

const hatchet: Weapon = {
    name: 'hatchet',
    edge: EdgeType.slash,
    damage: 25,
    weight: 12,
    price: 22
}

const shortSword: Weapon = {
    name: 'shortSword',
    edge: EdgeType.slash,
    damage: 35,
    weight: 14,
    price: 40
}

const sabre: Weapon = {
    name: 'sabre',
    edge: EdgeType.slash,
    damage: 40,
    weight: 22,
    price: 65
}

const axe: Weapon = {
    name: 'axe',
    edge: EdgeType.slash,
    damage: 50,
    weight: 28,
    price: 50
}

const broadSword: Weapon = {
    name: 'broadSword',
    edge: EdgeType.slash,
    damage: 58,
    weight: 36,
    price: 60
}

const shortSpear: Weapon = {
    name: 'shortSpear',
    edge: EdgeType.pierce,
    damage: 35,
    weight: 25,
    price: 40
}

const mace: Weapon = {
    name: 'mace',
    edge: EdgeType.blunt,
    damage: 60,
    weight: 27,
    price: 68
}

const flail: Weapon = {
    name: 'flail',
    edge: EdgeType.blunt,
    damage: 50,
    weight: 21,
    price: 60
}

const longSword: Weapon = {
    name: 'longSword',
    edge: EdgeType.blunt,
    damage: 62,
    weight: 22,
    price: 70
}

/**
 * Shields
 */

const buckler: Shield = {
    name: "buckler",
    blockChance: 15,
    durability: 500,
    weight: 6,
    price: 20,
}

const roundShield: Shield = {
    name: "roundShield",
    blockChance: 20,
    durability: 1000,
    weight: 20,
    price: 50,
}

const longShield: Shield = {
    name: "longShield",
    blockChance: 25,
    durability: 1500,
    weight: 30,
    price: 80,
}

/**
 * Armour
 */

const cloth: Armour = {
    name: 'cloth',
    value: 0,
    weight: 1,
    material: ArmourType.none,
    price: 0,
}

const quiltPadding: Armour = {
    name: 'quiltPadding',
    value: 2,
    weight: 3,
    material: ArmourType.padded,
    price: 10,
}

const leatherArmour: Armour = {
    name: 'leatherArmour',
    value: 4,
    weight: 7,
    material: ArmourType.leather,
    price: 17
}

const studdedLeatherArmour: Armour = {
    name: 'studdedLeatherArmour',
    value: 7,
    weight: 11,
    material: ArmourType.leather,
    price: 20
}

const mail: Armour = {
    name: 'mail',
    value: 10,
    weight: 20,
    material: ArmourType.mail,
    price: 30
}

const plate: Armour = {
    name: 'plate',
    value: 12,
    weight: 35,
    material: ArmourType.plate,
    price: 50
}

const actorOne: Actor = {
    intelligence: 30,
    strength: 50,
    dexterity: 70,
    mainHand: axe,
    offHand: buckler,
    armour: studdedLeatherArmour,
}

const actorTwo: Actor = {
    intelligence: 45,
    strength: 65,
    dexterity: 40,
    mainHand: hatchet,
    offHand: dagger,
    armour: quiltPadding,
}

const actorThree: Actor = {
    intelligence: 25,
    strength: 100,
    dexterity: 25,
    mainHand: longSword,
    offHand: dagger,
    armour: plate,
}

const actorFour: Actor = {
    intelligence: 100,
    strength: 25,
    dexterity: 25,
    mainHand: hatchet,
    offHand: dagger,
    armour: quiltPadding,
}

const actorFive: Actor = {
    intelligence: 25,
    strength: 25,
    dexterity: 100,
    mainHand: dagger,
    offHand: dagger,
    armour: quiltPadding,
}

const characterOne: Character = {
    name: 'one',
    actor: actorOne,
    experience: 0,
    gold: 0,
    wins: 0,
    losses: 0
}

const characterTwo: Character = {
    name: 'two',
    actor: actorTwo,
    experience: 0,
    gold: 0,
    wins: 0,
    losses: 0
}

const characterThree: Character = {
    name: 'three',
    actor: actorThree,
    experience: 0,
    gold: 0,
    wins: 0,
    losses: 0
}

const characterFour: Character = {
    name: 'four',
    actor: actorFour,
    experience: 0,
    gold: 0,
    wins: 0,
    losses: 0
}

const characterFive: Character = {
    name: 'five',
    actor: actorFive,
    experience: 0,
    gold: 0,
    wins: 0,
    losses: 0
}

const characters = [characterOne, characterTwo, characterThree, characterFour, characterFive]


const battleResults: BattleResults[] = [
    {
        character: characters[0],
        results: []
    },
    {
        character: characters[1],
        results: []
    }
];

for (let i = 0; i < 1000; i++) {
    const [combatantOne, combatantTwo] = battle(characterOne, characterTwo);

    console.log('\n####################\n');

    const getAttackRateStats = (combatant: Combatant): AttackRateStats => {
        const name = combatant.character.name;
        const count = combatant.roundStats.attacks.length;
        const successCount = combatant.roundStats.attacks.filter(a => a.isSuccessful).length;
        const successRate = Number((successCount / count).toFixed(3));
        const criticalHitSuccessCount = combatant.roundStats.attacks.filter(a => a.criticalHitStats?.isSuccessful).length;
        const criticalHitSuccessRate = Number((criticalHitSuccessCount / count).toFixed(3));
        const totalDamage = combatant.roundStats.attacks.reduce((total: number, a) => total += a.damageStats ? a.damageStats.damageCaused : 0, 0);
        const totalDamageGiven = combatant.roundStats.attacks.reduce((total: number, a) => total += a.damageStats ? a.damageStats.damageCaused - a.damageStats.damageBlockedByArmour : 0, 0);
        const averageDamage = Math.round(totalDamage / count);
        const averageDamageGiven = Math.round(totalDamageGiven / count);
        return {
            name,
            count,
            successCount,
            successRate,
            totalDamage,
            averageDamage,
            criticalHitSuccessCount,
            criticalHitSuccessRate,
            totalDamageGiven,
            averageDamageGiven
        };
    };

    const dodgeStats = (defender: Combatant): DodgeCheckStats => {
        const name = defender.character.name;
        const count = defender.roundStats.dodges.length;
        const successCount = defender.roundStats.dodges.filter(d => d.isSuccessful).length;
        const successRate = Number((successCount / count).toFixed(3));
        return {name, count, successCount, successRate}
    }

    const blockStats = (combatant: Combatant): BlockCheckStats => {
        const name = combatant.character.name;
        const count = combatant.roundStats.blocks.length;
        const successCount = combatant.roundStats.blocks.filter(b => b.isSuccessful).length;
        const successRate = Number((successCount / count).toFixed(3));
        return {name, count, successCount, successRate: !isNaN(successRate) ? successRate : 0}
    }

    const combatantOneStats: CombatantStats = {
        attackRateStats: getAttackRateStats(combatantOne),
        dodgeStats: dodgeStats(combatantOne),
        blockStats: blockStats(combatantOne)
    };

    const combatantTwoStats: CombatantStats = {
        attackRateStats: getAttackRateStats(combatantTwo),
        dodgeStats: dodgeStats(combatantTwo),
        blockStats: blockStats(combatantTwo)
    };

    battleResults[0].results.push(combatantOneStats);
    battleResults[1].results.push(combatantTwoStats);
}

const logCharacterStats = (character: Character | undefined) => {
    console.log('Wins: ', character?.wins);
    console.log('Losses: ', character?.losses);
    console.log('Exp: ', character?.experience);
    console.log('Gold: ', character?.gold);
};

console.log(`${capitalise(battleResults[0].character?.name)} vs ${capitalise(battleResults[1].character?.name)}`);
console.log('================\n');

function logResults(results: CombatantStats[]) {
    const totalDamage = results.reduce((count: number, r) => count += r.attackRateStats.totalDamage, 0);
    const totalDamageGiven = results.reduce((count: number, r) => count += r.attackRateStats.totalDamageGiven, 0);
    const totalAttacks = results.reduce((count: number, r) => count += r.attackRateStats.count, 0);
    const totalSuccessfulAttacks = results.reduce((count: number, r) => count += r.attackRateStats.successCount, 0);
    const totalCriticalHits = results.reduce((count: number, r) => count += r.attackRateStats.criticalHitSuccessCount, 0);
    console.log('Total Damage:', totalDamage);
    console.log('Total Damage Given:', totalDamageGiven);
    console.log('Total Attacks:', totalAttacks);
    console.log('Total Successful Attacks:', totalSuccessfulAttacks);
    console.log('Total Critical Hits:', totalCriticalHits);
    console.log('Average Damage:', Number((totalDamage / totalAttacks).toFixed(3)));
    console.log('Average Damage Given:', Number((totalDamageGiven / totalAttacks).toFixed(3)));
}

for (let i = 0; i < 2; i++) {
    console.log(`${capitalise(battleResults[i].character?.name)} Stats`);
    console.log('::::::::::::::::');
    logCharacterStats(battleResults[i].character);
    logResults(battleResults[i].results);
    console.log('\n~~~~~~~~~~~~~~~~\n');
}
