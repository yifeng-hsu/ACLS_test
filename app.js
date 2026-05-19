// DOM Elements
const views = {
    menu: document.getElementById('main-menu'),
    pathSelection: document.getElementById('path-selection'),
    scenario: document.getElementById('scenario-view'),
    result: document.getElementById('result-view')
};

const pathList = document.getElementById('path-list');
const treatmentSelect = document.getElementById('treatment-select');
const drugSelect = document.getElementById('drug-select');
const unitSelect = document.getElementById('unit-select');
const valueInput = document.getElementById('value-input');
const actionForm = document.getElementById('action-form');

const scenarioTitle = document.getElementById('scenario-title');
const modeBadge = document.getElementById('mode-badge');
const scenarioText = document.getElementById('scenario-text');
const feedbackBox = document.getElementById('feedback-box');
const feedbackText = document.getElementById('feedback-text');

// State
let currentMode = ''; // 'learning' or 'test'
let currentPath = null;
let currentStepIndex = 0;
let testErrorCount = 0;

// Initialize App
function init() {
    populateDropdowns();
    setupEventListeners();
    showView('menu');
}

function populateDropdowns() {
    OPTIONS.treatments.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        treatmentSelect.appendChild(el);
    });
    
    OPTIONS.drugs.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        drugSelect.appendChild(el);
    });

    OPTIONS.units.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        unitSelect.appendChild(el);
    });
}

function setupEventListeners() {
    document.getElementById('btn-learning-mode').addEventListener('click', () => startLearningMode());
    document.getElementById('btn-test-mode').addEventListener('click', () => startTestMode());
    document.getElementById('btn-back-menu').addEventListener('click', () => showView('menu'));
    document.getElementById('btn-quit-scenario').addEventListener('click', () => {
        if (currentMode === 'learning') showView('pathSelection');
        else showView('menu');
    });
    document.getElementById('btn-result-home').addEventListener('click', () => showView('menu'));
    document.getElementById('btn-result-next').addEventListener('click', () => {
        if (currentMode === 'learning') showView('pathSelection');
        else startTestMode(); // Start another random test
    });

    actionForm.addEventListener('submit', handleActionSubmit);
}

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    hideFeedback();
}

// Mode Handlers
function startLearningMode() {
    currentMode = 'learning';
    pathList.innerHTML = '';
    PATHWAYS.forEach((path, idx) => {
        const card = document.createElement('div');
        card.className = 'path-card';
        card.innerHTML = `<h3>${path.name}</h3><p>點擊開始練習</p>`;
        card.addEventListener('click', () => startScenario(idx));
        pathList.appendChild(card);
    });
    showView('pathSelection');
}

function startTestMode() {
    currentMode = 'test';
    testErrorCount = 0;
    // Random path
    const randomIdx = Math.floor(Math.random() * PATHWAYS.length);
    startScenario(randomIdx);
}

function startScenario(pathIndex) {
    currentPath = PATHWAYS[pathIndex];
    currentStepIndex = 0;
    
    scenarioTitle.textContent = currentMode === 'learning' ? currentPath.name : '考試模式：隨機情境';
    modeBadge.textContent = currentMode === 'learning' ? '學習模式' : '考試模式';
    
    showView('scenario');
    renderStep();
}

function renderStep() {
    const step = currentPath.steps[currentStepIndex];
    scenarioText.textContent = step.text;
    
    // Reset form
    actionForm.reset();
    treatmentSelect.value = OPTIONS.treatments[0];
    drugSelect.value = OPTIONS.drugs[0];
    unitSelect.value = OPTIONS.units[0];
    valueInput.value = '';
}

function handleActionSubmit(e) {
    e.preventDefault();
    hideFeedback();

    const userVal = {
        treatment: treatmentSelect.value,
        drug: drugSelect.value,
        dose: valueInput.value,
        unit: unitSelect.value
    };

    const step = currentPath.steps[currentStepIndex];
    const isValid = validateInput(userVal, step.expected);

    if (isValid) {
        showFeedback('處置正確！', 'success');
        setTimeout(() => {
            if (step.next !== null) {
                currentStepIndex = step.next;
                renderStep();
                hideFeedback();
            } else {
                finishScenario();
            }
        }, 1200);
    } else {
        testErrorCount++;
        const errMsg = getErrorMsg(step.expected);
        showFeedback(errMsg, 'error');
    }
}

function showFeedback(msg, type) {
    feedbackBox.className = `feedback-box feedback-${type}`;
    // Support newlines in feedback
    feedbackText.innerHTML = msg.replace(/\n/g, '<br>');
    feedbackBox.style.display = 'block';
}

function hideFeedback() {
    feedbackBox.style.display = 'none';
    feedbackText.innerHTML = '';
}

function finishScenario() {
    showView('result');
    const statsDiv = document.getElementById('test-stats');
    if (currentMode === 'test') {
        document.getElementById('error-count').textContent = testErrorCount;
        statsDiv.style.display = 'block';
        document.getElementById('result-message').textContent = testErrorCount === 0 ? '完美！您已成功處置此病患。' : '您已完成此情境，請檢討錯誤步驟。';
    } else {
        statsDiv.style.display = 'none';
        document.getElementById('result-message').textContent = '您已成功走完此路徑。';
    }
}

// Start
init();
