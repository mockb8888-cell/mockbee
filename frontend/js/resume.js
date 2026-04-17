/* ============================================
   MockBee - Resume Builder Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Accordion Logic & Modal Handling
    const accordionItems = document.querySelectorAll('.accordion-item');
    const templateModal = document.getElementById('template-modal');
    const templatesBtn = document.getElementById('templates-btn');
    const closeTemplatesBtn = document.getElementById('close-templates');
    const templateOptions = document.querySelectorAll('.template-option');
    const resumePaper = document.getElementById('resume-preview');
    const standaloneHeader = document.getElementById('standalone-header');

    // Standalone Header Logic (Back button for home page users only)
    if (standaloneHeader) {
        if (window.self === window.top) {
            standaloneHeader.style.display = 'flex';
        } else {
            standaloneHeader.style.display = 'none';
        }
    }

    // Accordion Toggle functionality
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            accordionItems.forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // Template Modal Toggle
    templatesBtn.addEventListener('click', () => {
        templateModal.classList.remove('modal-hidden');
    });

    if (closeTemplatesBtn) {
        closeTemplatesBtn.addEventListener('click', () => {
            templateModal.classList.add('modal-hidden');
        });
    }

    // Template Selection and Style Switching
    templateOptions.forEach(option => {
        option.addEventListener('click', () => {
            const access = option.dataset.access;
            if (access === 'pro' && localStorage.getItem('mockbee_subscribed') !== 'true') {
                document.getElementById('premium-lock').classList.remove('hidden');
                return;
            }

            // Remove active from options
            templateOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            const style = option.dataset.style;
            applyResumeStyle(style);
            templateModal.classList.add('modal-hidden');
        });
    });


    function applyResumeStyle(style) {
        // Reset base styles
        resumePaper.style.background = '#fff';
        resumePaper.style.color = '#333';
        resumePaper.style.borderLeft = 'none';
        resumePaper.style.fontFamily = 'Arial, sans-serif';

        if (style === 'classic') {
            resumePaper.style.fontFamily = '"Times New Roman", serif';
            resumePaper.style.background = '#fcfcfc';
        } else if (style === 'creative') {
            resumePaper.style.borderLeft = '20px solid var(--navy)';
            resumePaper.style.background = '#fefefe';
        }
    }

    // 2. Real-time Live Preview
    const inputs = {
        name: document.getElementById('in-name'),
        role: document.getElementById('in-role'),
        email: document.getElementById('in-email'),
        summary: document.getElementById('in-summary'),
        experience: document.getElementById('in-experience'),
        education: document.getElementById('in-education'),
        skills: document.getElementById('in-skills'),
        projects: document.getElementById('in-projects'),
        certifications: document.getElementById('in-certifications'),
        languages: document.getElementById('in-languages'),
    };

    const previews = {
        name: document.getElementById('p-name'),
        role: document.getElementById('p-role'),
        email: document.getElementById('p-email'),
        summary: document.getElementById('p-summary'),
        experience: document.getElementById('p-experience'),
        education: document.getElementById('p-education'),
        skills: document.getElementById('p-skills'),
        projects: document.getElementById('p-projects'),
        certifications: document.getElementById('p-certifications'),
        languages: document.getElementById('p-languages'),
    };

    const sections = {
        projects: document.getElementById('sec-projects'),
        certifications: document.getElementById('sec-certifications'),
        languages: document.getElementById('sec-languages'),
    };

    // Personal Info: Simple update
    inputs.name.addEventListener('input', (e) => previews.name.innerText = e.target.value || "Sarah Johnson");
    inputs.role.addEventListener('input', (e) => previews.role.innerText = e.target.value || "Marketing Specialist");
    inputs.email.addEventListener('input', (e) => previews.email.innerHTML = `<i class="fas fa-envelope"></i> ${e.target.value || "sarah.johnson@email.com"}`);

    // Summary: Text update
    inputs.summary.addEventListener('input', (e) => previews.summary.innerText = e.target.value || "Results driven professional...");

    // Experience: Multi-line to HTML
    inputs.experience.addEventListener('input', (e) => {
        const text = e.target.value;
        if (!text) {
            previews.experience.innerHTML = `<div class="exp-item"><div class="exp-header"><strong>Wait for input...</strong></div></div>`;
            return;
        }
        
        // Simple parser for demonstration
        const lines = text.split('\n');
        let html = '<div class="exp-item">';
        lines.forEach(line => {
            if (line.trim().startsWith('-')) {
                html += `<ul><li>${line.replace('-', '').trim()}</li></ul>`;
            } else {
                html += `<div class="exp-header"><strong>${line}</strong></div>`;
            }
        });
        html += '</div>';
        previews.experience.innerHTML = html;
    });

    // Education: Simple update
    inputs.education.addEventListener('input', (e) => {
        previews.education.innerHTML = `<div class="edu-item"><strong>${e.target.value || "B.A. Candidate"}</strong></div>`;
    });

    // Skills: Comma separated to list
    inputs.skills.addEventListener('input', (e) => {
        const list = e.target.value.split(',').map(s => `<span>${s.trim()}</span>`).join('');
        previews.skills.innerHTML = list || "<span>Skill A</span><span>Skill B</span>";
    });

    // New Sections: Projects, Certs, Languages
    inputs.projects.addEventListener('input', (e) => {
        const val = e.target.value;
        sections.projects.style.display = val ? 'block' : 'none';
        previews.projects.innerHTML = val.replace(/\n/g, '<br>');
    });

    inputs.certifications.addEventListener('input', (e) => {
        const val = e.target.value;
        sections.certifications.style.display = val ? 'block' : 'none';
        previews.certifications.innerHTML = val.replace(/\n/g, '<br>');
    });

    inputs.languages.addEventListener('input', (e) => {
        const val = e.target.value;
        sections.languages.style.display = val ? 'block' : 'none';
        previews.languages.innerHTML = val;
    });

    // 3. Auto-fill Logic (Simulating extraction from interview performance)
    const autoBtn = document.getElementById('auto-fill-btn');
    autoBtn.addEventListener('click', () => {
        // PRO CHECK: Only allow auto-fill for pro members
        if (localStorage.getItem('mockbee_subscribed') !== 'true') {
            document.getElementById('premium-lock').classList.remove('hidden');
            return;
        }

        // Mock data update
        inputs.name.value = "John Doe";
        inputs.role.value = "Senior Software Engineer";
        inputs.email.value = "john.doe@techcorp.com";
        inputs.summary.value = "Expert in distributed systems and cloud architecture with 8+ years of experience.";
        inputs.skills.value = "Java, Spring Boot, AWS, Kubernetes, Terraform";
        inputs.experience.value = "TechCorp, Senior Engineer, 2018 - Present\n- Led migration to microservices\n- Optimized database query performance by 40%";

        // Trigger manual input events to update preview
        Object.values(inputs).forEach(input => input.dispatchEvent(new Event('input')));
        
        // Open the first accordion
        accordionItems.forEach(i => i.classList.remove('active'));
        accordionItems[0].classList.add('active');
        
        // Visual feedback
        autoBtn.innerText = "Resume Generated!";
        if (window.parent && window.parent.logBeachActivity) {
            window.parent.logBeachActivity(`Resume Generated: ${inputs.role.value}`);
        }
        setTimeout(() => autoBtn.innerHTML = '<i class="fas fa-magic"></i> Build Your Resume', 2000);
    });


    // 4. Download Logic (Simulated)
    document.getElementById('download-pdf').addEventListener('click', () => {
        if (window.parent && window.parent.logBeachActivity) {
            window.parent.logBeachActivity(`Resume Exported as PDF`);
        }
        window.print();
    });

    document.getElementById('download-word').addEventListener('click', () => {
        const btn = document.getElementById('download-word');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Doc...';
        setTimeout(() => {
            btn.innerHTML = oldText;
            alert("Preparing ATS-Friendly Word Document (.docx). Done.");
        }, 1500);
    });

    // 5. Preview Mode Toggle
    const togglePreviewBtn = document.getElementById('toggle-preview');
    const builderGrid = document.querySelector('.builder-grid');

    if (togglePreviewBtn) {
        togglePreviewBtn.addEventListener('click', () => {
            const isPreview = builderGrid.classList.toggle('preview-active');
            togglePreviewBtn.innerHTML = isPreview 
                ? '<i class="fas fa-edit"></i> Edit Mode' 
                : '<i class="fas fa-eye"></i> Preview Mode';
            
            // Scroll to top of resume
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 6. Pro Access Check Logic
    const premiumLock = document.getElementById('premium-lock');
    const closeLockBtn = document.getElementById('close-lock');
    const isDashboard = window.self !== window.top;

    if (isDashboard) {
        // Customize popup for Dashboard only
        const lockTitle = premiumLock.querySelector('h2');
        const lockDesc = premiumLock.querySelector('p');
        const lockBtn = premiumLock.querySelector('.btn-premium');
        
        if (lockTitle) lockTitle.textContent = "MockB Pro/Elite";
        if (lockDesc) lockDesc.innerHTML = "Unlock our ATS-Optimized Resume Builder and <br> 16+ Professional Templates with MockB Pro Or Elite.";
        if (lockBtn) {
            lockBtn.textContent = "Upgrade";
            lockBtn.href = "javascript:void(0)";
            lockBtn.onclick = (e) => {
                e.preventDefault();
                if (window.parent && window.parent.loadPage) {
                    window.parent.loadPage('subscription');
                }
            };
        }
    }

    // Simulate Pro check: check localStorage for 'mockbee_pro'
    // To test: localStorage.setItem('mockbee_pro', 'true')
    function checkProAccess() {
        const isPro = localStorage.getItem('mockbee_subscribed') === 'true';
        if (!isPro) {
            premiumLock.classList.remove('hidden');
        } else {
            premiumLock.classList.add('hidden');
            
            // DYNAMICALLY UNLOCK UI ELEMENTS
            // Remove lock icons from templates
            document.querySelectorAll('.template-option .fa-lock').forEach(icon => icon.remove());
            // Remove PRO badges from descriptions
            document.querySelectorAll('.premium-badge').forEach(badge => badge.remove());
            // Change style of template previews to look unlocked
            document.querySelectorAll('.template-option .t-preview').forEach(preview => {
                preview.style.background = '#fff';
                preview.style.opacity = '1';
            });
        }
    }

    // Run check on load
    checkProAccess();

    if (closeLockBtn) {
        closeLockBtn.addEventListener('click', () => {
            premiumLock.classList.add('hidden');
        });
    }
});

