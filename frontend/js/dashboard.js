/* --- MockBee Dashboard Logic --- */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic User Name & Date
    const userNameElement = document.getElementById('dynamic-user-name');
    const sideUserNameElement = document.getElementById('side-user-name');
    const dateElement = document.getElementById('current-date');
    const userAvatar = document.getElementById('user-avatar');

    // Get name from localStorage (set during signup/login)
    const storedName = localStorage.getItem('mockbee_user_name') || 'Success Seeker';
    // If stored value looks like an email, show only the part before @
    const displayName = storedName.includes('@') ? storedName.split('@')[0] : storedName;
    userNameElement.textContent = displayName;
    sideUserNameElement.textContent = displayName;
    userAvatar.textContent = displayName.charAt(0).toUpperCase();

    // Set Current Date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options);

    // 2. Navigation Control
    const navItems = document.querySelectorAll('.nav-item');
    const frame = document.getElementById('page-frame');
    const overviewSection = document.getElementById('overview-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(i => i.classList.remove('active'));

            // Set current active
            item.classList.add('active');

            const page = item.getAttribute('data-page');
            loadPage(page);
        });
    });

    // 3. Subscription Button Logic
    const subBtn = document.getElementById('btn-sub');
    const subText = document.getElementById('sub-text');
    const userPlanBadge = document.querySelector('.user-plan-mini');

    const updateSubUI = (isSubbed) => {
        const subscribedPlan = localStorage.getItem('mockbee_subscribed_plan') || 'pro';

        if (isSubbed) {
            subBtn?.classList.add('is-subscribed');

            if (subscribedPlan === 'standard' || subscribedPlan === 'pro_plan') {
                if (subText) subText.textContent = 'Pro Member';
                if (userPlanBadge) userPlanBadge.textContent = 'PRO PLAN';
                // Yellow coloring for Pro plan
                if (userPlanBadge) {
                    userPlanBadge.style.backgroundColor = 'transparent';
                    userPlanBadge.style.color = '#F2C94C';
                }
                if (subBtn) {
                    subBtn.style.setProperty('background-color', '#F2C94C', 'important');
                    subBtn.style.setProperty('border-color', '#F2C94C', 'important');
                    subBtn.style.setProperty('color', '#1A1A1A', 'important');
                }
            } else if (subscribedPlan === 'pro' || subscribedPlan === 'elite_plan') {
                if (subText) subText.textContent = 'Elite Member';
                if (userPlanBadge) userPlanBadge.textContent = 'ELITE PLAN';
                // Green coloring for Elite plan
                if (userPlanBadge) {
                    userPlanBadge.style.backgroundColor = 'transparent';
                    userPlanBadge.style.color = '#27AE60';
                }
                if (subBtn) {
                    subBtn.style.setProperty('background-color', '#27AE60', 'important');
                    subBtn.style.setProperty('border-color', '#27AE60', 'important');
                    subBtn.style.setProperty('color', '#FFF', 'important');
                }
            }
        } else {
            subBtn?.classList.remove('is-subscribed');
            if (subText) subText.textContent = 'Join MockB Membership';
            if (userPlanBadge) {
                userPlanBadge.textContent = 'FREE PLAN';
                userPlanBadge.style.backgroundColor = '';
                userPlanBadge.style.color = '';
            }
            if (subBtn) {
                subBtn.style.backgroundColor = '';
                subBtn.style.borderColor = '';
                subBtn.style.color = '';
            }
        }
    };

    // Initial load
    updateSubUI(localStorage.getItem('mockbee_subscribed') === 'true');

    subBtn?.addEventListener('click', () => {
        const isCurrentlySubbed = localStorage.getItem('mockbee_subscribed') === 'true';
        if (isCurrentlySubbed) {
            alert('You are already a Pro Member! Enjoy all premium benefits.');
        } else {
            const targetNav = document.querySelector(`.nav-item[data-page="subscription"]`);
            if (targetNav) {
                navItems.forEach(i => i.classList.remove('active'));
                targetNav.classList.add('active');
            }
            window.loadPage('subscription');
        }
    });

    // 4. Load Page Function
    window.loadPage = (pageKey) => {
        localStorage.setItem('mockbee_last_page', pageKey);
        if (pageKey === 'home') {
            overviewSection.classList.remove('hidden');
            frame.classList.add('hidden');
            return;
        }

        // Mapping keys to existing HTML files
        const pageMap = {
            'resume': 'resume.html',
            'feedback': 'performance.html',
            'practice': 'quick-practice.html',
            'subscription': 'dashboard-subscription.html',
            'roles': 'roles.html',
            'comp-prep': 'company-prep.html',
            'achievements': 'achievements.html',
            'settings': 'settings.html',
            'roadmap': 'roadmap.html'
        };

        const targetUrl = pageMap[pageKey];

        if (targetUrl) {
            overviewSection.classList.add('hidden');
            frame.classList.remove('hidden');
            frame.src = targetUrl;
        } else {
            console.warn(`Page map for ${pageKey} not found.`);
        }
    };

    // 5. Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Load saved state
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
        sidebar.classList.add('sidebar--collapsed');
    }

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar--collapsed');
        const isCollapsed = sidebar.classList.contains('sidebar--collapsed');
        localStorage.setItem('sidebar_collapsed', isCollapsed);
    });

    // 6. Handle URL Parameters for specific page loading
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page') || localStorage.getItem('mockbee_last_page') || 'home';
    if (pageParam) {
        // Find corresponding link in sidebar to set active state
        const targetNav = document.querySelector(`.nav-item[data-page="${pageParam}"]`);
        if (targetNav) {
            navItems.forEach(i => i.classList.remove('active'));
            targetNav.classList.add('active');
        }
        window.loadPage(pageParam);
    }

    // 7. Notification Bell Logic with Dynamic Data
    const notifBell = document.querySelector('.notif-bell');
    const notifDot = document.querySelector('.notif-dot');

    const renderNotifications = () => {
        const notifications = JSON.parse(localStorage.getItem('mockbee_notifications') || '[]');
        const isUnread = localStorage.getItem('mockbee_notif_unread') === 'true';
        
        if (isUnread && notifDot) notifDot.style.display = 'block';
        else if (notifDot) notifDot.style.display = 'none';

        let htmlContent = '<div style="text-align: left; padding: 10px;">';
        if (notifications.length === 0) {
            htmlContent += '<p style="color: #888; font-size: 0.85rem; text-align: center;">No new notifications</p>';
        } else {
            notifications.slice(0, 5).forEach(n => {
                htmlContent += `
                    <p style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #eee; font-size: 0.9rem;">
                        <i class="fas fa-certificate" style="color: #D8C4B6; margin-right: 8px;"></i> ${n.msg}
                        <br><small style="color: #999;">${formatActivityTime(n.time)}</small>
                    </p>`;
            });
        }
        htmlContent += '</div>';
        return htmlContent;
    };

    notifBell?.addEventListener('click', () => {
        // Mark as read when opened
        localStorage.setItem('mockbee_notif_unread', 'false');
        if (notifDot) notifDot.style.display = 'none';

        Swal.fire({
            title: 'Notifications',
            html: renderNotifications(),
            confirmButtonText: 'Clear All',
            confirmButtonColor: '#1A1A1A',
            showCancelButton: true,
            cancelButtonText: 'Close',
            background: '#FFFFFF',
            color: '#1A1A1A'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem('mockbee_notifications', '[]');
                if (notifDot) notifDot.style.display = 'none';
            }
        });
    });

    window.addNotification = (msg) => {
        const notifications = JSON.parse(localStorage.getItem('mockbee_notifications') || '[]');
        // Don't duplicate recently added same msg (especially expiry alerts)
        if (notifications.length > 0 && notifications[0].msg === msg) return;
        
        notifications.unshift({ msg, time: new Date().toISOString() });
        localStorage.setItem('mockbee_notifications', JSON.stringify(notifications));
        localStorage.setItem('mockbee_notif_unread', 'true');
        if (notifDot) notifDot.style.display = 'block';
    };

    // 7.1 Subscription Expiry Check
    function checkSubscriptionExpiry() {
        const isSubbed = localStorage.getItem('mockbee_subscribed') === 'true';
        if (!isSubbed) return;

        // Get/Set mock expiry date (7 days from now if not exists)
        let expiryDate = localStorage.getItem('mockbee_subscription_expiry');
        if (!expiryDate) {
            const future = new Date();
            future.setDate(future.getDate() + 7); 
            expiryDate = future.toISOString();
            localStorage.setItem('mockbee_subscription_expiry', expiryDate);
        }

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= 5) {
            window.addNotification(`Action Required: Your subscription ends in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
        } else if (diffDays <= 0) {
            // Subscription expired logic
            localStorage.setItem('mockbee_subscribed', 'false');
            window.addNotification("Your MockBee Pro subscription has expired.");
        }
    }

    // Run expiry check
    checkSubscriptionExpiry();

    // 8. Welcome Email Service (Pure Fetch Edition)
    const needsEmail = localStorage.getItem('mockbee_send_welcome_email') === 'true';
    const userName = localStorage.getItem('mockbee_user_name') || 'Success Seeker';
    const userEmail = localStorage.getItem('mockbee_user_email');

    if (needsEmail && userEmail) {
        initiateWelcomeEmail(userName, userEmail);
    }

    async function initiateWelcomeEmail(name, email) {
        const SERVICE_ID = 'service_xxxx';
        const TEMPLATE_ID = 'template_xxxx';
        const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
        const siteUrl = window.location.origin + window.location.pathname.replace('dashboard.html', 'index.html');

        try {
            const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: SERVICE_ID,
                    template_id: TEMPLATE_ID,
                    user_id: PUBLIC_KEY,
                    template_params: {
                        user_name: name,
                        user_email: email,
                        message: `Hi ${name},\n\nWelcome to MockB! Your journey to a dream career starts here.\n\nDashboard: ${siteUrl}`
                    }
                })
            });

            if (response.ok) {
                localStorage.removeItem('mockbee_send_welcome_email');
            }
        } catch (e) {
            localStorage.removeItem('mockbee_send_welcome_email');
        }
    }


    // 9. Dynamic Recent Activity System
    const activityList = document.querySelector('.activity-list');

    window.logBeachActivity = (title) => {
        const activities = JSON.parse(localStorage.getItem('mockbee_activities') || '[]');
        const newActivity = { title: title, time: new Date().toISOString() };
        activities.unshift(newActivity);
        localStorage.setItem('mockbee_activities', JSON.stringify(activities)); // Show all activities dynamically
        if (activityList) renderActivities();
        updateDashboardStats(); // Update stats on new activity
    };

    function renderActivities() {
        if (!activityList) return;
        const activities = JSON.parse(localStorage.getItem('mockbee_activities') || '[]');
        if (activities.length === 0) {
            const defaults = [
                { title: "Interview Practice Started", time: new Date(Date.now() - 3600000).toISOString() },
                { title: "Dashboard Profile Created", time: new Date(Date.now() - 7200000).toISOString() }
            ];
            localStorage.setItem('mockbee_activities', JSON.stringify(defaults));
            return renderActivities();
        }

        activityList.innerHTML = '';
        activities.forEach(act => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `<span>${act.title}</span><span>${formatActivityTime(act.time)}</span>`;
            activityList.appendChild(item);
        });
    }

    function formatActivityTime(isoString) {
        const diffMin = Math.floor((new Date() - new Date(isoString)) / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
        return new Date(isoString).toLocaleDateString();
    }

    // 10. Update Stats (Interviews & Achievements)
    function updateDashboardStats() {
        const interviews = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
        const activities = JSON.parse(localStorage.getItem('mockbee_activities') || '[]');
        const isSubscribed = localStorage.getItem('mockbee_subscribed') === 'true';

        // Dynamic Achievement Tracking
        const currentBadges = JSON.parse(localStorage.getItem('mockbee_badges') || '[]');
        const newBadges = [];

        if (interviews.length > 0 && !currentBadges.includes('first_interview')) newBadges.push('first_interview');
        if (activities.some(a => a.title.toLowerCase().includes('resume')) && !currentBadges.includes('resume_master')) newBadges.push('resume_master');
        if (isSubscribed && !currentBadges.includes('pro_member')) newBadges.push('pro_member');
        if (activities.some(a => a.title.toLowerCase().includes('roadmap')) && !currentBadges.includes('roadmap_explorer')) newBadges.push('roadmap_explorer');
        if (activities.length >= 5 && !currentBadges.includes('active_practitioner')) newBadges.push('active_practitioner');

        if (newBadges.length > 0) {
            const updatedBadges = [...currentBadges, ...newBadges];
            localStorage.setItem('mockbee_badges', JSON.stringify(updatedBadges));
            
            newBadges.forEach(b => {
                const badgeNames = {
                    'first_interview': 'The Take-Off 🚀',
                    'resume_master': 'ATS Master 📄',
                    'pro_member': 'The Professional 👑',
                    'roadmap_explorer': 'Roadmap Explorer 🗺️',
                    'active_practitioner': 'Dedicated Learner ⏱️'
                };
                window.addNotification(`Achievement Unlocked: ${badgeNames[b]}`);
            });
        }

        const interviewCountElem = document.getElementById('mock-interviews-count');
        if (interviewCountElem) interviewCountElem.textContent = interviews.length;

        const achievementCountElem = document.getElementById('achievements-count');
        if (achievementCountElem) {
            achievementCountElem.textContent = JSON.parse(localStorage.getItem('mockbee_badges') || '[]').length;
        }

        // ATS Average & Latest Visualization
        const atsElement = document.getElementById('ats-score-average');
        const latestText = document.getElementById('latest-score-text');
        const latestBar = document.getElementById('latest-score-bar');

        const scoredInterviews = interviews.filter(i => i.analysis && i.analysis.overall);
        
        if (scoredInterviews.length > 0) {
            // ATS Average
            const sum = scoredInterviews.reduce((acc, curr) => acc + curr.analysis.overall, 0);
            const avg = Math.round(sum / scoredInterviews.length);
            if (atsElement) atsElement.textContent = avg + "%";
            
            // Latest Result Visualization
            const latest = scoredInterviews[scoredInterviews.length - 1]; // Because localStorage pushes it to the end
            if (latestText) latestText.textContent = latest.analysis.overall + "%";
            if (latestBar) {
                // Determine color based on score (similar performance logic)
                if (latest.analysis.overall >= 80) latestBar.style.background = '#27AE60'; // Green
                else if (latest.analysis.overall >= 60) latestBar.style.background = 'var(--gold-dark)'; // Yellowish
                else latestBar.style.background = '#E53935'; // Red
                
                setTimeout(() => {
                    latestBar.style.width = latest.analysis.overall + '%';
                }, 300);
            }
        } else {
            if (atsElement) atsElement.textContent = "--%";
        }
    }

    // 11. Sync Database History
    const userEmailSync = localStorage.getItem('mockbee_user_email');
    if (userEmailSync) {
        fetch(`https://mockbee.onrender.com/api/interview/history?email=${encodeURIComponent(userEmailSync)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.history && data.history.length > 0) {
                // Reverse to guarantee oldest first (chronological array order), and inject missing frontend view flags
                const chronological = data.history.reverse().map(session => {
                    if (session.isPro === undefined && session.isQuick === undefined) {
                        const m = session.mode;
                        if (m === '1-q' || m === '5-min' || m === 'rapid' || m === 'warmup') {
                            session.isQuick = true;
                            session.isPro = false;
                        } else {
                            session.isPro = true;
                            session.isQuick = false;
                        }
                    }
                    return session;
                });
                localStorage.setItem('mockbee_interviews', JSON.stringify(chronological));
                // Redraw stats dynamically after fetching DB!
                updateDashboardStats();
            }
        })
        .catch(err => console.error("Could not sync DB history:", err));
    }

    renderActivities();
    updateDashboardStats(); // Initial call
});

