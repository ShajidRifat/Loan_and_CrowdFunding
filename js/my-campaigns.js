
document.addEventListener('DOMContentLoaded', async () => {
    const user = layout.init();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const campaigns = await utils.apiCall(`api/get_my_campaigns.php?user_id=${user.id}`);
        renderCampaigns(campaigns || []);
    } catch (error) {
        console.error('Failed to load campaigns:', error);
        document.getElementById('campaigns-grid').innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                Failed to load campaigns.
            </div>
        `;
    }
});

function renderCampaigns(campaigns) {
    const grid = document.getElementById('campaigns-grid');

    if (campaigns.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <div class="mx-auto h-12 w-12 text-slate-300 mb-3"><i data-lucide="megaphone" class="h-full w-full"></i></div>
                <h3 class="text-slate-900 font-medium">No campaigns found</h3>
                <p class="text-slate-500 text-sm">Start a campaign to raise funds!</p>
            </div>
        `;
    } else {
        grid.innerHTML = campaigns.map(c => {
            const goal = parseFloat(c.goal_amount);
            const raised = parseFloat(c.raised_amount);
            const progress = Math.min((raised / goal) * 100, 100);
            const isFunded = c.status === 'funded';
            const daysLeft = c.daysLeft > 0 ? c.daysLeft : 0;

            // Status Styling
            let statusClass = 'bg-gray-100 text-gray-700';
            if (c.status === 'active') statusClass = 'bg-blue-100 text-blue-700';
            if (c.status === 'funded') statusClass = 'bg-purple-100 text-purple-700';
            if (c.status === 'pending') statusClass = 'bg-orange-100 text-orange-700';

            // Random Color
            const colors = ['bg-indigo-600', 'bg-pink-600', 'bg-emerald-600', 'bg-orange-500'];
            const color = colors[c.campaign_id % colors.length];

            return `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group">
                    <div class="h-40 relative overflow-hidden ${color} flex items-end p-4">
                        <h3 class="font-display font-bold text-xl text-white leading-tight z-10 relative">${c.title}</h3>
                        <div class="absolute top-4 right-4 z-10">
                            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass} shadow-sm backdrop-blur-md bg-opacity-90">
                                ${c.status}
                            </span>
                        </div>
                    </div>
                    
                    <div class="p-6 flex-1 flex flex-col">
                        <p class="text-slate-500 text-sm mb-6 line-clamp-2">${c.description}</p>
                        
                        <div class="mt-auto">
                            <div class="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                                <div class="bg-brand-600 h-2 rounded-full" style="width: ${progress}%"></div>
                            </div>
                            <div class="flex justify-between text-sm font-bold mb-6">
                                <span class="${isFunded ? 'text-purple-600' : 'text-brand-600'}">${utils.formatCurrency(raised)}</span>
                                <span class="text-slate-400">of ${utils.formatCurrency(goal)}</span>
                            </div>

                            <div class="flex justify-between items-center mb-6">
                                <div>
                                    <div class="text-xs text-slate-400 font-medium uppercase">Backers</div>
                                    <div class="font-bold text-slate-900 text-lg">${c.backers}</div>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-400 font-medium uppercase">Time Left</div>
                                    <div class="font-bold text-slate-900 text-lg">${isFunded ? 'Done' : daysLeft + ' Days'}</div>
                                </div>
                            </div>

                            <div class="flex gap-3">
                                <button onclick="viewDonors(${c.campaign_id})" class="flex-1 py-2.5 bg-white border border-brand-600 text-brand-600 font-bold rounded-lg hover:bg-brand-50 transition-colors text-sm">
                                    View Donors
                                </button>
                                ${c.status === 'active' ? `
                                <button onclick="donateToCampaign(${c.campaign_id})" class="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors text-sm shadow-md shadow-brand-200">
                                    Donate
                                </button>
                                ` : `
                                <button class="flex-1 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-lg cursor-not-allowed text-sm" disabled>
                                    ${c.status === 'pending' ? 'Pending' : 'Closed'}
                                </button>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    lucide.createIcons();
}

// View Donors Logic
window.viewDonors = async (campaignId) => {
    try {
        const donors = await utils.apiCall(`api/get_campaign_donors.php?campaign_id=${campaignId}`);

        const content = `
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-900">Donation History</h3>
                    <span class="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-1 rounded-full">${donors.length} Donors</span>
                </div>
                
                <div class="max-h-80 overflow-y-auto space-y-3 pr-2">
                    ${donors.length === 0 ? '<p class="text-slate-500 text-sm text-center py-4">No donations yet.</p>' :
                donors.map(d => `
                        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="h-10 w-10 bg-white rounded-full flex items-center justify-center font-bold text-brand-600 border border-slate-200 uppercase">
                                ${d.donor_name ? d.donor_name.charAt(0) : 'A'}
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-slate-900">${d.donor_name || 'Anonymous'}</p>
                                <p class="text-xs text-slate-500">${new Date(d.date).toLocaleDateString()}</p>
                            </div>
                            <div class="font-bold text-emerald-600">
                                +${utils.formatCurrency(d.amount)}
                            </div>
                        </div>
                        ${d.message ? `<p class="text-xs text-slate-500 italic ml-14 mt-1">"${d.message}"</p>` : ''}
                    `).join('')}
                </div>
            </div>
        `;
        utils.showModal('Campaign Donors', content);

    } catch (error) {
        console.error('Failed to load donors:', error);
        utils.showNotification('Failed to load donors', 'error');
    }
};

// Mock Donate Flow
window.donateToCampaign = (id) => {
    const content = `
        <div class="space-y-4">
            <p class="text-slate-500 text-sm">Enter the amount you wish to donate to this campaign.</p>
            <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Amount ($)</label>
                <div class="relative">
                    <span class="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                    <input type="number" id="donation-amount" value="500" class="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 font-bold text-slate-900">
                </div>
            </div>
            <button onclick="processDonation(${id})" class="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 mt-2">
                Confirm Donation
            </button>
        </div>
    `;
    utils.showModal('Make a Donation', content);
};

window.processDonation = async (id) => {
    const amountVal = document.getElementById('donation-amount').value;
    const amount = parseFloat(amountVal);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    utils.showModal('Processing...', '<div class="text-center p-8"><div class="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div><p>Processing Donation...</p></div>');

    try {
        const user = auth.getUser();
        await utils.apiCall('api/donate.php', 'POST', {
            campaign_id: id,
            donor_id: user.id,
            amount: amount,
            message: "Direct Donation",
            is_anonymous: 0
        });

        utils.showModal('Donation Successful', `<div class="text-center p-8"><i data-lucide="heart" class="h-16 w-16 text-pink-500 mx-auto mb-4 fill-pink-100"></i><h3 class="text-xl font-bold">Thank You!</h3><p class="text-slate-500 mt-2">You successfully donated ${utils.formatCurrency(amount)}.</p><button onclick="window.location.reload()" class="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Close</button></div>`);
        lucide.createIcons();

    } catch (error) {
        console.error('Donation Failed:', error);
        utils.showModal('Donation Failed', `<div class="text-center p-8 text-red-500"><p>${error.message}</p><button onclick="utils.closeModal()" class="mt-4 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">Close</button></div>`);
    }
};

