// --- Game Data ---
const allPartyMembers = [
    { name: "Brother Aldous", class: "Human Cleric", str: 10, dex: 10, int: 16, hp: 18, maxHp: 18, icon: "⛪", portraitUrl: "images/mhum1.png", level: 0, availableStatPoints: 0, knownSkills: [], activeSkills: [] },
    { name: "Sister Mira", class: "Elf Ranger", str: 12, dex: 16, int: 12, hp: 20, maxHp: 20, icon: "🏹", portraitUrl: "images/felf1.png", level: 0, availableStatPoints: 0, knownSkills: [], activeSkills: [] },
    { name: "Durgan", class: "Dwarf Fighter", str: 16, dex: 10, int: 8, hp: 24, maxHp: 24, icon: "🛡️", portraitUrl: "images/mdwrf1.png", level: 0, availableStatPoints: 0, knownSkills: [], activeSkills: [] },
    { name: "Tikka", class: "Halfling Rogue", str: 9, dex: 18, int: 13, hp: 16, maxHp: 16, icon: "🗡️", portraitUrl: "images/mhlf1.png", level: 0, availableStatPoints: 0, knownSkills: [], activeSkills: [] },
    { name: "Eldra", class: "Half-Elf Sorcerer", str: 8, dex: 12, int: 18, hp: 15, maxHp: 15, icon: "✨", portraitUrl: "images/fhelf1.png", level: 0, availableStatPoints: 0, knownSkills: [], activeSkills: [] }
];

let player = null;
let party = [];
let availableMembers = [...allPartyMembers];
let dayCount = 1;
let currentArea = "The Starting Point"; // NEW: Track current named area
let currentAreaWeather = "Clear skies"; // NEW: Store current weather for display
let currentAreaEncounter = "Peaceful surroundings"; // NEW: Store current encounter for display
let lastCheckpoint = null;
let gold = 10;
let inventory = [
    { name: "Health Potion", quantity: 2, icon: "🧪" },
    { name: "Torch", quantity: 1, icon: "🕯️" },
    { name: "Rope", quantity: 1, icon: "🔗" }
];

// --- MODIFIED: Shop Items now more detailed ---
const shopItems = [
    { name: "Health Potion", cost: 10, sellPrice: 5, description: "Restores 10 HP.", icon: "🧪" },
    { name: "Iron Sword", cost: 50, sellPrice: 25, description: "A basic but reliable sword. (+2 STR)", icon: "⚔️", statBonus: { str: 2 } },
    { name: "Leather Armor", cost: 40, sellPrice: 20, description: "Provides decent protection. (+5 Max HP)", icon: "🪖", statBonus: { maxHp: 5 } },
    { name: "Healing Salve", cost: 15, sellPrice: 7, description: "Restores 5 HP to all party members.", icon: "🩹" },
    { name: "Map of Whispering Woods", cost: 20, sellPrice: 10, description: "Helps navigate the Whispering Woods.", icon: "🗺️" }
];

// --- DOM Elements ---
const storyDiv = document.getElementById('story');
const optionsDiv = document.getElementById('options');
const diceDiv = document.getElementById('dice');
const charSheetDiv = document.getElementById('character-sheet');
const goldAmountSpan = document.getElementById('gold-amount');
const inventoryList = document.getElementById('inventory-list');
const partyManagementDiv = document.getElementById('party-members');
const availableMembersDiv = document.getElementById('available-members');
const restButton = document.getElementById('rest-button');
const mapButton = document.getElementById('map-button');
const mapDisplay = document.getElementById('map-display'); // Small map display in sidebar
const fullscreenMapOverlay = document.getElementById('fullscreen-map-overlay'); // Fullscreen map overlay

// New DOM elements for start screen and game wrapper
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const startGameButton = document.getElementById('startGameButton');
// --- NEW DOM ELEMENT: Shop Display ---
const shopDisplay = document.getElementById('shop-display');

// NEW DOM elements for day/area display
const dayCountDisplay = document.getElementById('day-count-display');
const currentAreaDisplay = document.getElementById('current-area-display');
const currentWeatherDisplay = document.getElementById('current-weather-display');
const currentEncounterDisplay = document.getElementById('current-encounter-display');

// NEW DOM elements for music control
const backgroundMusic = document.getElementById('background-music');
const musicToggleButton = document.getElementById('music-toggle-button');

// NEW DOM element for story image
const storyImage = document.getElementById('story-image');

// NEW DOM element for skill selection
const skillSelectionDiv = document.getElementById('skill-selection-content');


// --- Utility Functions ---
function updateSidebar() {
    goldAmountSpan.textContent = gold;
    inventoryList.innerHTML = inventory.map(item => `
        <li>
            <span class="inventory-item">
                <span class="icon">${item.icon || '❓'}</span> ${item.name} (x${item.quantity})
            </span>
            <button onclick="useItem('${item.name}')">Use</button>
            <button onclick="sellItem('${item.name}')" style="margin-left: 5px;">Sell (${item.sellPrice || Math.floor(item.cost / 2)}G)</button>
        </li>
    `).join('');
    renderPartyManagement();
    renderShop(); // Ensure shop is updated if visible

    // NEW: Update day/area/weather/encounter displays
    dayCountDisplay.textContent = dayCount;
    currentAreaDisplay.textContent = currentArea;
    currentWeatherDisplay.textContent = currentAreaWeather;
    currentEncounterDisplay.textContent = currentAreaEncounter; // FIX: Corrected this line
    renderSkillSelection(); // NEW: Update skill selection in sidebar
}

// --- NEW FEATURE: Use Item Logic ---
window.useItem = function(itemName) {
    const item = inventory.find(i => i.name === itemName);
    if (item && item.quantity > 0) {
        if (itemName === "Health Potion") {
            optionsDiv.innerHTML = `<div><b>Use Potion on:</b> ${
                party.map(member =>
                    `<button onclick="applyPotion('${member.name}')">${member.name}</button>`
                ).join(' ')
            }</div> <button onclick="cancelAction()">Cancel</button>`;

            window.applyPotion = function(memberName) {
                const member = party.find(m => m.name === memberName);
                if (member) {
                    member.hp = Math.min(member.maxHp, member.hp + 10);
                    item.quantity--;
                    if (item.quantity <= 0) { // Changed to <=0 for robustness
                        inventory = inventory.filter(i => i.name !== itemName);
                    }
                    updateSidebar();
                    renderCharacterSheet();
                    showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `${member.name} restored 10 HP. You now have ${item ? item.quantity : 0} ${itemName}(s) remaining.`); // MODIFIED: Added remaining quantity
                    optionsDiv.innerHTML = ''; // Clear action buttons
                }
            }

            window.cancelAction = function() {
                optionsDiv.innerHTML = '';
            }
        } else if (itemName === "Healing Salve") {
            party.forEach(member => {
                member.hp = Math.min(member.maxHp, member.hp + 5);
            });
            item.quantity--;
            if (item.quantity <= 0) {
                inventory = inventory.filter(i => i.name !== itemName);
            }
            updateSidebar();
            renderCharacterSheet();
            showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `All party members restored 5 HP from Healing Salve. You now have ${item ? item.quantity : 0} ${itemName}(s) remaining.`); // MODIFIED: Added remaining quantity
            optionsDiv.innerHTML = '';
        } else if (item.statBonus) {
            // Apply permanent stat bonus for equipment
            showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You equip the ${itemName}.`);
            if (item.statBonus.str) player.str += item.statBonus.str;
            if (item.statBonus.dex) player.dex += item.statBonus.dex;
            if (item.statBonus.int) player.int += item.statBonus.int;
            if (item.statBonus.maxHp) {
                player.maxHp += item.statBonus.maxHp;
                player.hp = player.maxHp; // Heal to full when equipping HP gear
            }
            inventory = inventory.filter(i => i.name !== itemName); // Item is equipped, remove from inventory
            updateSidebar();
            renderCharacterSheet();
            optionsDiv.innerHTML = '';
        } else {
            // For items that don't have a direct "use" action or specific target (e.g., Map)
            showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You used the ${itemName}. You now have ${item ? item.quantity : 0} ${itemName}(s) remaining.`); // MODIFIED: Added remaining quantity
            // If it's a consumable, decrement quantity:
            // item.quantity--;
            // if (item.quantity === 0) {
            //     inventory = inventory.filter(i => i.name !== itemName);
            // }
            updateSidebar();
            optionsDiv.innerHTML = '';
        }
    } else {
        showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You don't have any ${itemName} to use.`);
    }
}

function renderPartyManagement() {
    partyManagementDiv.innerHTML = party.map(member => `
        <div class="character">
            ${getPortrait(member)}
            <p>${member.name} (${member.class})</p>
            ${member.name !== player.name ? `<button onclick="removeFromParty('${member.name}')">Remove</button>` : ''}
        </div>
    `).join('');

    availableMembersDiv.innerHTML = availableMembers.map(member => `
        <div class="character">
            ${getPortrait(member)}
            <p>${member.name} (${member.class})</p>
            ${party.length < 4 ? `<button onclick="addToParty('${member.name}')">Add</button>` : ''}
        </div>
    `).join('');
}

function addToParty(memberName) {
    if (party.length < 4) {
        const memberToAdd = availableMembers.find(m => m.name === memberName);
        if (memberToAdd) {
            // Initialize new member's level, skills based on player's current level
            memberToAdd.level = player.level;
            memberToAdd.knownSkills = getSkillsForClassAndLevel(memberToAdd.class, memberToAdd.level);
            memberToAdd.activeSkills = memberToAdd.knownSkills.slice(0, 2); // Auto-equip first two skills

            party.push(memberToAdd);
            availableMembers = availableMembers.filter(m => m.name !== memberName);
            updateSidebar();
            renderCharacterSheet();
            showDialogue({name: "System", icon: "⚙️", portraitUrl: "images/narrator.png"}, `${memberToAdd.name} joined your party.`);
        }
    } else {
        showDialogue({name: "System", icon: "⚙️", portraitUrl: "images/narrator.png"}, "Your party is full!");
    }
}

function removeFromParty(memberName) {
    if (party.length > 1) { // Ensure player is not removed and at least one member remains
        const memberToRemove = party.find(m => m.name === memberName);
        if (memberToRemove && memberToRemove.name !== player.name) {
            availableMembers.push(memberToRemove);
            party = party.filter(m => m.name !== memberName);
            updateSidebar();
            renderCharacterSheet();
            showDialogue({name: "System", icon: "⚙️", portraitUrl: "images/narrator.png"}, `${memberToRemove.name} left your party.`);
        }
    } else {
        showDialogue({name: "System", icon: "⚙️", portraitUrl: "images/narrator.png"}, "You cannot remove your last party member!");
    }
}

