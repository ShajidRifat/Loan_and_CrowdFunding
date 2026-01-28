/**
 * UniFund Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Init Layout & Auth
        const user = layout.init();
        if (!user) return;

        // 2. Redirect Admins & Donors
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return;
        }
        if (user.role === 'donor') {
            window.location.href = 'donor-dashboard.html';
            return;
        }

        // 3. Fetch & Render Dashboard Content
        const dashboardData = await fetchDashboardData(user.id);
        renderDashboard(user, dashboardData);

        // Save data globally for other functions
        window.dashboardData = dashboardData;

    } catch (error) {
        console.error('Dashboard Init Error:', error);
        alert('An error occurred loading the dashboard. Please check console: ' + error.message);
    }
});

// Fetch Data from API
// Fetch Data from API
async function fetchDashboardData(userId) {
    try {
        const data = await utils.apiCall(`api/dashboard_data.php?user_id=${userId}`);
        if (!data) throw new Error('Empty data');
        return data;
    } catch (error) {
        console.error('API Fetch Failed:', error);
        // Fallback or Alert? For now, alert to signal integration issue
        utils.showNotification('Failed to load dashboard data', 'error');
        return null;
    }
}

// Render Dashboard
function renderDashboard(user, data) {
    if (!data) return;

    // 1. Update Stats
    // Calculate totals
    // Calculate totals
    // Use total_debt from API which is SUM(amount_outstanding)
    const totalLoans = data.total_debt !== undefined ? parseFloat(data.total_debt) : (data.loans ? data.loans.reduce((sum, loan) => sum + parseFloat(loan.amount_outstanding || 0), 0) : 0);
    const activeCampaigns = data.campaigns ? data.campaigns.filter(c => c.status === 'active').length : 0;
    const fundedCampaigns = data.campaigns ? data.campaigns.filter(c => parseFloat(c.raised_amount) >= parseFloat(c.goal_amount)).length : 0;
    const totalRaised = data.campaigns ? data.campaigns.reduce((sum, c) => sum + parseFloat(c.raised_amount), 0) : 0;

    // Set Total Loans/Debt
    const statsCards = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    if (statsCards.length >= 4) {
        // Card 1: Total Outstanding Debt (was Total Loans)
        const loanCard = statsCards[0];
        loanCard.querySelector('.text-sm').textContent = 'Total Outstanding Debt';
        loanCard.querySelector('.text-2xl').textContent = utils.formatCurrency(totalLoans);

        // Card 2: Active Campaigns
        statsCards[1].querySelector('.text-2xl').textContent = activeCampaigns;
        statsCards[1].querySelector('.text-xs').textContent = `${fundedCampaigns} funded`;

        // Card 3: Funds Raised
        statsCards[2].querySelector('.text-2xl').textContent = utils.formatCurrency(totalRaised);

        // Card 4: Credit Score
        statsCards[3].querySelector('.text-2xl').textContent = data.profile?.credit_score || 'N/A';

        // Also update specific elements if IDs present (Side Panel & Card)
        const creditScoreVal = document.getElementById('credit-score-card-value');
        if (creditScoreVal) creditScoreVal.textContent = data.profile?.credit_score || 'N/A';

        // Risk/Trust Score (Side Panel)
        const riskScoreVal = document.getElementById('risk-score-value');
        const riskTierBadge = document.getElementById('risk-tier-badge');

        if (riskScoreVal && data.profile) {
            // Normalize Credit Score (300-850) to 0-100 for "Trust Score" display
            // (Score - 300) / (850 - 300) * 100
            const score = parseInt(data.profile.credit_score) || 300;
            const trustScore = Math.round(((score - 300) / 550) * 100);
            riskScoreVal.textContent = trustScore;
        }

        if (riskTierBadge && data.profile?.risk_tier) {
            const tier = data.profile.risk_tier;
            riskTierBadge.textContent = tier + ' Risk';

            // Color Logic
            let colorClass = 'bg-gray-100 text-gray-700'; // Default
            if (tier === 'Low') colorClass = 'bg-emerald-100 text-emerald-700';
            else if (tier === 'Medium') colorClass = 'bg-yellow-100 text-yellow-700';
            else if (tier === 'High') colorClass = 'bg-orange-100 text-orange-700';
            else if (tier === 'Very High') colorClass = 'bg-red-100 text-red-700';

            riskTierBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-6 ${colorClass}`;
        }
    }

    // 2. Recent Activity
    const activityContainer = document.querySelector('.space-y-6'); // Selector for activity list
    if (activityContainer && data.recent_transactions) {
        activityContainer.innerHTML = data.recent_transactions.slice(0, 5).map(txn => {
            let icon = 'arrow-right', color = 'gray', title = 'Transaction';
            if (txn.type === 'loan_disbursal' || txn.type === 'loan_disbursement') { icon = 'arrow-down-left'; color = 'green'; title = 'Loan Disbursed'; }
            else if (txn.type === 'loan_repayment') { icon = 'arrow-up-right'; color = 'blue'; title = 'Repayment Sent'; }
            else if (txn.type === 'donation') { icon = 'heart'; color = 'pink'; title = 'Donation Received'; }

            const isCredit = parseFloat(txn.amount) > 0; // Or based on type logic

            return `
                <div class="flex gap-4">
                    <div class="h-10 w-10 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${icon}" class="h-5 w-5"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-slate-900 text-sm">${title}</p>
                                <p class="text-xs text-slate-500">${txn.description || headerCase(txn.type)}</p>
                            </div>
                            <span class="font-bold text-slate-900 text-sm">${isCredit ? '+' : ''}${utils.formatCurrency(txn.amount)}</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-1">${new Date(txn.created_at).toLocaleString()}</p>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    }

    // 3. Financial Graph
    if (data.financial_history) {
        updateFinancialChart(data.financial_history);
    }
}

function updateFinancialChart(history) {
    const svgHeight = 250;
    const svgWidth = 800;

    // Default valid history check
    if (!history || history.length === 0) return;

    const months = history.map(h => h.day);
    const values = history.map(h => parseFloat(h.total));
    const maxValue = Math.max(...values, 5000) * 1.2; // Add 20% headroom, min 5000 scale

    // X spacing
    const xStep = history.length > 1 ? svgWidth / (history.length - 1) : 0;

    // Generate Points
    const points = values.map((val, index) => {
        const x = index * xStep;
        // Invert Y (0 is top), allow bottom padding
        const y = svgHeight - ((val / maxValue) * svgHeight);
        return { x, y, val, month: months[index] };
    });

    // 2. Generate Path Command
    let pathD = `M ${points[0].x},${points[0].y}`;

    if (points.length > 1) {
        for (let i = 1; i < points.length; i++) {
            const curr = points[i];
            const prev = points[i - 1];
            // Cubic Bezier for smooth curve
            const cp1x = prev.x + (curr.x - prev.x) / 2;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) / 2;
            const cp2y = curr.y;
            pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        }
    } else {
        // Single point line (flat)
        pathD += ` L ${svgWidth},${points[0].y}`;
    }

    // Area Path
    const areaD = `${pathD} V ${svgHeight} H 0 Z`;

    // 3. Update DOM
    const chartContainer = document.querySelector('.lg\\:col-span-2.bg-white .h-64 svg');
    if (!chartContainer) return;

    // Animate/Set Paths
    const areaPath = chartContainer.querySelector('.animate-area-fade');
    const linePath = chartContainer.querySelector('.animate-line-draw');

    if (areaPath) areaPath.setAttribute('d', areaD);
    if (linePath) linePath.setAttribute('d', pathD);

    // Update Points
    const pointsGroup = chartContainer.querySelector('.data-points');
    if (pointsGroup) {
        pointsGroup.innerHTML = points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="6" fill="#fff" stroke="#6366f1" stroke-width="2"
                class="hover:r-8 transition-all cursor-pointer"
                onmouseover="showTooltip(this, '${utils.formatCurrency(p.val)}')" 
                onmouseout="hideTooltip()" />
        `).join('');
    }

    // Update X-Axis Labels (Show subset to avoid overcrowding, e.g., every 5th day)
    const labelsContainer = chartContainer.nextElementSibling;
    if (labelsContainer) {
        // Adjust grid columns? No, flexible flexbox better here
        labelsContainer.style.display = 'flex';
        labelsContainer.style.justifyContent = 'space-between';
        labelsContainer.className = 'flex justify-between text-xs text-slate-400 font-medium mt-2 px-2'; // Reset classes

        let labelStep = Math.ceil(months.length / 6); // Aim for ~6 labels

        labelsContainer.innerHTML = months.map((m, i) => {
            // Always show first and last, then stepping
            if (i === 0 || i === months.length - 1 || i % labelStep === 0) {
                return `<span>${m}</span>`;
            }
            return ''; // Hidden labels/spacers? Using justify-between handles spacing naturally if we only output visible ones? 
            // Better: Output specific spans only? Flex space-between distributes them.
        }).filter(s => s !== '').join('');

        // Actually for correct alignment with points, we might need a different strategy if we just use flex-between.
        // But for this simple graph, distributing 5-6 date labels evenly is acceptable approximation.
    }
}

function headerCase(str) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
}


// Pay Now Action
window.payUpcomingInstallment = async () => {
    const user = auth.getUser();
    if (!user) return;

    // We need fresh data to ensure we pay the right amount
    // Ideally fetch active loan directly: api/get_my_loans.php?status=active
    // But for now, let's reuse dashboardData if recent, or refetch. 
    // Best: Refill window.dashboardData or specific endpoint.

    // Let's rely on dashboardData for convenience but warn it might be stale? 
    // Or better, fetch dashboard data again.

    let data = window.dashboardData;
    if (!data) {
        data = await fetchDashboardData(user.id);
    }

    if (!data || !data.loans) return;

    // Find active loan (simple logic: approved_active)
    const activeLoan = data.loans.find(l => l.status === 'active' || l.status === 'approved');

    if (!activeLoan) {
        alert("You don't have any active loans to pay.");
        return;
    }

    // Calculate Installment (Mock Logic for now as schedule table not fully integrated in API yet)
    const amount = parseFloat(activeLoan.amount_requested);
    const term = parseInt(activeLoan.duration_months) || 12;
    const emi = Math.ceil(amount / term);
    // const remaining = amount - (activeLoan.amountPaid || 0); // Need to fetch paid amount
    const remaining = amount; // Assumption for now

    // If remaining is less than EMI, pay full remaining
    const amountToPay = Math.min(emi, remaining);

    promptPaymentGateway(activeLoan, amountToPay, remaining);
};

function promptPaymentGateway(loan, amount, remaining) {
    // 1. Payment Amount Input Modal
    window.showPaymentGateway = (e) => {
        e.preventDefault();
        const payAmount = parseFloat(document.getElementById('payment-amount').value);

        if (payAmount <= 0 || payAmount > remaining) {
            alert('Invalid payment amount');
            return;
        }

        // Close Input Modal
        utils.closeModal();

        // 2. Select Payment Method (Gateway UI)
        setTimeout(() => {
            const gatewayContent = `
                <div class="p-2">
                    <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <div>
                            <p class="text-xs text-slate-500 font-bold uppercase">Total Payable</p>
                            <p class="text-2xl font-bold text-slate-900">${utils.formatCurrency(payAmount)}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-slate-500">Transaction ID</p>
                            <p class="text-xs font-mono text-slate-900">TXN-${Date.now().toString().slice(-6)}</p>
                        </div>
                    </div>

                    <p class="text-sm font-bold text-slate-700 mb-3">Select Payment Method</p>
                    <div class="space-y-3 mb-6">
                        <button onclick="processPayment(${loan.id}, ${payAmount}, 'Card')" class="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <i data-lucide="credit-card" class="h-5 w-5"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-sm font-bold text-slate-900 group-hover:text-brand-700">Credit / Debit Card</p>
                                    <p class="text-xs text-slate-500">Visa, Mastercard, Amex</p>
                                </div>
                            </div>
                            <i data-lucide="chevron-right" class="h-5 w-5 text-slate-300 group-hover:text-brand-500"></i>
                        </button>

                        <button onclick="processPayment(${loan.id}, ${payAmount}, 'Mobile')" class="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all group">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                                    <i data-lucide="smartphone" class="h-5 w-5"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-sm font-bold text-slate-900 group-hover:text-pink-700">Mobile Banking</p>
                                    <p class="text-xs text-slate-500">bKash, Nagad, Rocket</p>
                                </div>
                            </div>
                            <i data-lucide="chevron-right" class="h-5 w-5 text-slate-300 group-hover:text-pink-500"></i>
                        </button>
                    </div>

                    <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <i data-lucide="lock" class="h-3 w-3"></i>
                        <span>Secured by UniFund SecurePay</span>
                    </div>
                </div>
            `;
            utils.showModal('Payment Gateway', gatewayContent);
            lucide.createIcons();
        }, 300);
    };

    const content = `
        <div class="text-center">
            <div class="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                <i data-lucide="wallet" class="h-8 w-8"></i>
            </div>
            <p class="text-slate-600 mb-6">Make a payment for <strong>Loan #${loan.id}</strong></p>
            
            <form onsubmit="showPaymentGateway(event)" class="text-left">
                <div class="bg-slate-50 p-4 rounded-xl mb-6">
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-500">Remaining Balance</span>
                        <span class="font-bold text-slate-900">${utils.formatCurrency(remaining)}</span>
                    </div>
                    <div class="flex justify-between text-sm mb-4">
                        <span class="text-slate-500">Due Amount</span>
                        <span class="font-bold text-brand-600">${utils.formatCurrency(amount)}</span>
                    </div>
                    
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Amount</label>
                    <div class="relative">
                        <span class="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
                        <input type="number" id="payment-amount" value="${amount}" max="${remaining}" class="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none">
                    </div>
                </div>
                
                <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-500/20">
                    Proceed to Pay
                </button>
            </form>
        </div>
    `;
    utils.showModal('Make Payment', content);
    lucide.createIcons();
}

// Process Payment (Spinner -> Success)
window.processPayment = (loanId, amount, method) => {
    // Show Spinner
    const processingHtml = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600 mx-auto mb-6"></div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Processing Payment...</h3>
            <p class="text-slate-500">Please wait while we confirm your transaction via ${method}.</p>
        </div>
    `;
    utils.showModal('Processing', processingHtml);

    // Call API
    setTimeout(async () => {
        try {
            const user = auth.getUser();
            // Use utils.apiCall
            await utils.apiCall('api/repay_loan.php', 'POST', {
                user_id: user.id,
                loan_id: loanId,
                amount: amount
            });

            // Show Success
            const successHtml = `
                 <div class="text-center py-6">
                     <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                         <i data-lucide="check" class="h-10 w-10 text-emerald-600"></i>
                     </div>
                     <h2 class="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                     <p class="text-slate-500 mb-8">You have successfully paid <strong>${utils.formatCurrency(amount)}</strong>.</p>
                     <button onclick="window.location.reload()" class="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                         Done
                     </button>
                 </div>
             `;
            utils.showModal('', successHtml);
            lucide.createIcons();

        } catch (error) {
            console.error('Payment Error:', error);
            utils.showModal('Payment Failed', `
                <div class="text-center p-6">
                    <div class="text-red-500 mb-4"><i data-lucide="x-circle" class="h-12 w-12 mx-auto"></i></div>
                    <h3 class="text-lg font-bold mb-2">Transaction Failed</h3>
                    <p class="text-slate-500 text-sm mb-4">${error.message || 'Unknown error occurred'}</p>
                    <button onclick="utils.closeModal()" class="px-6 py-2 bg-slate-200 rounded-lg font-bold text-slate-700">Close</button>
                </div>
            `);
            lucide.createIcons();
        }
    }, 1500); // Keep small delay for UX so spinner is visible
};
