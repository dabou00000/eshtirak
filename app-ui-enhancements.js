// تحسينات الواجهة والتفاعل
class UIEnhancements {
    constructor(app) {
        this.app = app;
        this.setupEnhancements();
    }

    setupEnhancements() {
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.setupFormValidation();
        this.setupLoadingStates();
        this.setupTooltips();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S لحفظ النماذج
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.handleSaveShortcut();
            }
            
            // Escape لإغلاق النوافذ المنبثقة
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Enter في حقول البحث للبحث الفوري
            if (e.key === 'Enter' && e.target.matches('input[type="search"], input[placeholder*="بحث"]')) {
                e.preventDefault();
                this.handleSearchEnter(e.target);
            }
        });
    }

    handleSaveShortcut() {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const form = activeModal.querySelector('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    handleSearchEnter(searchInput) {
        const searchValue = searchInput.value.trim();
        if (searchValue) {
            // تنفيذ البحث حسب السياق
            if (searchInput.id === 'customer-search') {
                this.app.filterCustomers(searchValue);
            }
        }
    }

    setupAutoSave() {
        // حفظ تلقائي للإعدادات عند التغيير
        const settingsInputs = document.querySelectorAll('#settings-form input, #settings-form select');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.debounce(() => {
                    this.autoSaveSettings();
                }, 2000)();
            });
        });
    }

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

    async autoSaveSettings() {
        try {
            const settingsData = {
                name: document.getElementById('tenant-name-input').value,
                address: document.getElementById('tenant-address').value,
                phone: document.getElementById('tenant-phone').value,
                defaultCurrencyMode: document.getElementById('default-currency').value,
                exchangeRate: parseFloat(document.getElementById('exchange-rate').value),
                lbpRounding: parseInt(document.getElementById('lbp-rounding').value),
                printTemplate: document.getElementById('print-template').value,
                updatedAt: firebase.serverTimestamp()
            };

            await firebase.updateDoc(
                firebase.doc(firebase.db, 'tenants', this.app.currentTenant.id),
                settingsData
            );

            this.app.settings = { ...this.app.settings, ...settingsData };
            this.app.updateTenantName();
            this.showAutoSaveIndicator();
        } catch (error) {
            console.error('خطأ في الحفظ التلقائي:', error);
        }
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
            font-size: 12px;
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
                document.body.removeChild(indicator);
            }, 300);
        }, 2000);
    }

    setupFormValidation() {
        // التحقق من صحة البيانات في الوقت الفعلي
        this.setupNumberValidation();
        this.setupEmailValidation();
        this.setupRequiredFieldValidation();
    }

    setupNumberValidation() {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const min = parseFloat(e.target.min);
                const max = parseFloat(e.target.max);
                
                if (isNaN(value) || (min && value < min) || (max && value > max)) {
                    e.target.classList.add('invalid');
                    this.showFieldError(e.target, 'قيمة غير صحيحة');
                } else {
                    e.target.classList.remove('invalid');
                    this.hideFieldError(e.target);
                }
            });
        });
    }

    setupEmailValidation() {
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                const email = e.target.value;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && !emailRegex.test(email)) {
                    e.target.classList.add('invalid');
                    this.showFieldError(e.target, 'البريد الإلكتروني غير صحيح');
                } else {
                    e.target.classList.remove('invalid');
                    this.hideFieldError(e.target);
                }
            });
        });
    }

    setupRequiredFieldValidation() {
        const requiredInputs = document.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                if (!e.target.value.trim()) {
                    e.target.classList.add('invalid');
                    this.showFieldError(e.target, 'هذا الحقل مطلوب');
                } else {
                    e.target.classList.remove('invalid');
                    this.hideFieldError(e.target);
                }
            });
        });
    }

    showFieldError(field, message) {
        this.hideFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #e74c3c;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        `;
        
        field.parentNode.appendChild(errorDiv);
    }

    hideFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    setupLoadingStates() {
        // إضافة حالات التحميل للأزرار
        this.setupButtonLoading();
        this.setupFormLoading();
    }

    setupButtonLoading() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn[type="submit"]')) {
                this.showButtonLoading(e.target);
            }
        });
    }

    showButtonLoading(button) {
        const originalText = button.textContent;
        button.dataset.originalText = originalText;
        button.textContent = 'جاري الحفظ...';
        button.disabled = true;
        button.style.opacity = '0.7';
        
        // إعادة تعيين الحالة بعد 5 ثوانٍ كحد أقصى
        setTimeout(() => {
            this.hideButtonLoading(button);
        }, 5000);
    }

    hideButtonLoading(button) {
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
        button.disabled = false;
        button.style.opacity = '1';
    }

    setupFormLoading() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                this.showButtonLoading(submitButton);
            }
        });
    }

    setupTooltips() {
        // إضافة تلميحات للمساعدة
        this.addTooltips();
    }

    addTooltips() {
        const tooltipElements = [
            {
                selector: '#exchange-rate',
                text: 'سعر الصرف الحالي للدولار مقابل الليرة اللبنانية'
            },
            {
                selector: '#lbp-rounding',
                text: 'تقريب المبالغ بالليرة لأقرب 100 أو 1000'
            },
            {
                selector: '#print-template',
                text: 'اختر قالب الطباعة المناسب لطابعتك'
            },
            {
                selector: '#pricing-mode',
                text: 'اختر العملة الأساسية للتسعير في هذا الوصل'
            }
        ];

        tooltipElements.forEach(({ selector, text }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.title = text;
                this.addTooltipIcon(element, text);
            }
        });
    }

    addTooltipIcon(element, text) {
        const icon = document.createElement('span');
        icon.innerHTML = '❓';
        icon.className = 'tooltip-icon';
        icon.style.cssText = `
            margin-right: 5px;
            cursor: help;
            color: #3498db;
            font-size: 12px;
        `;
        icon.title = text;
        
        element.parentNode.insertBefore(icon, element);
    }

    // وظائف مساعدة إضافية
    formatCurrencyInput(input) {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value && !isNaN(value)) {
                const formatted = this.app.formatNumber(parseFloat(value));
                e.target.dataset.formatted = formatted;
            }
        });
    }

    setupQuickActions() {
        // إضافة أزرار سريعة
        this.addQuickActionButtons();
    }

    addQuickActionButtons() {
        // زر سريع لإضافة مشترك
        const addCustomerBtn = document.getElementById('add-customer-btn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showQuickCustomerForm();
            });
        }
    }

    showQuickCustomerForm() {
        const name = prompt('اسم المشترك:');
        if (name) {
            const phone = prompt('رقم الهاتف (اختياري):');
            const address = prompt('العنوان (اختياري):');
            
            // إضافة المشترك مباشرة
            this.quickAddCustomer({ name, phone, address });
        }
    }

    async quickAddCustomer(customerData) {
        try {
            const data = {
                ...customerData,
                createdAt: firebase.serverTimestamp(),
                updatedAt: firebase.serverTimestamp()
            };

            await firebase.addDoc(
                firebase.collection(firebase.db, `tenants/${this.app.currentTenant.id}/customers`),
                data
            );

            this.app.showToast('تم إضافة المشترك بنجاح', 'success');
            await this.app.loadCustomers();
        } catch (error) {
            console.error('خطأ في إضافة المشترك:', error);
            this.app.showToast('خطأ في إضافة المشترك', 'error');
        }
    }

    // تحسينات للعرض على الشاشات الصغيرة
    setupMobileOptimizations() {
        if (window.innerWidth <= 768) {
            this.optimizeForMobile();
        }
    }

    optimizeForMobile() {
        // تحسين النوافذ المنبثقة للهواتف
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            modal.style.maxHeight = '90vh';
            modal.style.overflowY = 'auto';
        });

        // تحسين الجداول للهواتف
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            table.style.fontSize = '12px';
        });
    }
}

// إضافة UIEnhancements إلى التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.app.uiEnhancements = new UIEnhancements(window.app);
    }
});
