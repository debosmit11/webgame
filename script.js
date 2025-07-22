// --- Game Data ---
const partyMembers = [
    {
        name: "Brother Aldous",
        class: "Human Cleric",
        str: 10,
        dex: 10,
        int: 16,
        hp: 18,
        icon: "⛪",
        portraitUrl: "images/mhum1.png"
    },
    {
        name: "Sister Mira",
        class: "Elf Ranger",
        str: 12,
        dex: 16,
        int: 12,
        hp: 20,
        icon: "🏹",
        portraitUrl: "images/felf1.png"
    },
    {
        name: "Durgan",
        class: "Dwarf Fighter",
        str: 16,
        dex: 10,
        int: 8,
        hp: 24,
        icon: "🛡️",
        portraitUrl: "images/mdwrf1.png"
    },
    {
        name: "Tikka",
        class: "Halfling Rogue",
        str: 9,
        dex: 18,
        int: 13,
        hp: 16,
        icon: "🗡️",
        portraitUrl: "images/mhlf1.png"
    },
    {
        name: "Eldra",
        class: "Half-Elf Sorcerer",
        str: 8,
        dex: 12,
        int: 18,
        hp: 15,
        icon: "✨",
        portraitUrl: "images/fhelf1.png"
    }
];

let player = null;
let party = [];
let dayCount = 1;
let lastCheckpoint = null;

// --- DOM Elements ---
const storyDiv = document.getElementById('story');
const optionsDiv = document.getElementById('options');
const diceDiv = document.getElementById('dice');
const charSheetDiv = document.getElementById('character-sheet');

// --- Portrait & Chat Utility ---
function getPortrait(character) {
    if (character.portraitUrl) {
        // Larger, square, rounded edges
        return `<img class="portrait" src="${character.portraitUrl}" alt="${character.name}" style="width:4em;height:4em;border-radius:12px;margin-right:14px;object-fit:cover;background:#333;" />`;
    } else {
        return `<img class="portrait" src="placeholder.png" alt="portrait" style="width:4em;height:4em;border-radius:12px;margin-right:14px;object-fit:cover;background:#333;" />`;
    }
}

function showDialogue(speaker, text) {
    storyDiv.innerHTML = `
        <div class="chat-row" style="display:flex;align-items:flex-start;margin-bottom:10px;">
            <div style="flex-shrink:0;">${getPortrait(speaker)}</div>
            <div style="background:#222;padding:10px 16px;border-radius:12px;max-width:80%;color:#fff;">
                <b>${speaker.name}:</b> ${text}
            </div>
        </div>
    `;
}

// --- Story Premise ---
function getStoryPremise(name) {
    return `
You are ${name}, an orc outcast who has found faith in the light of the gods. Once feared as a marauder, you now walk the path of a paladin, seeking redemption and justice in a world that mistrusts your kind. 
Your journey begins as you receive a vision: a village is threatened by a rising darkness, and only you can stand against it. Will you prove that even an orc can be a true champion of the light?
`;
}

// --- Character Creator ---
function characterCreator() {
    storyDiv.innerHTML = `<h2>Create Your Orc Paladin</h2>
        <label>Name: <input id="charName" maxlength="16" placeholder="Grushnak" /></label>
        <button id="rollStatsBtn">Roll Attributes</button>
        <div id="rolledStats"></div>
    `;
    optionsDiv.innerHTML = "";
    diceDiv.innerHTML = "";

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
            player = {
                name,
                class: "Paladin",
                str: stats.str,
                dex: stats.dex,
                con: stats.con,
                int: stats.int,
                wis: stats.wis,
                cha: stats.cha,
                hp: hp > 0 ? hp : 1,
                icon: "🗡️",
                portraitUrl: "images/orc1.png"
            };
            party = [player];
            startGame();
        };
    };
}

// --- Utility: Set checkpoint before each major section ---
function setCheckpoint(sectionFunc) {
    lastCheckpoint = sectionFunc;
}