function rest() {
    party.forEach(member => {
        member.hp = member.maxHp;
    });
    dayCount++; // A rest also advances the day
    showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You rest for the night. It is now Day ${dayCount}. All party members are fully healed.`);
    renderCharacterSheet();
    updateSidebar();
}

restButton.onclick = rest;

function showMap() {
    fullscreenMapOverlay.style.display = 'flex'; // Show the fullscreen map overlay
    mapDisplay.style.display = 'none'; // Hide the small map in the sidebar
}

function hideMap() {
    fullscreenMapOverlay.style.display = 'none'; // Hide the fullscreen map overlay
    mapDisplay.style.display = 'block'; // Show the small map in the sidebar again
}

mapButton.onclick = showMap;
fullscreenMapOverlay.onclick = hideMap; // Click anywhere on the overlay to close

function getPortrait(character) {
    if (character.portraitUrl) {
        return `<img class="portrait" src="${character.portraitUrl}" alt="${character.name}" style="width:4em;height:4em;border-radius:12px;margin-right:14px;object-fit:cover;background:#333;" />`;
    } else {
        return `<img class="portrait" src="images/placeholder.png" alt="portrait" style="width:4em;height:4em;border-radius:12px;margin-right:14px;object-fit:cover;background:#333;" />`;
    }
}

/**
 * Displays dialogue and optionally an image for a story event.
 * @param {object} speaker - The speaker object with name, icon, and portraitUrl.
 * @param {string} text - The dialogue text.
 * @param {string} [imageUrl] - Optional URL for an image to display with the dialogue.
 */
function showDialogue(speaker, text, imageUrl = null) {
    storyDiv.innerHTML = `
        <div class="chat-row" style="display:flex;align-items:flex-start;margin-bottom:10px;">
            <div style="flex-shrink:0;">${getPortrait(speaker)}</div>
            <div style="background:#222;padding:10px 16px;border-radius:12px;max-width:80%;color:#fff;">
                <b>${speaker.name}:</b> ${text}
            </div>
        </div>
    `;

    if (imageUrl) {
        storyImage.src = imageUrl;
        storyImage.style.display = 'block'; // Show the image
    } else {
        storyImage.style.display = 'none'; // Hide the image if no URL is provided
        storyImage.src = ''; // Clear previous image
    }
}

function getStoryPremise(name) {
    return `
You are ${name}, an orc outcast who has found faith in the light of the gods. Once feared as a marauder, you now walk the path of a paladin, seeking redemption and justice in a world that mistrusts your kind.
Your journey begins as you receive a vision: a village is threatened by a rising darkness, and only you can stand against it. Will you prove that even an orc can be a true champion of the light?
`;
}

function characterCreator() {
    // Clear any previous story image
    storyImage.style.display = 'none';
    storyImage.src = '';

    storyDiv.innerHTML = `<h2>Create Your Orc Paladin</h2>
        <label>Name: <input id="charName" maxlength="16" placeholder="Grushnak" /></label>
        <button id="rollStatsBtn">Roll Attributes</button>
        <div id="rolledStats"></div>
    `;
    optionsDiv.innerHTML = "";
    diceDiv.innerHTML = "";
    charSheetDiv.innerHTML = ""; // Clear character sheet during creation

    document.getElementById('rollStatsBtn').onclick = function () {
        function rollStat() {
            let rolls = [rollDice(6), rollDice(6), rollDice(6), rollDice(6)];
            rolls.sort((a, b) => a - b);
            return rolls[1] + rolls[2] + rolls[3];
        }
        const stats = {
            str: rollStat(),
            dex: rollStat(),
            con: rollStat(),
            int: rollStat(),
            wis: rollStat(),
            cha: rollStat()
        };
        const conMod = Math.floor((stats.con - 10) / 2);
        const hp = 10 + conMod;

        document.getElementById('rolledStats').innerHTML = `
            <p>
                <b>Strength:</b> ${stats.str} <br>
                <b>Dexterity:</b> ${stats.dex} <br>
                <b>Constitution:</b> ${stats.con} <br>
                <b>Intelligence:</b> ${stats.int} <br>
                <b>Wisdom:</b> ${stats.wis} <br>
                <b>Charisma:</b> ${stats.cha} <br>
                <b>Hit Points:</b> ${hp > 0 ? hp : 1}
            </p>
            <button id="confirmCharBtn">Confirm Character</button>
        `;
        document.getElementById('confirmCharBtn').onclick = function () {
            const name = document.getElementById('charName').value.trim() || "Grushnak";
            const finalHp = hp > 0 ? hp : 1; // Ensure HP is at least 1
            player = {
                name,
                class: "Paladin",
                str: stats.str,
                dex: stats.dex,
                con: stats.con,
                int: stats.int,
                wis: stats.wis,
                cha: stats.cha,
                hp: finalHp,
                maxHp: finalHp,
                icon: "🗡️",
                portraitUrl: "images/orc1.png",
                level: 0, // Starting level 0, will level up to 1 after Greenhollow
                availableStatPoints: 0,
                knownSkills: [],
                activeSkills: []
            };
            party = [player];
            renderCharacterSheet(); // Render sheet after player is created
            recruitParty(); // Proceed to party recruitment
            updateSidebar(); // Initialize sidebar with player and gold
        };
    };
}

function setCheckpoint(sectionFunc) {
    lastCheckpoint = sectionFunc;
}

function renderCharacterSheet() {
    if (player && player.hp < 0) player.hp = 0;
    charSheetDiv.innerHTML = `<h3>Party</h3>` + party.map(member => `
        <div class="character" style="display:flex;align-items:center;margin-bottom:10px;">
            <div style="flex-shrink:0;">
                ${getPortrait(member)}
            </div>
            <div>
                <strong>${member.name}</strong> (${member.class}) Lv.${member.level}<br>
                STR: ${member.str} | DEX: ${member.dex} | INT: ${member.int} | HP: <span class="hp-text ${member.hp <= member.maxHp / 4 ? 'low-hp' : ''}">${member.hp}</span>/${member.maxHp}
            </div>
        </div>
    `).join('');
    if (player && player.hp <= 0) {
        showDeathScreen();
    }
}


function showDeathScreen() {
    storyImage.style.display = 'none'; // Hide image on death screen
    storyImage.src = '';

    storyDiv.innerHTML = `<h2 style="color:#e74c3c;font-size:2em;text-align:center;">💀 You Died 💀</h2>
        <p style="text-align:center;">Your journey ends here... for now.</p>`;
    optionsDiv.innerHTML = `
        <button onclick="retryCheckpoint()">Retry Last Checkpoint</button>
        <button onclick="restartGame()">Restart From Beginning</button>
    `;
    diceDiv.innerHTML = "";
}

window.retryCheckpoint = function() {
    if (lastCheckpoint) {
        party.forEach(p => p.hp = p.maxHp);
        optionsDiv.innerHTML = "";
        lastCheckpoint();
        renderCharacterSheet();
    } else {
        restartGame();
    }
};

window.restartGame = function() {
    location.reload();
};

function rollDice(sides = 20) {
    return Math.floor(Math.random() * sides) + 1;
}

function askDiceRoll(promptText, callback) {
    diceDiv.innerHTML = `
        <p>${promptText}</p>
        <button onclick="doDiceRoll(${callback})">Roll d20</button>
    `;
    window.doDiceRoll = function(cb) {
        const result = rollDice();
        diceDiv.innerHTML = `<p>You rolled a <strong>${result}</strong>!</p>`;
        setTimeout(() => {
            diceDiv.innerHTML = '';
            cb(result);
        }, 1200);
    }.bind(null, callback);
}

function showOptions(options) {
    optionsDiv.innerHTML = options.map((opt, i) =>
        `<button onclick="chooseOption(${i})">${opt.text}</button>`
    ).join('');
    window.chooseOption = function(idx) {
        optionsDiv.innerHTML = '';
        const opt = options[idx];
        if (opt.diceCheck) {
            askDiceRoll(opt.diceCheck.prompt, (roll) => {
                if (roll >= opt.diceCheck.dc) {
                    opt.diceCheck.success();
                } else {
                    opt.diceCheck.fail();
                }
            }); // Added closing parenthesis for askDiceRoll
        } else {
            opt.action();
        }
    };
}

// --- NEW: Game Skills Definitions ---
const gameSkills = {
    // Paladin Skills
    "Sanctuary": {
        name: "Sanctuary",
        description: "Halves all incoming damage to the party for 3 turns.",
        class: "Paladin",
        level: 1,
        type: "buff_party",
        duration: 3, // Turns
        effect: (caster, partyCombatants, enemyCombatants, addLog) => {
            addLog(`✨ <b>${caster.name}</b> casts Sanctuary! Incoming damage to party is halved for 3 turns.`);
            partyCombatants.forEach(m => m.sanctuaryTurns = 3);
        }
    },
    "Holy Strike": {
        name: "Holy Strike",
        description: "Powerful attack that also heals the caster for 1d4 HP.",
        class: "Paladin",
        level: 2,
        type: "attack_heal",
        effect: (caster, target, addLog) => {
            let attackRoll = rollDice(20) + Math.floor((caster.str - 10) / 2);
            let targetAC = 10 + Math.floor(((target.dex || 10) - 10) / 2);
            if (attackRoll >= targetAC) {
                let dmg = rollDice(10) + Math.floor((caster.str - 10) / 2);
                target.currentHp -= dmg;
                let heal = rollDice(4);
                caster.currentHp = Math.min(caster.maxHp, caster.currentHp + heal);
                addLog(`⚔️✨ <b>${caster.name}</b> strikes <b>${target.name}</b> for <b>${dmg}</b> damage and heals for <b>${heal}</b> HP!`);
            } else {
                addLog(`❌ <b>${caster.name}</b> misses <b>${target.name}</b>.`);
            }
        }
    },
    "Aura of Courage": {
        name: "Aura of Courage",
        description: "Boosts party's attack rolls (+2) for 3 turns.",
        class: "Paladin",
        level: 3,
        type: "buff_party",
        duration: 3,
        effect: (caster, partyCombatants, enemyCombatants, addLog) => {
            addLog(`🛡️ <b>${caster.name}</b> emanates an Aura of Courage! Party attack rolls are boosted for 3 turns.`);
            partyCombatants.forEach(m => m.courageAuraTurns = 3);
        }
    },

    // Fighter Skills
    "Charge": {
        name: "Charge",
        description: "Next attack deals double damage.",
        class: "Fighter",
        level: 1,
        type: "buff_self",
        duration: 1, // Next attack
        effect: (caster, target, addLog) => {
            addLog(`💪 <b>${caster.name}</b> prepares to Charge!`);
            caster.chargeActive = true;
        }
    },
    "Whirlwind Attack": {
        name: "Whirlwind Attack",
        description: "Attack all enemies.",
        class: "Fighter",
        level: 2,
        type: "attack_aoe",
        effect: (caster, targets, addLog) => {
            targets.forEach(target => {
                let dmg = rollDice(6) + Math.floor((caster.str - 10) / 2);
                target.currentHp -= dmg;
                addLog(`🌀 <b>${caster.name}</b> unleashes a whirlwind attack on <b>${target.name}</b> for <b>${dmg}</b> damage.`);
            });
        }
    },
    "Execute": {
        name: "Execute",
        description: "Deals massive damage (2d12 + STR) to one enemy.",
        class: "Fighter",
        level: 3,
        type: "attack",
        effect: (caster, target, addLog) => {
            let dmg = rollDice(12) + rollDice(12) + Math.floor((caster.str - 10) / 2);
            target.currentHp -= dmg;
            addLog(`💀 <b>${caster.name}</b> executes <b>${target.name}</b> for <b>${dmg}</b> brutal damage!`);
        }
    },

    // Cleric Skills
    "Heal": {
        name: "Heal",
        description: "Restore 1d8+2 HP to an ally.",
        class: "Cleric",
        level: 1,
        type: "heal_single",
        targetSide: "party",
        effect: (caster, target, addLog) => {
            let heal = rollDice(8) + 2;
            target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
            addLog(`✨ <b>${caster.name}</b> heals <b>${target.name}</b> for <b>${heal}</b> HP.`);
        }
    },
    "Shield of Faith": {
        name: "Shield of Faith",
        description: "Grants +2 AC to an ally for 3 turns.",
        class: "Cleric",
        level: 2,
        type: "buff_single",
        targetSide: "party",
        duration: 3,
        effect: (caster, target, addLog) => {
            addLog(`🛡️ <b>${caster.name}</b> casts Shield of Faith on <b>${target.name}</b>!`);
            target.shieldOfFaithTurns = 3;
        }
    },
    "Mass Heal": {
        name: "Mass Heal",
        description: "Restore 1d6+1 HP to all party members.",
        class: "Cleric",
        level: 3,
        type: "heal_aoe",
        targetSide: "party",
        effect: (caster, partyCombatants, enemyCombatants, addLog) => {
            partyCombatants.forEach(m => {
                let heal = rollDice(6) + 1;
                m.currentHp = Math.min(m.maxHp, m.currentHp + heal);
                addLog(`✨ <b>${caster.name}</b> heals <b>${m.name}</b> for <b>${heal}</b> HP.`);
            });
            addLog(`✨ <b>${caster.name}</b> casts Mass Heal!`);
        }
    },

    // Ranger Skills
    "Arrow Shot": {
        name: "Arrow Shot",
        description: "Shoot an arrow for 1d8+DEX damage.",
        class: "Ranger",
        level: 1,
        type: "attack",
        effect: (caster, target, addLog) => {
            let dmg = rollDice(8) + Math.floor((caster.dex - 10) / 2);
            target.currentHp -= dmg;
            addLog(`🏹 <b>${caster.name}</b> shoots an arrow at <b>${target.name}</b> for <b>${dmg}</b> damage.`);
        }
    },
    "Volley": {
        name: "Volley",
        description: "Attack all enemies with arrows (1d4+DEX damage each).",
        class: "Ranger",
        level: 2,
        type: "attack_aoe",
        effect: (caster, targets, addLog) => {
            targets.forEach(target => {
                let dmg = rollDice(4) + Math.floor((caster.dex - 10) / 2);
                target.currentHp -= dmg;
                addLog(`🏹 <b>${caster.name}</b> fires a volley at <b>${target.name}</b> for <b>${dmg}</b> damage.`);
            });
        }
    },
    "Hunter's Mark": {
        name: "Hunter's Mark",
        description: "Marks an enemy, causing them to take +2 damage from all sources for 3 turns.",
        class: "Ranger",
        level: 3,
        type: "debuff_single",
        duration: 3,
        effect: (caster, target, addLog) => {
            addLog(`🎯 <b>${caster.name}</b> places Hunter's Mark on <b>${target.name}</b>!`);
            target.huntersMarkTurns = 3;
        }
    },

    // Rogue Skills
    "Sneak Attack": {
        name: "Sneak Attack",
        description: "Deal 1d8+3 damage. (Increased damage if target is debuffed/engaged by ally).",
        class: "Rogue",
        level: 1,
        type: "attack",
        effect: (caster, target, addLog) => {
            let dmg = rollDice(8) + 3;
            target.currentHp -= dmg;
            addLog(`🗡️ <b>${caster.name}</b> sneak attacks <b>${target.name}</b> for <b>${dmg}</b> damage!`);
        }
    },
    "Shadow Step": {
        name: "Shadow Step",
        description: "Become untargetable for 1 turn and deal bonus damage on next attack (consumes untargetable).",
        class: "Rogue",
        level: 2,
        type: "buff_self",
        duration: 1,
        effect: (caster, partyCombatants, enemyCombatants, addLog) => {
            addLog(`💨 <b>${caster.name}</b> vanishes into the shadows!`);
            caster.shadowStepActive = true;
        }
    },
    "Vanish": {
        name: "Vanish",
        description: "Become untargetable for 2 turns. (Cannot attack while vanished).",
        class: "Rogue",
        level: 3,
        type: "buff_self",
        duration: 2,
        effect: (caster, partyCombatants, enemyCombatants, addLog) => {
            addLog(`👻 <b>${caster.name}</b> completely vanishes from sight!`);
            caster.vanishTurns = 2;
        }
    },

    // Sorcerer Skills
    "Magic Missile": {
        name: "Magic Missile",
        description: "Launch three darts of force at one or more enemies (1d4+1 damage each).",
        class: "Sorcerer",
        level: 1,
        type: "attack_multi",
        effect: (caster, targets, addLog) => {
            let numDarts = 3;
            for (let i = 0; i < numDarts; i++) {
                let target = targets[Math.floor(Math.random() * targets.length)]; // Randomly pick target for each dart
                let dmg = rollDice(4) + 1;
                target.currentHp -= dmg;
                addLog(`✨ <b>${caster.name}</b> launches a magic missile at <b>${target.name}</b> for <b>${dmg}</b> force damage.`);
            }
        }
    },
    "Fireball": {
        name: "Fireball",
        description: "Deal 2d6 fire damage to an enemy.",
        class: "Sorcerer",
        level: 2,
        type: "attack",
        effect: (caster, target, addLog) => {
            let dmg = rollDice(6) + rollDice(6);
            target.currentHp -= dmg;
            addLog(`🔥 <b>${caster.name}</b> casts Fireball on <b>${target.name}</b> for <b>${dmg}</b> damage!`);
        }
    },
    "Chain Lightning": {
        name: "Chain Lightning",
        description: "Strikes multiple enemies with lightning (1d8+INT damage each).",
        class: "Sorcerer",
        level: 3,
        type: "attack_aoe",
        effect: (caster, targets, addLog) => {
            targets.forEach(target => {
                let dmg = rollDice(8) + Math.floor((caster.int - 10) / 2);
                target.currentHp -= dmg;
                addLog(`⚡ <b>${caster.name}</b> strikes <b>${target.name}</b> with lightning for <b>${dmg}</b> damage.`);
            });
        }
    },

    // Warlock (Enemy) Skills
    "Dark Bolt": {
        name: "Dark Bolt",
        description: "Deal 1d10 necrotic damage.",
        class: "Warlock",
        level: 1, // Monsters don't level up, but skills are tied to a level for consistency
        type: "attack",
        effect: (caster, target, addLog) => {
            let dmg = rollDice(10);
            target.currentHp -= dmg;
            addLog(`💀 <b>${caster.name}</b> casts Dark Bolt on <b>${target.name}</b> for <b>${dmg}</b> damage!`);
        }
    },
    "Shadow Bind": {
        name: "Shadow Bind",
        description: "Binds a target, reducing their DEX by 2 for 2 turns.",
        class: "Warlock",
        level: 2,
        type: "debuff_single",
        duration: 2,
        effect: (caster, target, addLog) => {
            addLog(`🕸️ <b>${caster.name}</b> binds <b>${target.name}</b> with shadows!`);
            target.shadowBindTurns = 2;
        }
    }
};

// Helper to get skills for a specific class and level
function getSkillsForClassAndLevel(charClass, charLevel) {
    return Object.values(gameSkills).filter(skill =>
        skill.class === charClass && skill.level <= charLevel
    );
}

