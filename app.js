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
        // مراقبة حالة المصادقة
        firebase.onAuthStateChanged(firebase.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadTenantData();
                this.showAppScreen();
            } else {
                this.currentUser = null;
                this.showLoginScreen();
            }
        });

        this.setupEventListeners();
    }

    async loadTenantData() {
        try {
            // البحث عن tenant للمستخدم الحالي
            const tenantsQuery = firebase.query(
                firebase.collection(firebase.db, 'tenants'),
                firebase.where('ownerUid', '==', this.currentUser.uid)
            );
            const tenantsSnapshot = await firebase.getDocs(tenantsQuery);
            
            if (tenantsSnapshot.empty) {
                // إنشاء tenant جديد
                await this.createDefaultTenant();
            } else {
                this.currentTenant = tenantsSnapshot.docs[0];
                await this.loadAllData();
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات الاشتراك:', error);
            this.showToast('خطأ في تحميل البيانات', 'error');
        }
    }

    async createDefaultTenant() {
        try {
            const tenantData = {
                ownerUid: this.currentUser.uid,
                name: 'اشتراك الكهرباء',
                address: '',
                phone: '',
                defaultCurrencyMode: 'USD',
                exchangeRate: 90000,
                lbpRounding: 1000,
                printTemplate: 'A5',
                createdAt: firebase.serverTimestamp(),
                updatedAt: firebase.serverTimestamp()
            };

            const docRef = await firebase.addDoc(
                firebase.collection(firebase.db, 'tenants'),
                tenantData
            );
            
            this.currentTenant = { id: docRef.id, data: () => tenantData };
            this.settings = tenantData;
            this.updateTenantName();
        } catch (error) {
            console.error('خطأ في إنشاء الاشتراك:', error);
            this.showToast('خطأ في إنشاء الاشتراك', 'error');
        }
    }

    async loadAllData() {
        if (!this.currentTenant) return;

        try {
            // تحميل الإعدادات
            this.settings = this.currentTenant.data();
            this.updateTenantName();
            this.loadSettingsForm();

            // تحميل المشتركين
            await this.loadCustomers();
            
            // تحميل الوصولات
            await this.loadInvoices();
            
            // تحميل النفقات
            await this.loadExpenses();

            // تحديث الفلاتر
            this.updateFilters();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showToast('خطأ في تحميل البيانات', 'error');
        }
    }

    async loadCustomers() {
        const customersQuery = firebase.query(
            firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/customers`),
            firebase.orderBy('name')
        );
        const snapshot = await firebase.getDocs(customersQuery);
        this.customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        this.renderCustomers();
    }

    async loadInvoices() {
        const invoicesQuery = firebase.query(
            firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/invoices`),
            firebase.orderBy('period', 'desc')
        );
        const snapshot = await firebase.getDocs(invoicesQuery);
        this.invoices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        this.renderInvoices();
    }

    async loadExpenses() {
        const expensesQuery = firebase.query(
            firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/expenses`),
            firebase.orderBy('period', 'desc')
        );
        const snapshot = await firebase.getDocs(expensesQuery);
        this.expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        this.renderExpenses();
    }

    setupEventListeners() {
        // تسجيل الدخول
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

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

        // إضافة مشترك
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.showCustomerModal();
        });

        // إضافة وصل
        document.getElementById('add-invoice-btn').addEventListener('click', () => {
            this.showInvoiceModal();
        });

        // إضافة نفقة
        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.showExpenseModal();
        });

        // البحث في المشتركين
        document.getElementById('customer-search').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        // فلاتر الوصولات
        document.getElementById('invoice-period-filter').addEventListener('change', () => {
            this.filterInvoices();
        });
        document.getElementById('invoice-customer-filter').addEventListener('change', () => {
            this.filterInvoices();
        });

        // فلاتر النفقات
        document.getElementById('expense-period-filter').addEventListener('change', () => {
            this.filterExpenses();
        });

        // التقارير
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            this.generateReport();
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
        // نموذج المشترك
        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // نموذج الوصل
        document.getElementById('invoice-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInvoice();
        });

        // نموذج النفقة
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });

        // حساب الوصل
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateInvoice();
        });

        // تغيير وضع التسعير
        document.getElementById('pricing-mode').addEventListener('change', () => {
            this.updatePricingMode();
        });

        // تغيير قراءات العداد
        document.getElementById('meter-previous').addEventListener('input', () => {
            this.calculateConsumption();
        });
        document.getElementById('meter-current').addEventListener('input', () => {
            this.calculateConsumption();
        });

        // إضافة دفعة إضافية
        document.getElementById('add-extra-btn').addEventListener('click', () => {
            this.addExtraItem();
        });

        // تغيير نوع النفقة
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

        try {
            await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
            errorDiv.classList.remove('show');
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            errorDiv.textContent = this.getAuthErrorMessage(error.code);
            errorDiv.classList.add('show');
        }
    }

    async handleLogout() {
        try {
            await firebase.signOut(firebase.auth);
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            this.showToast('خطأ في تسجيل الخروج', 'error');
        }
    }

    getAuthErrorMessage(errorCode) {
        const messages = {
            'auth/user-not-found': 'المستخدم غير موجود',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
            'auth/user-disabled': 'تم تعطيل هذا الحساب',
            'auth/too-many-requests': 'محاولات كثيرة، حاول مرة أخرى لاحقاً',
            'auth/network-request-failed': 'خطأ في الشبكة'
        };
        return messages[errorCode] || 'خطأ في تسجيل الدخول';
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
    }

    updateTenantName() {
        if (this.settings.name) {
            document.getElementById('tenant-name').textContent = this.settings.name;
        }
    }

    loadSettingsForm() {
        if (!this.settings) return;

        document.getElementById('tenant-name-input').value = this.settings.name || '';
        document.getElementById('tenant-address').value = this.settings.address || '';
        document.getElementById('tenant-phone').value = this.settings.phone || '';
        document.getElementById('default-currency').value = this.settings.defaultCurrencyMode || 'USD';
        document.getElementById('exchange-rate').value = this.settings.exchangeRate || 90000;
        document.getElementById('lbp-rounding').value = this.settings.lbpRounding || 1000;
        document.getElementById('print-template').value = this.settings.printTemplate || 'A5';
    }

    async saveSettings() {
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
                firebase.doc(firebase.db, 'tenants', this.currentTenant.id),
                settingsData
            );

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
            title.textContent = 'تعديل المشترك';
            document.getElementById('customer-name').value = customer.name || '';
            document.getElementById('customer-phone').value = customer.phone || '';
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-meter-ref').value = customer.meterRef || '';
            form.dataset.customerId = customer.id;
        } else {
            title.textContent = 'إضافة مشترك جديد';
            form.reset();
            delete form.dataset.customerId;
        }

        modal.classList.add('active');
    }

    async saveCustomer() {
        try {
            const customerData = {
                name: document.getElementById('customer-name').value,
                phone: document.getElementById('customer-phone').value,
                address: document.getElementById('customer-address').value,
                meterRef: document.getElementById('customer-meter-ref').value,
                updatedAt: firebase.serverTimestamp()
            };

            const form = document.getElementById('customer-form');
            const customerId = form.dataset.customerId;

            if (customerId) {
                // تعديل مشترك موجود
                await firebase.updateDoc(
                    firebase.doc(firebase.db, `tenants/${this.currentTenant.id}/customers`, customerId),
                    customerData
                );
                this.showToast('تم تعديل المشترك بنجاح', 'success');
            } else {
                // إضافة مشترك جديد
                customerData.createdAt = firebase.serverTimestamp();
                await firebase.addDoc(
                    firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/customers`),
                    customerData
                );
                this.showToast('تم إضافة المشترك بنجاح', 'success');
            }

            this.closeModal(document.getElementById('customer-modal'));
            await this.loadCustomers();
        } catch (error) {
            console.error('خطأ في حفظ المشترك:', error);
            this.showToast('خطأ في حفظ المشترك', 'error');
        }
    }

    renderCustomers() {
        const container = document.getElementById('customers-list');
        if (this.customers.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا يوجد مشتركين</p></div>';
            return;
        }

        container.innerHTML = this.customers.map(customer => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${customer.name}</h4>
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    ${customer.meterRef ? `<p>🔢 العداد: ${customer.meterRef}</p>` : ''}
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
        if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;

        try {
            await firebase.deleteDoc(
                firebase.doc(firebase.db, `tenants/${this.currentTenant.id}/customers`, customerId)
            );
            this.showToast('تم حذف المشترك بنجاح', 'success');
            await this.loadCustomers();
        } catch (error) {
            console.error('خطأ في حذف المشترك:', error);
            this.showToast('خطأ في حذف المشترك', 'error');
        }
    }

    filterCustomers(searchTerm) {
        const filtered = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm))
        );
        
        const container = document.getElementById('customers-list');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = filtered.map(customer => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${customer.name}</h4>
                    ${customer.phone ? `<p>📞 ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p>📍 ${customer.address}</p>` : ''}
                    ${customer.meterRef ? `<p>🔢 العداد: ${customer.meterRef}</p>` : ''}
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
            'report-period'
        ];

        periodSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            select.innerHTML = selectId === 'report-period' 
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

        // تحديث فلتر المشتركين
        const customerSelect = document.getElementById('invoice-customer-filter');
        const currentValue = customerSelect.value;
        customerSelect.innerHTML = '<option value="">جميع المشتركين</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });
        
        customerSelect.value = currentValue;
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
        const rounding = this.settings.lbpRounding || 1000;
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

    // وظائف إضافية للوصولات
    async loadInvoices() {
        const invoicesQuery = firebase.query(
            firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/invoices`),
            firebase.orderBy('period', 'desc')
        );
        const snapshot = await firebase.getDocs(invoicesQuery);
        this.invoices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        this.renderInvoices();
    }

    renderInvoices() {
        if (this.invoiceManager) {
            this.invoiceManager.renderInvoices();
        }
    }

    // وظائف إضافية للنفقات
    async loadExpenses() {
        const expensesQuery = firebase.query(
            firebase.collection(firebase.db, `tenants/${this.currentTenant.id}/expenses`),
            firebase.orderBy('period', 'desc')
        );
        const snapshot = await firebase.getDocs(expensesQuery);
        this.expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        this.renderExpenses();
    }

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
}

// تهيئة التطبيق عند تحميل الصفحة
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ElectricitySubscriptionApp();
});
