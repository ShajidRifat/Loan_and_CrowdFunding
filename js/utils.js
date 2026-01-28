/**
 * UniFund 
 * 
 */

const utils = {
    // Format Currency (Bangladeshi Taka)
    formatCurrency: (amount) => {
        const val = Number(amount) || 0;
        return '৳' + val.toLocaleString('en-BD');
    },

    // Mock Data Store
    mockData: {
        // 'api/get_profile.php': (params) => {
        //     const user = auth.getUser() || { id: 1, name: 'Rahim', email: 'rahim@uiu.ac.bd', role: 'student' };
        //     return {
        //         user: {
        //             id: user.id || 1,
        //             full_name: user.name || 'Rahim',
        //             email: user.email || 'rahim@uiu.ac.bd',
        //             phone_number: '01711223344',
        //             role: user.role || 'student',
        //             avatar_url: user.avatar,
        //             wallet_balance: 5000.00,
        //             status: 'active'
        //         },
        //         profile: {
        //             university: 'United International University',
        //             student_id_number: '011233001',
        //             major: 'Computer Science & Engineering',
        //             cgpa: 3.85,
        //             credit_score: 75,
        //             repayment_history: 98
        //         }
        //     };
        // },
        // 'api/dashboard_data.php': () => ({
        //     stats: {
        //         total_loans: 12500,
        //         active_campaigns: 3,
        //         funds_raised: 8250,
        //         credit_score: 72
        //     },
        //     recent_activity: [
        //         { type: 'loan', title: 'Loan Disbursed', desc: 'Tuition Fee Loan', amount: 12500, date: 'Today' },
        //         { type: 'repayment', title: 'Repayment Sent', desc: 'Installment 2', amount: -1200, date: 'Yesterday' }
        //     ],
        //     upcoming_payments: [
        //         { title: 'Loan Repayment', desc: 'Due in 2 days', amount: 1200 }
        //     ]
        // }),
        'api/login.php': (body) => {
            // Simple mock login
            const email = body?.email || 'rahim@uiu.ac.bd';
            let role = 'student';
            if (email.includes('admin')) role = 'admin';
            if (email.includes('donor')) role = 'donor';

            return {
                message: 'Login successful (Mock)',
                token: 'mock-token-123',
                user: {
                    id: 1,
                    full_name: 'Rahim (Mock)',
                    email: email,
                    role: role,
                    wallet_balance: 5000,
                    status: 'active',
                    avatar_url: ''
                }
            };
        }
    },

    // Generic API Call Helper
    apiCall: async (endpoint, method = 'GET', body = null) => {
        console.log(`[API] Calling ${endpoint} (${method})`);
        const cleanEndpoint = endpoint.split('?')[0];
        const headers = { 'Content-Type': 'application/json' };

        // Add Token if exists (safe access to auth)
        const userStr = localStorage.getItem('unifund_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.token) headers['Authorization'] = `Bearer ${user.token}`;
            } catch (e) { console.error('Token Parse Error', e); }
        }

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        let data;
        try {
            // Attempt Fetch
            let response;
            try {
                response = await fetch(endpoint, config);
            } catch (netError) {
                // If fetch completely fails (e.g. file:// protocol or server down), throw to catch block below
                throw new Error('Network call failed');
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // Handle non-JSON response (e.g. PHP warnings/errors in text)
                const text = await response.text();

                // CRITICAL CHECK: Did we get the PHP source code back? (Live Server issue)
                if (text.includes('<?php') || text.includes('db_config.php')) {
                    throw new Error('SERVER ERROR: PHP is not executing.');
                }

                // Try to parse if it looks like JSON wrapped in text
                try { data = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON response'); }
            }

            if (!response.ok) throw new Error(data.message || 'API request failed');
            return data;

        } catch (error) {
            console.log(`[API] Fetch failed for ${endpoint}:`, error);

            console.log(`[API] Checking mock for ${cleanEndpoint}`);
            console.log(`[API] Available mocks:`, Object.keys(utils.mockData));

            if (utils.mockData && utils.mockData[cleanEndpoint]) {
                console.log(`[MOCK] serving ${cleanEndpoint}`);
                utils.showNotification('Using Mock Data', 'warning');

                // Parse params if any
                const params = {};
                if (endpoint.includes('?')) {
                    const queryString = endpoint.split('?')[1];
                    const urlParams = new URLSearchParams(queryString);
                    for (const [key, value] of urlParams) params[key] = value;
                }

                // Pass body if it was a POST
                const bodyObj = body ? body : params;

                try {
                    const mockResponse = utils.mockData[cleanEndpoint](bodyObj);
                    console.log(`[MOCK] Response:`, mockResponse);
                    return mockResponse;
                } catch (mockErr) {
                    console.error('[MOCK] Error generating response:', mockErr);
                }
            } else {
                console.warn('[MOCK] No mock found for ' + cleanEndpoint);
            }

            console.error('API Call Error (No Mock Available):', error);
            // Ensure we always return an Error object with a message
            if (!error.message) error.message = 'Network or Server Error';
            throw error;
        }
    },


    // Modal Logic
    showModal: (title, content) => {
        let modal = document.getElementById('generic-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'generic-modal';
            // Tailwind classes for overlay
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center opacity-0 transition-opacity duration-300 pointer-events-none';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 scale-95 opacity-0 flex flex-col max-h-[90vh]" id="generic-modal-content">
                    <div class="p-6 overflow-y-auto custome-scrollbar">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="font-display text-xl font-bold text-slate-900" id="modal-title"></h3>
                            <button onclick="utils.closeModal()" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <i data-lucide="x" class="h-5 w-5"></i>
                            </button>
                        </div>
                        <div id="modal-body" class="text-slate-600"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            lucide.createIcons();
        }

        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;

        // Show Modal
        modal.classList.remove('opacity-0', 'pointer-events-none');
        // Animate Content
        const contentEl = document.getElementById('generic-modal-content');
        requestAnimationFrame(() => {
            contentEl.classList.remove('scale-95', 'opacity-0');
            contentEl.classList.add('scale-100', 'opacity-100');
        });

        lucide.createIcons();
    },

    closeModal: () => {
        const modal = document.getElementById('generic-modal');
        const contentEl = document.getElementById('generic-modal-content');

        if (modal && contentEl) {
            contentEl.classList.remove('scale-100', 'opacity-100');
            contentEl.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                modal.classList.add('opacity-0', 'pointer-events-none');
            }, 200);
        }
    },

    // Get Status Color
    getStatusColor: (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'funded': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    },

    // Get Risk Color
    getRiskColor: (tier) => {
        switch (tier) {
            case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'High': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    },

    // Calculate Risk Score
    calculateRiskScore: (student) => {

        const cgpaScore = (student.cgpa / 4.0) * 30;

        // 2. Credit Score (Max 40 points)
        // Formula: (Score / 100) * 40
        const creditScorePoints = (student.creditScore / 100) * 40;

        // 3. Repayment History (Max 30 points)
        // Formula: (Score / 100) * 30
        const historyScore = (student.repaymentHistory / 100) * 30;

        const totalScore = Math.round(cgpaScore + creditScorePoints + historyScore);

        let tier = 'High';
        if (totalScore >= 75) tier = 'Low';
        else if (totalScore >= 50) tier = 'Medium';

        return { score: totalScore, tier };
    },

    // Show Notification (Toast)
    showNotification: (message, type = 'success') => {
        const div = document.createElement('div');
        div.className = `fixed bottom-5 right-5 px-6 py-3 rounded-xl shadow-lg text-white transform transition-all duration-500 translate-y-20 opacity-0 z-50 flex items-center gap-2 ${type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`;
        div.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="h-5 w-5"></i>
            <span class="font-medium">${message}</span>
        `;
        document.body.appendChild(div);

        // Animate In
        requestAnimationFrame(() => {
            div.classList.remove('translate-y-20', 'opacity-0');
        });

        // Initialize icon
        lucide.createIcons();

        // Remove after 3s
        setTimeout(() => {
            div.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }
};

// Expose to window
window.utils = utils;


// Authentication Logic (Moved from auth.js)
const AUTH_KEY = 'unifund_user';

const auth = {
    getUser: () => {
        const userStr = localStorage.getItem(AUTH_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    setCurrentUser: (user) => {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    },

    login: async (email, password) => {
        try {
            const data = await utils.apiCall('api/login.php', 'POST', { email, password });

            // api/login.php returns { message, user, token }
            if (!data.user) {
                throw new Error('Invalid server response: User data missing');
            }

            const user = {
                id: data.user.id,
                name: data.user.full_name,
                role: data.user.role,
                email: data.user.email,
                status: data.user.status,
                token: data.token,
                wallet: parseFloat(data.user.wallet_balance || 0),
                avatar: data.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.full_name.replace(' ', '')}`
            };

            auth.setCurrentUser(user);
            return { success: true, role: user.role };

        } catch (error) {
            console.error('Login Failed:', error);
            return { success: false, message: error.message };
        }
    },

    signup: async (name, email, password, role) => {
        try {
            const data = await utils.apiCall('api/register.php', 'POST', {
                full_name: name,
                email,
                password,
                role
            });

            const newUser = {
                id: data.user_id,
                name,
                email,
                role,
                status: 'active',
                token: data.token,
                wallet: 0,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`
            };
            auth.setCurrentUser(newUser);
            return { success: true, role };

        } catch (error) {
            console.error('Signup Failed:', error);
            return { success: false, message: error.message };
        }
    },

    logout: () => {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
    },

    requireAuth: () => {
        const user = auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
        }
        return user;
    },

    refreshUser: async () => {
        const user = auth.getUser();
        if (!user) return null;

        try {
            const data = await utils.apiCall(`api/get_profile.php?user_id=${user.id}`);
            if (data && data.user) {
                const updatedUser = {
                    ...user,
                    name: data.user.full_name,
                    email: data.user.email,
                    wallet: parseFloat(data.wallet_balance || 0), // dashboard returns wallet_balance at top level or inside profile? CHECK get_profile.php
                    // get_profile.php returns {user: {...}, profile: {...}}
                    // actually dashboard_data returns wallet_balance.
                    // Let's rely on dashboard_data logic if possible or just update what we have.
                    // get_profile returns user table data.
                    avatar: data.user.avatar_url
                };
                // If wallet balance is in data.user check api/get_profile.php
                // It is NOT in simple get_profile user object (it's in view or profile table).
                // Let's assume dashboard refresh handles wallet.
                // Or call dashboard_data here? No, too heavy.

                auth.setCurrentUser(updatedUser);
                return updatedUser;
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
        return user;
    }
};

window.auth = auth;
