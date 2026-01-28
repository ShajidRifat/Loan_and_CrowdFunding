/**
 * UniFund Layout Logic (Sidebar & Header)
 */

function initLayout() {
    const user = auth.requireAuth();
    if (!user) return null;

    // Setup Sidebar
    setupSidebar(user);
    setupHeader(user);

    // Update User Info in Sidebar
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userInitialEl = document.getElementById('user-initial');
    const userAvatarEl = document.getElementById('user-avatar-sidebar');

    if (userNameEl) userNameEl.textContent = user.name || 'User';
    if (userRoleEl) userRoleEl.textContent = user.role;
    if (userInitialEl) userInitialEl.textContent = (user.name || 'User').charAt(0);

    if (userAvatarEl && user.avatar) {
        userAvatarEl.src = user.avatar;
        // Hide initial if avatar is present
        if (userInitialEl && userInitialEl.parentElement) {
            userInitialEl.parentElement.style.display = 'none';
            userAvatarEl.parentElement.style.display = 'block';
        }
    } else if (userAvatarEl) {
        userAvatarEl.parentElement.style.display = 'none';
    }

    // Initialize Icons
    if (window.lucide) lucide.createIcons();

    return user;
}

function setupSidebar(user) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const path = window.location.pathname;
    // const page = path.split('/').pop() || 'dashboard.html';

    let links = [];

    if (user.role === 'student') {
        if (user.restricted) {
            // RESTRICTED MODE: Only loans and history
            links = [
                { icon: 'alert-triangle', text: 'Account Restricted', href: 'recovery-dashboard.html' },
                { icon: 'banknote', text: 'My Loans', href: 'my-loans.html' },
                { icon: 'file-clock', text: 'Payment History', href: 'history.html' },
            ];
        } else {
            // NORMAL MODE
            links = [
                { icon: 'layout-dashboard', text: 'Dashboard', href: 'dashboard.html' },
                { icon: 'user', text: 'My Profile', href: 'profile.html' },
                { icon: 'file-clock', text: 'Payment History', href: 'history.html' },
                { icon: 'search', text: 'Browse Campaigns', href: 'campaign-marketplace.html' },
                { icon: 'plus-circle', text: 'Apply for Loan', href: 'apply-loan.html' },
                { icon: 'banknote', text: 'My Loans', href: 'my-loans.html' },
                { icon: 'megaphone', text: 'Create Campaign', href: 'create-campaign.html' },
                { icon: 'heart', text: 'My Campaigns', href: 'my-campaigns.html' },
            ];
        }

    } else if (user.role === 'donor') {
        links = [
            { icon: 'layout-dashboard', text: 'Impact Dashboard', href: 'donor-dashboard.html' },
            { icon: 'user', text: 'My Profile', href: 'profile.html' },
            { icon: 'search', text: 'Browse Campaigns', href: 'campaign-marketplace.html' },
            { icon: 'file-clock', text: 'Payment History', href: 'history.html' },
        ];
    } else if (user.role === 'admin') {
        links = [
            { icon: 'layout-dashboard', text: 'Overview', href: 'admin-dashboard.html' },
            { icon: 'users', text: 'Users', href: 'admin-users.html' },
            { icon: 'search', text: 'Browse Campaigns', href: 'campaign-marketplace.html' },
            { icon: 'alert-triangle', text: 'Fraud Center', href: 'fraud-center.html' },
            { icon: 'file-clock', text: 'Payment History', href: 'history.html' },
        ];
    } else {
        // Default / Fallback (treat as student)
        links = [
            { icon: 'layout-dashboard', text: 'Dashboard', href: 'dashboard.html' },
            { icon: 'user', text: 'My Profile', href: 'profile.html' },
            { icon: 'file-clock', text: 'Payment History', href: 'history.html' },
        ];
        console.warn('Unknown user role:', user.role);
    }

    // Sidebar HTML
    const sidebarHtml = `
        <div class="h-full flex flex-col bg-white border-r border-slate-200">
            <div class="p-6 flex items-center gap-3 overflow-hidden">
                <div class="h-8 w-8 min-w-[2rem] bg-brand-600 rounded-lg flex items-center justify-center">
                    <i data-lucide="layers" class="text-white h-5 w-5"></i>
                </div>
                <span class="logo-text font-display font-bold text-lg text-slate-900 leading-tight whitespace-nowrap">Loan &<br>CrowdFunding</span>
            </div>

            <nav class="flex-1 px-4 space-y-2 mt-4">
                ${links.map(link => `
                    <a href="${link.href}" class="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-all group ${window.location.pathname.includes(link.href) ? 'bg-brand-50 text-brand-600 font-semibold' : ''}">
                        <i data-lucide="${link.icon}" class="h-5 w-5 min-w-[1.25rem] group-hover:scale-110 transition-transform"></i>
                        <span class="sidebar-text whitespace-nowrap">${link.text}</span>
                    </a>
                `).join('')}
            </nav>

            <div class="p-4 border-t border-slate-100">
                <div onclick="window.location.href='profile.html'" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer overflow-hidden" title="View Profile">
                    <img id="user-avatar-sidebar" src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}" class="h-10 w-10 min-w-[2.5rem] rounded-full border border-slate-200" alt="User">
                    <div class="flex-1 min-w-0 sidebar-text">
                        <div class="font-bold text-sm text-slate-900 truncate" id="user-name">${user.name || 'User'}</div>
                        <div class="text-xs text-slate-500 truncate" id="user-role">${user.role}</div>
                    </div>
                    <i data-lucide="chevron-down" class="h-4 w-4 text-slate-400 sidebar-text"></i>
                </div>
                <button onclick="auth.logout()" class="mt-2 w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium overflow-hidden">
                    <i data-lucide="log-out" class="h-4 w-4 min-w-[1rem]"></i> <span class="sidebar-text">Sign Out</span>
                </button>
            </div>
        </div>
    `;

    // console.log('Setting sidebar HTML');
    container.innerHTML = sidebarHtml;
}

