
document.addEventListener('DOMContentLoaded', async () => {
    const user = layout.init();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const transactions = await utils.apiCall(`api/get_transaction_history.php?user_id=${user.id}`);
        // Ensure transactions is array
        renderHistory(Array.isArray(transactions) ? transactions : []);
    } catch (error) {
        console.error('Failed to load history:', error);
        document.getElementById('history-table-body').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-red-500">
                    Failed to load transaction history.
                </td>
            </tr>
         `;
    }
});

function renderHistory(transactions) {
    const tbody = document.getElementById('history-table-body');

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                    <div class="mx-auto h-12 w-12 text-slate-300 mb-3"><i data-lucide="file-clock" class="h-full w-full"></i></div>
                    <p class="text-slate-500 font-medium">No transactions found</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = transactions.map(tx => {
            const isDebit = ['withdrawal', 'repayment', 'donation_sent'].includes(tx.type);
            const colorClass = isDebit ? 'text-slate-900' : 'text-emerald-600 font-bold';
            const sign = isDebit ? '-' : '+';

            let typeLabel = tx.type.replace('_', ' ').toUpperCase();
            let icon = 'banknote';

            if (tx.type.includes('loan')) icon = 'file-check';
            if (tx.type.includes('repayment')) icon = 'refresh-cw';
            if (tx.type.includes('donation')) icon = 'heart';

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <i data-lucide="${icon}" class="h-4 w-4"></i>
                            </div>
                            <span class="font-medium text-slate-900 text-xs tracking-wide">${typeLabel}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 ${colorClass}">
                        ${sign}${utils.formatCurrency(tx.amount)}
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    tx.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                }">
                            ${tx.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-sm max-w-xs truncate" title="${tx.description || ''}">
                        ${tx.description || '-'}
                    </td>
                    <td class="px-6 py-4 text-right text-slate-400 text-sm font-mono">
                        ${new Date(tx.created_at).toLocaleDateString()}
                    </td>
                </tr>
            `;
        }).join('');
    }
    lucide.createIcons();
}