// --- MODIFIED: Combat Rewards and Gold/Item Handling ---
function partyCombat(enemyGroup, nextScene) {
    // Hide story image during combat
    storyImage.style.display = 'none';
    storyImage.src = '';

    let combatLog = [];
    let turnOrder = [];
    let turnIndex = 0;
    let inCombat = true;
    let goldGained = 0; // Track gold gained in this combat
    let itemsFound = []; // Track items found in this combat

    const partyCombatants = party.map((m, i) => ({
        ...m,
        side: "party",
        idx: i,
        currentHp: m.hp,
        isAlive: function() { return this.currentHp > 0; },
        // Combat-specific temporary states
        sanctuaryTurns: 0,
        chargeActive: false,
        shieldOfFaithTurns: 0,
        courageAuraTurns: 0,
        huntersMarkTurns: 0,
        shadowStepActive: false,
        vanishTurns: 0,
        // For enemies
        shadowBindTurns: 0
    }));
    const enemyCombatants = enemyGroup.enemies.map((e, i) => ({
        ...e,
        side: "enemy",
        idx: i,
        currentHp: e.hp,
        maxHp: e.hp,
        isAlive: function() { return this.currentHp > 0; },
        // Combat-specific temporary states
        sanctuaryTurns: 0,
        chargeActive: false,
        shieldOfFaithTurns: 0,
        courageAuraTurns: 0,
        huntersMarkTurns: 0,
        shadowStepActive: false,
        vanishTurns: 0,
        // For enemies
        shadowBindTurns: 0
    }));

    function rollInitiativeGroup(combatants) {
        return rollDice(20) + Math.max(...combatants.map(c => Math.floor((c.dex || 10) / 2)));
    }
    let partyInit, enemyInit;
    do {
        partyInit = rollInitiativeGroup(partyCombatants);
        enemyInit = rollInitiativeGroup(enemyCombatants);
    } while (partyInit === enemyInit);

    let allCombatants = [...partyCombatants, ...enemyCombatants];
    allCombatants.forEach(c => {
        let dexMod = Math.floor((c.dex || 10) / 2);
        // Apply Aura of Courage bonus if active
        if (c.side === "party" && c.courageAuraTurns > 0) {
            dexMod += 2; // Courage Aura adds to attack rolls, not initiative, but we can simulate it here for simplicity
        }
        c.initiative = rollDice(20) + dexMod;
    });
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    if (enemyInit > partyInit) {
        allCombatants.sort((a, b) => {
            if (b.initiative === a.initiative) {
                return a.side === "enemy" ? -1 : 1;
            }
            return b.initiative - a.initiative;
        });
    } else {
        allCombatants.sort((a, b) => {
            if (b.initiative === a.initiative) {
                return a.side === "party" ? -1 : 1;
            }
            return b.initiative - a.initiative;
        });
    }
    turnOrder = allCombatants;

    function addLog(html) {
        combatLog.push(html);
        if (combatLog.length > 10) combatLog.shift();
    }

    function renderCombat() {
        let partyStatus = partyCombatants.map(m => `
            <div class="character" style="display:flex;align-items:center;margin-bottom:6px;">
                ${getPortrait(m)}
                <div>
                    <strong>${m.name}</strong> (${m.class}) Lv.${m.level}<br>
                    HP: <span class="hp-text ${m.currentHp <= m.maxHp / 4 ? 'low-hp' : ''}">${Math.max(0, m.currentHp)}</span> / ${m.maxHp}
                    ${m.sanctuaryTurns > 0 ? ' <span style="color:#8af;">(Sanctuary: ' + m.sanctuaryTurns + 't)</span>' : ''}
                    ${m.chargeActive ? ' <span style="color:#f88;">(Charging)</span>' : ''}
                    ${m.shieldOfFaithTurns > 0 ? ' <span style="color:#8af;">(Shielded: ' + m.shieldOfFaithTurns + 't)</span>' : ''}
                    ${m.courageAuraTurns > 0 ? ' <span style="color:#8f8;">(Courage: ' + m.courageAuraTurns + 't)</span>' : ''}
                    ${m.shadowStepActive ? ' <span style="color:#aaa;">(Shadow Step)</span>' : ''}
                    ${m.vanishTurns > 0 ? ' <span style="color:#aaa;">(Vanished: ' + m.vanishTurns + 't)</span>' : ''}
                </div>
            </div>
        `).join('');
        let enemyStatus = enemyCombatants.map(e => `
            <div class="character" style="display:flex;align-items:center;margin-bottom:6px;">
                ${getPortrait(e)}
                <div>
                    <strong>${e.name}</strong> (${e.class || "Monster"})<br>
                    HP: <span class="hp-text ${e.currentHp <= e.maxHp / 4 ? 'low-hp' : ''}">${Math.max(0, e.currentHp)}</span> / ${e.maxHp}
                    ${e.huntersMarkTurns > 0 ? ' <span style="color:#f88;">(Marked: ' + e.huntersMarkTurns + 't)</span>' : ''}
                    ${e.shadowBindTurns > 0 ? ' <span style="color:#f88;">(Bound: ' + e.shadowBindTurns + 't)</span>' : ''}
                </div>
            </div>
        `).join('');
        let logHtml = combatLog.map(l => `<div>${l}</div>`).join('');
        storyDiv.innerHTML = `
            <h2>⚔️ Combat Encounter</h2>
            <p>${enemyGroup.desc}</p>
            <div style="display:flex;gap:30px;flex-wrap:wrap;">
                <div style="min-width:220px;"><b>Your Party</b>${partyStatus}</div>
                <div style="min-width:220px;"><b>Enemies</b>${enemyStatus}</div>
            </div>
            <div style="margin-top:12px;max-height:120px;overflow:auto;background:#111;padding:8px;border-radius:6px;">
                ${logHtml}
            </div>
        `;
    }

    function getAlive(side) {
        return (side === "party" ? partyCombatants : enemyCombatants).filter(c => c.currentHp > 0);
    }

    function checkCombatEnd() {
        if (getAlive("party").length === 0) {
            addLog(`<b style="color:#e74c3c;">Combat lost</b>`);
            renderCombat();
            setTimeout(() => {
                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "Combat lost");
                optionsDiv.innerHTML = "";
                setTimeout(showDeathScreen, 1200);
            }, 1200);
            inCombat = false;
            return true;
        }
        if (getAlive("enemy").length === 0) {
            addLog(`<b style="color:#2ecc40;">Combat won</b>`);
            // --- MODIFIED: Combat Rewards ---
            const currentGoldReward = enemyGroup.goldReward || (rollDice(10) + 5);
            gold += currentGoldReward;
            goldGained += currentGoldReward;
            addLog(`You are rewarded with ${currentGoldReward} gold.`);

            if (enemyGroup.itemReward) {
                addItemToInventory(enemyGroup.itemReward.name, enemyGroup.itemReward.quantity, enemyGroup.itemReward.icon);
                itemsFound.push(enemyGroup.itemReward);
                addLog(`You found a ${enemyGroup.itemReward.name}!`);
            } else {
                const potionChance = rollDice(4);
                if (potionChance === 4) {
                    addItemToInventory("Health Potion", 1, "🧪");
                    itemsFound.push({ name: "Health Potion", quantity: 1, icon: "🧪" });
                    addLog(`You found a Health Potion!`);
                }
            }
            // --- END MODIFIED: Combat Rewards ---

            // --- FIX: Update original party members' HP from combat results ---
            partyCombatants.forEach(combatant => {
                if (combatant.side === 'party') {
                    const originalMember = party.find(p => p.name === combatant.name);
                    if (originalMember) {
                        originalMember.hp = combatant.currentHp > 0 ? combatant.currentHp : 0;
                    }
                }
            });

            updateSidebar();
            renderCharacterSheet();
            renderCombat();

            setTimeout(() => {
                let rewardsSummary = `Combat won! You gained ${goldGained} gold.`;
                if (itemsFound.length > 0) {
                    rewardsSummary += ` You also found: ${itemsFound.map(item => `${item.quantity} ${item.name}`).join(', ')}.`;
                }
                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, rewardsSummary); // MODIFIED: Added detailed reward message
                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                document.getElementById('combatContinueBtn').onclick = () => {
                    optionsDiv.innerHTML = "";
                    if (enemyGroup.onDefeat) enemyGroup.onDefeat();
                    if (typeof nextScene === "function") nextScene();
                };
            }, 1200);
            inCombat = false;
            return true;
        }
        return false;
    }

    function applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants) {
        // This function will execute the skill's effect
        if (skill.type === "attack" || skill.type === "attack_aoe" || skill.type === "attack_multi" || skill.type === "attack_heal") {
            // Check for Charge effect before applying skill damage
            let damageMultiplier = 1;
            if (caster.chargeActive) {
                damageMultiplier = 2;
                caster.chargeActive = false; // Consume charge
                addLog(`💥 <b>${caster.name}</b>'s Charge doubles the damage!`);
            }
            // Apply Hunter's Mark bonus if target is marked
            if (target && target.huntersMarkTurns > 0) {
                addLog(`🎯 <b>${target.name}</b> takes extra damage from Hunter's Mark!`);
                target.currentHp -= 2; // Apply flat +2 damage
            }

            // Apply skill effect
            skill.effect(caster, target, addLog, partyCombatants, enemyCombatants, damageMultiplier);

        } else if (skill.type === "buff_party" || skill.type === "buff_self" || skill.type === "buff_single" || skill.type === "heal_single" || skill.type === "heal_aoe" || skill.type === "debuff_single") {
            skill.effect(caster, target, addLog, partyCombatants, enemyCombatants);
        }
    }

    function getAvailableActions(combatant) {
        let actions = [];
        // Basic attack is always available
        actions.push({
            name: "Attack",
            desc: "Attack a foe with your weapon.",
            type: "attack",
            effect: (caster, target, addLog, partyCombatants, enemyCombatants, damageMultiplier = 1) => {
                let attackRoll = rollDice(20) + Math.floor((caster.str - 10) / 2);
                let targetAC = 10 + Math.floor(((target.dex || 10) - 10) / 2);
                if (target.shieldOfFaithTurns > 0) { // Shield of Faith AC bonus
                    targetAC += 2;
                }
                // Apply Aura of Courage bonus to attack roll
                if (caster.courageAuraTurns > 0) {
                    attackRoll += 2;
                }

                if (attackRoll - Math.floor((caster.str - 10) / 2) === 20) { // Natural 20
                    let dmg = (rollDice(8) + Math.floor((caster.str - 10) / 2) + 2) * damageMultiplier;
                    target.currentHp -= dmg;
                    addLog(`💥 <b>${caster.name}</b> (CRIT) hits <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                } else if (attackRoll >= targetAC) {
                    let dmg = (rollDice(8) + Math.floor((caster.str - 10) / 2)) * damageMultiplier;
                    target.currentHp -= dmg;
                    addLog(`🗡️ <b>${caster.name}</b> hits <b>${target.name}</b> for <b>${dmg}</b> damage.`);
                } else {
                    addLog(`❌ <b>${caster.name}</b> misses <b>${target.name}</b>.`);
                }
            }
        });

        // Add active skills if it's a party member
        if (combatant.side === "party") {
            combatant.activeSkills.forEach(skillName => {
                const skill = gameSkills[skillName];
                if (skill) {
                    actions.push({
                        name: skill.name,
                        desc: skill.description,
                        type: skill.type,
                        targetSide: skill.targetSide, // For targeting UI
                        effect: (caster, target, addLog) => applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants)
                    });
                }
            });
        } else { // For enemies, use their known skills directly
            combatant.knownSkills.forEach(skillName => {
                const skill = gameSkills[skillName];
                if (skill) {
                    actions.push({
                        name: skill.name,
                        desc: skill.description,
                        type: skill.type,
                        targetSide: skill.targetSide,
                        effect: (caster, target, addLog) => applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants)
                    });
                }
            });
        }
        return actions;
    }

    function nextTurn() {
        if (!inCombat) return;

        // Apply end-of-turn effects and decrement durations
        allCombatants.forEach(c => {
            if (c.sanctuaryTurns > 0) c.sanctuaryTurns--;
            if (c.shieldOfFaithTurns > 0) c.shieldOfFaithTurns--;
            if (c.courageAuraTurns > 0) c.courageAuraTurns--;
            if (c.huntersMarkTurns > 0) c.huntersMarkTurns--;
            if (c.shadowBindTurns > 0) c.shadowBindTurns--;
            if (c.vanishTurns > 0) {
                c.vanishTurns--;
                if (c.vanishTurns === 0) {
                    addLog(`✨ <b>${c.name}</b> emerges from Vanish.`);
                }
            }
            if (c.shadowStepActive) { // Shadow step is consumed on next attack or end of turn if no attack
                c.shadowStepActive = false;
            }
        });

        while (turnIndex < turnOrder.length && turnOrder[turnIndex].currentHp <= 0) {
            turnIndex++;
        }
        if (turnIndex >= turnOrder.length) {
            turnIndex = 0;
            turnOrder = turnOrder.filter(c => c.currentHp > 0);
            turnOrder.sort((a, b) => b.initiative - a.initiative);
            if (checkCombatEnd()) return;
        }
        const current = turnOrder[turnIndex];
        renderCombat();

        // Check if character is vanished and cannot attack
        if (current.vanishTurns > 0 && current.side === "party") {
            addLog(`👻 <b>${current.name}</b> is Vanished and cannot act this turn.`);
            turnIndex++;
            setTimeout(nextTurn, 800);
            return;
        }

        if (current.side === "party" && current.currentHp > 0) {
            addLog(`<b style="color:#fff;">${current.name}'s turn!</b>`);
            renderCombat();
            let actions = getAvailableActions(current);
            let actionButtons = actions.map((action, i) =>
                `<button onclick="chooseCombatAction(${i})">${action.name}</button>`
            ).join(' ');
            optionsDiv.innerHTML = `<div><b>Choose action:</b> ${actionButtons}</div>`;

            window.chooseCombatAction = function(actionIdx) {
                optionsDiv.innerHTML = "";
                let action = actions[actionIdx];
                let targets = [];

                if (action.targetSide === "party") {
                    targets = getAlive("party");
                } else if (action.targetSide === "enemy") {
                    targets = getAlive("enemy");
                } else { // Default targeting
                    targets = current.side === "party" ? getAlive("enemy") : getAlive("party");
                }

                if (action.type === "attack_aoe" || action.type === "attack_multi" || action.type === "heal_aoe") {
                    // AOE/Multi-target skills don't need specific target selection UI
                    action.effect(current, targets, addLog); // Pass all relevant targets
                    if (checkCombatEnd()) return;
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                }
                else if (targets.length === 1) {
                    action.effect(current, targets[0], addLog);
                    if (checkCombatEnd()) return;
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                } else {
                    optionsDiv.innerHTML = `<div><b>Choose target:</b> ${
                        targets.map((t, j) =>
                            `<button onclick="doCombatAction(${actionIdx},${j})">${t.name}</button>`
                        ).join(' ')
                    }</div>`;
                    window.doCombatAction = function(aIdx, tIdx) {
                        optionsDiv.innerHTML = "";
                        actions[aIdx].effect(current, targets[tIdx], addLog);
                        if (checkCombatEnd()) return;
                        turnIndex++;
                        setTimeout(nextTurn, 800);
                    };
                }
            };
        }
        else if (current.side === "enemy" && current.currentHp > 0) {
            // Check if enemy is vanished (e.g., if a rogue used Vanish on them)
            if (current.vanishTurns > 0) {
                addLog(`👻 <b>${current.name}</b> is Vanished and cannot act this turn.`);
                turnIndex++;
                setTimeout(nextTurn, 800);
                return;
            }

            // Shield effect for Fighter: nullifies next enemy attack
            let shieldedMember = partyCombatants.find(m => m.shielded);
            if (shieldedMember) {
                addLog(`🛡️ <b>${shieldedMember.name}</b>'s Shield nullifies the enemy attack!`);
                shieldedMember.shielded = false;
                turnIndex++;
                setTimeout(nextTurn, 800);
                return;
            }
            addLog(`<b style="color:#fff;">${current.name}'s turn!</b>`);
            renderCombat();
            let actions = getAvailableActions(current);
            let action = actions[Math.floor(Math.random() * actions.length)]; // Enemy picks a random action
            let targets = [];

            if (action.targetSide === "enemy") {
                targets = getAlive("enemy");
            } else if (action.targetSide === "party") {
                targets = getAlive("party");
            } else { // Default targeting for enemies is party
                targets = getAlive("party");
            }

            // Filter out untargetable party members (e.g., from Shadow Step)
            if (action.type === "attack" || action.type === "attack_aoe" || action.type === "attack_multi") {
                targets = targets.filter(t => !t.shadowStepActive);
                if (targets.length === 0) { // No valid targets, enemy skips turn
                    addLog(`<b>${current.name}</b> has no valid targets and skips its turn.`);
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                    return;
                }
            }


            let target = targets[Math.floor(Math.random() * targets.length)]; // Enemy picks a random target
            setTimeout(() => {
                applySkillEffect(action, current, target, addLog, partyCombatants, enemyCombatants);
                if (checkCombatEnd()) return;
                turnIndex++;
                setTimeout(nextTurn, 800);
            }, 800);
        }
        else {
            turnIndex++;
            setTimeout(nextTurn, 100);
        }
    }

    addLog(`<i>Party initiative: ${partyInit}, Enemy initiative: ${enemyInit}</i>`);
    addLog(`<i>Initiative order: ${turnOrder.map(c => c.name).join(", ")}</i>`);
    renderCombat();
    setTimeout(nextTurn, 1200);
}

// --- NEW: Level Up System Functions ---
function levelUpParty(nextSceneCallback) {
    // Clear story image during level up
    storyImage.style.display = 'none';
    storyImage.src = '';

    player.level++;
    player.availableStatPoints += 3; // Award 3 stat points to player

    showDialogue({ name: "System", icon: "✨", portraitUrl: "images/narrator.png" }, `
        <h2 style="color:#2ecc40;text-align:center;">🎉 Congratulations! 🎉</h2>
        <p style="text-align:center;font-size:1.2em;">Your party has reached Level ${player.level}!</p>
        <p style="text-align:center;">Click 'Continue' to distribute stat points and learn new skills.</p>
    `);
    optionsDiv.innerHTML = `<button onclick="proceedToLevelUpScreen('${nextSceneCallback.name}')">Continue</button>`;
}

window.proceedToLevelUpScreen = function(nextSceneName) {
    const nextSceneCallback = window[nextSceneName]; // Get function reference from its name

    let levelUpHtml = `
        <h2 style="color:#2ecc40;text-align:center;">Level Up! (Level ${player.level})</h2>
        <p>Distribute ${player.availableStatPoints} stat points for ${player.name}:</p>
        <div id="stat-distribution" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Strength (STR): ${player.str}</span>
                <button onclick="addStatPoint('str')">+</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Dexterity (DEX): ${player.dex}</span>
                <button onclick="addStatPoint('dex')">+</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Intelligence (INT): ${player.int}</span>
                <button onclick="addStatPoint('int')">+</button>
            </div>
        </div>
        <p>Each party member gains 1d8 HP!</p>
        <div id="hp-roll-results"></div>
        <p>New skills learned by your party:</p>
        <ul id="new-skills-list"></ul>
        <button id="confirmLevelUpBtn" onclick="confirmLevelUp('${nextSceneName}')">Confirm Level Up</button>
    `;
    storyDiv.innerHTML = levelUpHtml;
    optionsDiv.innerHTML = ''; // Clear options during level up

    // Roll HP for all party members
    let hpRollResults = '';
    party.forEach(member => {
        const hpGain = rollDice(8);
        member.maxHp += hpGain;
        member.hp = member.maxHp; // Heal to full on level up
        hpRollResults += `<p>${member.name} gained ${hpGain} HP! (New Max HP: ${member.maxHp})</p>`;
    });
    document.getElementById('hp-roll-results').innerHTML = hpRollResults;

    // Discover new skills for each party member
    let newSkillsHtml = '';
    party.forEach(member => {
        const newlyLearnedSkills = Object.values(gameSkills).filter(skill =>
            skill.class === member.class && skill.level === member.level && !member.knownSkills.includes(skill.name)
        );
        if (newlyLearnedSkills.length > 0) {
            newSkillsHtml += `<li><b>${member.name} (${member.class}):</b>`;
            newlyLearnedSkills.forEach(skill => {
                member.knownSkills.push(skill.name);
                newSkillsHtml += ` <i>${skill.name}</i> (${skill.description})`;
            });
            newSkillsHtml += `</li>`;
        }
    });
    document.getElementById('new-skills-list').innerHTML = newSkillsHtml || '<li>No new skills this level.</li>';

    renderCharacterSheet(); // Update character sheet with new HP
    updateSidebar(); // Update sidebar to reflect level and new skill options
};

window.addStatPoint = function(stat) {
    if (player.availableStatPoints > 0) {
        player[stat]++;
        player.availableStatPoints--;
        // Re-render the stat distribution section
        document.getElementById('stat-distribution').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Strength (STR): ${player.str}</span>
                <button onclick="addStatPoint('str')">+</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Dexterity (DEX): ${player.dex}</span>
                <button onclick="addStatPoint('dex')">+</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Intelligence (INT): ${player.int}</span>
                <button onclick="addStatPoint('int')">+</button>
            </div>
        `;
        renderCharacterSheet(); // Update char sheet to show new stats
    }
    // Disable button if no points left
    if (player.availableStatPoints === 0) {
        document.querySelectorAll('#stat-distribution button').forEach(btn => btn.disabled = true);
    }
};

window.confirmLevelUp = function(nextSceneName) {
    // Ensure all stat points are distributed (optional, could force it)
    if (player.availableStatPoints > 0) {
        showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, "Please distribute all your stat points before continuing.");
        return;
    }

    // Auto-equip skills if activeSkills array is less than 2
    party.forEach(member => {
        if (member.activeSkills.length < 2) {
            member.knownSkills.forEach(skillName => {
                if (!member.activeSkills.includes(skillName) && member.activeSkills.length < 2) {
                    member.activeSkills.push(skillName);
                }
            });
        }
    });

    updateSidebar(); // Final update after all changes
    const nextSceneCallback = window[nextSceneName];
    if (typeof nextSceneCallback === "function") {
        nextSceneCallback();
    } else {
        // Fallback if nextSceneCallback is not found
        showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, "Level up complete. Proceeding with the adventure!");
        waitForContinue(mainGameStart); // Or a default scene
    }
};

// --- NEW: Render Skill Selection in Sidebar ---
function renderSkillSelection() {
    if (!skillSelectionDiv || !player) return;

    let html = `<h3>Active Combat Skills (Max 2)</h3>`;
    party.forEach(member => {
        html += `<h4>${member.name} (${member.class})</h4>`;
        if (member.knownSkills.length === 0) {
            html += `<p>No skills learned yet.</p>`;
        } else {
            html += `<div style="display:flex; flex-wrap:wrap; gap:5px;">`;
            member.knownSkills.forEach(skillName => {
                const skill = gameSkills[skillName];
                if (skill) {
                    const isActive = member.activeSkills.includes(skillName);
                    html += `
                        <button
                            class="skill-toggle-btn ${isActive ? 'active' : ''}"
                            onclick="toggleActiveSkill('${member.name}', '${skillName}')"
                            title="${skill.description}"
                        >
                            ${skill.name}
                        </button>
                    `;
                }
            });
            html += `</div>`;
        }
    });
    skillSelectionDiv.innerHTML = html;
}

window.toggleActiveSkill = function(memberName, skillName) {
    const member = party.find(m => m.name === memberName);
    if (!member) return;

    const index = member.activeSkills.indexOf(skillName);
    if (index > -1) {
        // Skill is active, deactivate it
        member.activeSkills.splice(index, 1);
    } else {
        // Skill is not active, activate it if space available
        if (member.activeSkills.length < 2) {
            member.activeSkills.push(skillName);
        } else {
            showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `${member.name} can only have 2 active skills at a time.`);
        }
    }
    renderSkillSelection(); // Re-render to update buttons
};


// --- MODIFIED: Combat Rewards and Gold/Item Handling ---
function partyCombat(enemyGroup, nextScene) {
    // Hide story image during combat
    storyImage.style.display = 'none';
    storyImage.src = '';

    let combatLog = [];
    let turnOrder = [];
    let turnIndex = 0;
    let inCombat = true;
    let goldGained = 0; // Track gold gained in this combat
    let itemsFound = []; // Track items found in this combat

    const partyCombatants = party.map((m, i) => ({
        ...m,
        side: "party",
        idx: i,
        currentHp: m.hp,
        isAlive: function() { return this.currentHp > 0; },
        // Combat-specific temporary states
        sanctuaryTurns: 0,
        chargeActive: false,
        shieldOfFaithTurns: 0,
        courageAuraTurns: 0,
        huntersMarkTurns: 0,
        shadowStepActive: false,
        vanishTurns: 0,
    }));
    const enemyCombatants = enemyGroup.enemies.map((e, i) => ({
        ...e,
        side: "enemy",
        idx: i,
        currentHp: e.hp,
        maxHp: e.hp,
        isAlive: function() { return this.currentHp > 0; },
        // Combat-specific temporary states for enemies
        shadowBindTurns: 0
    }));

    function rollInitiativeGroup(combatants) {
        return rollDice(20) + Math.max(...combatants.map(c => Math.floor((c.dex || 10) / 2)));
    }
    let partyInit, enemyInit;
    do {
        partyInit = rollInitiativeGroup(partyCombatants);
        enemyInit = rollInitiativeGroup(enemyCombatants);
    } while (partyInit === enemyInit);

    let allCombatants = [...partyCombatants, ...enemyCombatants];
    allCombatants.forEach(c => {
        let dexMod = Math.floor((c.dex || 10) / 2);
        // Apply Aura of Courage bonus if active
        if (c.side === "party" && c.courageAuraTurns > 0) {
            dexMod += 2; // Courage Aura adds to attack rolls, not initiative, but we can simulate it here for simplicity
        }
        c.initiative = rollDice(20) + dexMod;
    });
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    if (enemyInit > partyInit) {
        allCombatants.sort((a, b) => {
            if (b.initiative === a.initiative) {
                return a.side === "enemy" ? -1 : 1;
            }
            return b.initiative - a.initiative;
        });
    } else {
        allCombatants.sort((a, b) => {
            if (b.initiative === a.initiative) {
                return a.side === "party" ? -1 : 1;
            }
            return b.initiative - a.initiative;
        });
    }
    turnOrder = allCombatants;

    function addLog(html) {
        combatLog.push(html);
        if (combatLog.length > 10) combatLog.shift();
    }

    function renderCombat() {
        let partyStatus = partyCombatants.map(m => `
            <div class="character" style="display:flex;align-items:center;margin-bottom:6px;">
                ${getPortrait(m)}
                <div>
                    <strong>${m.name}</strong> (${m.class}) Lv.${m.level}<br>
                    HP: <span class="hp-text ${m.currentHp <= m.maxHp / 4 ? 'low-hp' : ''}">${Math.max(0, m.currentHp)}</span> / ${m.maxHp}
                    ${m.sanctuaryTurns > 0 ? ' <span style="color:#8af;">(Sanctuary: ' + m.sanctuaryTurns + 't)</span>' : ''}
                    ${m.chargeActive ? ' <span style="color:#f88;">(Charging)</span>' : ''}
                    ${m.shieldOfFaithTurns > 0 ? ' <span style="color:#8af;">(Shielded: ' + m.shieldOfFaithTurns + 't)</span>' : ''}
                    ${m.courageAuraTurns > 0 ? ' <span style="color:#8f8;">(Courage: ' + m.courageAuraTurns + 't)</span>' : ''}
                    ${m.shadowStepActive ? ' <span style="color:#aaa;">(Shadow Step)</span>' : ''}
                    ${m.vanishTurns > 0 ? ' <span style="color:#aaa;">(Vanished: ' + m.vanishTurns + 't)</span>' : ''}
                </div>
            </div>
        `).join('');
        let enemyStatus = enemyCombatants.map(e => `
            <div class="character" style="display:flex;align-items:center;margin-bottom:6px;">
                ${getPortrait(e)}
                <div>
                    <strong>${e.name}</strong> (${e.class || "Monster"})<br>
                    HP: <span class="hp-text ${e.currentHp <= e.maxHp / 4 ? 'low-hp' : ''}">${Math.max(0, e.currentHp)}</span> / ${e.maxHp}
                    ${e.huntersMarkTurns > 0 ? ' <span style="color:#f88;">(Marked: ' + e.huntersMarkTurns + 't)</span>' : ''}
                    ${e.shadowBindTurns > 0 ? ' <span style="color:#f88;">(Bound: ' + e.shadowBindTurns + 't)</span>' : ''}
                </div>
            </div>
        `).join('');
        let logHtml = combatLog.map(l => `<div>${l}</div>`).join('');
        storyDiv.innerHTML = `
            <h2>⚔️ Combat Encounter</h2>
            <p>${enemyGroup.desc}</p>
            <div style="display:flex;gap:30px;flex-wrap:wrap;">
                <div style="min-width:220px;"><b>Your Party</b>${partyStatus}</div>
                <div style="min-width:220px;"><b>Enemies</b>${enemyStatus}</div>
            </div>
            <div style="margin-top:12px;max-height:120px;overflow:auto;background:#111;padding:8px;border-radius:6px;">
                ${logHtml}
            </div>
        `;
    }

    function getAlive(side) {
        return (side === "party" ? partyCombatants : enemyCombatants).filter(c => c.currentHp > 0);
    }

    function checkCombatEnd() {
        if (getAlive("party").length === 0) {
            addLog(`<b style="color:#e74c3c;">Combat lost</b>`);
            renderCombat();
            setTimeout(() => {
                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "Combat lost");
                optionsDiv.innerHTML = "";
                setTimeout(showDeathScreen, 1200);
            }, 1200);
            inCombat = false;
            return true;
        }
        if (getAlive("enemy").length === 0) {
            addLog(`<b style="color:#2ecc40;">Combat won</b>`);
            // --- MODIFIED: Combat Rewards ---
            const currentGoldReward = enemyGroup.goldReward || (rollDice(10) + 5);
            gold += currentGoldReward;
            goldGained += currentGoldReward;
            addLog(`You are rewarded with ${currentGoldReward} gold.`);

            if (enemyGroup.itemReward) {
                addItemToInventory(enemyGroup.itemReward.name, enemyGroup.itemReward.quantity, enemyGroup.itemReward.icon);
                itemsFound.push(enemyGroup.itemReward);
                addLog(`You found a ${enemyGroup.itemReward.name}!`);
            } else {
                const potionChance = rollDice(4);
                if (potionChance === 4) {
                    addItemToInventory("Health Potion", 1, "🧪");
                    itemsFound.push({ name: "Health Potion", quantity: 1, icon: "🧪" });
                    addLog(`You found a Health Potion!`);
                }
            }
            // --- END MODIFIED: Combat Rewards ---

            // --- FIX: Update original party members' HP from combat results ---
            partyCombatants.forEach(combatant => {
                if (combatant.side === 'party') {
                    const originalMember = party.find(p => p.name === combatant.name);
                    if (originalMember) {
                        originalMember.hp = combatant.currentHp > 0 ? combatant.currentHp : 0;
                    }
                }
            });

            updateSidebar();
            renderCharacterSheet();
            renderCombat();

            setTimeout(() => {
                let rewardsSummary = `Combat won! You gained ${goldGained} gold.`;
                if (itemsFound.length > 0) {
                    rewardsSummary += ` You also found: ${itemsFound.map(item => `${item.quantity} ${item.name}`).join(', ')}.`;
                }
                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, rewardsSummary); // MODIFIED: Added detailed reward message
                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                document.getElementById('combatContinueBtn').onclick = () => {
                    optionsDiv.innerHTML = "";
                    if (enemyGroup.onDefeat) enemyGroup.onDefeat();
                    if (typeof nextScene === "function") nextScene();
                };
            }, 1200);
            inCombat = false;
            return true;
        }
        return false;
    }

    function applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants, damageMultiplier = 1) {
        // This function will execute the skill's effect
        if (skill.type.startsWith("attack")) {
            // Apply Hunter's Mark bonus if target is marked
            if (target && target.huntersMarkTurns > 0) {
                addLog(`🎯 <b>${target.name}</b> takes extra damage from Hunter's Mark!`);
                target.currentHp -= 2; // Apply flat +2 damage
            }

            // Pass damageMultiplier to the skill's effect function
            skill.effect(caster, target, addLog, partyCombatants, enemyCombatants, damageMultiplier);

        } else if (skill.type.startsWith("buff") || skill.type.startsWith("heal") || skill.type.startsWith("debuff")) {
            skill.effect(caster, target, addLog, partyCombatants, enemyCombatants);
        }
    }

    function getAvailableActions(combatant) {
        let actions = [];
        // Basic attack is always available
        actions.push({
            name: "Attack",
            desc: "Attack a foe with your weapon.",
            type: "attack",
            effect: (caster, target, addLog, partyCombatants, enemyCombatants, damageMultiplier = 1) => {
                let attackRoll = rollDice(20) + Math.floor((caster.str - 10) / 2);
                let targetAC = 10 + Math.floor(((target.dex || 10) - 10) / 2);
                if (target.shieldOfFaithTurns > 0) { // Shield of Faith AC bonus
                    targetAC += 2;
                }
                // Apply Aura of Courage bonus to attack roll
                if (caster.courageAuraTurns > 0) {
                    attackRoll += 2;
                }
                // Apply Shadow Bind penalty to target AC
                if (target.shadowBindTurns > 0) {
                    targetAC -= 2; // Reduce target's effective DEX by 2, so AC is lower
                }

                if (attackRoll - Math.floor((caster.str - 10) / 2) === 20) { // Natural 20
                    let dmg = (rollDice(8) + Math.floor((caster.str - 10) / 2) + 2) * damageMultiplier;
                    target.currentHp -= dmg;
                    addLog(`💥 <b>${caster.name}</b> (CRIT) hits <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                } else if (attackRoll >= targetAC) {
                    let dmg = (rollDice(8) + Math.floor((caster.str - 10) / 2)) * damageMultiplier;
                    target.currentHp -= dmg;
                    addLog(`🗡️ <b>${caster.name}</b> hits <b>${target.name}</b> for <b>${dmg}</b> damage.`);
                } else {
                    addLog(`❌ <b>${caster.name}</b> misses <b>${target.name}</b>.`);
                }
            }
        });

        // Add active skills if it's a party member
        if (combatant.side === "party") {
            combatant.activeSkills.forEach(skillName => {
                const skill = gameSkills[skillName];
                if (skill) {
                    actions.push({
                        name: skill.name,
                        desc: skill.description,
                        type: skill.type,
                        targetSide: skill.targetSide, // For targeting UI
                        effect: (caster, target, addLog) => applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants)
                    });
                }
            });
        } else { // For enemies, use their known skills directly
            // Enemies will randomly pick from their known skills
            combatant.knownSkills.forEach(skillName => {
                const skill = gameSkills[skillName];
                if (skill) {
                    actions.push({
                        name: skill.name,
                        desc: skill.description,
                        type: skill.type,
                        targetSide: skill.targetSide,
                        effect: (caster, target, addLog) => applySkillEffect(skill, caster, target, addLog, partyCombatants, enemyCombatants)
                    });
                }
            });
        }
        return actions;
    }

    function nextTurn() {
        if (!inCombat) return;

        // Apply end-of-turn effects and decrement durations
        allCombatants.forEach(c => {
            if (c.sanctuaryTurns > 0) c.sanctuaryTurns--;
            if (c.shieldOfFaithTurns > 0) c.shieldOfFaithTurns--;
            if (c.courageAuraTurns > 0) c.courageAuraTurns--;
            if (c.huntersMarkTurns > 0) c.huntersMarkTurns--;
            if (c.shadowBindTurns > 0) c.shadowBindTurns--;
            if (c.vanishTurns > 0) {
                c.vanishTurns--;
                if (c.vanishTurns === 0) {
                    addLog(`✨ <b>${c.name}</b> emerges from Vanish.`);
                }
            }
            if (c.shadowStepActive) { // Shadow step is consumed on next attack or end of turn if no attack
                c.shadowStepActive = false;
            }
        });

        while (turnIndex < turnOrder.length && turnOrder[turnIndex].currentHp <= 0) {
            turnIndex++;
        }
        if (turnIndex >= turnOrder.length) {
            turnIndex = 0;
            turnOrder = turnOrder.filter(c => c.currentHp > 0);
            turnOrder.sort((a, b) => b.initiative - a.initiative);
            if (checkCombatEnd()) return;
        }
        const current = turnOrder[turnIndex];
        renderCombat();

        // Check if character is vanished and cannot attack
        if (current.vanishTurns > 0 && current.side === "party") {
            addLog(`👻 <b>${current.name}</b> is Vanished and cannot act this turn.`);
            turnIndex++;
            setTimeout(nextTurn, 800);
            return;
        }

        if (current.side === "party" && current.currentHp > 0) {
            addLog(`<b style="color:#fff;">${current.name}'s turn!</b>`);
            renderCombat();
            let actions = getAvailableActions(current);
            let actionButtons = actions.map((action, i) =>
                `<button onclick="chooseCombatAction(${i})">${action.name}</button>`
            ).join(' ');
            optionsDiv.innerHTML = `<div><b>Choose action:</b> ${actionButtons}</div>`;

            window.chooseCombatAction = function(actionIdx) {
                optionsDiv.innerHTML = "";
                let action = actions[actionIdx];
                let targets = [];

                if (action.targetSide === "party") {
                    targets = getAlive("party");
                } else if (action.targetSide === "enemy") {
                    targets = getAlive("enemy");
                } else { // Default targeting
                    targets = current.side === "party" ? getAlive("enemy") : getAlive("party");
                }

                if (action.type === "attack_aoe" || action.type === "attack_multi" || action.type === "heal_aoe") {
                    // AOE/Multi-target skills don't need specific target selection UI
                    action.effect(current, targets, addLog); // Pass all relevant targets
                    if (checkCombatEnd()) return;
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                }
                else if (targets.length === 1) {
                    action.effect(current, targets[0], addLog);
                    if (checkCombatEnd()) return;
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                } else {
                    optionsDiv.innerHTML = `<div><b>Choose target:</b> ${
                        targets.map((t, j) =>
                            `<button onclick="doCombatAction(${actionIdx},${j})">${t.name}</button>`
                        ).join(' ')
                    }</div>`;
                    window.doCombatAction = function(aIdx, tIdx) {
                        optionsDiv.innerHTML = "";
                        actions[aIdx].effect(current, targets[tIdx], addLog);
                        if (checkCombatEnd()) return;
                        turnIndex++;
                        setTimeout(nextTurn, 800);
                    };
                }
            };
        }
        else if (current.side === "enemy" && current.currentHp > 0) {
            // Check if enemy is vanished (e.g., if a rogue used Vanish on them)
            if (current.vanishTurns > 0) {
                addLog(`👻 <b>${current.name}</b> is Vanished and cannot act this turn.`);
                turnIndex++;
                setTimeout(nextTurn, 800);
                return;
            }

            // Shield effect for Fighter: nullifies next enemy attack
            let shieldedMember = partyCombatants.find(m => m.shielded);
            if (shieldedMember) {
                addLog(`🛡️ <b>${shieldedMember.name}</b>'s Shield nullifies the enemy attack!`);
                shieldedMember.shielded = false;
                turnIndex++;
                setTimeout(nextTurn, 800);
                return;
            }
            addLog(`<b style="color:#fff;">${current.name}'s turn!</b>`);
            renderCombat();
            let actions = getAvailableActions(current);
            let action = actions[Math.floor(Math.random() * actions.length)]; // Enemy picks a random action
            let targets = [];

            if (action.targetSide === "enemy") {
                targets = getAlive("enemy");
            } else if (action.targetSide === "party") {
                targets = getAlive("party");
            } else { // Default targeting for enemies is party
                targets = getAlive("party");
            }

            // Filter out untargetable party members (e.g., from Shadow Step)
            if (action.type.startsWith("attack")) {
                targets = targets.filter(t => !t.shadowStepActive);
                if (targets.length === 0) { // No valid targets, enemy skips turn
                    addLog(`<b>${current.name}</b> has no valid targets and skips its turn.`);
                    turnIndex++;
                    setTimeout(nextTurn, 800);
                    return;
                }
            }


            let target = targets[Math.floor(Math.random() * targets.length)]; // Enemy picks a random target
            setTimeout(() => {
                applySkillEffect(action, current, target, addLog, partyCombatants, enemyCombatants);
                if (checkCombatEnd()) return;
                turnIndex++;
                setTimeout(nextTurn, 800);
            }, 800);
        }
        else {
            turnIndex++;
            setTimeout(nextTurn, 100);
        }
    }

    addLog(`<i>Party initiative: ${partyInit}, Enemy initiative: ${enemyInit}</i>`);
    addLog(`<i>Initiative order: ${turnOrder.map(c => c.name).join(", ")}</i>`);
    renderCombat();
    setTimeout(nextTurn, 1200);
}

// --- Weather & Encounter System ---
function rollWeather() {
    const roll = rollDice(20);
    let weather = "";
    if (roll <= 5) {
        weather = "🌧️ Awful weather: heavy downpour soaks the land.";
    } else if (roll <= 10) {
        weather = "☁️ Overcast and gloomy weather hangs overhead.";
    } else if (roll <= 15) {
        weather = "⛅ Warm weather with a few clouds in the distance.";
    } else {
        weather = "🌞 Perfect weather: clear skies and a gentle breeze.";
    }
    return { roll, weather };
}

function rollEncounter() {
    const roll = rollDice(20);
    let encounter = "Peaceful surroundings"; // Default to peaceful
    let effect = null;
    if (roll === 20) {
        if (party.length < 4) {
            const available = allPartyMembers.filter(m => !party.some(p => p.name === m.name)); // Use allPartyMembers here
            if (available.length > 0) {
                const newComp = available[Math.floor(Math.random() * available.length)];
                party.push(newComp);
                encounter = `✨ You meet a new companion: ${newComp.icon} <b>${newComp.name}</b> joins your party!`;
                effect = () => renderCharacterSheet();
            } else {
                encounter = "✨ You find a rare magical item that heals you (+5 HP)!";
                effect = () => { player.hp += 5; showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You gain 5 HP!`); renderCharacterSheet(); }; // MODIFIED: Added dialogue for HP gain
            }
        } else {
            encounter = "✨ You find a rare magical item that heals you (+5 HP)!";
            effect = () => { player.hp += 5; showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You gain 5 HP!`); renderCharacterSheet(); }; // MODIFIED: Added dialogue for HP gain
        }
    } else if (roll >= 16) {
        encounter = "😊 You meet a friendly traveler who shares food and stories. (+2 HP)";
        effect = () => { player.hp += 2; showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You gain 2 HP!`); renderCharacterSheet(); }; // MODIFIED: Added dialogue for HP gain
    } else if (roll >= 11) {
        encounter = "🚶‍♂️ The road is quiet, and you make good progress.";
    } else if (roll >= 6) {
        encounter = "⚠️ You stumble into a minor trap and lose 2 HP.";
        effect = () => { player.hp -= 2; showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You lose 2 HP from a trap!`); renderCharacterSheet(); }; // MODIFIED: Added dialogue for HP loss
    } else if (roll > 1) {
        encounter = "👹 A monster ambushes you! (Party combat!)";
        effect = (nextScene) => {
            partyCombat({
                enemies: [{
                    name: "Goblin Scourge",
                    icon: "👺",
                    class: "Goblin",
                    str: 10,
                    dex: 14,
                    int: 8,
                    hp: 15 + dayCount * 1, // Scale with dayCount
                    portraitUrl: "images/goblin.png",
                    knownSkills: ["Attack"]
                },
                {
                    name: "Giant Spider",
                    icon: "🕷️",
                    class: "Beast",
                    str: 12,
                    dex: 10,
                    int: 4,
                    hp: 12 + dayCount * 1,
                    portraitUrl: "images/spider.png",
                    knownSkills: ["Attack"]
                }],
                desc: "A group of Goblins and Spiders leap out!",
                goldReward: rollDice(10) + 10, // Increased gold reward for more challenging encounter
                itemReward: (rollDice(3) === 3) ? { name: "Minor Healing Potion", quantity: 1, icon: "🧪" } : null,
                onDefeat: () => {
                    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "The monsters are defeated!");
                }
            }, nextScene);
        };
    } else {
        encounter = "💀 A powerful beast stalks you! (Party combat!)";
        effect = (nextScene) => {
            partyCombat({
                enemies: [{
                    name: "Dire Wolf",
                    icon: "🐺",
                    class: "Beast",
                    str: 16,
                    dex: 14,
                    int: 6,
                    hp: 25 + dayCount * 2,
                    portraitUrl: "images/direwolf.png",
                    knownSkills: ["Attack"]
                },
                {
                    name: "Forest Guardian",
                    icon: "🌳",
                    class: "Elemental",
                    str: 18,
                    dex: 8,
                    int: 10,
                    hp: 30 + dayCount * 2,
                    portraitUrl: "images/golem.png",
                    knownSkills: ["Attack"]
                }],
                desc: "A fearsome Dire Wolf and a vengeful Forest Guardian appear!",
                goldReward: rollDice(20) + 20,
                itemReward: (rollDice(2) === 2) ? { name: "Elven Rope", quantity: 1, icon: "🔗" } : null,
                onDefeat: () => {
                    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "You have overcome a formidable foe!");
                }
            }, nextScene);
        };
    }
    return { roll, encounter, effect };
}

// --- NEW FEATURE: Add Item to Inventory Utility ---
function addItemToInventory(itemName, quantity = 1, icon = '❓') {
    const existingItem = inventory.find(item => item.name === itemName);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const shopItemRef = shopItems.find(sItem => sItem.name === itemName);
        inventory.push({
            name: itemName,
            quantity: quantity,
            icon: icon,
            cost: shopItemRef ? shopItemRef.cost : 0, // Preserve cost for selling if it was a shop item
            sellPrice: shopItemRef ? shopItemRef.sellPrice : Math.floor((shopItemRef ? shopItemRef.cost : 0) / 2),
            statBonus: shopItemRef ? shopItemRef.statBonus : null
        });
    }
    updateSidebar();
}

// --- NEW FEATURE: Reward Party Function ---
function rewardParty(amount, item = null) {
    gold += amount;
    let message = `You gained ${amount} gold!`;
    if (item) {
        addItemToInventory(item.name, item.quantity, item.icon);
        message += ` And found a ${item.name}!`;
    }
    showDialogue({ name: "Reward", icon: "💰", portraitUrl: "images/narrator.png" }, message);
    updateSidebar();
}


// --- Utility: Wait for click to continue ---
function waitForContinue(next) {
    optionsDiv.innerHTML = `<button id="continueBtn">Continue</button>`;
    document.getElementById('continueBtn').onclick = () => {
        optionsDiv.innerHTML = "";
        next();
    };
}

// NEW: Function to handle moving to a new named area (rolls weather/encounter)
function moveToArea(areaName, nextSceneCallback) {
    dayCount++; // A day passes when you travel to a new area
    currentArea = areaName;

    const weatherResult = rollWeather();
    const encounterResult = rollEncounter();

    currentAreaWeather = weatherResult.weather; // Store for display in sidebar
    currentAreaEncounter = encounterResult.encounter; // Store for display in sidebar

    // Clear story image when moving to a new area, unless a specific image is set by the next scene
    storyImage.style.display = 'none';
    storyImage.src = '';

    let areaIntroHtml = `<p><b>Entering ${areaName}</b></p>`;
    let weatherHtml = `<p><b>Weather:</b> ${currentAreaWeather}</p>`;
    let encounterHtml = `<p><b>Encounter:</b> ${currentAreaEncounter}</p>`;

    storyDiv.innerHTML = areaIntroHtml + weatherHtml + encounterHtml;

    if (encounterResult.effect) {
        // If the encounter has a combat effect, it needs to be handled
        // before proceeding to the next narrative scene.
        if (encounterResult.effect.length > 0) { // If effect expects nextScene
            encounterResult.effect(nextSceneCallback);
        } else {
            encounterResult.effect();
            waitForContinue(nextSceneCallback);
        }
    } else {
        waitForContinue(nextSceneCallback);
    }
    updateSidebar(); // Update sidebar with new area, weather, encounter, day
}

// NEW: Function to handle a day passing within the current area (no new weather/encounter roll)
function advanceDayInArea(nextSectionCallback) {
    dayCount++;
    // Clear story image when advancing day within an area
    storyImage.style.display = 'none';
    storyImage.src = '';

    showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `A day passes in ${currentArea}. It is now Day ${dayCount}.`);
    waitForContinue(nextSectionCallback);
    updateSidebar(); // Update day counter
}