function setupHeader(user) {
    // Populate Header User Info
    const headerName = document.getElementById('header-user-name');
    const headerInitial = document.getElementById('header-user-initial');
    const headerInitialInner = document.getElementById('header-user-initial-inner');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');

    const name = user.name || 'User';
    if (headerName) headerName.textContent = name.split(' ')[0];
    if (headerInitial) headerInitial.textContent = name.charAt(0);
    if (headerInitialInner) headerInitialInner.textContent = name.charAt(0);
    if (dropdownName) dropdownName.textContent = name;
    if (dropdownEmail) dropdownEmail.textContent = user.email || '';

    // Dropdown Toggles
    const btnNotif = document.getElementById('btn-notifications');
    const dropNotif = document.getElementById('dropdown-notifications');
    const btnProfile = document.getElementById('btn-profile');
    const dropProfile = document.getElementById('dropdown-profile');

    if (btnNotif && dropNotif) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            dropNotif.classList.toggle('hidden');
            if (dropProfile) dropProfile.classList.add('hidden');
        });
    }

    if (btnProfile && dropProfile) {
        btnProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            dropProfile.classList.toggle('hidden');
            if (dropNotif) dropNotif.classList.add('hidden');
        });
    }

    // Close on click outside
    document.addEventListener('click', () => {
        if (dropNotif) dropNotif.classList.add('hidden');
        if (dropProfile) dropProfile.classList.add('hidden');
    });

    if (dropNotif) dropNotif.addEventListener('click', (e) => e.stopPropagation());
    if (dropProfile) dropProfile.addEventListener('click', (e) => e.stopPropagation());

    // Mark All Read Logic
    const btnMarkRead = document.getElementById('btn-mark-read');
    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', (e) => {
            e.stopPropagation();
            // 1. Hide the Red Dot
            const badge = document.querySelector('#btn-notifications span');
            if (badge) badge.style.display = 'none';

            // 2. Show Feedback
            if (window.utils && utils.showNotification) {
                utils.showNotification('All notifications marked as read');
            } else {
                alert('All notifications marked as read');
            }

            // 3. Close Dropdown (Optional, keeps it cleaner)
            if (dropNotif) dropNotif.classList.add('hidden');
        });
    }
}

// Expose to window
window.layout = { init: initLayout };
