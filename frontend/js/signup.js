document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const signupForm = document.querySelector('.auth-form');
    const errorMsg = document.getElementById('signup-error-msg');
    const errorText = document.getElementById('error-text');
    const inputs = document.querySelectorAll('.form-input');
    
    // 0. Simulated Social OAuth Clicks for Signup
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            const titleAttr = icon.getAttribute('title') || '';
            const provider = titleAttr.replace('Sign in with ', '');
            if (!provider || provider === '') return;

            const mockName = `${provider} User`;
            const mockEmail = `${provider.toLowerCase()}-auth@mockbee.com`;
            const mockPassword = `oauth_token_${provider.toLowerCase()}`;

            // Register directly via backend API
            fetch('https://mockbee.onrender.com/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: mockName, email: mockEmail, password: mockPassword })
            })
            .then(res => res.json())
            .then(regData => {
                if (regData.status === 'success' || regData.detail === 'Account already exists. Try logging in.') {
                    // Success, or it was already made earlier! Log them in:
                    localStorage.setItem('mockbee_user_name', mockName);
                    localStorage.setItem('mockbee_user_email', mockEmail);
                    localStorage.setItem('mockbee_subscribed', 'false');
                    
                    localStorage.removeItem('mockbee_subscribed_plan');
                    localStorage.removeItem('mockbee_all_plans');
                    localStorage.removeItem('mockbee_interviews');
                    localStorage.removeItem('mockbee_activities');

                    window.location.href = 'dashboard.html';
                } else {
                    alert(`Failed to simulate ${provider} registration.`);
                }
            }).catch(err => {
                // If backend fails, fallback to local simulate!
                localStorage.setItem('mockbee_user_name', mockName);
                localStorage.setItem('mockbee_user_email', mockEmail);
                window.location.href = 'dashboard.html';
            });
        });
    });

    // 1. Password Visibility Toggle
    const setupPasswordToggle = (toggleId, inputId) => {
        const toggleBtn = document.getElementById(toggleId);
        const passwordInput = document.getElementById(inputId);

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                toggleBtn.classList.toggle('fa-eye');
                toggleBtn.classList.toggle('fa-eye-slash');
            });
        }
    };

    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirm-password');

    // 2. Error Display Helpers
    const showSignupError = (message) => {
        if (errorMsg && errorText) {
            errorText.textContent = message;
            errorMsg.style.display = 'flex';
        }
    };

    const hideSignupError = () => {
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    };

    // Clear error while typing
    inputs.forEach(input => {
        input.addEventListener('input', hideSignupError);
    });

    // Clear error when checkbox toggled
    const termsCheck = document.getElementById('agreeTerms');
    if (termsCheck) {
        termsCheck.addEventListener('change', hideSignupError);
    }

    // 3. Validation & Registration
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullname = (document.getElementById('fullname')?.value || '').trim();
            const emailRaw = (document.getElementById('email')?.value || '').trim();
            const pass = document.getElementById('password')?.value || '';
            const confirm = document.getElementById('confirm-password')?.value || '';
            const terms = document.getElementById('agreeTerms')?.checked;

            // --- Full Validation Logic ---
            // Strict Regex: requires @ and a TLD of at least 2 characters
            const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

            if (!fullname || !emailRaw || !pass) {
                showSignupError('Please fill in all required fields.');
                return;
            }

            if (!emailRegex.test(emailRaw)) {
                showSignupError('Please enter a valid email address.');
                return;
            }

            if (pass.length < 6) {
                showSignupError('Password must be at least 6 characters.');
                return;
            }

            if (pass !== confirm) {
                showSignupError('Passwords do not match.');
                return;
            }

            if (!terms) {
                showSignupError('Please agree to the Terms & Privacy.');
                return;
            }

            // Normalise email for storage
            const email = emailRaw.toLowerCase();

            // Setup API call to FastAPI backend
            fetch('https://mockbee.onrender.com/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fullname, email: email, password: pass })
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(res => {
                if (res.status === 400) {
                    showSignupError(res.body.detail || 'Signup failed.');
                    return;
                } else if (res.status !== 200) {
                    showSignupError('Server error, try again later.');
                    return;
                }

                // --- Success Phase ---
                // Set session
                localStorage.setItem('mockbee_user_name', fullname);
                localStorage.setItem('mockbee_user_email', email);
                localStorage.setItem('mockbee_subscribed', 'false');
                localStorage.setItem('mockbee_send_welcome_email', 'true'); // Flag for welcome email
                
                // Clear any stale plan data from a previous user's session
                localStorage.removeItem('mockbee_subscribed_plan');
                localStorage.removeItem('mockbee_all_plans');
                localStorage.removeItem('mockbee_interviews');
                localStorage.removeItem('mockbee_activities');

                // Redirect with rocket animation effect if possible
                window.location.href = 'dashboard.html?source=new_user';
            })
            .catch(err => {
                showSignupError('Network error. Is the backend running?');
                console.error(err);
            });
        });
    }
});
