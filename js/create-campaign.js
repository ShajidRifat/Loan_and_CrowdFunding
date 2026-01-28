/**
 * UniFund Create Campaign Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = layout.init();
    if (user.role !== 'student') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Wizard State
    let currentStep = 1;
    const totalSteps = 3;
    let coverImageBase64 = null;

    // Elements
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };
    const progressBars = {
        1: document.getElementById('progress-bar-1'),
        2: document.getElementById('progress-bar-2')
    };
    const btnNext = document.getElementById('btn-next');
    const btnBack = document.getElementById('btn-back');
    const btnSubmit = document.getElementById('btn-submit');
    const form = document.getElementById('campaign-form');

    // Preview Elements
    const previewTitle = document.getElementById('preview-title');
    const previewTagline = document.getElementById('preview-tagline');
    const previewCategory = document.getElementById('preview-category');
    const previewGoal = document.getElementById('preview-goal');
    const previewDays = document.getElementById('preview-days');
    const previewImage = document.getElementById('preview-image');

    // Inputs
    const inputTitle = document.getElementById('input-title');
    const inputTagline = document.getElementById('input-tagline');
    const inputCategory = document.getElementById('input-category');
    const inputGoal = document.getElementById('input-goal');
    const inputDeadline = document.getElementById('input-deadline');

    // Initialize
    updateWizard();

    // Event Listeners - Navigation
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

    // Event Listeners - Live Preview
    if (inputTitle) inputTitle.addEventListener('input', (e) => previewTitle.textContent = e.target.value || 'Your Campaign Title');
    if (inputTagline) inputTagline.addEventListener('input', (e) => previewTagline.textContent = e.target.value || 'Your short tagline will appear here...');
    if (inputCategory) inputCategory.addEventListener('change', (e) => previewCategory.textContent = e.target.value);
    if (inputGoal) inputGoal.addEventListener('input', (e) => previewGoal.textContent = utils.formatCurrency(e.target.value || 0));

    if (inputDeadline) {
        inputDeadline.addEventListener('change', (e) => {
            if (e.target.value) {
                const days = Math.ceil((new Date(e.target.value) - new Date()) / (1000 * 60 * 60 * 24));
                previewDays.textContent = days > 0 ? days : 0;
            }
        });
    }

    // Image Upload
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-upload');

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
            handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                coverImageBase64 = e.target.result;
                previewImage.src = coverImageBase64;

                // Update Drop Zone UI
                dropZone.innerHTML = `
                    <div class="relative w-full h-32 rounded-lg overflow-hidden">
                        <img src="${coverImageBase64}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium opacity-0 hover:opacity-100 transition-opacity">
                            Change Image
                        </div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    }

    // Check for Edit Mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    let isEditMode = false;

    if (editId) {
        try {
            // Fetch campaign for editing. 
            // We can reuse get_my_campaigns and find, or assume a get_campaign endpoint exists/we create one.
            // For now, let's filter from get_my_campaigns to be safe as we know that endpoint exists.
            const campaigns = await utils.apiCall(`api/get_my_campaigns.php?user_id=${user.id}`);
            const campaignToEdit = campaigns.find(c => c.id == editId);

            if (campaignToEdit) {
                isEditMode = true;
                // Populate Form
                inputTitle.value = campaignToEdit.title;
                inputTagline.value = campaignToEdit.tagline || '';
                // Map category text to value if needed, or if API returns ID
                // inputCategory.value = campaignToEdit.category; 
                // We might need to ensure category matches select values (1,2,3 etc)
                // If API returns "Medical", we need to map back to ID? 
                // Or if select options have value="Medical".
                // Let's assume for now we might need to select by text if value mismatch.
                // Simplified: Set value and hope checks.
                inputCategory.value = campaignToEdit.category_id || campaignToEdit.category; // Try both

                inputGoal.value = campaignToEdit.goal_amount;
                inputDeadline.value = campaignToEdit.end_date; // date format?
                document.getElementById('input-description').value = campaignToEdit.description;

                // Set Image
                if (campaignToEdit.image_url) { // API likely returns image_url
                    coverImageBase64 = campaignToEdit.image_url;
                    previewImage.src = coverImageBase64;
                    dropZone.innerHTML = `
                        <div class="relative w-full h-32 rounded-lg overflow-hidden">
                            <img src="${coverImageBase64}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium opacity-0 hover:opacity-100 transition-opacity">
                                Change Image
                            </div>
                        </div>
                    `;
                }

                // Update UI for Edit Mode
                document.getElementById('form-title').textContent = 'Edit Campaign';
                btnSubmit.textContent = 'Save Changes';

                // Trigger input events to update preview
                inputTitle.dispatchEvent(new Event('input'));
                inputTagline.dispatchEvent(new Event('input'));
                inputGoal.dispatchEvent(new Event('input'));
                inputCategory.dispatchEvent(new Event('change'));
                if (inputDeadline.value) inputDeadline.dispatchEvent(new Event('change'));
            }
        } catch (e) {
            console.error("Failed to load campaign for editing", e);
        }
    }

    // Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);

            // Prepare Payload
            const payload = {
                studentId: user.id,
                title: formData.get('title'),
                goal_amount: parseFloat(formData.get('goal')),
                end_date: formData.get('deadline'),
                category_id: formData.get('category'), // Sends ID (1, 2, 3...) directly
                description: formData.get('description'),
                tagline: formData.get('tagline'),
                cover_image: coverImageBase64
            };

            // Remove category mapping as backend expects ID
            // const catMap = { '1': 'Education', '2': 'Project', '3': 'Medical', '4': 'Emergency', '5': 'Community' };
            // if (catMap[payload.category]) payload.category = catMap[payload.category];

            try {
                if (isEditMode) {
                    // Edit Logic (TODO: api/update_campaign.php)
                    utils.showNotification('Edit functionality not yet linked to API', 'info');
                } else {
                    // Create New
                    await utils.apiCall('api/create_campaign.php', 'POST', payload);

                    // Success Modal
                    const successHtml = `
                        <div class="text-center py-6">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <i data-lucide="clipboard-check" class="h-10 w-10 text-blue-600"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-slate-900 mb-2">Submitted for Review!</h2>
                            <p class="text-slate-500 mb-8">Your campaign <strong>${payload.title}</strong> has been submitted. An admin will review it shortly. Once approved, it will be visible to donors.</p>
                            <button onclick="window.location.href = 'dashboard.html'" class="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">
                                Back to Dashboard
                            </button>
                        </div>
                    `;
                    utils.showModal('', successHtml);
                    lucide.createIcons();
                }
            } catch (error) {
                console.error('Campaign Creation Failed:', error);
                utils.showNotification(error.message || 'Failed to create campaign', 'error');
            }
        });
    }

    function updateWizard() {
        // Toggle Steps
        Object.values(steps).forEach(el => el.classList.add('hidden'));
        if (steps[currentStep]) steps[currentStep].classList.remove('hidden');

        // Update Progress Bars
        if (currentStep > 1) progressBars[1].style.width = '100%';
        else progressBars[1].style.width = '0%';

        if (currentStep > 2) progressBars[2].style.width = '100%';
        else progressBars[2].style.width = '0%';

        // Update Indicators (Visual only, simplified for now)
        // In a real app, we'd toggle classes on the indicators themselves

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
            if (!inputTitle.value || !inputCategory.value) {
                utils.showNotification('Please fill in required fields', 'error');
                return false;
            }
        }
        if (step === 2) {
            if (!inputGoal.value || !inputDeadline.value) {
                utils.showNotification('Please set a goal and deadline', 'error');
                return false;
            }
        }
        return true;
    }
});