// --- Insert setCheckpoint before each major section ---
function mainGameStart() {
    setCheckpoint(mainGameStart);
    // Initial image for game start
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        getStoryPremise(player.name),
        "images/divinevision.png" // Placeholder image for vision
    );
    showOptions([
        {
            text: "Begin your quest",
            action: () => {
                moveToArea("The Road to Greenhollow", roadEncounter); // Rolls for weather/encounter for the road
            }
        }
    ]);
    renderCharacterSheet();
    updateSidebar();
}

function recruitParty() {
    setCheckpoint(recruitParty);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        `<p>Before you set out, you may choose up to <b>three</b> companions to join you on your path of redemption.</p>`,
        "images/recruitparty.png" // Image for recruitment
    );
    let chosen = [];
    availableMembers = allPartyMembers.filter(member => !party.some(p => p.name === member.name));

    function renderRecruitOptions() {
        optionsDiv.innerHTML = "";
        if (chosen.length < 3 && availableMembers.length > 0) {
            showOptions(
                availableMembers
                    .map((member, idx) => ({
                        text: `Recruit ${member.icon} ${member.name} (${member.class})`,
                        action: () => {
                            chosen.push(member);
                            party.push(member);
                            availableMembers = availableMembers.filter(m => m.name !== member.name);

                            // Initialize new member's level, skills based on player's current level
                            member.level = player.level;
                            member.knownSkills = getSkillsForClassAndLevel(member.class, member.level);
                            member.activeSkills = member.knownSkills.slice(0, 2); // Auto-equip first two skills

                            showDialogue(member, `${member.name} joins your cause!`);
                            renderCharacterSheet();
                            updateSidebar();
                            renderRecruitOptions();
                        }
                    }))
            );
            optionsDiv.innerHTML += `<button onclick="finishRecruitment()">Continue with current party</button>`;
        } else {
             finishRecruitment();
        }
    }

    window.finishRecruitment = function() {
        showDialogue(
            { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            `Your party is ready! You have chosen ${chosen.map(m => m.name).join(", ") || "no additional companions"}.`,
            "images/readyparty.png" // Image for ready party
        );
        if (party[0] !== player) {
            party = [player, ...party.filter(m => m !== player)];
        }
        renderCharacterSheet();
        updateSidebar();
        waitForContinue(mainGameStart);
    };
    renderRecruitOptions();
    updateSidebar();
}

