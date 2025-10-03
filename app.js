// التطبيق الرئيسي
class ElectricitySubscriptionApp {
    constructor() {
        this.currentUser = null;
        this.currentTenant = null;
        this.customers = [];
        this.invoices = [];
        this.expenses = [];
        this.settings = {};
        
        this.init();
    }

    async init() {
        // عرض شاشة تسجيل الدخول مباشرة
        this.showLoginScreen();
        this.setupEventListeners();
    }

    async loadTenantData() {
        try {
            // تحميل الإعدادات من LocalStorage
            const stored = localStorage.getItem('settings');
            const defaultSettings = {
                name: 'اشتراك كهرباء الضيعة',
                address: '',
                phone: '',
                defaultCurrency: 'USD',
                exchangeRate: 90000,
                defaultPriceUsd: 0.45,
                defaultPriceLbp: 40000,
                defaultSubscription: 6,
                printTemplate: 'A5'
            };
            
            this.settings = stored ? JSON.parse(stored) : defaultSettings;
            
            // إنشاء tenant افتراضي
            this.currentTenant = { 
                id: 'default-tenant',
                data: () => this.settings
            };
            await this.loadAllData();
        } catch (error) {
            console.error('خطأ في تحميل بيانات الاشتراك:', error);
            this.showToast('خطأ في تحميل البيانات', 'error');
        }
    }

    async loadAllData() {
        if (!this.currentTenant) return;

        try {
            // تحميل الإعدادات
            this.loadSettingsForm();
            this.updateTenantName();

            // تحميل الزبائن
            await this.loadCustomers();
            
            // تحميل الفواتير
            await this.loadInvoices();
            
            // تحميل المصاريف
            await this.loadExpenses();

            // تحديث الفلاتر
            this.updateFilters();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showToast('خطأ في تحميل البيانات', 'error');
        }
    }

    async loadCustomers() {
        // تحميل من LocalStorage
        const stored = localStorage.getItem('customers');
        this.customers = stored ? JSON.parse(stored) : [];
        this.renderCustomers();
    }

    async loadInvoices() {
        // تحميل من LocalStorage
        const stored = localStorage.getItem('invoices');
        this.invoices = stored ? JSON.parse(stored) : [];
        this.renderInvoices();
    }

    async loadExpenses() {
        // تحميل من LocalStorage
        const stored = localStorage.getItem('expenses');
        this.expenses = stored ? JSON.parse(stored) : [];
        this.renderExpenses();
    }

    setupEventListeners() {
        // تسجيل الدخول
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // إزالة التحقق من صحة الإيميل
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.setAttribute('novalidate', 'true');
        }

