document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Layout (Sidebar, Header)
        const user = layout.init();
        if (!user) return; // Stop if redirecting

        if (user.role !== 'donor' && user.role !== 'admin') {
            console.warn('Accessing donor dashboard with non-donor role');
        }

        // Fetch Dashboard Data
        const dashboardData = await utils.apiCall(`api/dashboard_data.php?user_id=${user.id}`);

        // Fetch Recommendations (Active Campaigns)
        const campaigns = await utils.apiCall('api/get_marketplace_campaigns.php');

        renderDonorDashboard(user, dashboardData, campaigns);
    } catch (error) {
        console.error('Donor Dashboard Init Error:', error);
        utils.showNotification('Failed to load dashboard data', 'error');
    }
});

function renderDonorDashboard(user, data, allCampaigns) {
    // 1. Stats
    const donations = data.donations || [];

    const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.donation_amount || 0), 0);
    const livesImpacted = new Set(donations.map(d => d.student_id)).size;
    const campaignsSupported = new Set(donations.map(d => d.campaign_id)).size;

    document.getElementById('stat-total-donated').textContent = utils.formatCurrency(totalDonated);
    document.getElementById('stat-lives-impacted').textContent = livesImpacted;
    document.getElementById('stat-campaigns-supported').textContent = campaignsSupported;

    // 2. Smart Recommendations (Top 3 active campaigns by progress or urgency)
    const activeCampaigns = (allCampaigns || []).filter(c => c.status === 'active');

    // Sort by funding percentage triggers (higher is better for "nearly funded", or lower for "needs help"?)
    // Let's sort by "Trending" (random for now) or just most raised
    // activeCampaigns.sort((a, b) => parseFloat(b.raised_amount) - parseFloat(a.raised_amount));

    const recGrid = document.getElementById('recommendations-grid');
    if (activeCampaigns.length === 0) {
        recGrid.innerHTML = '<div class="col-span-full py-8 text-center text-slate-500">No active campaigns found.</div>';
    } else {
        recGrid.innerHTML = activeCampaigns.slice(0, 3).map(camp => {
            const goal = parseFloat(camp.goal_amount);
            const raised = parseFloat(camp.raised_amount);
            const percent = Math.min(100, Math.round((raised / goal) * 100));

            return `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow">
                    <div class="h-32 bg-slate-100 relative">
                        <!-- Placeholder or abstract pattern -->
                        <div class="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100"></div>
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-brand-700 shadow-sm">
                            ${camp.category || 'Education'}
                        </div>
                        <div class="absolute -bottom-6 left-6">
                            <div class="h-12 w-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-xl font-bold text-slate-500">
                                ${camp.student_name ? camp.student_name.charAt(0) : 'U'}
                            </div>
                        </div>
                    </div>
                    <div class="pt-8 px-6 pb-6 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">${camp.title}</h4>
                                <p class="text-xs text-slate-500">${camp.university || 'University'} • ${camp.major || 'Student'}</p>
                            </div>
                             <div class="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                                <i data-lucide="star" class="h-3 w-3 fill-current"></i> ${camp.average_rating || 'N/A'}
                            </div>
                        </div>
                        <p class="text-sm text-slate-600 line-clamp-2 mb-4 flex-grow">${camp.description}</p>
                        
                        <div class="mt-auto space-y-3">
                            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div class="bg-brand-500 h-full rounded-full" style="width: ${percent}%"></div>
                            </div>
                            <div class="flex justify-between text-xs font-medium text-slate-500">
                                <span>${utils.formatCurrency(raised)} raised</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="flex gap-2 pt-2">
                                <button onclick="openDonationModal('${camp.campaign_id}', '${camp.title.replace(/'/g, "\\'")}')" class="flex-1 bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-lg shadow-slate-200 hover:shadow-brand-200">
                                    Donate Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Render Portfolio Table (Recent Donations)
    const portfolioTable = document.getElementById('portfolio-table-body');
    if (donations.length === 0) {
        portfolioTable.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500">No contributions yet. Start exploring!</td></tr>';
    } else {
        portfolioTable.innerHTML = donations.map(d => `
            <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 text-sm">${d.campaign_title || 'Campaign'}</div>
                    <div class="text-xs text-slate-500">Donation ID: #${d.donation_id}</div>
                </td>
                <td class="px-6 py-4 text-right font-mono text-sm text-slate-700 font-medium">
                    ${utils.formatCurrency(d.donation_amount)}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Completed
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // 4. Render Transaction History
    const txnList = document.getElementById('transaction-list');
    const transactions = data.recent_transactions || []; // from dashboard_data

    if (transactions.length === 0) {
        txnList.innerHTML = '<li class="p-6 text-center text-slate-500 text-sm">No transactions found.</li>';
    } else {
        txnList.innerHTML = transactions.map(t => {
            const isCredit = t.type === 'wallet_deposit' || t.amount > 0; // simplistic check, logic depends on API sign
            // Actually API returns amount. Donations are usually negative for donor wallet? 
            // `dashboard_data.php` returns transactions. 
            // In setup.sql transaction amount is positive, type determines flow? 
            // Wait, dashboard_data says "from_user_id or to_user_id". 
            // If from_user = me -> Debit. If to_user = me -> Credit.

            // For simplicity, let's just show raw info
            return `
            <li class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <i data-lucide="activity" class="h-4 w-4"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-slate-900">${t.description || t.type}</div>
                        <div class="text-xs text-slate-500">${new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-bold text-slate-900">${utils.formatCurrency(t.amount)}</div>
                    <div class="text-xs text-slate-400 capitalize">${t.status}</div>
                </div>
            </li>
            `;
        }).join('');
    }

    lucide.createIcons();
}

// Donation Logic - Exposed to Window
window.openDonationModal = (id, title) => {
    const content = `
        <div class="text-center">
            <div class="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                <i data-lucide="heart" class="h-8 w-8"></i>
            </div>
            <p class="text-slate-600 mb-6">Donate to <strong>${title}</strong></p>
            
            <div class="text-left">
                <div class="bg-slate-50 p-4 rounded-xl mb-6">
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Donation Amount</label>
                    <div class="relative">
                        <span class="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
                        <input type="number" id="donation-amount" placeholder="500" min="10" class="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none">
                    </div>
                </div>
                
                <button onclick="processDonation('${id}')" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-500/20">
                    Confirm Donation
                </button>
            </div>
        </div >
    `;
    utils.showModal('Support Campaign', content);
    lucide.createIcons();
};

window.processDonation = async (campaignId) => {
    const amount = parseFloat(document.getElementById('donation-amount').value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    utils.closeModal();

    // Simulate Processing Spinner
    const processingHtml = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-600 mx-auto mb-6"></div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Processing Donation...</h3>
            <p class="text-slate-500">Thank you for your generosity.</p>
        </div >
    `;
    utils.showModal('Processing', processingHtml);

    try {
        const user = auth.getUser();
        await utils.apiCall('api/donate.php', 'POST', {
            campaign_id: campaignId,
            donor_id: user.id,
            amount: amount,
            message: "Donation via Dashboard",
            is_anonymous: 0
        });

        const successHtml = `
            <div class="text-center py-6">
                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <i data-lucide="check" class="h-10 w-10 text-emerald-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
                <p class="text-slate-500 mb-8">You successfully donated <strong>${utils.formatCurrency(amount)}</strong>.</p>
                <button onclick="window.location.reload()" class="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Done
                </button>
            </div >
        `;
        utils.showModal('', successHtml);
        lucide.createIcons();

    } catch (error) {
        console.error('Donation Failed:', error);
        utils.showModal('Donation Failed', `
            <div class="text-center p-6">
                <div class="text-red-500 mb-4"><i data-lucide="x-circle" class="h-12 w-12 mx-auto"></i></div>
                <h3 class="text-lg font-bold mb-2">Transaction Failed</h3>
                <p class="text-slate-500 text-sm mb-4">${error.message || 'Unknown error occurred'}</p>
                <button onclick="utils.closeModal()" class="px-6 py-2 bg-slate-200 rounded-lg font-bold text-slate-700">Close</button>
            </div>
        `);
        lucide.createIcons();
    }
};