function firstVision() {
    setCheckpoint(firstVision);
    showDialogue(
        { name: player.name, icon: player.icon, portraitUrl: player.portraitUrl },
        `That night, you dream of a burning village and hear a voice: "${player.name}, the innocent need your strength. Will you answer the call?"`,
        "images/nightmare.png" // Image for vision
    );
    showOptions([
        {
            text: "Swear an oath to help",
            action: () => {
                showDialogue(player, "You awaken with resolve. The village of Greenhollow is in danger. You set out at dawn.");
                // This is a narrative event, not a new area.
                waitForContinue(() => moveToArea("Greenhollow Village", greenhollowArrival));
            }
        },
        {
            text: "Ignore the vision",
            action: () => {
                showDialogue(player, "You try to ignore the vision, but guilt gnaws at you. At sunrise, you decide to help after all.");
                // This is a narrative event, not a new area.
                waitForContinue(() => moveToArea("Greenhollow Village", greenhollowArrival));
            }
        }
    ]);
}

function roadEncounter() {
    setCheckpoint(roadEncounter);
    showDialogue(
        { name: "Guard Captain", icon: "🛡️", portraitUrl: "images/guard1.png" },
        `On the road to Greenhollow, a group of suspicious guards stops you. "Orc! State your business!"`,
        "images/roadguards.png" // Image for road guards
    );
    showOptions([
        {
            text: "Speak honestly 🗣️",
            diceCheck: {
                prompt: "Roll to persuade the guards (INT check, DC 13)",
                dc: 13,
                success: () => {
                    showDialogue(player, "The guards, surprised by your honesty, let you pass but warn you to behave.");
                    moveToArea("Greenhollow Village", greenhollowArrival); // Rolls for weather/encounter when arriving at Greenhollow
                },
                fail: () => {
                    showDialogue(player, "The guards don't trust you and demand a bribe. You prepare for a fight.");
                    waitForContinue(() => {
                        partyCombat({
                            enemies: [{
                                name: "Guard Captain",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 14,
                                dex: 12,
                                int: 10,
                                hp: 18,
                                portraitUrl: "images/guard1.png",
                                knownSkills: ["Attack"]
                            },
                            {
                                name: "Guard",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 12,
                                dex: 12,
                                int: 10,
                                hp: 14,
                                portraitUrl: "images/guard2.png",
                                knownSkills: ["Attack"]
                            }],
                            desc: "The guards attack you!",
                            goldReward: 25, // Specific reward for this combat
                            onDefeat: () => {
                                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "You defeat the guards and continue your journey.");
                                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                                document.getElementById('combatContinueBtn').onclick = () => {
                                    optionsDiv.innerHTML = "";
                                    moveToArea("Greenhollow Village", greenhollowArrival); // Rolls for weather/encounter when arriving at Greenhollow
                                };
                            }
                        });
                    });
                }
            }
        },
        {
            text: "Intimidate them 💪",
            diceCheck: {
                prompt: "Roll to intimidate (STR check, DC 15)",
                dc: 15,
                success: () => {
                    showDialogue(player, "Your presence is enough to make the guards back down. You continue on your way.");
                    moveToArea("Greenhollow Village", greenhollowArrival); // Rolls for weather/encounter when arriving at Greenhollow
                },
                fail: () => {
                    showDialogue(player, "The guards attack! You prepare for a fight.");
                    waitForContinue(() => {
                        partyCombat({
                            enemies: [{
                                name: "Guard Captain",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 14,
                                dex: 12,
                                int: 10,
                                hp: 18,
                                portraitUrl: "images/guard1.png",
                                knownSkills: ["Attack"]
                            },
                            {
                                name: "Guard",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 12,
                                dex: 12,
                                int: 10,
                                hp: 14,
                                portraitUrl: "images/guard2.png",
                                knownSkills: ["Attack"]
                            }],
                            desc: "The guards attack you!",
                            goldReward: 25,
                            onDefeat: () => {
                                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "You defeat the guards and continue your journey.");
                                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                                document.getElementById('combatContinueBtn').onclick = () => {
                                    optionsDiv.innerHTML = "";
                                    moveToArea("Greenhollow Village", greenhollowArrival); // Rolls for weather/encounter when arriving at Greenhollow
                                };
                            }
                        });
                    });
                }
            }
        }
    ]);
}