        // الخروج
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // إضافة زبون
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.showCustomerModal();
        });

        // إضافة فاتورة
        document.getElementById('add-invoice-btn').addEventListener('click', () => {
            this.showInvoiceModal();
        });

        // إضافة مصروف
        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.showExpenseModal();
        });

        // البحث في الزبائن
        document.getElementById('customer-search').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        // فلاتر الزبائن
        document.getElementById('customer-status-filter').addEventListener('change', () => {
            this.filterCustomers();
        });

        // فلاتر الفواتير
        document.getElementById('invoice-period-filter').addEventListener('change', () => {
            this.filterInvoices();
        });
        document.getElementById('invoice-customer-filter').addEventListener('change', () => {
            this.filterInvoices();
        });

        // فلاتر السجلات
        document.getElementById('history-customer-filter').addEventListener('change', () => {
            this.filterHistory();
        });
        document.getElementById('history-year-filter').addEventListener('change', () => {
            this.filterHistory();
        });
        document.getElementById('history-month-filter').addEventListener('change', () => {
            this.filterHistory();
        });

        // فلاتر المصاريف
        document.getElementById('expense-period-filter').addEventListener('change', () => {
            this.filterExpenses();
        });
        document.getElementById('expense-type-filter').addEventListener('change', () => {
            this.filterExpenses();
        });

        // التقارير
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            this.generateReport();
        });
        document.getElementById('export-report-btn').addEventListener('click', () => {
            this.exportReport();
        });

        // الإعدادات
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // إغلاق النوافذ المنبثقة
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // النوافذ المنبثقة
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // نموذج الزبون
        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // نموذج الفاتورة
        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvoice();
        });

        // نموذج المصروف
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });

        // حساب الفاتورة
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateInvoice();
        });

        // تغيير قراءات العداد
        document.getElementById('meter-previous').addEventListener('input', () => {
            this.calculateConsumption();
        });
        document.getElementById('meter-current').addEventListener('input', () => {
            this.calculateConsumption();
        });

        // تغيير الزبون في الفاتورة
        document.getElementById('invoice-customer').addEventListener('change', () => {
            this.updateCustomerData();
        });

        // إضافة دفعة إضافية
        document.getElementById('add-extra-btn').addEventListener('click', () => {
            this.addExtraItem();
        });

        // تغيير نوع المصروف
        document.getElementById('expense-type').addEventListener('change', (e) => {
            this.updateExpenseType(e.target.value);
        });

        // الطباعة
        document.getElementById('print-btn').addEventListener('click', () => {
            this.printInvoice();
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        // تسجيل دخول مبسط
        if (email === 'admin' && password === 'admin123') {
            // محاكاة تسجيل دخول ناجح
            this.currentUser = { uid: 'admin-user', email: 'admin' };
            await this.loadTenantData();
            this.showAppScreen();
            errorDiv.classList.remove('show');
        } else {
            errorDiv.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            errorDiv.classList.add('show');
        }
    }

    async handleLogout() {
        this.currentUser = null;
        this.currentTenant = null;
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('app-screen').classList.remove('active');
    }

    showAppScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
    }

    switchTab(tabName) {
        // إخفاء جميع التبويبات
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // إظهار التبويب المحدد
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // تحديث البيانات حسب التبويب
        if (tabName === 'history') {
            this.loadHistory();
        }
    }

    updateTenantName() {
        if (this.settings.name) {
            document.getElementById('tenant-name').textContent = this.settings.name;
        }
    }

    loadSettingsForm() {
        // تحميل الإعدادات من LocalStorage
        const stored = localStorage.getItem('settings');
        if (stored) {
            this.settings = JSON.parse(stored);
        }

        if (!this.settings) return;

        document.getElementById('tenant-name-input').value = this.settings.name || '';
        document.getElementById('tenant-address').value = this.settings.address || '';
        document.getElementById('tenant-phone').value = this.settings.phone || '';
        document.getElementById('default-currency').value = this.settings.defaultCurrency || 'USD';
        document.getElementById('exchange-rate').value = this.settings.exchangeRate || 90000;
        document.getElementById('default-price-usd').value = this.settings.defaultPriceUsd || 0.45;
        document.getElementById('default-price-lbp').value = this.settings.defaultPriceLbp || 40000;
        document.getElementById('default-subscription').value = this.settings.defaultSubscription || 6;
        document.getElementById('print-template').value = this.settings.printTemplate || 'A5';
    }

    async saveSettings() {
        try {
            const settingsData = {
                name: document.getElementById('tenant-name-input').value,
                address: document.getElementById('tenant-address').value,
                phone: document.getElementById('tenant-phone').value,
                defaultCurrency: document.getElementById('default-currency').value,
                exchangeRate: parseFloat(document.getElementById('exchange-rate').value),
                defaultPriceUsd: parseFloat(document.getElementById('default-price-usd').value),
                defaultPriceLbp: parseFloat(document.getElementById('default-price-lbp').value),
                defaultSubscription: parseFloat(document.getElementById('default-subscription').value),
                printTemplate: document.getElementById('print-template').value,
                updatedAt: new Date().toISOString()
            };

            // حفظ في LocalStorage
            localStorage.setItem('settings', JSON.stringify(settingsData));

            this.settings = { ...this.settings, ...settingsData };
            this.updateTenantName();
            this.showToast('تم حفظ الإعدادات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
            this.showToast('خطأ في حفظ الإعدادات', 'error');
        }
    }

    showCustomerModal(customer = null) {
        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('customer-modal-title');
        const form = document.getElementById('customer-form');

        if (customer) {
            title.textContent = 'تعديل الزبون';
            document.getElementById('customer-name').value = customer.name || '';
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-phone').value = customer.phone || '';
            document.getElementById('customer-subscription').value = customer.subscription || this.settings.defaultSubscription;
            document.getElementById('customer-price-usd').value = customer.priceUsd || this.settings.defaultPriceUsd;
            document.getElementById('customer-price-lbp').value = customer.priceLbp || this.settings.defaultPriceLbp;
            document.getElementById('customer-status').value = customer.status || 'active';
            form.dataset.customerId = customer.id;
        } else {
            title.textContent = 'إضافة زبون جديد';
            form.reset();
            // تعيين القيم الافتراضية
            document.getElementById('customer-subscription').value = this.settings.defaultSubscription;
            document.getElementById('customer-price-usd').value = this.settings.defaultPriceUsd;
            document.getElementById('customer-price-lbp').value = this.settings.defaultPriceLbp;
            delete form.dataset.customerId;
        }

        modal.classList.add('active');
    }

    async saveCustomer() {
        try {
            const customerData = {
                name: document.getElementById('customer-name').value,
                address: document.getElementById('customer-address').value,
                phone: document.getElementById('customer-phone').value,
                subscription: parseFloat(document.getElementById('customer-subscription').value),
                priceUsd: parseFloat(document.getElementById('customer-price-usd').value),
                priceLbp: parseFloat(document.getElementById('customer-price-lbp').value),
                status: document.getElementById('customer-status').value,
                updatedAt: new Date().toISOString()
            };

            const form = document.getElementById('customer-form');
            const customerId = form.dataset.customerId;

            if (customerId) {
                // تعديل زبون موجود
                const index = this.customers.findIndex(c => c.id === customerId);
                if (index !== -1) {
                    this.customers[index] = { ...this.customers[index], ...customerData };
                }
                this.showToast('تم تعديل الزبون بنجاح', 'success');
            } else {
                // إضافة زبون جديد
                customerData.id = 'customer_' + Date.now();
                customerData.createdAt = new Date().toISOString();
                customerData.lastMeterReading = 0; // قراءة العداد الأخيرة
                this.customers.push(customerData);
                this.showToast('تم إضافة الزبون بنجاح', 'success');
            }

            // حفظ في LocalStorage
            localStorage.setItem('customers', JSON.stringify(this.customers));

            this.closeModal(document.getElementById('customer-modal'));
            await this.loadCustomers();
        } catch (error) {
            console.error('خطأ في حفظ الزبون:', error);
            this.showToast('خطأ في حفظ الزبون', 'error');
        }
    }

    renderCustomers() {
        const container = document.getElementById('customers-list');
        if (this.customers.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا يوجد زبائن</p></div>';
            return;
        }

        container.innerHTML = this.customers.map(customer => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${customer.name} <span class="status-badge ${customer.status}">${customer.status === 'active' ? 'نشط' : 'متوقف'}</span></h4>
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    <p>💰 الاشتراك: $${customer.subscription} | الكيلو: $${customer.priceUsd}</p>
                    <p>🔢 آخر قراءة: ${customer.lastMeterReading || 0}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary" onclick="app.editCustomer('${customer.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.deleteCustomer('${customer.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.showCustomerModal(customer);
        }
    }

    async deleteCustomer(customerId) {
        if (!confirm('هل أنت متأكد من حذف هذا الزبون؟')) return;

        try {
            this.customers = this.customers.filter(c => c.id !== customerId);
            localStorage.setItem('customers', JSON.stringify(this.customers));
            this.showToast('تم حذف الزبون بنجاح', 'success');
            await this.loadCustomers();
        } catch (error) {
            console.error('خطأ في حذف الزبون:', error);
            this.showToast('خطأ في حذف الزبون', 'error');
        }
    }

    filterCustomers(searchTerm = '') {
        const search = searchTerm || document.getElementById('customer-search').value;
        const statusFilter = document.getElementById('customer-status-filter').value;
        
        let filtered = this.customers;

        // فلترة حسب النص
        if (search) {
            filtered = filtered.filter(customer => 
                customer.name.toLowerCase().includes(search.toLowerCase()) ||
                (customer.phone && customer.phone.includes(search))
            );
        }

        // فلترة حسب الحالة
        if (statusFilter) {
            filtered = filtered.filter(customer => customer.status === statusFilter);
        }
        
        const container = document.getElementById('customers-list');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = filtered.map(customer => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${customer.name} <span class="status-badge ${customer.status}">${customer.status === 'active' ? 'نشط' : 'متوقف'}</span></h4>
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    <p>💰 الاشتراك: $${customer.subscription} | الكيلو: $${customer.priceUsd}</p>
                    <p>🔢 آخر قراءة: ${customer.lastMeterReading || 0}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary" onclick="app.editCustomer('${customer.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.deleteCustomer('${customer.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    updateFilters() {
        // تحديث فلاتر الفترات
        const periods = [...new Set([
            ...this.invoices.map(inv => inv.period),
            ...this.expenses.map(exp => exp.period)
        ])].sort().reverse();

        const periodSelects = [
            'invoice-period-filter',
            'expense-period-filter',
            'report-month'
        ];

        periodSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = selectId === 'report-month' 
                ? '<option value="">اختر الشهر</option>'
                : '<option value="">جميع الأشهر</option>';
            
            periods.forEach(period => {
                const option = document.createElement('option');
                option.value = period;
                option.textContent = this.formatPeriod(period);
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });

        // تحديث فلتر الزبائن
        const customerSelects = [
            'invoice-customer-filter',
            'history-customer-filter'
        ];

        customerSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = selectId === 'invoice-customer-filter' 
                ? '<option value="">جميع الزبائن</option>'
                : '<option value="">جميع الزبائن</option>';
            
            this.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });

        // تحديث فلاتر السنوات
        const years = [...new Set(this.invoices.map(inv => inv.period.split('-')[0]))].sort().reverse();
        const yearSelect = document.getElementById('report-year');
        const historyYearSelect = document.getElementById('history-year-filter');
        
        [yearSelect, historyYearSelect].forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">اختر السنة</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            });
            select.value = currentValue;
        });
    }

    formatPeriod(period) {
        const [year, month] = period.split('-');
        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    roundLBP(value) {
        const rounding = 1000;
        return Math.round(value / rounding) * rounding;
    }

    formatCurrency(value, currency) {
        if (currency === 'USD') {
            return `$${value.toFixed(2)}`;
        } else {
            return `${this.formatNumber(value)} ل.ل`;
        }
    }

    formatNumber(value) {
        return new Intl.NumberFormat('ar-LB').format(value);
    }

    // وظائف إضافية للفواتير
    renderInvoices() {
        if (this.invoiceManager) {
            this.invoiceManager.renderInvoices();
        }
    }

    // وظائف إضافية للمصاريف
    renderExpenses() {
        if (this.expensesManager) {
            this.expensesManager.renderExpenses();
        }
    }

    // وظائف إضافية للتقارير
    generateReport() {
        if (this.expensesManager) {
            this.expensesManager.generateReport();
        }
    }

    exportReport() {
        if (this.expensesManager) {
            this.expensesManager.exportReport();
        }
    }

    // وظائف إضافية للفلاتر
    filterInvoices() {
        if (this.invoiceManager) {
            this.invoiceManager.filterInvoices();
        }
    }

    filterExpenses() {
        if (this.expensesManager) {
            this.expensesManager.filterExpenses();
        }
    }

    filterHistory() {
        if (this.invoiceManager) {
            this.invoiceManager.filterHistory();
        }
    }

    loadHistory() {
        if (this.invoiceManager) {
            this.invoiceManager.loadHistory();
        }
    }

    // وظائف الفواتير
    showInvoiceModal(invoice = null) {
        if (this.invoiceManager) {
            this.invoiceManager.showInvoiceModal(invoice);
        }
    }

    saveInvoice() {
        if (this.invoiceManager) {
            this.invoiceManager.saveInvoice();
        }
    }

    calculateInvoice() {
        if (this.invoiceManager) {
            this.invoiceManager.calculateInvoice();
        }
    }

    calculateConsumption() {
        if (this.invoiceManager) {
            this.invoiceManager.calculateConsumption();
        }
    }

    updateCustomerData() {
        if (this.invoiceManager) {
            this.invoiceManager.updateCustomerData();
        }
    }

    addExtraItem() {
        if (this.invoiceManager) {
            this.invoiceManager.addExtraItem();
        }
    }

    printInvoice() {
        if (this.invoiceManager) {
            this.invoiceManager.printInvoice();
        }
    }

    // وظائف المصاريف
    showExpenseModal(expense = null) {
        if (this.expensesManager) {
            this.expensesManager.showExpenseModal(expense);
        }
    }

    saveExpense() {
        if (this.expensesManager) {
            this.expensesManager.saveExpense();
        }
    }

    updateExpenseType(type) {
        if (this.expensesManager) {
            this.expensesManager.updateExpenseType(type);
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ElectricitySubscriptionApp();
});
