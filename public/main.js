// Utility functions for the blog application

// Show notification messages
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);

    // Remove on click
    notification.addEventListener('click', () => {
        notification.remove();
    });
}

// Format date for display
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Create slug from title
function createSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    // Add mobile menu functionality
    const navMenu = document.querySelector('.nav-menu');
    
    if (navMenu) {
        // Create mobile menu button
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '☰';
        mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');

        const navContainer = document.querySelector('.nav-container');
        navContainer.appendChild(mobileMenuBtn);

        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('nav-menu-active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navContainer.contains(e.target)) {
                navMenu.classList.remove('nav-menu-active');
                mobileMenuBtn.classList.remove('active');
            }
        });

        // Close menu on window resize if screen becomes large
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('nav-menu-active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
});

// API helper functions
const API = {
    async get(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    async post(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Request failed');
            }
            
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    async delete(url) {
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Request failed');
            }
            
            return result;
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// Form validation helpers
const Validation = {
    required(value, fieldName) {
        if (!value || value.trim() === '') {
            throw new Error(`${fieldName} is required`);
        }
        return true;
    },

    minLength(value, min, fieldName) {
        if (value.length < min) {
            throw new Error(`${fieldName} must be at least ${min} characters long`);
        }
        return true;
    },

    maxLength(value, max, fieldName) {
        if (value.length > max) {
            throw new Error(`${fieldName} must be no more than ${max} characters long`);
        }
        return true;
    }
};

// Loading state helper
function setLoadingState(element, isLoading = true) {
    if (isLoading) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.textContent = 'Loading...';
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText || element.textContent;
    }
}

// Error handling helper
function handleError(error, fallbackMessage = 'An error occurred') {
    const message = error.message || fallbackMessage;
    showNotification(message, 'error');
    console.error('Error:', error);
}

// Success handling helper
function handleSuccess(message) {
    showNotification(message, 'success');
}

///////////////////////////////////////

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDJU-m5RcBowWZfwDsbpXKgMmdh2M2WRY",
  authDomain: "blogy-go.firebaseapp.com",
  projectId: "blogy-go",
  storageBucket: "blogy-go.firebasestorage.app",
  messagingSenderId: "757856471013",
  appId: "1:757856471013:web:26df956e7ef1814642910c",
  measurementId: "G-0R45Q2ZZRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);