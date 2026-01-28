/**
 * UniFund My Loans / Marketplace Logic (Mock Data)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Init Layout & Auth
    const user = layout.init();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch Loans from API
    try {
        // Fetch loans
        const loans = await utils.apiCall(`api/get_my_loans.php?user_id=${user.id}`);

        // Render
        renderLoans(loans || [], user);

    } catch (error) {
        console.error('Failed to load loans:', error);
        utils.showNotification('Failed to load loans', 'error');
        document.getElementById('loans-grid').innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-red-500">Error loading data. Please try again.</p>
            </div>
        `;
    }
});

function renderLoans(loans, user) {
    const grid = document.getElementById('loans-grid');
    const actions = document.getElementById('header-actions');

    if (user.role === 'student') {
        actions.innerHTML = `
            <a href="apply-loan.html" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="h-4 w-4"></i> New Application
            </a>
        `;
    }

    if (loans.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <div class="mx-auto h-12 w-12 text-slate-300 mb-3">
                    <i data-lucide="inbox" class="h-full w-full"></i>
                </div>
                <h3 class="text-slate-900 font-medium">No loans found</h3>
                <p class="text-slate-500 text-sm">You haven't applied for any loans yet.</p>
            </div>
        `;
    } else {
        grid.innerHTML = loans.map(loan => {
            const amount = parseFloat(loan.principal_amount);
            const amountPaid = parseFloat(loan.amount_paid);
            const progress = Math.min((amountPaid / amount) * 100, 100);

            // Status Styling
            let statusBadgeClass = '';
            let statusLabel = '';

            switch (loan.status) {
                case 'approved':
                    statusBadgeClass = 'bg-blue-100 text-blue-700';
                    statusLabel = 'Approved';
                    break;
                case 'pending':
                    statusBadgeClass = 'bg-orange-100 text-orange-700';
                    statusLabel = 'Pending';
                    break;
                default:
                    statusBadgeClass = 'bg-gray-100 text-gray-700';
                    statusLabel = loan.status;
            }

            return `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-6">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadgeClass}">
                            ${statusLabel}
                        </span>
                        <span class="text-xs text-slate-400 font-medium">Applied: ${new Date(loan.applied_at).toLocaleDateString()}</span>
                    </div>

                    <div class="mb-6">
                        <div class="text-3xl font-bold text-slate-900 mb-1">${utils.formatCurrency(amount)}</div>
                        <div class="text-slate-500 font-medium">${loan.category}</div>
                    </div>

                    <!-- Repayment Progress -->
                    <div class="mb-6">
                        <div class="flex justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Repayment Progress</span>
                            <span>${Math.round(progress)}%</span>
                        </div>
                        <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-brand-600 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>
                        <div class="flex justify-between text-xs mt-2">
                            <span class="text-emerald-600 font-bold">Paid: ${utils.formatCurrency(amountPaid)}</span>
                            <span class="text-slate-400">Remaining: ${utils.formatCurrency(amount - amountPaid)}</span>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="viewLoanDetails(${loan.id})" class="flex-1 py-2.5 bg-white border border-brand-600 text-brand-600 font-bold rounded-lg hover:bg-brand-50 transition-colors text-sm">
                            View Schedule
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    lucide.createIcons();
}

// 3. View Details & Schedule (Mock)
// 3. View Details & Schedule
window.viewLoanDetails = async (id) => {
    try {
        // Fetch Schedule
        const response = await utils.apiCall(`api/get_repayment_schedule.php?loan_id=${id}`);
        const schedule = response.schedule || [];

        // Since we don't have the full loan object passed here easily (unless we re-fetch or store securely),
        // we might rely on what's rendered or fetch loan details if needed. 
        // For now, let's assume we can pass the loan basic info or fetch it.
        // Actually, get_my_loans.php gave us the list, typically we'd have it in memory or DOM.
        // To simplify, let's just use the schedule for calculations as that's the source of truth.

        const totalDue = schedule.reduce((sum, item) => sum + parseFloat(item.installment_amount), 0);
        const totalPaid = schedule.reduce((sum, item) => sum + parseFloat(item.amount_paid || 0), 0); // Check schema for amount_paid in schedule items
        const remaining = totalDue - totalPaid;

        // We need 'isRepayable' status. If we don't have loan object, we can guess or fetch.
        // Let's assume active if remaining > 0 for now, or check schedule status.
        // Ideally we should pass the loan status to this function. 
        // But for this refactor, I'll calculate based on schedule pending items.
        const isRepayable = remaining > 0; // Simplified

        const content = `
        <div class="space-y-6">
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                 <div>
                    <p class="text-slate-500 text-xs uppercase font-bold">Total Remaining</p>
                    <p class="text-xl font-bold text-slate-900">${utils.formatCurrency(remaining)}</p>
                 </div>
                 <div class="text-right">
                     <p class="text-slate-500 text-xs uppercase font-bold">Next Due Date</p>
                     <p class="text-brand-600 font-bold">${schedule.find(s => s.status !== 'paid')?.due_date || 'None'}</p>
                 </div>
            </div>

            <!-- Pay Full Button (Assuming implementation exists) -->
            ${(remaining > 0) ? `
            <button onclick="payAllRemaining(${id}, ${remaining})" class="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <i data-lucide="check-circle-2" class="h-5 w-5"></i>
                Pay Full Amount (${utils.formatCurrency(remaining)})
            </button>
            ` : ''}

            <!-- Schedule Table -->
            <div class="border rounded-xl overflow-hidden">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                            <th class="p-3">Month</th>
                            <th class="p-3">Due Date</th>
                            <th class="p-3">Amount</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${schedule.map(item => {
            const isPaid = item.status === 'paid';
            return `
                            <tr class="bg-white hover:bg-slate-50">
                                <td class="p-3 font-medium text-slate-900">#${item.installment_number}</td>
                                <td class="p-3 text-slate-500">${item.due_date}</td>
                                <td class="p-3 font-bold text-slate-900">${utils.formatCurrency(item.installment_amount)}</td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td class="p-3 text-right">
                                    ${!isPaid ? `
                                    <button onclick="promptInstallmentPayment(${id}, ${item.installment_id}, ${item.installment_amount}, ${item.installment_number})" class="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors">
                                        Pay
                                    </button>
                                    ` : `<span class="text-emerald-500 font-bold flex items-center justify-end gap-1"><i data-lucide="check-circle" class="h-4 w-4"></i> Paid</span>`}
                                </td >
                            </tr >
            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

        utils.showModal('Repayment Schedule', content);
        lucide.createIcons();

    } catch (error) {
        console.error('Error fetching schedule:', error);
        utils.showNotification('Failed to load schedule', 'error');
    }
};

window.promptInstallmentPayment = (loanId, installmentId, amountDue, installmentNumber) => {
    const content = `
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <i data-lucide="info" class="h-5 w-5 text-blue-600 mt-0.5"></i>
                <div class="text-sm text-blue-800">
                    <p class="font-bold">Flexible Repayment</p>
                    <p class="mt-1">You can pay the full due amount of <strong>${utils.formatCurrency(amountDue)}</strong> or a partial amount. Remaining balance will carry over.</p>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Amount to Pay</label>
                <div class="relative">
                    <span class="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
                    <input type="number" id="installment-amount" value="${amountDue}" max="${amountDue}" min="10" class="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none">
                </div>
                <p class="text-xs text-slate-400 mt-2 text-right">Max: ${utils.formatCurrency(amountDue)}</p>
            </div>

            <button onclick="confirmInstallmentPayment(${loanId}, ${installmentId})" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2">
                <i data-lucide="credit-card" class="h-5 w-5"></i>
                Confirm Payment
            </button>
        </div>
    `;
    utils.showModal(`Pay Installment #${installmentNumber}`, content);
    lucide.createIcons();
};

window.confirmInstallmentPayment = (loanId, installmentId) => {
    const amountInput = document.getElementById('installment-amount');
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    utils.closeModal();
    // Proceed to pay
    payInstallment(loanId, installmentId, amount);
};

window.payInstallment = async (loanId, installmentId, amount) => {
    // Show Processing
    utils.showModal('Processing...', '<div class="text-center p-8"><div class="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div><p>Processing Repayment...</p></div>');

    try {
        const user = auth.getUser();
        await utils.apiCall('api/repay_loan.php', 'POST', {
            user_id: user.id,
            loan_id: loanId,
            amount: amount,
            installment_id: installmentId // API should handle specific installment updating if needed
        });

        // Update UI
        utils.showModal('Payment Successful', `<div class="text-center p-8"><i data-lucide="check-circle" class="h-16 w-16 text-emerald-500 mx-auto mb-4"></i><h3 class="text-xl font-bold">Paid ${utils.formatCurrency(amount)}</h3><p class="text-slate-500 mt-2">Installment marked as paid.</p><button onclick="utils.closeModal(); viewLoanDetails(${loanId})" class="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Done</button></div>`);
        lucide.createIcons();

        // Refresh user wallet
        await auth.refreshUser();

    } catch (error) {
        console.error('Repayment Error:', error);
        utils.showModal('Payment Failed', `<div class="text-center p-8 text-red-500"><p>${error.message}</p><button onclick="utils.closeModal()" class="mt-4 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">Close</button></div>`);
    }
};

window.payAllRemaining = async (id, amount) => {
    utils.showModal('Processing...', '<div class="text-center p-8"><div class="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div><p>Settling Loan...</p></div>');

    try {
        const user = auth.getUser();
        await utils.apiCall('api/repay_loan.php', 'POST', {
            user_id: user.id,
            loan_id: id,
            amount: amount,
            full_settlement: true
        });

        utils.showModal('Loan Settled', `<div class="text-center p-8"><i data-lucide="check-circle" class="h-16 w-16 text-emerald-500 mx-auto mb-4"></i><h3 class="text-xl font-bold">Loan Settled!</h3><p class="text-slate-500 mt-2">You paid ${utils.formatCurrency(amount)}.</p><button onclick="window.location.reload()" class="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Close</button></div>`);
        lucide.createIcons();
        await auth.refreshUser();

    } catch (error) {
        console.error('Repayment Error:', error);
        utils.showModal('Payment Failed', `<div class="text-center p-8 text-red-500"><p>${error.message}</p><button onclick="utils.closeModal()" class="mt-4 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">Close</button></div>`);
    }
};


