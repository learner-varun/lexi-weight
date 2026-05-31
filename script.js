document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const weightTableEl = document.getElementById('weight-table');
    const toggleWeightsBtn = document.getElementById('toggle-weights');
    const scoreDisplay = document.getElementById('score-display');
    const timerBar = document.getElementById('timer-bar');
    const rulesText = document.getElementById('rules-text');
    const requiredLettersDisplay = document.getElementById('required-letters-display');
    const letterBank = document.getElementById('letter-bank');
    const gameBoard = document.getElementById('game-board');
    const slots = document.querySelectorAll('.slot');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // Modals
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalActionBtn = document.getElementById('modal-action-btn');

    // Game State
    let currentLevel = 1;
    let score = 0;
    let timerInterval;
    let totalTime = 30;
    let timeRemaining = 30;
    let requiredLetters = [];
    let isGameOver = false;
    let winStreak = 0;

    // Constants
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const WEIGHTS = {};
    ALPHABET.forEach((char, index) => {
        WEIGHTS[char] = index + 1;
    });

    const LEVEL_CONFIG = {
        1: { time: 30, reqCount: 2, reward: 100 },
        2: { time: 45, reqCount: 3, reward: 250 },
        3: { time: 60, reqCount: 4, reward: 500 }
    };

    // Initialize UI
    function initUI() {
        // Build Weight Table
        ALPHABET.forEach(char => {
            const div = document.createElement('div');
            div.className = 'wt-item';
            div.innerHTML = `<span class="wt-letter">${char}</span><span class="wt-val">${WEIGHTS[char]}</span>`;
            weightTableEl.appendChild(div);
        });

        toggleWeightsBtn.addEventListener('click', () => {
            weightTableEl.classList.toggle('hidden');
        });

        // Build Letter Bank
        ALPHABET.forEach(char => {
            const letterEl = createLetterElement(char);
            letterBank.appendChild(letterEl);
        });

        // Setup Drag and Drop for slots
        slots.forEach(slot => {
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
            
            // Allow click to remove letter from slot
            slot.addEventListener('click', (e) => {
                if (slot.dataset.index === "1") return; // Prevent removing from first slot
                if (slot.children.length > 0) {
                    slot.innerHTML = '';
                }
            });
        });

        // Setup Letter Bank drag events
        letterBank.addEventListener('dragover', handleDragOver);
        letterBank.addEventListener('dragleave', handleDragLeave);
        letterBank.addEventListener('drop', handleBankDrop);

        submitBtn.addEventListener('click', handleSubmit);
        clearBtn.addEventListener('click', clearBoard);
        modalActionBtn.addEventListener('click', handleModalAction);

        // Setup Keyboard support
        document.addEventListener('keydown', handleKeyDown);

        // Setup Custom Dropdown
        const customSelect = document.getElementById('custom-level-select');
        const selectSelected = customSelect.querySelector('.select-selected');
        const selectItems = customSelect.querySelector('.select-items');
        const itemsList = selectItems.querySelectorAll('div');

        selectSelected.addEventListener('click', function(e) {
            e.stopPropagation();
            selectItems.classList.toggle('select-hide');
        });

        itemsList.forEach(item => {
            item.addEventListener('click', function() {
                selectSelected.textContent = this.textContent;
                selectItems.classList.add('select-hide');
                startLevel(parseInt(this.dataset.val));
            });
        });

        // Setup Base Theme Toggle
        const baseThemeToggle = document.getElementById('base-theme-toggle');
        let isLightMode = false;
        baseThemeToggle.addEventListener('click', () => {
            isLightMode = !isLightMode;
            if (isLightMode) {
                document.documentElement.setAttribute('data-base-theme', 'light');
                baseThemeToggle.textContent = 'Dark Mode';
            } else {
                document.documentElement.removeAttribute('data-base-theme');
                baseThemeToggle.textContent = 'Light Mode';
            }
        });

        document.addEventListener('click', () => {
            const selectItems = document.querySelector('.select-items');
            if (selectItems) selectItems.classList.add('select-hide');
        });

        // Setup Color Theme Selector
        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const theme = btn.dataset.colorTheme;
                if (theme === 'default') {
                    document.documentElement.removeAttribute('data-color-theme');
                } else {
                    document.documentElement.setAttribute('data-color-theme', theme);
                }
            });
        });

        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', showRulesModal);
        }

        startLevel(1);

        if (!localStorage.getItem('lexiWeightRulesSeen')) {
            localStorage.setItem('lexiWeightRulesSeen', 'true');
            showRulesModal();
        }
    }

    function createLetterElement(char) {
        const el = document.createElement('div');
        el.className = 'letter';
        el.innerHTML = `<span class="letter-weight-badge">${WEIGHTS[char]}</span><span class="letter-char">${char}</span>`;
        el.draggable = true;
        el.dataset.char = char;
        
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);

        // Click to auto-place in first available slot
        el.addEventListener('click', () => {
            for (let slot of slots) {
                if (slot.children.length === 0) {
                    const clone = el.cloneNode(true);
                    setupClone(clone);
                    slot.appendChild(clone);
                    break;
                }
            }
        });

        return el;
    }

    function setupClone(clone) {
        clone.draggable = true;
        clone.addEventListener('dragstart', handleDragStart);
        clone.addEventListener('dragend', handleDragEnd);
        // We handle clicking clone in the slot click handler
    }

    // Drag & Drop Handlers
    let draggedElement = null;
    let sourceSlot = null;

    function handleDragStart(e) {
        if (isGameOver) {
            e.preventDefault();
            return;
        }
        draggedElement = e.target;
        sourceSlot = e.target.parentElement.classList.contains('slot') ? e.target.parentElement : null;
        
        // For Firefox compatibility
        e.dataTransfer.setData('text/plain', e.target.dataset.char);
        e.dataTransfer.effectAllowed = 'copyMove';
        
        setTimeout(() => e.target.style.opacity = '0.5', 0);
    }

    function handleDragEnd(e) {
        e.target.style.opacity = '1';
        draggedElement = null;
        sourceSlot = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (e.currentTarget.classList.contains('slot')) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        if (e.currentTarget.classList.contains('slot')) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const slot = e.currentTarget;
        slot.classList.remove('drag-over');
        
        if (!draggedElement || isGameOver) return;
        if (slot.dataset.index === "1") return; // Prevent dropping on first slot

        // If dropping from bank to slot
        if (!sourceSlot) {
            if (slot.children.length > 0) slot.innerHTML = ''; // Replace
            const clone = draggedElement.cloneNode(true);
            setupClone(clone);
            slot.appendChild(clone);
        } else {
            // Moving between slots
            if (slot !== sourceSlot) {
                if (slot.children.length > 0) {
                    // Swap
                    const temp = slot.children[0];
                    sourceSlot.appendChild(temp);
                    slot.appendChild(draggedElement);
                } else {
                    slot.appendChild(draggedElement);
                }
            }
        }
    }

    function handleBankDrop(e) {
        e.preventDefault();
        // If dropping from slot back to bank, just remove it from slot
        if (sourceSlot && draggedElement) {
            draggedElement.remove();
        }
    }

    function handleKeyDown(e) {
        if (isGameOver || !overlay.classList.contains('hidden')) return;
        
        // Handle Enter
        if (e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
            return;
        }

        // Handle Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            // Find the last filled slot
            for (let i = slots.length - 1; i >= 0; i--) {
                const slot = slots[i];
                if (slot.children.length > 0) {
                    if (slot.dataset.index === "1") break; // Don't delete the fixed first slot
                    slot.innerHTML = '';
                    break;
                }
            }
            return;
        }

        // Handle Letters (A-Z)
        if (/^[a-zA-Z]$/.test(e.key)) {
            const char = e.key.toUpperCase();
            // Find first empty slot
            for (let slot of slots) {
                if (slot.children.length === 0) {
                    const el = document.createElement('div');
                    el.className = 'letter';
                    el.innerHTML = `<span class="letter-weight-badge">${WEIGHTS[char]}</span><span class="letter-char">${char}</span>`;
                    el.dataset.char = char;
                    setupClone(el);
                    slot.appendChild(el);
                    
                    // Add a tiny visual pop effect to the slot
                    slot.classList.add('drag-over');
                    setTimeout(() => slot.classList.remove('drag-over'), 150);
                    break;
                }
            }
        }
    }

    // Game Logic
    function startLevel(level) {
        currentLevel = level;
        isGameOver = false;
        
        // Sync Dropdown
        const levelNames = {1: "Level 1 (Easy)", 2: "Level 2 (Medium)", 3: "Level 3 (Hard)"};
        document.querySelector('.select-selected').textContent = levelNames[currentLevel];
        
        scoreDisplay.textContent = score;
        
        const config = LEVEL_CONFIG[currentLevel];
        totalTime = config.time;
        timeRemaining = totalTime;
        
        generateRequiredLetters(config.reqCount);
        updateRulesDisplay();
        clearBoard();
        startTimer();
        hideModal();
    }

    function getRandomVowel() {
        const vowels = 'AEIOU';
        return vowels[Math.floor(Math.random() * vowels.length)];
    }

    function getRandomConsonant() {
        const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
        return consonants[Math.floor(Math.random() * consonants.length)];
    }

    function generateRequiredLetters(count) {
        requiredLetters = [];
        // Ensure at least one vowel to make forming words easier
        let hasVowel = false;
        
        for (let i = 0; i < count; i++) {
            if (i === 1 && !hasVowel) {
                requiredLetters.push(getRandomVowel());
                hasVowel = true;
            } else {
                // Mix vowels and consonants
                if (Math.random() > 0.7) {
                    requiredLetters.push(getRandomVowel());
                    hasVowel = true;
                } else {
                    requiredLetters.push(getRandomConsonant());
                }
            }
        }
    }

    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function updateRulesDisplay() {
        let rules = [`1st letter at slot 1`];
        for (let i = 1; i < requiredLetters.length; i++) {
            rules.push(`${getOrdinal(i + 1)} letter at slot ${i + 1} or ${i + 2}`);
        }
        rulesText.innerHTML = `<span style="opacity: 0.85; font-size: 0.9em;">Include these letters in order:</span><br><strong>${rules.join('. ')}.</strong>`;

        requiredLettersDisplay.innerHTML = '';
        requiredLetters.forEach((char, idx) => {
            const span = document.createElement('span');
            span.className = 'req-letter-card';
            span.textContent = `${idx + 1}: ${char}`;
            requiredLettersDisplay.appendChild(span);
        });
    }

    function clearBoard() {
        slots.forEach(slot => {
            slot.innerHTML = '';
            if (slot.dataset.index === "1" && requiredLetters.length > 0) {
                const char = requiredLetters[0];
                const el = document.createElement('div');
                el.className = 'letter fixed-letter';
                el.innerHTML = `<span class="letter-weight-badge">${WEIGHTS[char]}</span><span class="letter-char">${char}</span>`;
                el.dataset.char = char;
                el.style.cursor = 'not-allowed';
                el.style.background = 'linear-gradient(135deg, var(--secondary-color), #ff6b6b)';
                el.style.borderColor = 'var(--secondary-color)';
                slot.appendChild(el);
            }
        });
    }

    function startTimer() {
        clearInterval(timerInterval);
        updateTimerVisuals();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerVisuals();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }, 1000);
    }

    function updateTimerVisuals() {
        const percentage = (timeRemaining / totalTime) * 100;
        timerBar.style.width = `${percentage}%`;
        
        // 70% done means 30% remaining -> yellow
        // 80% done means 20% remaining -> red
        if (percentage <= 20) {
            timerBar.style.background = 'linear-gradient(90deg, #ff3d00, #ff007f)'; // Red
        } else if (percentage <= 30) {
            timerBar.style.background = 'linear-gradient(90deg, #ffc107, #ff9100)'; // Yellow
        } else {
            timerBar.style.background = 'linear-gradient(90deg, #00ffcc, #00e676)'; // Green
        }
    }

    function gameOver() {
        isGameOver = true;
        showModal(
            "Time's Up! <span class='badge failed'>Failed</span>", 
            `You ran out of time on <strong>Level ${currentLevel}</strong>.<br><br><strong>Total Score Achieved:</strong> <span style="color:var(--primary-color); font-weight:800">${score}</span>`, 
            "Restart", 
            () => {
                score = 0;
                winStreak = 0;
                document.getElementById('score-list').innerHTML = '';
                document.getElementById('side-total-score').textContent = '0';
                startLevel(currentLevel);
            },
            true
        );
    }

    function gameOverWithReason(reason) {
        isGameOver = true;
        clearInterval(timerInterval);
        showModal(
            "Game Over <span class='badge failed'>Failed</span>", 
            `<strong>Failed on Level ${currentLevel}</strong><br>${reason}<br><br><strong>Total Score Achieved:</strong> <span style="color:var(--primary-color); font-weight:800">${score}</span>`, 
            "Restart", 
            () => {
                score = 0;
                winStreak = 0;
                document.getElementById('score-list').innerHTML = '';
                document.getElementById('side-total-score').textContent = '0';
                startLevel(currentLevel);
            },
            true
        );
    }

    function calculateWeight(word) {
        let w = 0;
        for (let i = 0; i < word.length; i++) {
            w += WEIGHTS[word[i].toUpperCase()] || 0;
        }
        // Subtract predefined letters weight
        let reqWeight = 0;
        for (let i = 0; i < requiredLetters.length; i++) {
            reqWeight += WEIGHTS[requiredLetters[i].toUpperCase()] || 0;
        }
        return Math.max(0, w - reqWeight);
    }

    // Validation
    async function handleSubmit() {
        if (isGameOver) return;

        // Stop counter on click
        clearInterval(timerInterval);

        // Read the board
        let word = '';
        let placedLettersInfo = [];
        
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            if (slot.children.length > 0) {
                const char = slot.children[0].dataset.char;
                word += char;
                placedLettersInfo.push({ char, pos: i + 1 });
            } else {
                // If there is an empty slot, and we already have letters, but wait, spaces in words?
                // English words don't have spaces inside them.
                // Let's ensure slots are contiguous from pos 1.
            }
        }

        if (word.length === 0) {
            triggerShake(gameBoard);
            startTimer();
            return;
        }

        // Check contiguity
        let isContiguous = true;
        let foundEmpty = false;
        for (let i = 0; i < slots.length; i++) {
            if (slots[i].children.length === 0) {
                foundEmpty = true;
            } else if (foundEmpty) {
                isContiguous = false;
                break;
            }
        }
        
        if (!isContiguous) {
            gameOverWithReason("Letters must be placed continuously starting from position 1.");
            return;
        }

        // Rule Check
        let ruleValid = true;
        let ruleErrorMsg = "";

        // Check required letters placement
        for (let i = 0; i < requiredLetters.length; i++) {
            const reqChar = requiredLetters[i];
            // Find where this required letter is.
            // Wait, the rule says "First alphabet should be used as starting letter"
            // Let's enforce strict positioning for the required letters in sequence.
            let validPositions = (i === 0) ? [1] : [i + 1, i + 2];

            // Does the word have the required letter at one of these positions?
            let foundValid = false;
            for (let pos of validPositions) {
                const charAtPos = placedLettersInfo.find(info => info.pos === pos)?.char;
                if (charAtPos === reqChar) {
                    foundValid = true;
                    break;
                }
            }

            if (!foundValid) {
                ruleValid = false;
                ruleErrorMsg = `Required letter ${i + 1} (${reqChar}) is not in valid positions: ${validPositions.join(' or ')}`;
                break;
            }
        }

        if (!ruleValid) {
            gameOverWithReason(ruleErrorMsg);
            return;
        }

        // Dictionary API Check
        submitBtn.textContent = "Validating...";
        submitBtn.disabled = true;

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (response.ok) {
                // Valid word!
                const weight = calculateWeight(word);
                // Score formula: Reward base - weight + bonus for remaining time
                const timeBonus = timeRemaining * 2;
                const levelScore = Math.max(10, LEVEL_CONFIG[currentLevel].reward - weight + timeBonus);
                score += levelScore;

                // Update Side Scoreboard
                const li = document.createElement('li');
                li.innerHTML = `Level ${currentLevel} <span>${levelScore}</span>`;
                document.getElementById('score-list').appendChild(li);
                document.getElementById('side-total-score').textContent = score;
                winStreak++;
                if (window.posthog) {
                    posthog.capture('Level Passed', {
                        level: currentLevel,
                        word: word,
                        score_earned: levelScore,
                        win_streak: winStreak
                    });
                }

                showModal(
                    "Level Complete! <span class='badge success'>Success</span>", 
                    `Word: ${word}<br>Weight: ${weight}<br>Time Bonus: ${timeBonus}<br>Earned: ${levelScore}`,
                    "Continue",
                    () => {
                        startLevel(currentLevel);
                    }
                );
            } else {
                // Not a valid word
                gameOverWithReason(`"${word}" is not a valid English word!`);
            }
        } catch (error) {
            console.error(error);
            showModal("Connection Error <span class='badge failed'>Error</span>", "Error connecting to dictionary API. Please try again.", "Close", () => {
                startTimer();
            }, true);
        } finally {
            submitBtn.textContent = "Forge Word";
            submitBtn.disabled = false;
        }
    }

    function showRulesModal() {
        clearInterval(timerInterval);
        
        const rulesHTML = `
            <div style="text-align: left; font-size: 0.95rem; line-height: 1.5; padding: 1rem; color: var(--text-color); max-height: 60vh; overflow-y: auto;">
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">🎯 The Objective</h3>
                <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
                    <li>Form a <strong>valid English word</strong> before the timer runs out.</li>
                    <li><strong>The lighter, the better!</strong> Your goal is to use letters with the lowest possible weights to maximize your score.</li>
                </ul>
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">📜 Placement Rules</h3>
                <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
                    <li><strong>Required Letters:</strong> Levels provide mandatory letters that you MUST include.</li>
                    <li><strong>Strict Placement:</strong> As levels get harder, you must place these letters in specific positions:
                        <ul style="margin-left: 1.5rem; margin-top: 0.25rem; font-size: 0.9em; opacity: 0.9; margin-bottom: 0.5rem;">
                            <li><strong>1st Letter:</strong> Always at Slot 1.</li>
                            <li><strong>2nd Letter:</strong> Must be at Slot 2 or 3.</li>
                            <li><strong>nth Letter:</strong> Must be at Slot n or n+1. (This pattern continues infinitely as levels get harder!)</li>
                        </ul>
                    </li>
                    <li><strong>Controls:</strong> Drag & drop, click, or type on your keyboard. Press <code>Backspace</code> to delete.</li>
                </ul>
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">💰 Scoring & Weights</h3>
                <ul style="margin-left: 1.5rem; margin-bottom: 0.5rem;">
                    <li>Every level gives a <strong>Base Reward</strong> (e.g. 100 points for Level 1).</li>
                    <li>The combined weight of all the letters you added is <strong>subtracted</strong> from this reward. (Pre-placed letters don't penalize you).</li>
                    <li><strong>Time Bonus:</strong> Every remaining second adds +2 points to your score.</li>
                    <li><strong>Formula:</strong> <code>Score = Base Reward - Added Letter Weights + Time Bonus</code></li>
                </ul>
            </div>
        `;
        showModal("How to Play", rulesHTML, "Got It!", () => {
            if (!isGameOver) {
                startTimer();
            }
        });
    }

    function triggerShake(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 400);
    }

    // Modal Handling
    let modalActionCallback = null;

    function showModal(title, desc, btnText, callback, isFailed = false) {
        modalTitle.innerHTML = title;
        modalDesc.innerHTML = desc;
        modalActionBtn.textContent = btnText;
        modalActionCallback = callback;
        
        if (isFailed) {
            modal.classList.add('error-modal');
        } else {
            modal.classList.remove('error-modal');
        }
        
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
    }

    function hideModal() {
        overlay.classList.add('hidden');
        modal.classList.add('hidden');
    }

    function handleModalAction() {
        hideModal();
        if (modalActionCallback) {
            modalActionCallback();
        }
    }

    // Boot
    initUI();
});
