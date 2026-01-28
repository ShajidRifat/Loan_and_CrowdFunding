/**
 * UniFund Apply Loan Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = layout.init();

    // Wizard State
    let currentStep = 1;
    const totalSteps = 3;

    // Elements
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };
    const indicators = document.querySelectorAll('.step-indicator');
    const btnNext = document.getElementById('btn-next');
    const btnBack = document.getElementById('btn-back');
    const btnSubmit = document.getElementById('btn-submit');
    const form = document.getElementById('loan-form');

    // EMI Elements
    const amountInput = document.getElementById('amount-input');
    const amountSlider = document.getElementById('amount-slider');
    const termSelect = document.getElementById('term');
    const emiDisplay = document.getElementById('emi-amount');

    // Initialize
    updateEMI();

    // Event Listeners
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateWizard();
            }
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateWizard();
            }
        });
    }

    // Sync Slider & Input
    if (amountSlider && amountInput) {
        amountSlider.addEventListener('input', (e) => {
            amountInput.value = e.target.value;
            updateEMI();
        });

        amountInput.addEventListener('input', (e) => {
            if (e.target.value <= 50000) {
                amountSlider.value = e.target.value;
                updateEMI();
            }
        });
    }

    if (termSelect) {
        termSelect.addEventListener('change', updateEMI);
    }

    // Document Upload (Visual Only)
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-upload');
    const fileList = document.getElementById('file-list');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-brand-500', 'bg-brand-50');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-brand-500', 'bg-brand-50');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-brand-500', 'bg-brand-50');
            handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    function handleFiles(files) {
        if (files.length > 0 && fileList) {
            fileList.innerHTML = '';
            Array.from(files).forEach(file => {
                const item = document.createElement('div');
                item.className = 'flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200';
                item.innerHTML = `
                    <i data-lucide="file-text" class="h-5 w-5 text-brand-600"></i>
                    <span class="text-sm font-medium text-slate-700 truncate flex-1">${file.name}</span>
                    <i data-lucide="check-circle" class="h-4 w-4 text-emerald-500"></i>
                `;
                fileList.appendChild(item);
            });
            if (window.lucide) lucide.createIcons();
        }
    }

    // Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const termsCheck = document.getElementById('terms-check');
            if (termsCheck && !termsCheck.checked) {
                utils.showNotification('Please agree to the Terms & Conditions', 'error');
                return;
            }

            // Create Loan Object
            const amount = parseFloat(amountInput.value);
            const term = parseInt(termSelect.value);
            const purpose = document.getElementById('category').value;

            // Submit to API
            try {
                await utils.apiCall('api/apply_loan.php', 'POST', {
                    studentId: user.id, // Ensure user.id matches what auth returns (API return user_id as id? yes)
                    amount: amount,
                    purpose: `${purpose} Loan`, // Or just purpose
                    duration: term,
                    category: purpose
                });

                showSuccessModal();

            } catch (error) {
                console.error('Loan Application Failed:', error);
                utils.showNotification(error.message || 'Application failed', 'error');
            }
        });
    }

    function updateWizard() {
        // Toggle Steps
        Object.values(steps).forEach(el => {
            if (el) el.classList.add('hidden');
        });
        if (steps[currentStep]) steps[currentStep].classList.remove('hidden');

        // Update Indicators
        indicators.forEach((ind, idx) => {
            const circle = ind.querySelector('div');
            const text = ind.querySelector('span');

            if (idx + 1 === currentStep) {
                // Active
                ind.classList.add('active');
                circle.className = 'w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shadow-lg shadow-brand-500/20 transition-colors duration-300';
                text.className = 'text-xs font-bold text-brand-600';
                if (circle.innerHTML.includes('check')) circle.textContent = idx + 1;
            } else if (idx + 1 < currentStep) {
                // Completed
                ind.classList.remove('active');
                circle.className = 'w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold transition-colors duration-300';
                circle.innerHTML = '<i data-lucide="check" class="h-5 w-5"></i>';
                text.className = 'text-xs font-bold text-emerald-600';
            } else {
                // Pending
                ind.classList.remove('active');
                circle.className = 'w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold transition-colors duration-300';
                circle.textContent = idx + 1;
                text.className = 'text-xs font-bold text-slate-400';
            }
        });
        if (window.lucide) lucide.createIcons();

        // Update Buttons
        if (btnBack) btnBack.classList.toggle('hidden', currentStep === 1);
        if (currentStep === totalSteps) {
            if (btnNext) btnNext.classList.add('hidden');
            if (btnSubmit) btnSubmit.classList.remove('hidden');
        } else {
            if (btnNext) btnNext.classList.remove('hidden');
            if (btnSubmit) btnSubmit.classList.add('hidden');
        }
    }

    function validateStep(step) {
        if (step === 1) {
            const amount = amountInput ? amountInput.value : 0;
            const purposeEl = document.getElementById('category');
            const purpose = purposeEl ? purposeEl.value : '';
            const term = termSelect ? termSelect.value : '';

            if (!amount || !purpose || !term) {
                utils.showNotification('Please fill in all fields', 'error');
                return false;
            }
        }
        if (step === 2) {
            const pName = document.getElementById('parent-name').value;
            const pPhone = document.getElementById('parent-phone').value;
            if (!pName || !pPhone) {
                utils.showNotification('Please fill in parent details', 'error');
                return false;
            }
        }
        return true;
    }

    function updateEMI() {
        if (!amountInput || !termSelect || !emiDisplay) return;

        const amount = parseFloat(amountInput.value) || 0;
        const months = parseInt(termSelect.value) || 12; // Default to 12 if not selected
        const emi = Math.ceil(amount / months);
        emiDisplay.textContent = `৳${emi.toLocaleString()}`;
    }

    function showSuccessModal() {
        const modalHtml = `
            <div class="text-center p-6">
                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <i data-lucide="check" class="h-10 w-10 text-emerald-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
                <p class="text-slate-500 mb-8">Your loan application has been received and is under review. We will notify you shortly.</p>
                <div class="flex gap-3 justify-center">
                    <a href="dashboard.html" class="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Go to Dashboard
                    </a>
                    <button onclick="window.location.reload()" class="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-colors">
                        View Application
                    </button>
                </div>
            </div>
        `;
        utils.showModal('', modalHtml);

        // Simple Confetti Effect
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        // Basic confetti
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        for (let i = 0; i < 100; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                color: ['#4f46e5', '#10b981', '#f59e0b'][Math.floor(Math.random() * 3)],
                size: Math.random() * 10 + 5,
                speed: Math.random() * 5 + 2
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                p.y += p.speed;
                if (p.y > canvas.height) p.y = -20;
            });
            requestAnimationFrame(animate);
        }
        animate();

        setTimeout(() => canvas.remove(), 5000);
    }
});
