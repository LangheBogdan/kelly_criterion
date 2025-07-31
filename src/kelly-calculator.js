document.addEventListener('DOMContentLoaded', function () {

    // --- UTILITY FUNCTIONS ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // --- CONFIGURATION ---
    const config = {
        decimalPlaces: 2,
        minProbability: 0,
        maxProbability: 1,
        minOdds: 1,
        selectors: {
            calculateBtn: '#calculateBtn',
            probabilityInput: '#probability',
            oddsInput: '#odds',
            kellyFractionSelect: '#kelly_fraction',
            resultDiv: '#result',
            resultText: '#result-text',
            interpretationText: '#interpretation',
            errorDiv: '#error',
            errorText: '#error-text',
            latexFormula: '#latex-formula',
            marketType: '#market_type',
            oddsContainer: '#odds_container',
            calculateProbBtn: '#calculateProbBtn',
            probResultDiv: '#prob_result',
            probResultText: '#prob_result_text',
            probErrorDiv: '#prob_error',
            probErrorText: '#prob_error_text',
            bankrollInput: '#bankroll',
            wagerPercentageInput: '#wager_percentage',
            calculateWagerBtn: '#calculateWagerBtn',
            wagerResultDiv: '#wager_result',
            wagerResultText: '#wager_result_text',
            wagerErrorDiv: '#wager_error',
            wagerErrorText: '#wager_error_text',
        }
    };

    // --- DOM ELEMENTS ---
    const elements = Object.keys(config.selectors).reduce((acc, key) => {
        const el = $(config.selectors[key]);
        if (el) acc[key] = el;
        return acc;
    }, {});

    // --- KELLY CRITERION CALCULATOR ---
    const KellyCalculator = {
        init() {
            if (elements.calculateBtn) {
                this.bindEvents();
                this.renderFormula();
            }
        },

        bindEvents() {
            elements.calculateBtn.addEventListener('click', () => this.handleCalculation());
        },

        renderFormula() {
            if (elements.latexFormula) {
                katex.render("f^* = \\frac{bp - q}{b}", elements.latexFormula, {
                    throwOnError: false,
                    displayMode: true
                });
            }
        },

        validateInputs(probability, decimalOdds) {
            if (isNaN(probability) || isNaN(decimalOdds)) {
                return "Please enter valid numbers for both fields.";
            }
            if (probability < config.minProbability || probability > config.maxProbability) {
                return `Probability of winning must be between ${config.minProbability} and ${config.maxProbability}.`;
            }
            if (decimalOdds <= config.minOdds) {
                return `Decimal odds must be greater than ${config.minOdds} to have a potential for profit.`;
            }
            return null;
        },

        calculate(probability, decimalOdds, kellyFraction) {
            const b = decimalOdds - 1;
            const q = 1 - probability;
            const f_star_full = (b * probability - q) / b;
            return f_star_full * kellyFraction;
        },

        handleCalculation() {
            this.hideMessages();
            const inputs = this.getInputValues();
            const validationError = this.validateInputs(inputs.probability, inputs.decimalOdds);

            if (validationError) {
                this.showError(validationError);
                return;
            }

            const optimalBet = this.calculate(inputs.probability, inputs.decimalOdds, inputs.kellyFraction);
            this.displayResult(optimalBet, inputs.kellyFraction);
        },

        getInputValues() {
            return {
                probability: parseFloat(elements.probabilityInput.value),
                decimalOdds: parseFloat(elements.oddsInput.value),
                kellyFraction: parseFloat(elements.kellyFractionSelect.value)
            };
        },

        hideMessages() {
            elements.resultDiv.classList.add('hidden');
            elements.errorDiv.classList.add('hidden');
        },

        showError(message) {
            elements.errorText.textContent = message;
            elements.errorDiv.classList.remove('hidden');
        },

        displayResult(optimalBet, kellyFraction) {
            elements.resultDiv.classList.remove('hidden');
            if (optimalBet > 0) {
                const percentage = (optimalBet * 100).toFixed(config.decimalPlaces);
                elements.resultText.textContent = `${percentage}%`;
                let interpretation = `The formula suggests you should wager ${percentage}% of your bankroll.`;
                if (kellyFraction < 1) {
                    const strategyName = elements.kellyFractionSelect.options[elements.kellyFractionSelect.selectedIndex].text.split('(')[0].trim();
                    interpretation += ` (This is based on a ${strategyName} strategy).`;
                }
                elements.interpretationText.textContent = interpretation;

                // Update the wager percentage input
                if (elements.wagerPercentageInput) {
                    elements.wagerPercentageInput.value = percentage;
                }
            } else {
                elements.resultText.textContent = "0%";
                elements.interpretationText.textContent = "You do not have an edge. The Kelly Criterion suggests you should not bet.";
                if (elements.wagerPercentageInput) {
                    elements.wagerPercentageInput.value = 0;
                }
            }
        }
    };

    // --- WAGER CALCULATOR ---
    const WagerCalculator = {
        init() {
            if (elements.calculateWagerBtn) {
                this.bindEvents();
            }
        },

        bindEvents() {
            elements.calculateWagerBtn.addEventListener('click', () => this.handleCalculation());
        },

        validateInputs(bankroll, wagerPercentage) {
            if (isNaN(bankroll) || isNaN(wagerPercentage)) {
                return "Please enter valid numbers for bankroll and wager percentage.";
            }
            if (bankroll < 0) {
                return "Bankroll cannot be negative.";
            }
            if (wagerPercentage < 0) {
                return "Wager percentage cannot be negative.";
            }
            return null;
        },

        calculate(bankroll, wagerPercentage) {
            return bankroll * (wagerPercentage / 100);
        },

        handleCalculation() {
            this.hideMessages();
            const inputs = this.getInputValues();
            const validationError = this.validateInputs(inputs.bankroll, inputs.wagerPercentage);

            if (validationError) {
                this.showError(validationError);
                return;
            }

            const wagerAmount = this.calculate(inputs.bankroll, inputs.wagerPercentage);
            this.displayResult(wagerAmount);
        },

        getInputValues() {
            return {
                bankroll: parseFloat(elements.bankrollInput.value),
                wagerPercentage: parseFloat(elements.wagerPercentageInput.value)
            };
        },

        hideMessages() {
            elements.wagerResultDiv.classList.add('hidden');
            elements.wagerErrorDiv.classList.add('hidden');
        },

        showError(message) {
            elements.wagerErrorText.textContent = message;
            elements.wagerErrorDiv.classList.remove('hidden');
        },

        displayResult(wagerAmount) {
            elements.wagerResultDiv.classList.remove('hidden');
            elements.wagerResultText.textContent = `$${wagerAmount.toFixed(config.decimalPlaces)}`;
        }
    };

    // --- IMPLIED PROBABILITY CALCULATOR ---
    const ProbabilityCalculator = {
        init() {
            if (elements.marketType) {
                this.bindEvents();
                this.renderOddsInputs();
            }
        },

        bindEvents() {
            elements.marketType.addEventListener('change', () => this.renderOddsInputs());
            elements.calculateProbBtn.addEventListener('click', () => this.handleCalculation());
        },

        renderOddsInputs() {
            const marketType = parseInt(elements.marketType.value);
            let html = '';
            const labels = marketType === 2 ? ['Outcome 1', 'Outcome 2'] : ['Home Win', 'Draw', 'Away Win'];
            for (let i = 0; i < marketType; i++) {
                html += `
                    <div>
                        <label for="prob_odds_${i}" class="form-label">${labels[i]} Odds</label>
                        <input type="number" id="prob_odds_${i}" step="0.01" min="1" placeholder="e.g., 1.80" class="form-input">
                    </div>`;
            }
            elements.oddsContainer.innerHTML = html;
        },

        validateInputs(odds) {
            if (odds.some(isNaN)) {
                return "Please enter valid decimal odds for all outcomes.";
            }
            if (odds.some(o => o <= config.minOdds)) {
                return `All decimal odds must be greater than ${config.minOdds}.`;
            }
            return null;
        },

        calculate(odds) {
            const inverseOdds = odds.map(o => 1 / o);
            const totalInverse = inverseOdds.reduce((sum, val) => sum + val, 0);
            const impliedProbs = inverseOdds.map(inv => (inv / totalInverse) * 100);
            return { impliedProbs, totalInverse };
        },

        handleCalculation() {
            this.hideMessages();
            const odds = this.getInputValues();
            const validationError = this.validateInputs(odds);

            if (validationError) {
                this.showError(validationError);
                return;
            }

            const { impliedProbs, totalInverse } = this.calculate(odds);
            this.displayResult(impliedProbs, totalInverse);
        },

        getInputValues() {
            const marketType = parseInt(elements.marketType.value);
            const odds = [];
            for (let i = 0; i < marketType; i++) {
                const input = $(`#prob_odds_${i}`);
                odds.push(input ? parseFloat(input.value) : NaN);
            }
            return odds;
        },

        hideMessages() {
            elements.probResultDiv.classList.add('hidden');
            elements.probErrorDiv.classList.add('hidden');
        },

        showError(message) {
            elements.probErrorText.textContent = message;
            elements.probErrorDiv.classList.remove('hidden');
        },

        displayResult(impliedProbs, totalInverse) {
            elements.probResultDiv.classList.remove('hidden');
            let resultHTML = '<ul class="space-y-2">';
            const labels = impliedProbs.length === 2 ? ['Outcome 1', 'Outcome 2'] : ['Home Win', 'Draw', 'Away Win'];
            impliedProbs.forEach((prob, i) => {
                resultHTML += `<li><strong>${labels[i]}:</strong> ${prob.toFixed(config.decimalPlaces)}%</li>`;
            });
            resultHTML += '</ul>';
            resultHTML += `<p class="mt-4 text-xs text-gray-500"><strong>Total (Overround):</strong> ${(totalInverse * 100).toFixed(config.decimalPlaces)}%</p>`;
            elements.probResultText.innerHTML = resultHTML;
        }
    };

    // --- INITIALIZATION ---
    KellyCalculator.init();
    WagerCalculator.init();
    ProbabilityCalculator.init();

});