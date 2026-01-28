/**
 * Admin Dashboard Logic
 */

async function renderAdminDashboard() {
    const user = auth.getUser();
    if (!user || user.role !== 'admin') return;

    try {
        const data = await utils.apiCall(`api/dashboard_data.php?user_id=${user.id}`);
        console.log('Admin Data:', data);

        // 1. Stats
        if (data.stats) {
            document.getElementById('stat-pending').textContent = data.stats.pending_reviews || 0;
            document.getElementById('stat-volume').textContent = utils.formatCurrency(data.stats.total_volume || 0);
            if (document.getElementById('stat-active-users')) {
                document.getElementById('stat-active-users').textContent = data.stats.active_users || 0;
            }
        }

        // 2. Loans (Pending & Others)
        const loans = data.loans || [];
        const pendingLoans = loans.filter(l => l.status === 'pending');
        const grid = document.getElementById('pending-grid');

        if (pendingLoans.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p class="text-slate-500 text-sm">No pending loans.</p>
                </div>
            `;
        } else {
            grid.innerHTML = pendingLoans.map(loan => `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-slate-900">${loan.loan_title || loan.title}</h3>
                            <p class="text-xs text-slate-500">by ${loan.student_name || 'Unknown'}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold border ${utils.getRiskColor(loan.risk_tier || 'High')}">${loan.risk_tier || 'N/A'} Risk</span>
                    </div>
                    <p class="text-slate-600 text-sm mb-4 line-clamp-2 flex-grow">${loan.loan_reason || loan.description || 'No description'}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                        <div class="font-bold text-slate-900">${utils.formatCurrency(loan.principal_amount)}</div>
                        <div class="flex gap-2">
                            <button onclick="rejectLoan(${loan.loan_id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><i data-lucide="x" class="h-4 w-4"></i></button>
                            <button onclick="approveLoan(${loan.loan_id})" class="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"><i data-lucide="check" class="h-3 w-3"></i> Approve</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 3. Campaigns
        const campaigns = data.campaigns || [];
        const campaignGrid = document.getElementById('campaign-grid');
        if (campaigns.length === 0) {
            campaignGrid.innerHTML = `
                <div class="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p class="text-slate-500 text-sm">No campaigns found.</p>
                </div>
            `;
        } else {
            campaignGrid.innerHTML = campaigns.map(camp => `
                 <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full relative">
                        <span class="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded ${camp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} uppercase">${camp.status}</span>
                        <h3 class="font-bold text-slate-900 mb-1">${camp.title}</h3>
                        <p class="text-xs text-slate-500 mb-4">Goal: ${utils.formatCurrency(camp.goal_amount)}</p>
                        <div class="flex items-center justify-end gap-2 mt-auto">
                            ${camp.status === 'pending' || camp.status === 'active' ? `<button onclick="rejectCampaign(${camp.campaign_id})" class="text-xs font-bold text-red-600 hover:text-red-700">Reject/Stop</button>` : ''}
                            ${camp.status === 'pending' ? `<button onclick="approveCampaign(${camp.campaign_id})" class="text-xs font-bold text-brand-600 hover:text-brand-700">Approve</button>` : ''}
                        </div>
                 </div>
            `).join('');
        }

        // 4. Users
        const users = data.users || [];
        const userTable = document.getElementById('users-table-body');
        userTable.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                         <img src="${u.avatar_url || 'https://via.placeholder.com/40'}" class="h-10 w-10 rounded-full border border-slate-200">
                         <div>
                            <div class="font-bold text-slate-900">${u.name}</div>
                            <div class="text-xs text-slate-500">${u.email}</div>
                         </div>
                    </div>
                </td>
                <td class="px-6 py-4 uppercase text-xs font-bold text-slate-500">${u.role}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${u.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${u.status || 'Active'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                     <div class="flex justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                         <!-- View Profile Button could go here if we implemented viewUser fully with backend data -->
                         ${u.role !== 'admin' ? `
                            <button onclick="toggleUserBlock('${u.id}', '${u.status}')" class="p-2 ${u.status === 'blocked' ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'} rounded-lg transition-colors" title="${u.status === 'blocked' ? 'Unblock' : 'Block'}">
                                <i data-lucide="${u.status === 'blocked' ? 'unlock' : 'lock'}" class="h-4 w-4"></i>
                            </button>
                            <button onclick="deleteUser('${u.id}')" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                                <i data-lucide="trash-2" class="h-4 w-4"></i>
                            </button>
                         ` : ''}
                     </div>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();

    } catch (e) {
        console.error('Error loading dashboard:', e);
        utils.showNotification('Failed to load dashboard data', 'error');
    }
}

// Actions

window.approveLoan = async (id) => {
    try {
        await utils.apiCall('api/update_status.php', 'POST', { type: 'loan', id: id, status: 'approved' });
        utils.showNotification('Loan approved successfully');
        renderAdminDashboard();
    } catch (e) {
        console.error(e);
        utils.showNotification('Failed to approve loan', 'error');
    }
};

window.rejectLoan = async (id) => {
    if (!confirm('Are you sure you want to reject this loan?')) return;
    try {
        await utils.apiCall('api/update_status.php', 'POST', { type: 'loan', id: id, status: 'rejected' });
        utils.showNotification('Loan rejected');
        renderAdminDashboard();
    } catch (e) {
        console.error(e);
        utils.showNotification('Failed to reject loan', 'error');
    }
};

window.approveCampaign = async (id) => {
    try {
        await utils.apiCall('api/update_status.php', 'POST', { type: 'campaign', id: id, status: 'active' });
        utils.showNotification('Campaign approved');
        renderAdminDashboard();
    } catch (e) {
        console.error(e);
        utils.showNotification('Failed to approve campaign', 'error');
    }
};

window.rejectCampaign = async (id) => {
    console.log('Reject clicked for ID:', id);

    // Create a custom confirmation modal to avoid native confirm() issues
    const content = `
        <div class="text-center p-4">
            <div class="bg-red-100 text-red-600 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="alert-triangle" class="h-8 w-8"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Reject Campaign?</h3>
            <p class="text-slate-500 mb-6">Are you sure you want to reject/stop this campaign? This action cannot be undone.</p>
            <div class="flex gap-3">
                <button onclick="utils.closeModal()" class="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
                <button onclick="performCampaignRejection(${id})" class="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30">Confirm Reject</button>
            </div>
        </div>
    `;
    utils.showModal('Confirm Rejection', content);
    lucide.createIcons();
};

window.performCampaignRejection = async (id) => {
    utils.closeModal();
    utils.showNotification('Processing rejection...', 'info'); // Feedback

    try {
        console.log('Sending API call to reject:', id);
        const response = await utils.apiCall('api/update_status.php', 'POST', { type: 'campaign', id: id, status: 'rejected' });
        console.log('API Response:', response);

        utils.showNotification('Campaign updated successfully');
        renderAdminDashboard();
    } catch (e) {
        console.error('Rejection Failed:', e);
        utils.showNotification('Failed to update campaign: ' + e.message, 'error');
    }
};

window.toggleUserBlock = async (id, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
        await utils.apiCall('api/admin_users.php', 'PUT', { id: id, status: newStatus });
        utils.showNotification(`User ${newStatus}`);
        renderAdminDashboard();
    } catch (e) {
        console.error(e);
        utils.showNotification('Failed to update user status', 'error');
    }
};

window.deleteUser = async (id) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
        await utils.apiCall(`api/admin_users.php?id=${id}`, 'DELETE');
        utils.showNotification('User deleted');
        renderAdminDashboard();
    } catch (e) {
        console.error(e);
        utils.showNotification('Failed to delete user', 'error');
    }
};

// Initial Load is handled by DOMContentLoaded in HTML, calling renderAdminDashboard()
