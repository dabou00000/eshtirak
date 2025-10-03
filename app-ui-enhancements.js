// تحسينات الواجهة
class UIEnhancements {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
        this.setupPrintStyles();
        this.setupResponsiveDesign();
    }

    setupFormValidation() {
        // التحقق من صحة النماذج
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });

        // التحقق من صحة الحقول في الوقت الفعلي
        const inputs = document.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name') || field.id;
        
        // إزالة رسائل الخطأ السابقة
        this.removeFieldError(field);

        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'هذا الحقل مطلوب');
            return false;
        }

        // التحقق من صحة الإيميل
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'يرجى إدخال بريد إلكتروني صحيح');
                return false;
            }
        }

        // التحقق من صحة الأرقام
        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                this.showFieldError(field, 'يرجى إدخال رقم صحيح');
                return false;
            }
            
            if (field.hasAttribute('min') && num < parseFloat(field.getAttribute('min'))) {
                this.showFieldError(field, `القيمة يجب أن تكون أكبر من أو تساوي ${field.getAttribute('min')}`);
                return false;
            }
        }

        return true;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    removeFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    setupAutoSave() {
        // حفظ تلقائي للإعدادات
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            const inputs = settingsForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    this.autoSaveSettings();
                });
            });
        }
    }

    autoSaveSettings() {
        // حفظ الإعدادات تلقائياً بعد 2 ثانية من آخر تغيير
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            if (this.app && this.app.saveSettings) {
                this.app.saveSettings();
                this.showAutoSaveIndicator();
            }
        }, 2000);
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = 'تم الحفظ تلقائياً';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(indicator);
        
        // إظهار المؤشر
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // إخفاء المؤشر
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }, 2000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + S لحفظ الإعدادات
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const activePanel = document.querySelector('.tab-panel.active');
                if (activePanel && activePanel.id === 'settings-tab') {
                    const settingsForm = document.getElementById('settings-form');
                    if (settingsForm) {
                        settingsForm.dispatchEvent(new Event('submit'));
                    }
                }
            }

            // Ctrl + N لإضافة عنصر جديد
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const activePanel = document.querySelector('.tab-panel.active');
                if (activePanel) {
                    const addButton = activePanel.querySelector('.btn-primary');
                    if (addButton) {
                        addButton.click();
                    }
                }
            }

            // Escape لإغلاق النوافذ المنبثقة
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    const closeBtn = activeModal.querySelector('.close-btn');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }
        });
    }

    setupPrintStyles() {
        // إضافة أنماط الطباعة
        const printStyles = `
            @media print {
                body * {
                    visibility: hidden;
                }
                .invoice-preview-content,
                .invoice-preview-content * {
                    visibility: visible;
                }
                .invoice-preview-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .print-actions {
                    display: none !important;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = printStyles;
        document.head.appendChild(styleSheet);
    }

    setupResponsiveDesign() {
        // تحسين التصميم للشاشات الصغيرة
        this.setupMobileNavigation();
        this.setupTouchGestures();
    }

    setupMobileNavigation() {
        // إضافة قائمة تنقل للهواتف
        if (window.innerWidth <= 768) {
            this.createMobileMenu();
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.createMobileMenu();
            } else {
                this.removeMobileMenu();
            }
        });
    }

    createMobileMenu() {
        if (document.getElementById('mobile-menu')) return;

        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.innerHTML = `
            <button id="mobile-menu-toggle" class="mobile-menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div id="mobile-menu-content" class="mobile-menu-content">
                <div class="mobile-tabs"></div>
            </div>
        `;

        mobileMenu.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            z-index: 1000;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(mobileMenu);

        // نسخ التبويبات إلى القائمة المحمولة
        const tabs = document.querySelectorAll('.tab-btn');
        const mobileTabs = mobileMenu.querySelector('.mobile-tabs');
        
        tabs.forEach(tab => {
            const mobileTab = tab.cloneNode(true);
            mobileTab.addEventListener('click', () => {
                tab.click();
                this.closeMobileMenu();
            });
            mobileTabs.appendChild(mobileTab);
        });

        // إضافة أحداث القائمة
        const toggle = mobileMenu.querySelector('#mobile-menu-toggle');
        const content = mobileMenu.querySelector('#mobile-menu-content');
        
        toggle.addEventListener('click', () => {
            content.classList.toggle('active');
        });
    }

    removeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.remove();
        }
    }

    closeMobileMenu() {
        const content = document.getElementById('mobile-menu-content');
        if (content) {
            content.classList.remove('active');
        }
    }

    setupTouchGestures() {
        // إضافة إيماءات اللمس للهواتف
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // تجاهل الحركات الصغيرة
            if (Math.abs(diffX) < 50 && Math.abs(diffY) < 50) return;

            // حركة أفقية (تغيير التبويبات)
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    this.switchToNextTab();
                } else {
                    this.switchToPreviousTab();
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    switchToNextTab() {
        const activeTab = document.querySelector('.tab-btn.active');
        const tabs = Array.from(document.querySelectorAll('.tab-btn'));
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].click();
    }

    switchToPreviousTab() {
        const activeTab = document.querySelector('.tab-btn.active');
        const tabs = Array.from(document.querySelectorAll('.tab-btn'));
        const currentIndex = tabs.indexOf(activeTab);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        tabs[prevIndex].click();
    }

    // وظائف مساعدة
    showLoading(element) {
        const originalContent = element.innerHTML;
        element.innerHTML = '<div class="loading-spinner">جاري التحميل...</div>';
        element.dataset.originalContent = originalContent;
    }

    hideLoading(element) {
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-LB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('ar-LB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // تحسين الأداء
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// إضافة CSS للتحسينات
const enhancementStyles = `
    .field-error {
        color: #e74c3c;
        font-size: 12px;
        margin-top: 5px;
    }

    .error {
        border-color: #e74c3c !important;
        box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2) !important;
    }

    .loading-spinner {
        text-align: center;
        padding: 20px;
        color: #666;
    }

    .mobile-menu-toggle {
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .mobile-menu-toggle span {
        width: 25px;
        height: 3px;
        background: #333;
        transition: 0.3s;
    }

    .mobile-menu-content {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s;
    }

    .mobile-menu-content.active {
        max-height: 400px;
    }

    .mobile-tabs {
        padding: 10px;
    }

    .mobile-tabs .tab-btn {
        display: block;
        width: 100%;
        text-align: right;
        border: none;
        background: none;
        padding: 15px;
        border-bottom: 1px solid #eee;
    }

    @media (min-width: 769px) {
        .mobile-menu-toggle,
        .mobile-menu-content {
            display: none;
        }
    }
`;

// إضافة الأنماط
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancementStyles;
document.head.appendChild(styleSheet);

// تهيئة التحسينات
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.app.uiEnhancements = new UIEnhancements(window.app);
    }
});
