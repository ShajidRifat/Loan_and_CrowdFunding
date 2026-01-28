/**
 * UniFund Campaign Marketplace Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    try {
        const user = layout.init();
        if (!user) return;
        renderMarketplace(user);
    } catch (error) {
        console.error('Marketplace Init Error:', error);
        alert('An error occurred loading the marketplace. Please check console.');
    }
});

async function renderMarketplace(user) {
    try {
        // Fetch Campaigns from API
        const campaigns = await utils.apiCall('api/get_marketplace_campaigns.php');
        const grid = document.getElementById('marketplace-grid');

        if (!campaigns || campaigns.length === 0) {
            grid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500">No active campaigns found. Check back later!</div>';
        } else {
            grid.innerHTML = campaigns.map(camp => {
                const raised = parseFloat(camp.raised_amount || 0);
                const goal = parseFloat(camp.goal_amount || 1);
                const percent = Math.min(100, Math.round((raised / goal) * 100));
                const canDonate = ['donor', 'student', 'admin'].includes(user.role);
                const studentName = camp.student_name || 'User';

                return `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow">
                        <div class="h-40 bg-slate-100 relative">
                        <div class="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100"></div>
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-brand-700 shadow-sm">
                            ${camp.category}
                        </div>
                        <div class="absolute -bottom-6 left-6">
                            <div class="h-12 w-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName.replace(' ', '')}" class="h-full w-full">
                            </div>
                        </div>
                    </div>
                    <div class="pt-8 px-6 pb-6 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">${camp.title}</h4>
                                <p class="text-xs text-slate-500">${camp.university || 'University'} • ${camp.major || 'Major'}</p>
                            </div>
                            <div class="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                                <i data-lucide="star" class="h-3 w-3 fill-current"></i> ${camp.average_rating || camp.rating || 'N/A'}
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
                            
                            <!-- Action Buttons -->
                            <div class="grid grid-cols-2 gap-2 pt-2">
                                <button onclick="openDonorModal('${camp.id}', '${camp.title.replace(/'/g, "\\'")}')" class="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <i data-lucide="users" class="h-3 w-3"></i> Donors
                                </button>
                                <button onclick="openRatingModal('${camp.id}', '${camp.title.replace(/'/g, "\\'")}')" class="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <i data-lucide="star" class="h-3 w-3"></i> Rate
                                </button>
                                ${canDonate ? `
                                <button onclick="openDonationModal('${camp.id}')" class="col-span-2 bg-slate-900 hover:bg-brand-600 text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-lg shadow-slate-200 hover:shadow-brand-200">
                                    Donate Now
                                </button>
                                ` : `
                                <button class="col-span-2 bg-slate-100 text-slate-400 cursor-not-allowed text-sm font-bold py-2 rounded-lg" disabled>
                                    View Only
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
    } catch (error) {
        console.error('Failed to load campaigns:', error);
        document.getElementById('marketplace-grid').innerHTML = '<div class="col-span-full py-12 text-center text-red-500">Failed to load campaigns.</div>';
    }
}

// Ratings Logic
let currentRatingCampaignId = null;
let currentRatingValue = 0;

function openRatingModal(id, title) {
    currentRatingCampaignId = id;
    currentRatingValue = 0;
    document.getElementById('rating-modal-title').textContent = `How impactful was "${title}" ? `;

    const modal = document.getElementById('rating-modal');
    const content = document.getElementById('rating-modal-content');

    resetStars();
    document.getElementById('rating-comment').value = '';

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeRatingModal() {
    const modal = document.getElementById('rating-modal');
    const content = document.getElementById('rating-modal-content');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        currentRatingCampaignId = null;
    }, 300);
}

async function submitRating() {
    if (currentRatingValue === 0) {
        alert('Please select a star rating.');
        return;
    }

    const comment = document.getElementById('rating-comment').value;
    const user = auth.getUser();

    if (!user) {
        alert('You must be logged in to rate.');
        return;
    }

    const submitBtn = document.querySelector('#rating-modal button[onclick="submitRating()"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const response = await utils.apiCall('api/rate_campaign.php', 'POST', {
            campaign_id: currentRatingCampaignId,
            donor_id: user.id,
            rating: currentRatingValue,
            comment: comment
        });

        utils.showNotification(response.message || 'Rating submitted!');
        closeRatingModal();
        renderMarketplace(user);

    } catch (error) {
        console.error('Rating Error:', error);
        alert('Failed to submit rating: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function resetStars() {
    const stars = document.querySelectorAll('#star-container button i, #star-container button svg');
    stars.forEach(s => {
        s.classList.remove('fill-yellow-400', 'text-yellow-400');
        s.classList.add('text-slate-300');
    });
}

document.querySelectorAll('#star-container button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const val = parseInt(btn.dataset.value);
        currentRatingValue = val;

        const buttons = document.querySelectorAll('#star-container button');
        buttons.forEach((b) => {
            const icon = b.querySelector('svg') || b.querySelector('i');
            if (!icon) return;

            const bVal = parseInt(b.dataset.value);
            if (bVal <= val) {
                icon.classList.add('fill-yellow-400', 'text-yellow-400');
                icon.classList.remove('text-slate-300');
            } else {
                icon.classList.remove('fill-yellow-400', 'text-yellow-400');
                icon.classList.add('text-slate-300');
            }
        });
    });
});

// Donation Logic
window.openDonationModal = (id) => {
    const content = `
        <div class="text-center">
            <div class="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                <i data-lucide="heart" class="h-8 w-8"></i>
            </div>
            <p class="text-slate-600 mb-6">Donate to this Campaign</p>
            
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
            message: "Donation via Marketplace",
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

// View Donors Logic
window.openDonorModal = async (id, title) => {
    // Show Loading
    utils.showModal('Campaign Donors', `
        <div class="flex justify-center py-8">
             <div class="animate-spin h-8 w-8 border-2 border-brand-600 rounded-full border-b-transparent"></div>
        </div>
    `);

    try {
        const donors = await utils.apiCall(`api/get_campaign_donors.php?campaign_id=${id}`);

        let content = `
            <div class="mb-4 text-center">
                <h3 class="text-sm text-slate-500">Supporters of</h3>
                <p class="font-bold text-slate-900">${title}</p>
            </div>
        `;

        if (!donors || donors.length === 0) {
            content += `
                <div class="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p class="text-slate-500 text-sm">No donors yet. Be the first!</p>
                </div>
            `;
        } else {
            content += `<div class="space-y-3 max-h-64 overflow-y-auto pr-2">`;
            content += donors.map(d => `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="flex items-center gap-3">
                         <div class="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                             ${d.donor_name.charAt(0)}
                         </div>
                         <div>
                             <p class="text-sm font-bold text-slate-900">${d.donor_name}</p>
                             <p class="text-xs text-slate-500">${new Date(d.date).toLocaleDateString()}</p>
                         </div>
                    </div>
                    <span class="font-bold text-emerald-600 text-sm">+${utils.formatCurrency(d.amount)}</span>
                </div>
            `).join('');
            content += `</div>`;
        }

        content += `
            <div class="mt-6">
                 <button onclick="utils.closeModal()" class="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors">Close</button>
            </div>
        `;

        utils.showModal('Campaign Donors', content);

    } catch (e) {
        console.error(e);
        utils.showModal('Error', 'Failed to load donors');
    }
};