// Logout Logic with SweetAlert2
document.querySelector('.btn-logout')?.addEventListener('click', () => {
    Swal.fire({
        title: 'Wait! Are you leaving?',
        text: "You'll need to login again to access your mock interviews.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1A1A1A', // Navy
        cancelButtonColor: '#D8C4B6', // Gold
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Keep Practicing',
        background: '#FFFFFF',
        color: '#1A1A1A',
        iconColor: '#D8C4B6'
    }).then((result) => {
        if (result.isConfirmed) {
            // Save current session state back to account registry before logout
            const email = localStorage.getItem('mockbee_user_email') || '';
            const name = localStorage.getItem('mockbee_user_name') || '';
            const subscribed = localStorage.getItem('mockbee_subscribed') === 'true';

            if (email) {
                const accounts = JSON.parse(localStorage.getItem('mockbee_accounts') || '{}');
                if (accounts[email]) {
                    // ✅ PRESERVE PASSWORD and other existing data
                    accounts[email].name = name;
                    accounts[email].subscribed = subscribed;
                    accounts[email].interviews = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
                    accounts[email].activities = JSON.parse(localStorage.getItem('mockbee_activities') || '[]');
                    localStorage.setItem('mockbee_accounts', JSON.stringify(accounts));
                }
            }

            // Clear session keys
            localStorage.removeItem('mockbee_user_name');
            localStorage.removeItem('mockbee_user_email');
            localStorage.removeItem('mockbee_subscribed');
            localStorage.removeItem('mockbee_last_page');
            localStorage.removeItem('mockbee_interviews');
            localStorage.removeItem('mockbee_activities');

            // Show success alert
            Swal.fire({
                title: 'Logged Out!',
                text: 'See you again soon, Success Seeker.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'login.html';
            });
        }
    });
});