function greenhollowArrival() {
    setCheckpoint(greenhollowArrival);
    showDialogue(
        { name: "Village Child", icon: "🧒", portraitUrl: "images/fhumchild1.png" },
        `Please, my mother is trapped in the burning mill!`,
        "images/burningmill.png" // Image for burning mill
    );
    showOptions([
        {
            text: "Rush into the flames �",
            diceCheck: {
                prompt: "Roll to brave the fire (STR check, DC 14)",
                dc: 14,
                success: () => {
                    showDialogue(player, "You carry the woman to safety. The villagers begin to trust you.");
                    rewardParty(15);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => darknessRevealed());
                },
                fail: () => {
                    player.hp -= 5;
                    showDialogue(player, `You save the woman but are burned. You lose 5 HP.`); // MODIFIED: Added dialogue for HP loss
                    renderCharacterSheet();
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => darknessRevealed());
                }
            }
        },
        {
            text: "Organize a rescue 🗣️",
            diceCheck: {
                prompt: "Roll to lead the villagers (INT check, DC 13)",
                dc: 13,
                success: () => {
                    showDialogue(player, "Your leadership saves the woman and inspires the villagers.");
                    rewardParty(15);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => darknessRevealed());
                },
                fail: () => {
                    player.hp -= 3;
                    showDialogue(player, `The rescue is chaotic. The woman is saved, but you are exhausted. You lose 3 HP.`); // MODIFIED: Added dialogue for HP loss
                    renderCharacterSheet();
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => darknessRevealed());
                }
            }
        }
    ]);
}

function darknessRevealed() {
    setCheckpoint(darknessRevealed);
    showDialogue(
        { name: "Warlock", portraitUrl: "images/warlock.png" },
        `That night, a shadowy cult attacks the village. Their leader, a dark warlock, calls you out: "Orc! You do not belong here!"`,
        "images/warlockattack.png" // Image for warlock attack
    );
    showOptions([
        {
            text: "Challenge the warlock ⚔️",
            diceCheck: {
                prompt: "Roll to duel the warlock (STR check, DC 15)",
                dc: 15,
                success: () => {
                    showDialogue(player, "You defeat the warlock in single combat. The cultists scatter.");
                    rewardParty(30, {name: "Amulet of Protection", quantity: 1, icon: "🧿"});
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => redemption());
                },
                fail: () => {
                    player.hp -= 6;
                    showDialogue(player, `The warlock wounds you with dark magic. You lose 6 HP.`); // MODIFIED: Added dialogue for HP loss
                    renderCharacterSheet();
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => redemption());
                }
            }
        },
        {
           text: "Inspire the villagers 🗣️",
            diceCheck: {
                prompt: "Roll to rally the villagers (INT check, DC 14)",
                dc: 14,
                success: () => {
                    showDialogue(player, "Your words give the villagers courage. Together, you drive off the cultists.");
                    rewardParty(30, {name: "Village Provisions", quantity: 1, icon: "🍎"});
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => redemption());
                },
                fail: () => {
                    player.hp -= 4;
                    showDialogue(player, `The villagers hesitate, and the cultists cause havoc. You lose 4 HP.`); // MODIFIED: Added dialogue for HP loss
                    renderCharacterSheet();
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => redemption());
                }
            }
        }
    ]);
}

function redemption() {
    setCheckpoint(redemption);
    showDialogue(
        { name: "Priest", portraitUrl: "images/priest.png" },
        `With the village safe, the people gather to thank you. The local priest offers you a blessing. "You have shown us that redemption is possible for all."`,
        "images/blessing.png" // Image for blessing
    );
    showOptions([
        {
            text: "Accept the blessing ✨",
            action: () => {
                showDialogue(player, "You feel the light of the gods fill you. Your HP is fully restored!");
                player.hp = player.maxHp;
                party.forEach(member => member.hp = member.maxHp); // Also restore party HP
                renderCharacterSheet();
                updateSidebar();
                // ADVANCE DAY WITHIN THE SAME AREA
                advanceDayInArea(() => finalBattle());
            }
        },
        {
            text: "Humbly refuse",
            action: () => {
                showDialogue(player, "You thank the priest, but say your deeds are their own reward.");
                // ADVANCE DAY WITHIN THE SAME AREA
                advanceDayInArea(() => finalBattle());
            }
        }
    ]);
}