// --- Functions ---
function renderCharacterSheet() {
    if (player && player.hp < 0) player.hp = 0;
    charSheetDiv.innerHTML = `<h3>Party</h3>` + party.map(member => `
        <div class="character" style="display:flex;align-items:center;margin-bottom:10px;">
            <div style="flex-shrink:0;">
                ${getPortrait(member)}
            </div>
            <div>
                <strong>${member.name}</strong> (${member.class})<br>
                STR: ${member.str} | DEX: ${member.dex} | INT: ${member.int} | WIS: ${member.wis !== undefined ? member.wis : "-"} | CHA: ${member.cha !== undefined ? member.cha : "-"} | HP: ${member.hp}
            </div>
        </div>
    `).join('');
    if (player && player.hp <= 0) {
        showDeathScreen();
    }
}

function showDeathScreen() {
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
        player.hp = 1;
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
            });
        } else {
            opt.action();
        }
    };
}

// --- Enhanced Turn-Based Combat System ---
function partyCombat(enemyGroup, nextScene) {
    let combatLog = [];
    let turnOrder = [];
    let turnIndex = 0;
    let inCombat = true;

    const partyCombatants = party.map((m, i) => ({
        ...m,
        side: "party",
        idx: i,
        currentHp: m.hp,
        maxHp: m.hp,
        isAlive: function() { return this.currentHp > 0; }
    }));
    const enemyCombatants = enemyGroup.enemies.map((e, i) => ({
        ...e,
        side: "enemy",
        idx: i,
        currentHp: e.hp,
        maxHp: e.hp,
        isAlive: function() { return this.currentHp > 0; }
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
        c.initiative = rollDice(20) + Math.floor((c.dex || 10) / 2);
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
                    <strong>${m.name}</strong> (${m.class})<br>
                    HP: <span style="color:${m.currentHp > 0 ? '#2ecc40' : '#e74c3c'}">${Math.max(0, m.currentHp)}</span> / ${m.maxHp}
                </div>
            </div>
        `).join('');
        let enemyStatus = enemyCombatants.map(e => `
            <div class="character" style="display:flex;align-items:center;margin-bottom:6px;">
                ${getPortrait(e)}
                <div>
                    <strong>${e.name}</strong> (${e.class || "Monster"})<br>
                    HP: <span style="color:${e.currentHp > 0 ? '#2ecc40' : '#e74c3c'}">${Math.max(0, e.currentHp)}</span> / ${e.maxHp}
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
            renderCombat();
            setTimeout(() => {
                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "Combat won");
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

    function getAvailableActions(combatant) {
        let actions = [];
        // Basic attack
        actions.push({
            name: "Attack",
            desc: "Attack a foe with your weapon.",
            fn: (target) => {
                let attackRoll = rollDice(20) + Math.floor((combatant.str - 10) / 2);
                let targetAC = 10 + Math.floor(((target.dex || 10) - 10) / 2);
                if (attackRoll - Math.floor((combatant.str - 10) / 2) === 20) {
                    let dmg = rollDice(8) + Math.floor((combatant.str - 10) / 2) + 2;
                    target.currentHp -= dmg;
                    addLog(`💥 <b>${combatant.name}</b> (CRIT) hits <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                } else if (attackRoll >= targetAC) {
                    let dmg = rollDice(8) + Math.floor((combatant.str - 10) / 2);
                    target.currentHp -= dmg;
                    addLog(`🗡️ <b>${combatant.name}</b> hits <b>${target.name}</b> for <b>${dmg}</b> damage.`);
                } else {
                    addLog(`❌ <b>${combatant.name}</b> misses <b>${target.name}</b>.`);
                }
            }
        });

        // Paladin Skill: Bless
        if (combatant.class && combatant.class.toLowerCase().includes("paladin")) {
            actions.push({
                name: "Bless",
                desc: "Heal all party members for 3 HP (1d6 skill check).",
                fn: () => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Bless and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to cast Bless.`);
                    } else if (skillRoll <= 5) {
                        getAlive("party").forEach(m => {
                            m.currentHp = Math.min(m.maxHp, m.currentHp + 3);
                        });
                        addLog(`✨ <b>${combatant.name}</b> successfully casts Bless! All party members heal 3 HP.`);
                    } else {
                        getAlive("party").forEach(m => {
                            m.currentHp = Math.min(m.maxHp, m.currentHp + 3);
                        });
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Bless! All party members heal 3 HP and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        // Fighter Skill: Shield
        if (combatant.class && combatant.class.toLowerCase().includes("fighter")) {
            actions.push({
                name: "Shield",
                desc: "Nullifies next enemy attack for 1 turn (1d6 skill check).",
                fn: () => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Shield and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to cast Shield.`);
                    } else if (skillRoll <= 5) {
                        combatant.shielded = true;
                        addLog(`🛡️ <b>${combatant.name}</b> successfully casts Shield! Next enemy attack is nullified.`);
                    } else {
                        combatant.shielded = true;
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Shield! Next enemy attack is nullified and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        // Cleric Skill: Heal
        if (combatant.class && combatant.class.toLowerCase().includes("cleric")) {
            actions.push({
                name: "Heal",
                desc: "Restore 1d8+2 HP to an ally (1d6 skill check).",
                fn: (target) => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Heal and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to cast Heal.`);
                    } else if (skillRoll <= 5) {
                        let heal = rollDice(8) + 2;
                        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                        addLog(`✨ <b>${combatant.name}</b> heals <b>${target.name}</b> for <b>${heal}</b> HP.`);
                    } else {
                        let heal = rollDice(8) + 2;
                        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Heal! <b>${target.name}</b> heals <b>${heal}</b> HP and ${combatant.name} gains 1 HP.`);
                    }
                },
                targetSide: "party"
            });
        }

        // Sorcerer Skill: Fireball
        if (combatant.class && combatant.class.toLowerCase().includes("sorcerer")) {
            actions.push({
                name: "Fireball",
                desc: "Deal 2d6 fire damage to an enemy (1d6 skill check).",
                fn: (target) => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Fireball and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to cast Fireball.`);
                    } else if (skillRoll <= 5) {
                        let dmg = rollDice(6) + rollDice(6);
                        target.currentHp -= dmg;
                        addLog(`🔥 <b>${combatant.name}</b> casts Fireball on <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                    } else {
                        let dmg = rollDice(6) + rollDice(6);
                        target.currentHp -= dmg;
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Fireball! <b>${target.name}</b> takes <b>${dmg}</b> damage and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        // Ranger Skill: Arrow Shot
        if (combatant.class && combatant.class.toLowerCase().includes("ranger")) {
            actions.push({
                name: "Arrow Shot",
                desc: "Shoot an arrow for 1d8+DEX damage (1d6 skill check).",
                fn: (target) => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Arrow Shot and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to shoot Arrow.`);
                    } else if (skillRoll <= 5) {
                        let dmg = rollDice(8) + Math.floor((combatant.dex - 10) / 2);
                        target.currentHp -= dmg;
                        addLog(`🏹 <b>${combatant.name}</b> shoots an arrow at <b>${target.name}</b> for <b>${dmg}</b> damage.`);
                    } else {
                        let dmg = rollDice(8) + Math.floor((combatant.dex - 10) / 2);
                        target.currentHp -= dmg;
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Arrow Shot! <b>${target.name}</b> takes <b>${dmg}</b> damage and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        // Rogue Skill: Sneak Attack
        if (combatant.class && combatant.class.toLowerCase().includes("rogue")) {
            actions.push({
                name: "Sneak Attack",
                desc: "Deal 1d8+3 damage if enemy is not at full HP (1d6 skill check).",
                fn: (target) => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Sneak Attack and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails Sneak Attack.`);
                    } else if (skillRoll <= 5) {
                        let dmg = rollDice(8) + 3;
                        target.currentHp -= dmg;
                        addLog(`🗡️ <b>${combatant.name}</b> sneak attacks <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                    } else {
                        let dmg = rollDice(8) + 3;
                        target.currentHp -= dmg;
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Sneak Attack! <b>${target.name}</b> takes <b>${dmg}</b> damage and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        // Warlock Skill: Dark Bolt (for monsters)
        if (combatant.class && combatant.class.toLowerCase().includes("warlock")) {
            actions.push({
                name: "Dark Bolt",
                desc: "Deal 1d10 necrotic damage (1d6 skill check).",
                fn: (target) => {
                    let skillRoll = rollDice(6);
                    if (skillRoll === 1) {
                        combatant.currentHp = Math.max(0, combatant.currentHp - 1);
                        addLog(`💥 <b>${combatant.name}</b> critically fails Dark Bolt and takes 1 damage!`);
                    } else if (skillRoll <= 3) {
                        addLog(`❌ <b>${combatant.name}</b> fails to cast Dark Bolt.`);
                    } else if (skillRoll <= 5) {
                        let dmg = rollDice(10);
                        target.currentHp -= dmg;
                        addLog(`💀 <b>${combatant.name}</b> casts Dark Bolt on <b>${target.name}</b> for <b>${dmg}</b> damage!`);
                    } else {
                        let dmg = rollDice(10);
                        target.currentHp -= dmg;
                        combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + 1);
                        addLog(`🌟 <b>${combatant.name}</b> critically succeeds Dark Bolt! <b>${target.name}</b> takes <b>${dmg}</b> damage and ${combatant.name} gains 1 HP.`);
                    }
                }
            });
        }

        return actions;
    }

    function nextTurn() {
        if (!inCombat) return;
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
                } else {
                    targets = current.side === "party" ? getAlive("enemy") : getAlive("party");
                }
                if (targets.length === 1) {
                    action.fn(targets[0]);
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
                        actions[aIdx].fn(targets[tIdx]);
                        if (checkCombatEnd()) return;
                        turnIndex++;
                        setTimeout(nextTurn, 800);
                    };
                }
            };
        }
        else if (current.side === "enemy" && current.currentHp > 0) {
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
            let action = actions[Math.floor(Math.random() * actions.length)];
            let targets = [];
            if (action.targetSide === "enemy") {
                targets = getAlive("enemy");
            } else if (action.targetSide === "party") {
                targets = getAlive("party");
            } else {
                targets = getAlive("party");
            }
            let target = targets[Math.floor(Math.random() * targets.length)];
            setTimeout(() => {
                action.fn(target);
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
    let encounter = "";
    let effect = null;
    if (roll === 20) {
        if (party.length < 4) {
            const available = partyMembers.filter(m => !party.includes(m));
            if (available.length > 0) {
                const newComp = available[Math.floor(Math.random() * available.length)];
                party.push(newComp);
                encounter = `✨ You meet a new companion: ${newComp.icon} <b>${newComp.name}</b> joins your party!`;
                effect = () => renderCharacterSheet();
            } else {
                encounter = "✨ You find a rare magical item that heals you (+5 HP)!";
                effect = () => { player.hp += 5; renderCharacterSheet(); };
            }
        } else {
            encounter = "✨ You find a rare magical item that heals you (+5 HP)!";
            effect = () => { player.hp += 5; renderCharacterSheet(); };
        }
    } else if (roll >= 16) {
        encounter = "😊 You meet a friendly traveler who shares food and stories. (+2 HP)";
        effect = () => { player.hp += 2; renderCharacterSheet(); };
    } else if (roll >= 11) {
        encounter = "🚶‍♂️ The road is quiet, and you make good progress.";
    } else if (roll >= 6) {
        encounter = "⚠️ You stumble into a minor trap and lose 2 HP.";
        effect = () => { player.hp -= 2; renderCharacterSheet(); };
    } else if (roll > 1) {
        encounter = "👹 A monster ambushes you! (Party combat!)";
        effect = (nextScene) => {
            partyCombat({
                enemies: [{
                    name: "Orc Brute",
                    icon: "👹",
                    class: "Orc Brute",
                    str: 16,
                    dex: 10,
                    int: 6,
                    hp: 18 + dayCount * 2,
                    portraitUrl: "images/orcbrute.png"
                }],
                desc: "A hulking orc brute blocks your path!",
                onDefeat: () => {
                    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "The monster is defeated! You may continue your journey.");
                }
            }, nextScene);
        };
    } else {
        encounter = "💀 A deadly foe appears! (Party combat!)";
        effect = (nextScene) => {
            partyCombat({
                enemies: [{
                    name: "Dread Wraith",
                    icon: "💀",
                    class: "Wraith",
                    str: 14,
                    dex: 14,
                    int: 16,
                    hp: 30 + dayCount * 3,
                    portraitUrl: "images/wraith.png"
                }],
                desc: "A Dread Wraith emerges from the shadows!",
                onDefeat: () => {
                    showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "The deadly foe is vanquished! You may continue your journey.");
                }
            }, nextScene);
        };
    }
    return { roll, encounter, effect };
}

// --- Utility: Wait for click to continue ---
function waitForContinue(next) {
    optionsDiv.innerHTML = `<button id="continueBtn">Continue</button>`;
    document.getElementById('continueBtn').onclick = () => {
        optionsDiv.innerHTML = "";
        next();
    };
}

// --- Day/Night System: Only roll weather/encounter at the start of each new day ---
function newDay(nextSectionCallback) {
    dayCount++;
    // Only roll weather/encounter before greenhollowArrival and newChapterTown
    if (
        nextSectionCallback === greenhollowArrival ||
        nextSectionCallback === newChapterTown
    ) {
        const weatherResult = rollWeather();
        const encounterResult = rollEncounter();
        let weatherHtml = `<p><b>Day ${dayCount} Weather:</b> ${weatherResult.roll} - ${weatherResult.weather}</p>`;
        let encounterHtml = `<p><b>Day ${dayCount} Encounter:</b> ${encounterResult.roll} - ${encounterResult.encounter}</p>`;
        if (encounterResult.effect) {
            if (encounterResult.effect.length > 0) {
                encounterResult.effect(nextSectionCallback);
            } else {
                encounterResult.effect();
                waitForContinue(nextSectionCallback);
            }
        } else {
            storyDiv.innerHTML = weatherHtml + encounterHtml;
            waitForContinue(nextSectionCallback);
        }
    } else {
        // No weather/encounter roll for other sections
        nextSectionCallback();
    }
}

// --- Insert setCheckpoint before each major section ---
function startGame() {
    dayCount = 1;
    setCheckpoint(startGame);
    storyDiv.innerHTML = `<p>${getStoryPremise(player.name)}</p>`;
    showOptions([
        {
            text: "Begin your quest",
            action: () => {
                recruitParty();
            }
        }
    ]);
    renderCharacterSheet();
}

function recruitParty() {
    setCheckpoint(recruitParty);
    storyDiv.innerHTML = `<p>Before you set out, you may choose <b>two</b> companions to join you on your path of redemption.</p>`;
    let chosen = [];
    function renderRecruitOptions() {
        showOptions(
            partyMembers
                .filter(m => !chosen.includes(m))
                .map((member, idx) => ({
                    text: `Recruit ${member.icon} ${member.name} (${member.class})`,
                    action: () => {
                        chosen.push(member);
                        if (chosen.length < 2) {
                            showDialogue(member, `${member.name} joins your cause! Choose one more companion.`);
                            renderRecruitOptions();
                        } else {
                            party = [player, ...chosen];
                            showDialogue(
                                { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                                `${chosen.map(m => m.name).join(" and ")} join your party!`
                            );
                            renderCharacterSheet();
                            waitForContinue(() => newDay(firstVision));
                        }
                        renderCharacterSheet();
                    }
                }))
        );
    }
    renderRecruitOptions();
}

function firstVision() {
    setCheckpoint(firstVision);
    showDialogue(
        { name: player.name, icon: player.icon, portraitUrl: player.portraitUrl },
        `That night, you dream of a burning village and hear a voice: "${player.name}, the innocent need your strength. Will you answer the call?"`
    );
    showOptions([
        {
            text: "Swear an oath to help",
            action: () => {
                showDialogue(player, "You awaken with resolve. The village of Greenhollow is in danger. You set out at dawn.");
                waitForContinue(() => newDay(roadEncounter));
            }
        },
        {
            text: "Ignore the vision",
            action: () => {
                showDialogue(player, "You try to ignore the vision, but guilt gnaws at you. At sunrise, you decide to help after all.");
                waitForContinue(() => newDay(roadEncounter));
            }
        }
    ]);
}

function roadEncounter() {
    setCheckpoint(roadEncounter);
    showDialogue(
        { name: "Guard Captain", icon: "🛡️", portraitUrl: "images/guard1.png" },
        `On the road to Greenhollow, a group of suspicious guards stops you. "Orc! State your business!"`
    );
    showOptions([
        {
            text: "Speak honestly 🗣️",
            diceCheck: {
                prompt: "Roll to persuade the guards (INT check, DC 13)",
                dc: 13,
                success: () => {
                    showDialogue(player, "The guards, surprised by your honesty, let you pass but warn you to behave.");
                    waitForContinue(() => newDay(greenhollowArrival));
                },
                fail: () => {
                    showDialogue(player, "The guards don't trust you and demand a bribe. Lose 2 HP in the scuffle.");
                    player.hp -= 2;
                    renderCharacterSheet();
                    waitForContinue(() => {
                        // Avoidable combat scene if persuasion fails
                        partyCombat({
                            enemies: [{
                                name: "Guard Captain",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 14,
                                dex: 12,
                                int: 10,
                                hp: 18,
                                portraitUrl: "images/guard1.png"
                            },
                            {
                                name: "Guard",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 12,
                                dex: 12,
                                int: 10,
                                hp: 14,
                                portraitUrl: "images/guard2.png"
                            }],
                            desc: "The guards attack you!",
                            onDefeat: () => {
                                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "You defeat the guards and continue your journey.");
                                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                                document.getElementById('combatContinueBtn').onclick = () => {
                                    optionsDiv.innerHTML = "";
                                    newDay(greenhollowArrival);
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
                    waitForContinue(() => newDay(greenhollowArrival));
                },
                fail: () => {
                    showDialogue(player, "The guards attack! You lose 4 HP before escaping.");
                    player.hp -= 4;
                    renderCharacterSheet();
                    waitForContinue(() => {
                        // Avoidable combat scene if intimidation fails
                        partyCombat({
                            enemies: [{
                                name: "Guard Captain",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 14,
                                dex: 12,
                                int: 10,
                                hp: 18,
                                portraitUrl: "images/guard1.png"
                            },
                            {
                                name: "Guard",
                                icon: "🛡️",
                                class: "Human Fighter",
                                str: 12,
                                dex: 12,
                                int: 10,
                                hp: 14,
                                portraitUrl: "images/guard2.png"
                            }],
                            desc: "The guards attack you!",
                            onDefeat: () => {
                                showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "You defeat the guards and continue your journey.");
                                optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
                                document.getElementById('combatContinueBtn').onclick = () => {
                                    optionsDiv.innerHTML = "";
                                    newDay(greenhollowArrival);
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
        `Please, my mother is trapped in the burning mill!`
    );
    showOptions([
        {
            text: "Rush into the flames 🔥",
            diceCheck: {
                prompt: "Roll to brave the fire (STR check, DC 14)",
                dc: 14,
                success: () => {
                    showDialogue(player, "You carry the woman to safety. The villagers begin to trust you.");
                    waitForContinue(() => newDay(darknessRevealed));
                },
                fail: () => {
                    showDialogue(player, "You save the woman but are burned. Lose 5 HP.");
                    player.hp -= 5;
                    renderCharacterSheet();
                    waitForContinue(() => newDay(darknessRevealed));
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
                    waitForContinue(() => newDay(darknessRevealed));
                },
                fail: () => {
                    showDialogue(player, "The rescue is chaotic. The woman is saved, but you are exhausted. Lose 3 HP.");
                    player.hp -= 3;
                    renderCharacterSheet();
                    waitForContinue(() => newDay(darknessRevealed));
                }
            }
        }
    ]);
}

function darknessRevealed() {
    setCheckpoint(darknessRevealed);
    showDialogue(
        { name: "Warlock", portraitUrl: "images/warlock.png" },
        `That night, a shadowy cult attacks the village. Their leader, a dark warlock, calls you out: "Orc! You do not belong here!"`
    );
    showOptions([
        {
            text: "Challenge the warlock ⚔️",
            diceCheck: {
                prompt: "Roll to duel the warlock (STR check, DC 15)",
                dc: 15,
                success: () => {
                    showDialogue(player, "You defeat the warlock in single combat. The cultists scatter.");
                    waitForContinue(() => newDay(redemption));
                },
                fail: () => {
                    showDialogue(player, "The warlock wounds you with dark magic. Lose 6 HP.");
                    player.hp -= 6;
                    renderCharacterSheet();
                    waitForContinue(() => newDay(redemption));
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
                    waitForContinue(() => newDay(redemption));
                },
                fail: () => {
                    showDialogue(player, "The villagers hesitate, and the cultists cause havoc. Lose 4 HP.");
                    player.hp -= 4;
                    renderCharacterSheet();
                    waitForContinue(() => newDay(redemption));
                }
            }
        }
    ]);
}

function redemption() {
    setCheckpoint(redemption);
    showDialogue(
        { name: "Priest", portraitUrl: "images/priest.png" },
        `With the village safe, the people gather to thank you. The local priest offers you a blessing. "You have shown us that redemption is possible for all."`
    );
    showOptions([
        {
            text: "Accept the blessing ✨",
            action: () => {
                showDialogue(player, "You feel the light of the gods fill you. Your HP is fully restored!");
                player.hp = 10 + Math.floor((player.con - 10) / 2);
                renderCharacterSheet();
                waitForContinue(() => newDay(finalBattle));
            }
        },
        {
            text: "Humbly refuse",
            action: () => {
                showDialogue(player, "You thank the priest, but say your deeds are their own reward.");
                waitForContinue(() => newDay(finalBattle));
            }
        }
    ]);
}
// ...existing code...

function finalBattle() {
    setCheckpoint(finalBattle);
    showDialogue(
        { name: "Narrator", icon: "📜" },
        "As dawn breaks, the warlock returns, now a monstrous demon! The villagers cower. It is up to you and your companions to stand against the darkness."
    );
    // Compulsory combat scene with Warlock/Demon
    partyCombat({
        enemies: [{
            name: "Dark Warlock",
            icon: "🧙‍♂️",
            class: "Warlock",
            str: 12,
            dex: 14,
            int: 18,
            hp: 32,
            portraitUrl: "images/warlock.png"
        },
        {
            name: "Demon Form",
            icon: "👹",
            class: "Demon",
            str: 18,
            dex: 12,
            int: 14,
            hp: 40,
            portraitUrl: "images/demon.png"
        }],
        desc: "The warlock transforms into a demon and attacks!",
        onDefeat: () => {
            showDialogue({ name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" }, "Your party defeats the demon! The village is saved and you are hailed as a true paladin!");
            optionsDiv.innerHTML = `<button id="combatContinueBtn">Continue</button>`;
            document.getElementById('combatContinueBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                newChapterTown();
            };
        }
    });
}

// --- New Chapter: Town Mystery ---
function newChapterTown() {
    setCheckpoint(newChapterTown);
    showDialogue(
        { name: "Narrator", icon: "📜" },
        "After your victory, your party travels to the bustling town of Silverbrook. The streets are lively, but a shadow of unease hangs over the townsfolk."
    );
    waitForContinue(() => {
        showDialogue(
            { name: "Innkeeper", icon: "🍺", portraitUrl: "images/innkeeper.png" },
            "Welcome, travelers! Strange things have been happening at night. People are vanishing, and the mayor is desperate for help."
        );
        optionsDiv.innerHTML = `<button id="townMysteryBtn">Investigate the mystery</button>`;
        document.getElementById('townMysteryBtn').onclick = () => {
            optionsDiv.innerHTML = "";
            townMysteryInvestigation();
        };
    });
}

function townMysteryInvestigation() {
    showDialogue(
        { name: "Mayor", icon: "🏛️", portraitUrl: "images/mayor.png" },
        "Thank goodness you're here! Last night, the blacksmith disappeared. Can you help us find out what's happening?"
    );
    showOptions([
        {
            text: "Search the blacksmith's shop 🔍",
            diceCheck: {
                prompt: "Roll to investigate (INT check, DC 14)",
                dc: 14,
                success: () => {
                    showDialogue(player, "You find a hidden passage beneath the shop leading to the old sewers.");
                    waitForContinue(() => sewerBattle());
                },
                fail: () => {
                    showDialogue(player, "You find nothing but soot and tools. The trail is cold.");
                    waitForContinue(() => townMysteryClue());
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
                    waitForContinue(() => sewerBattle());
                },
                fail: () => {
                    showDialogue(player, "No one seems willing to talk. You'll have to search for clues yourself.");
                    waitForContinue(() => townMysteryClue());
                }
            }
        }
    ]);
}

function townMysteryClue() {
    showDialogue(
        { name: "Party Member", icon: "🗡️" },
        "Maybe we should check the sewers. That's where trouble usually hides!"
    );
    waitForContinue(() => sewerBattle());
}

function sewerBattle() {
    showDialogue(
        { name: "Narrator", icon: "📜" },
        "You descend into the dark, damp sewers. Suddenly, monstrous rats and a shadowy figure attack!"
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
                hp: 12,
                portraitUrl: "images/rat.png"
            },
            {
                name: "Shadowy Kidnapper",
                icon: "🕵️",
                class: "Rogue",
                str: 12,
                dex: 16,
                int: 12,
                hp: 18,
                portraitUrl: "images/kidnapper.png"
            }
        ],
        desc: "A swarm of giant rats and a mysterious kidnapper attack!",
        onDefeat: () => {
            showDialogue(
                { name: "Narrator", icon: "📜", portraitUrl: "images/narrator.png" },
                "You defeat the monsters and rescue the missing townsfolk. The mayor is overjoyed!"
            );
            optionsDiv.innerHTML = `<button id="chapterContinueBtn">Continue</button>`;
            document.getElementById('chapterContinueBtn').onclick = () => {
                optionsDiv.innerHTML = "";
                newCompanionJoins();
            };
        }
    });
}

function newCompanionJoins() {
    // Example new companion
    const newCompanion = {
        name: "Lira",
        class: "Human Bard",
        str: 8,
        dex: 14,
        int: 15,
        hp: 16,
        icon: "🎶",
        portraitUrl: "images/bard.png"
    };
    party.push(newCompanion);
    renderCharacterSheet();
    showDialogue(
        newCompanion,
        "Thank you for saving me! I would be honored to join your party and help on your adventures."
    );
    optionsDiv.innerHTML = `<button id="nextAdventureBtn">Continue your journey</button>`;
    document.getElementById('nextAdventureBtn').onclick = () => {
        optionsDiv.innerHTML = "";
        showDialogue(
            { name: "Narrator", icon: "📜" },
            "With a new companion, your party sets out for new adventures, ready to face whatever challenges await!"
        );
        optionsDiv.innerHTML = `<button onclick="location.reload()">Play Again</button>`;
    };
}

// --- Initialize the game ---
document.addEventListener('DOMContentLoaded', () => {
    characterCreator();
    renderCharacterSheet();
});