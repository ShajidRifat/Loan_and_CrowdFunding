
// Fraud Center Logic

document.addEventListener('DOMContentLoaded', () => {
    // Already handled by main script in HTML, but good to have dedicated init
    // const user = layout.init(); 
    // if (user.role !== 'admin') window.location.href = 'dashboard.html';
    // renderFraudDashboard();
});

let currentAlerts = [];

async function renderFraudDashboard() {
    const tbody = document.getElementById('fraud-table-body');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">Loading alerts...</td></tr>`;

    try {
        const alerts = await utils.apiCall('api/fraud_alerts.php');
        currentAlerts = alerts;

        if (!alerts || alerts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-500">No suspicious activity detected.</td></tr>`;
            return;
        }

        tbody.innerHTML = alerts.map(alert => {
            const user = alert.user;

            // Status Badge
            const isBlocked = user.status === 'blocked';
            const statusBadge = isBlocked
                ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">Blocked</span>`
                : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Flagged</span>`;

            // Risk Badge
            let riskClass = 'bg-orange-100 text-orange-800';
            if (alert.severity === 'High') riskClass = 'bg-red-100 text-red-800';
            if (alert.severity === 'Low') riskClass = 'bg-slate-100 text-slate-600';

            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-900">${user.name}</div>
                        <div class="text-xs text-slate-500">ID: ${user.id}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-slate-900">${alert.activity}</div>
                        <div class="text-xs text-slate-500">${alert.date}</div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskClass}">
                            ${user.risk_tier || 'Medium'} (${alert.severity})
                        </span>
                    </td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="openInvestigation('${user.id}')" class="text-brand-600 hover:text-brand-700 font-bold text-sm bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                            Investigate
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();

    } catch (error) {
        console.error('Failed to load fraud alerts:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Error loading data.</td></tr>`;
    }
}

let currentInvestigatingUserId = null;

window.openInvestigation = (userId) => {
    // API returns user.id nested in user object, not at root as userId
    const alert = currentAlerts.find(a => a.user.id == userId);
    if (!alert) {
        console.error('Alert not found for user', userId);
        return;
    }

    currentInvestigatingUserId = userId;
    const user = alert.user;

    const modal = document.getElementById('investigation-modal');
    const content = document.getElementById('investigation-modal-content');
    const body = document.getElementById('investigation-body');

    const isBlocked = user.status === 'blocked';

    body.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            <img src="${user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" class="h-16 w-16 rounded-full border-2 border-slate-100">
            <div>
                <h4 class="text-lg font-bold text-slate-900">${user.name}</h4>
                <p class="text-sm text-slate-500">${user.email}</p>
                <p class="text-xs text-brand-600 font-bold uppercase mt-1">${user.role}</p>
            </div>
        </div>

        <div class="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <h5 class="text-red-800 font-bold text-sm mb-1 flex items-center gap-2">
                <i data-lucide="alert-triangle" class="h-4 w-4"></i> Alert Trigger
            </h5>
            <p class="text-red-600 text-sm">${alert.activity}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p class="text-xs text-slate-500 uppercase font-bold">CGPA</p>
                <p class="text-lg font-bold text-slate-900">${user.cgpa}</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p class="text-xs text-slate-500 uppercase font-bold">Current Status</p>
                <p class="text-lg font-bold ${isBlocked ? 'text-red-600' : 'text-emerald-600'}">${isBlocked ? 'Blocked' : 'Active'}</p>
            </div>
        </div>

        <div class="flex gap-3">
            <button onclick="closeInvestigation()" class="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
            </button>
            ${isBlocked
            ? `<button onclick="toggleBlockUser('${userId}', false)" class="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Unblock User</button>`
            : `<button onclick="toggleBlockUser('${userId}', true)" class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Block User</button>`
        }
        </div>
    `;

    modal.classList.remove('hidden');
    // Animate in
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    });
    lucide.createIcons();
};

window.closeInvestigation = () => {
    const modal = document.getElementById('investigation-modal');
    const content = document.getElementById('investigation-modal-content');

    modal.classList.add('opacity-0');
    content.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.toggleBlockUser = async (userId, shouldBlock) => {
    try {
        const newStatus = shouldBlock ? 'blocked' : 'active';
        await utils.apiCall('api/admin_users.php', 'PUT', { id: userId, status: newStatus });

        utils.showNotification(shouldBlock ? 'User blocked successfully' : 'User unblocked successfully');
        closeInvestigation();
        renderFraudDashboard(); // Refresh list to reflect status change
    } catch (error) {
        console.error('Toggle Block Failed:', error);
        utils.showNotification(error.message || 'Action failed', 'error');
    }
};