function finalBattle() {
    setCheckpoint(finalBattle);
    showDialogue(
        { name: "Narrator", icon: "📜" },
        "As dawn breaks, the warlock returns, now summons a monstrous demon! The villagers cower. It is up to you and your companions to stand against the darkness.",
        "images/demonbattle.png" // Image for final battle
    );
    partyCombat({
        enemies: [{
            name: "Dark Warlock",
            icon: "🧙‍♂️",
            class: "Warlock",
            str: 12,
            dex: 14,
            int: 18,
            hp: 32 + dayCount * 2,
            portraitUrl: "images/warlock.png",
            knownSkills: ["Dark Bolt", "Shadow Bind"]
        },
        {
            name: "Demon Form",
            icon: "👹",
            class: "Demon",
            str: 18,
            dex: 12,
            int: 14,
            hp: 30 + dayCount * 3,
            portraitUrl: "images/demon.png",
            knownSkills: ["Attack"] // Demons just attack for now
        }],
        desc: "The warlock transforms into a demon and attacks!",
        goldReward: 50,
        itemReward: {name: "Demon Heartstone", quantity: 1, icon: "❤️‍🔥"},
        onDefeat: () => {
            showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "Your party defeats the demon! The village is saved and you are hailed as a true paladin!");
            optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
            document.getElementById('combatContinueBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                // Level Up 1 after saving Greenhollow
                levelUpParty(newChapterTown);
            };
        }
    });
}

// --- Chapter 2: Silverbrook and Whispering Woods Journey ---

function newChapterTown() {
    setCheckpoint(newChapterTown);
    showDialogue(
        { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "You arrive in the bustling town of Silverbrook. The streets are lively, but a shadow of unease hangs over the townsfolk.",
        "images/silverbrook.png" // Image for Silverbrook
    );
    waitForContinue(() => {
        showDialogue(
            { name: "Innkeeper", icon: "🍺", portraitUrl: "images/innkeeper.png" },
            "Welcome, travelers! Strange things have been happening at night. People are vanishing, and the mayor is desperate for help.",
            "images/inkeepertalk.png" // Image for innkeeper
        );
        optionsDiv.innerHTML = `<button id="townMysteryBtn">Investigate the mystery</button>`;
        document.getElementById('townMysteryBtn').onclick = () => {
            optionsDiv.innerHTML = "";
            townMysteryInvestigation();
        };
    });
}

function townMysteryInvestigation() {
    setCheckpoint(townMysteryInvestigation); // Added checkpoint for town investigation
    showDialogue(
        { name: "Mayor", icon: "🏛️", portraitUrl: "images/mayor.png" },
        "Thank goodness you're here! Last night, the blacksmith disappeared. Can you help us find out what's happening?",
        "images/mayorquest.png" // Image for mayor quest
    );
    showOptions([
        {
            text: "Search the blacksmith's shop 🔍",
            diceCheck: {
                prompt: "Roll to investigate (INT check, DC 14)",
                dc: 14,
                success: () => {
                    showDialogue(player, "You find a hidden passage beneath the shop leading to the old sewers.");
                    rewardParty(10);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => sewerBattle());
                },
                fail: () => {
                    showDialogue(player, "You find nothing but soot and tools. The trail is cold.");
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => townMysteryClue());
                }
            }
        },
        {
            text: "Question the townsfolk 🗣️",
            diceCheck: {
                prompt: "Roll to persuade (CHA check, DC 13)",
                dc: 13,
                success: () => {
                    showDialogue(player, "A nervous child tells you about strange noises from the sewers.");
                    rewardParty(10);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => sewerBattle());
                },
                fail: () => {
                    showDialogue(player, "No one seems willing to talk. You'll have to search for clues yourself.");
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => townMysteryClue());
                }
            }
        }
    ]);
}

function townMysteryClue() {
    setCheckpoint(townMysteryClue); // Added checkpoint
    showDialogue(
        { name: "Party Member", icon: "🗡️", portraitUrl: party[1] ? party[1].portraitUrl : "images/narrator.png" }, // Use a random party member or narrator
        "Maybe we should check the sewers. That's where trouble usually hides!",
        "images/sewers.png" // Image for sewer entrance
    );
    // ADVANCE DAY WITHIN THE SAME AREA
    advanceDayInArea(() => sewerBattle());
}

function sewerBattle() {
    setCheckpoint(sewerBattle); // Added checkpoint for sewer battle
    showDialogue(
        { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "You descend into the dark, damp sewers. Suddenly, monstrous rats and a shadowy figure attack!",
        "images/sewercombat.png" // Image for sewer combat
    );
    partyCombat({
        enemies: [
            {
                name: "Giant Rat",
                icon: "🐀",
                class: "Beast",
                str: 10,
                dex: 14,
                int: 2,
                hp: 12 + dayCount,
                portraitUrl: "images/rat.png",
                knownSkills: ["Attack"]
            },
            {
                name: "Shadowy Kidnapper",
                icon: "🕵️",
                class: "Rogue",
                str: 12,
                dex: 16,
                int: 12,
                hp: 18 + dayCount,
                portraitUrl: "images/kidnapper.png",
                knownSkills: ["Attack", "Sneak Attack"] // Kidnapper might use Sneak Attack
            }
        ],
        desc: "A swarm of giant rats and a mysterious kidnapper attack!",
        goldReward: 30,
        itemReward: {name: "Lockpick Set", quantity: 1, icon: "🗝️"},
        onDefeat: () => {
            showDialogue(
                { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                "You defeat the monsters and rescue the missing townsfolk. The mayor is overjoyed!"
            );
            optionsDiv.innerHTML = `<button id="chapterContinueBtn">Continue</button>`;
            document.getElementById('chapterContinueBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                // Level Up 2 after saving Silverbrook
                levelUpParty(newCompanionJoins);
            };
        }
    });
}

function newCompanionJoins() {
    setCheckpoint(newCompanionJoins); // Added checkpoint
    const potentialNewCompanion = allPartyMembers.find(m => !party.some(p => p.name === m.name));
    let newCompanion;
    if (potentialNewCompanion) {
        newCompanion = potentialNewCompanion;
    } else {
        newCompanion = {
            name: "Lira",
            class: "Human Bard",
            str: 8,
            dex: 14,
            int: 15,
            hp: 16,
            maxHp: 16,
            icon: "🎶",
            portraitUrl: "images/bard.png",
            level: player.level, // New companions join at player's current level
            availableStatPoints: 0,
            knownSkills: getSkillsForClassAndLevel("Human Bard", player.level), // Assuming Bard class skills exist
            activeSkills: getSkillsForClassAndLevel("Human Bard", player.level).slice(0,2)
        };
    }

    if (party.length < 4 && !party.some(m => m.name === newCompanion.name)) {
        party.push(newCompanion);
        availableMembers = availableMembers.filter(m => m.name !== newCompanion.name);
        renderCharacterSheet();
        updateSidebar();
        showDialogue(
            newCompanion,
            "Thank you for saving me! I would be honored to join your party and help on your adventures.",
            "images/lirajoining.png" // Image for new companion
        );
        rewardParty(0, {name: "Bard's Lute", quantity: 1, icon: "🎸"}); // No gold, just an item
    } else {
        showDialogue(
            { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            "You rescued someone, but your party is full, or no suitable new companion could join."
        );
    }

    optionsDiv.innerHTML = `<button id="nextAdventureBtn">Continue your journey</button>`;
    document.getElementById('nextAdventureBtn').onclick = () => {
        optionsDiv.innerHTML = "";
        showDialogue(
            { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            "With Silverbrook safe, you hear whispers of the grand city of Goldenspire, nestled beyond the ancient Whispering Woods. It's time for a new adventure!",
            "images/goldenspireimagined.png" // Image for road to Goldenspire
        );
        moveToArea("Whispering Woods", startWhisperingWoodsJourney); // Rolls for weather/encounter for Whispering Woods
    };
}


// --- NEW FEATURE: Shop System Functions ---
function renderShop() {
    if (!shopDisplay) return; // Ensure element exists

    shopDisplay.innerHTML = `<h3>Items for Sale:</h3>`;
    shopItems.forEach(item => {
        shopDisplay.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; background:#1a1a1a; padding: 8px; border-radius: 5px;">
                <span><span class="icon">${item.icon}</span> ${item.name} - ${item.cost} Gold</span>
                <button onclick="buyItem('${item.name}')">Buy</button>
            </div>
            <p style="font-size:0.9em; color:#ccc; margin-left:10px;"><i>${item.description}</i></p>
        `;
    });
}

window.buyItem = function(itemName) {
    const itemToBuy = shopItems.find(item => item.name === itemName);
    if (!itemToBuy) {
        showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/shopkeeper.png" }, "I don't sell that item, friend.");
        return;
    }

    if (gold >= itemToBuy.cost) {
        gold -= itemToBuy.cost;
        addItemToInventory(itemToBuy.name, 1, itemToBuy.icon); // Add 1 of the item
        showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/shopkeeper.png" }, `You bought a ${itemName} for ${itemToBuy.cost} gold! You now have ${gold} gold.`); // MODIFIED: Added gold amount
    } else {
        showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/narrator.png" }, "You don't have enough gold for that.");
    }
    updateSidebar();
};

window.sellItem = function(itemName) {
    const itemToSell = inventory.find(item => item.name === itemName);
    if (!itemToSell) {
        showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/shopkeeper.png" }, "You don't have that item to sell.");
        return;
    }

    const sellPrice = itemToSell.sellPrice || Math.floor(itemToSell.cost / 2); // Use defined sellPrice or half cost

    gold += sellPrice;
    itemToSell.quantity--;
    if (itemToSell.quantity <= 0) {
        inventory = inventory.filter(item => item.name !== itemName);
    }
    showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/shopkeeper.png" }, `You sold a ${itemName} for ${sellPrice} gold! You now have ${gold} gold.`); // MODIFIED: Added gold amount
    updateSidebar();
};
// --- END NEW FEATURE: Shop System Functions ---


// --- NEW CHAPTER: Whispering Woods Journey ---
let forestDaysTraveled = 0;
const totalForestDays = 5; // Example: It takes 5 days to cross the woods

function startWhisperingWoodsJourney() {
    setCheckpoint(startWhisperingWoodsJourney);
    forestDaysTraveled = 0; // Reset for this journey
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "You step into the Whispering Woods. The trees immediately close in, their canopy thick and ancient. The air is cooler, and strange calls echo from the depths.",
        "images/whisperingwoods.png" // Image for Whispering Woods
    );
    // This function is called by moveToArea, so the initial roll for entering the woods already occurred.
    waitForContinue(whisperingWoodsDay);
}

function whisperingWoodsDay() {
    setCheckpoint(whisperingWoodsDay); // Set checkpoint for each day in the woods
    if (forestDaysTraveled >= totalForestDays) {
        // Party has reached Goldenspire City
        // Level Up 3 after traveling through Whispering Woods and reaching Goldenspire
        return levelUpParty(enterGoldenspireCity); // Rolls for weather/encounter on arrival day. Appropriate.
    }

    forestDaysTraveled++;
    dayCount++; // Advance day within the woods
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        `You continue your journey through the Whispering Woods. Day ${forestDaysTraveled} of ${totalForestDays}. It is now Day ${dayCount}.`
    );
    updateSidebar(); // Update day counter
    forestEvent();
}

function forestEvent() {
    setCheckpoint(forestEvent);
    // Add specific forest events here, or use general encounter system
    const eventRoll = rollDice(10);

    if (eventRoll <= 3) {
        // Just travel, no special event beyond weather/encounter
        showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            "The day passes with uneventful travel through the dense woods."
        );
        waitForContinue(whisperingWoodsDay); // Proceed to next day
    } else if (eventRoll <= 6) {
        // Mysterious character encounter
        const characterRoll = rollDice(2);
        if (characterRoll === 1) {
            showDialogue({ name: "Mysterious Hermit", icon: "🧙", portraitUrl: "images/hermit.png" },
                "Greetings, travelers. The woods whisper secrets only to those who listen. Beware the sunken crypt, its shadows stir.",
                "images/hermitforest.png" // Image for hermit
            );
            optionsDiv.innerHTML = `
                <button onclick="askHermitForAdvice()">Ask for advice</button>
                <button onclick="continueJourney()">Ignore and continue</button>
            `;
            window.askHermitForAdvice = function() {
                showDialogue(player, "What do you know of this crypt?");
                waitForContinue(() => {
                    showDialogue({ name: "Mysterious Hermit", icon: "🧙", portraitUrl: "images/hermit.png" },
                        "An ancient evil sleeps there. Only the bravest, or most foolish, dare disturb it. Take this. It might help."
                    );
                    rewardParty(0, {name: "Ancient Map Fragment", quantity: 1, icon: "🗺️"});
                    waitForContinue(whisperingWoodsDay);
                });
            };
            window.continueJourney = function() {
                showDialogue(player, "We have no time for cryptic warnings.");
                waitForContinue(whisperingWoodsDay);
            };
        } else {
            showDialogue({ name: "Lost Scout", icon: "🌲", portraitUrl: "images/scout.png" },
                "Phew, glad to see friendly faces! I'm lost. Can you help me find my way to a clearer path?",
                "images/lostscout.png" // Image for lost scout
            );
            optionsDiv.innerHTML = `
                <button onclick="helpScout()">Help the Scout (DEX Check DC 12)</button>
                <button onclick="demandPayment()">Demand Payment (CHA Check DC 10)</button>
                <button onclick="leaveScout()">Leave the Scout</button>
            `;
            window.helpScout = function() {
                askDiceRoll("Roll to navigate the woods (DEX check, DC 12)", (roll) => {
                    if (roll >= 12) {
                        showDialogue(player, "You expertly guide the scout to a well-worn trail.");
                        rewardParty(20);
                        showDialogue({ name: "Lost Scout", icon: "🌲", portraitUrl: "images/scout.png" }, "Thank you! Take this for your troubles.");
                        waitForContinue(whisperingWoodsDay);
                    } else {
                        showDialogue(player, "You struggle to find the way, eventually leading the scout back where you started. They leave frustrated.");
                        waitForContinue(whisperingWoodsDay);
                    }
                });
            };
            window.demandPayment = function() {
                askDiceRoll("Roll to demand payment (CHA check, DC 10)", (roll) => {
                    if (roll >= 10) {
                        showDialogue(player, "The scout begrudgingly hands over some coin.");
                        rewardParty(10);
                        waitForContinue(whisperingWoodsDay);
                    } else {
                        showDialogue(player, "The scout curses you and disappears into the undergrowth.");
                        waitForContinue(whisperingWoodsDay);
                    }
                });
            };
            window.leaveScout = function() {
                showDialogue(player, "You tell the scout you have your own journey to tend to.");
                waitForContinue(whisperingWoodsDay);
            };
        }
    } else if (eventRoll <= 8) {
        // Abandoned Crypt discovery
        showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            "Deep within the woods, you stumble upon a crumbling stone structure, half-overgrown with moss and vines. It appears to be an abandoned crypt.",
            "images/crypt.png" // Image for crypt
        );
        optionsDiv.innerHTML = `
            <button onclick="exploreCrypt()">Explore the crypt</button>
            <button onclick="avoidCrypt()">Avoid the crypt and continue</button>
        `;
        window.exploreCrypt = function() {
            setCheckpoint(exploreCrypt); // Checkpoint before entering crypt
            showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                "The air within the crypt is heavy and cold. Dust motes dance in the faint light. Ahead, a disturbed sarcophagus suggests recent activity...",
                "images/cryptinterior.png" // Image for inside crypt
            );
            waitForContinue(() => cryptEncounter());
        };
        window.avoidCrypt = function() {
            showDialogue(player, "This place feels too unsettling. Best to leave it be.");
            waitForContinue(whisperingWoodsDay);
        };
    } else {
        // Resource finding mission
        showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
            "You notice some rare herbs growing nearby, or perhaps signs of small game.",
            "images/resources.png" // Image for resources
        );
        optionsDiv.innerHTML = `
            <button onclick="gatherResources()">Gather Resources (WIS Check DC 11)</button>
            <button onclick="ignoreResources()">Ignore and continue travel</button>
        `;
        window.gatherResources = function() {
            askDiceRoll("Roll to gather resources effectively (WIS check, DC 11)", (roll) => {
                if (roll >= 11) {
                    showDialogue(player, "You skillfully gather valuable herbs and berries.");
                    rewardParty(5, {name: "Wild Berries", quantity: 3, icon: "🍓"});
                    waitForContinue(whisperingWoodsDay);
                } else {
                    showDialogue(player, "You struggle to find anything useful, or the herbs turn out to be poisonous.");
                    showDialogue({ name: "System", icon: "⚙️" }, "You gain nothing useful.");
                    waitForContinue(whisperingWoodsDay);
                }
            });
        };
        window.ignoreResources = function() {
            showDialogue(player, "You press on, focusing on reaching your destination.");
            waitForContinue(whisperingWoodsDay);
        };
    }
}

function cryptEncounter() {
    setCheckpoint(cryptEncounter);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "Suddenly, skeletal figures rise from the dust, guardians of the crypt!",
        "images/skeletalattack.png" // Image for crypt encounter
    );
    partyCombat({
        enemies: [
            { name: "Skeleton Warrior", icon: "🦴", class: "Undead", str: 10, dex: 8, int: 5, hp: 15, portraitUrl: "images/skeleton.png", knownSkills: ["Attack"] },
            { name: "Crypt Ghoul", icon: "🧟", class: "Undead", str: 14, dex: 10, int: 7, hp: 20, portraitUrl: "images/ghoul.png", knownSkills: ["Attack"] }
        ],
        desc: "Undead guardians animate to defend their rest!",
        goldReward: 40,
        itemReward: {name: "Ancient Coin", quantity: 1, icon: "🪙"},
        onDefeat: () => {
            showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                "The crypt is silent once more. You find some valuables among the dust."
            );
            optionsDiv.innerHTML = `<button id="continueCryptBtn">Continue searching</button>`;
            document.getElementById('continueCryptBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                findCryptTreasure();
            };
        }
    });
}

function findCryptTreasure() {
    setCheckpoint(findCryptTreasure);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "Deeper in the crypt, you discover a hidden compartment containing an ancient, dusty chest.",
        "images/treasure.png" // Image for crypt treasure
    );
    optionsDiv.innerHTML = `
        <button onclick="attemptToOpenChest()">Attempt to open the chest (DEX Check DC 13)</button>
        <button onclick="leaveCrypt()">Leave the crypt</button>
    `;

    window.attemptToOpenChest = function() {
        askDiceRoll("Roll to pick the lock or force it open (DEX check, DC 13)", (roll) => {
            if (roll >= 13) {
                showDialogue(player, "You manage to open the chest!");
                rewardParty(50, {name: "Silver Locket", quantity: 1, icon: "📿"});
                waitForContinue(whisperingWoodsDay);
            } else {
                showDialogue(player, "The chest's lock is sturdy, or you lack the right tools. It won't budge.");
                waitForContinue(whisperingWoodsDay);
            }
        });
    };
    window.leaveCrypt = function() {
        showDialogue(player, "You decide the crypt holds no more for you and leave.");
        waitForContinue(whisperingWoodsDay);
    };
}


function enterGoldenspireCity() {
    setCheckpoint(enterGoldenspireCity);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "Finally, after days of travel through the Whispering Woods, the trees thin, and the grand spires of Goldenspire City gleam in the distance. You have arrived!",
        "images/goldenspire.png" // Image for Goldenspire
    );
    optionsDiv.innerHTML = `
        <button onclick="exploreGoldenspire()">Explore Goldenspire City</button>
        <button onclick="visitGoldenspireShop()">Visit the City Shop</button>
    `;
}

function exploreGoldenspire() {
    setCheckpoint(exploreGoldenspire); // Added checkpoint
    showDialogue({ name: "Goldenspire Guard", icon: "💂", portraitUrl: "images/guard3.png" },
        "Welcome to Goldenspire, travelers. May your stay be prosperous. Be wary of the rumors of strange disappearances near the outer walls.",
        "images/cityguardq.png" // Image for Goldenspire Guard
    );
    showOptions([
        { text: "Ask about the disappearances", action: () => {
            showDialogue(player, "What can you tell us about these disappearances?");
            waitForContinue(() => {
                showDialogue({name: "Goldenspire Guard", icon: "💂", portraitUrl: "images/guard3.png"}, "Just strange cult-like markings and whispers in the night. The Mayor is offering a reward for any information.");
                // ADVANCE DAY WITHIN THE SAME AREA
                advanceDayInArea(goldenspireMystery);
            });
        }},
        { text: "Find an Inn", action: () => {
            showDialogue(player, "We seek a place to rest.");
            waitForContinue(() => {
                showDialogue({name: "Innkeeper", icon: "🍺", portraitUrl: "images/innkeeper.png"}, "Welcome to The Gilded Gryphon! Rooms are 5 gold a night.");
                gold -= 5; // Deduct gold for rest
                showDialogue({ name: "System", icon: "⚙️", portraitUrl: "images/narrator.png" }, `You spent 5 gold for a night's rest. You now have ${gold} gold.`); // MODIFIED: Added gold loss message
                rest(); // Automatically rests and uses gold
                waitForContinue(enterGoldenspireCity); // Return to city options after rest
            });
        }},
        { text: "Look for new quests", action: () => {
            showDialogue(player, "We are adventurers looking for work.");
            // ADVANCE DAY WITHIN THE SAME AREA
            advanceDayInArea(goldenspireQuests);
        }}
    ]);
}

function visitGoldenspireShop() {
    setCheckpoint(visitGoldenspireShop); // Added checkpoint
    showDialogue({ name: "Shopkeeper", icon: "🧑‍💼", portraitUrl: "images/shopkeeper.png" },
        "Welcome to 'The Golden Hoard', where quality meets convenience!",
        "images/cityshop.png" // Image for city shop
    );
    renderShop(); // Displays the shop items
    optionsDiv.innerHTML = `<button onclick="enterGoldenspireCity()">Leave Shop</button>`;
}

function goldenspireMystery() {
    setCheckpoint(goldenspireMystery);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "You decide to investigate the disappearances in Goldenspire City. Following the guard's vague directions, you find strange markings on an alley wall.",
        "images/strangemarking.png" // Image for mystery markings
    );
    showOptions([
        {
            text: "Examine the markings (INT Check DC 15)",
            diceCheck: {
                prompt: "Roll to decipher the strange markings.",
                dc: 15,
                success: () => {
                    showDialogue(player, "You recognize ancient cultist symbols, pointing towards the old abandoned temple outside the city walls.");
                    rewardParty(20);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => cultistLair());
                },
                fail: () => {
                    showDialogue(player, "The symbols are meaningless to you. You spend hours confused.");
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(enterGoldenspireCity);
                }
            }
        },
        {
            text: "Ask around (CHA Check DC 14)",
            diceCheck: {
                prompt: "Roll to gather information from nervous townsfolk.",
                dc: 14,
                success: () => {
                    showDialogue(player, "A frightened merchant whispers about cloaked figures dragging people towards the old temple.");
                    rewardParty(20);
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(() => cultistLair());
                },
                fail: () => {
                    showDialogue(player, "The townsfolk are too scared to talk, or give you false leads.");
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(enterGoldenspireCity);
                }
            }
        }
    ]);
}

function cultistLair() {
    setCheckpoint(cultistLair);
    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
        "You arrive at the dilapidated temple, an ominous aura emanating from within. As you approach, cloaked figures emerge, chanting unsettling incantations!",
        "images/cultistlair.png" // Image for cultist lair
    );
    partyCombat({
        enemies: [
            { name: "Cultist Initiate", icon: "🌑", class: "Human Cultist", str: 10, dex: 10, int: 8, hp: 16, portraitUrl: "images/cultist1.png", knownSkills: ["Attack"] },
            { name: "Cultist Fanatic", icon: " fanatic", class: "Human Cultist", str: 12, dex: 10, int: 10, hp: 20, portraitUrl: "images/cultist2.png", knownSkills: ["Attack"] },
            { name: "Cultist Sorcerer", icon: "✨", class: "Human Sorcerer", str: 8, dex: 12, int: 16, hp: 25, portraitUrl: "images/cultistsorcerer.png", knownSkills: ["Attack", "Fireball"] }
        ],
        desc: "A group of dark cultists blocks your way!",
        goldReward: 60,
        itemReward: {name: "Cultist Robe", quantity: 1, icon: "🧥"},
        onDefeat: () => {
            showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                "The cultists are defeated! You have saved the missing townsfolk and brought peace to Goldenspire.",
                "images/cultistsdefeated.png" // Image for cultists defeated
            );
            optionsDiv.innerHTML = `<button id="chapterEndBtn">Conclude Chapter</button>`;
            document.getElementById('chapterEndBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                endGame("victory"); // End the game with a victory
            };
        }
    });
}

function goldenspireQuests() {
    setCheckpoint(goldenspireQuests);
    showDialogue({ name: "Quest Board", icon: "📜", portraitUrl: "images/narrator.png" },
        "The city quest board offers several tasks. What will you choose?",
        "images/questboard.png" // Image for quest board
    );
    showOptions([
        { text: "Clear Rat Infestation (Combat)", action: () => {
            partyCombat({
                enemies: [{name: "Giant Rat Swarm", icon: "🐀", class: "Beast", str: 8, dex: 12, int: 2, hp: 15, portraitUrl: "images/rat.png", knownSkills: ["Attack"]}],
                desc: "A nasty rat infestation in the sewers!",
                goldReward: 20,
                onDefeat: () => {
                    showDialogue({name: "Narrator", icon: "📜"}, "You cleared the rat infestation!");
                    // ADVANCE DAY WITHIN THE SAME AREA
                    advanceDayInArea(enterGoldenspireCity);
                }
            });
        }},
        { text: "Retrieve Stolen Goods (Investigation)", diceCheck: {
            prompt: "Roll to track down the thieves (DEX Check DC 12)",
            dc: 12,
            success: () => {
                showDialogue(player, "You track the thieves to their hideout and retrieve the goods!");
                rewardParty(30, {name: "Rare Gem", quantity: 1, icon: "💎"});
                // ADVANCE DAY WITHIN THE SAME AREA
                advanceDayInArea(enterGoldenspireCity);
            },
            fail: () => {
                showDialogue(player, "The thieves are too elusive, you lose their trail.");
                // ADVANCE DAY WITHIN THE SAME AREA
                advanceDayInArea(enterGoldenspireCity);
            }
        }},
        { text: "Return to City Center", action: () => { enterGoldenspireCity(); }}
    ]);
}


function endGame(outcome) {
    // Hide story image on game end
    storyImage.style.display = 'none';
    storyImage.src = '';

    if (outcome === "victory") {
        storyDiv.innerHTML = `<h2 style="color:#2ecc4c;font-size:2em;text-align:center;">🏆 Victory! 🏆</h2>
            <p style="text-align:center;">You have brought light to the dark corners of Eldoria. Your legend as the Orc Paladin will echo through the ages!</p>`;
    } else { // Can be extended for other outcomes
        storyDiv.innerHTML = `<h2 style="color:#e74c3c;font-size:2em;text-align:center;">Game Over</h2>
            <p style="text-align:center;">Your journey concludes.</p>`;
    }
    optionsDiv.innerHTML = `<button onclick="location.reload()">Play Again</button>`;
    diceDiv.innerHTML = "";
    pauseMusic(); // Pause music on game over
}


// --- Dropdown functionality ---
function toggleDropdown(event) {
    const button = event.currentTarget;
    const targetId = button.dataset.target;
    const content = document.getElementById(targetId);

    // Close all other dropdowns
    document.querySelectorAll('.dropdown-content.active').forEach(openContent => {
        if (openContent.id !== targetId) {
            openContent.classList.remove('active');
            openContent.previousElementSibling.classList.remove('active'); // Remove active from button
        }
    });

    // Toggle the clicked one
    button.classList.toggle('active');
    content.classList.toggle('active');
    // --- NEW: Render shop if the shop dropdown is opened ---
    if (targetId === "shop-section-content" && content.classList.contains('active')) {
        renderShop();
    }
    // NEW: Render skill selection if that dropdown is opened
    if (targetId === "skill-selection-content" && content.classList.contains('active')) {
        renderSkillSelection();
    }
}

// --- Music Control Functions ---
function playMusic() {
    if (backgroundMusic) {
        backgroundMusic.play().catch(e => console.error("Error playing music:", e));
        musicToggleButton.textContent = "Music: ON 🎵";
        musicToggleButton.classList.add('active');
    }
}

function pauseMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        musicToggleButton.textContent = "Music: OFF 🔇";
        musicToggleButton.classList.remove('active');
    }
}

function toggleMusic() {
    if (backgroundMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
}


// --- Initialize the game ---
function showStartScreen() {
    startScreen.style.display = 'flex';
    gameWrapper.style.display = 'none'; // Ensure game wrapper is hidden initially
    startGameButton.onclick = () => {
        startScreen.style.display = 'none';
        gameWrapper.style.display = 'flex'; // Show game wrapper
        gameWrapper.classList.add('visible'); // Trigger animation
        characterCreator();
        playMusic(); // Start music when the game begins
    };

    // Attach dropdown listeners once on load
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener('click', toggleDropdown);
    });

    // Attach music toggle listener
    if (musicToggleButton) {
        musicToggleButton.addEventListener('click', toggleMusic);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Initial update to set default values in sidebar
    updateSidebar();
    showStartScreen();
});