// وظائف المصاريف والتقارير
class ExpensesReportsManager {
    constructor(app) {
        this.app = app;
    }

    showExpenseModal(expense = null) {
        const modal = document.getElementById('expense-modal');
        const form = document.getElementById('expense-form');

        if (expense) {
            document.getElementById('expense-period').value = expense.period;
            document.getElementById('expense-type').value = expense.type;
            document.getElementById('expense-label').value = expense.label || '';
            document.getElementById('expense-amount').value = expense.amountValue;
            document.getElementById('expense-currency').value = expense.amountCurrency;
            form.dataset.expenseId = expense.id;
        } else {
            form.reset();
            delete form.dataset.expenseId;
            
            // تعيين الشهر الحالي كافتراضي
            const currentDate = new Date();
            const currentMonth = currentDate.getFullYear() + '-' + 
                String(currentDate.getMonth() + 1).padStart(2, '0');
            document.getElementById('expense-period').value = currentMonth;
        }

        this.updateExpenseType(document.getElementById('expense-type').value);
        modal.classList.add('active');
    }

    updateExpenseType(type) {
        const labelInput = document.getElementById('expense-label');
        
        if (type === 'DIESEL') {
            labelInput.value = 'ثمن مازوت';
        } else if (type === 'MAINTENANCE') {
            labelInput.value = 'صيانة المولد';
        } else {
            labelInput.value = '';
        }
    }

    async saveExpense() {
        try {
            const expenseData = {
                period: document.getElementById('expense-period').value,
                type: document.getElementById('expense-type').value,
                label: document.getElementById('expense-label').value || 
                       (document.getElementById('expense-type').value === 'DIESEL' ? 'ثمن مازوت' : ''),
                amountValue: parseFloat(document.getElementById('expense-amount').value),
                amountCurrency: document.getElementById('expense-currency').value,
                createdAt: new Date().toISOString()
            };

            const form = document.getElementById('expense-form');
            const expenseId = form.dataset.expenseId;

            if (expenseId) {
                // تعديل مصروف موجود
                const index = this.app.expenses.findIndex(exp => exp.id === expenseId);
                if (index !== -1) {
                    this.app.expenses[index] = { ...this.app.expenses[index], ...expenseData };
                }
                this.app.showToast('تم تعديل المصروف بنجاح', 'success');
            } else {
                // إضافة مصروف جديد
                expenseData.id = 'expense_' + Date.now();
                this.app.expenses.push(expenseData);
                this.app.showToast('تم إضافة المصروف بنجاح', 'success');
            }

            // حفظ في LocalStorage
            localStorage.setItem('expenses', JSON.stringify(this.app.expenses));

            this.app.closeModal(document.getElementById('expense-modal'));
            await this.app.loadExpenses();
        } catch (error) {
            console.error('خطأ في حفظ المصروف:', error);
            this.app.showToast('خطأ في حفظ المصروف', 'error');
        }
    }

    renderExpenses() {
        const container = document.getElementById('expenses-list');
        if (this.app.expenses.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد مصاريف</p></div>';
            return;
        }

        container.innerHTML = this.app.expenses.map(expense => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${expense.label}</h4>
                    <p>📅 ${this.app.formatPeriod(expense.period)}</p>
                    <p>🏷️ ${this.getExpenseTypeLabel(expense.type)}</p>
                    <p>💰 ${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary" onclick="app.expensesManager.editExpense('${expense.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.expensesManager.deleteExpense('${expense.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    getExpenseTypeLabel(type) {
        const labels = {
            'DIESEL': 'مازوت',
            'MAINTENANCE': 'صيانة',
            'OTHER': 'أخرى'
        };
        return labels[type] || type;
    }

    editExpense(expenseId) {
        const expense = this.app.expenses.find(e => e.id === expenseId);
        if (expense) {
            this.showExpenseModal(expense);
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

        try {
            this.app.expenses = this.app.expenses.filter(exp => exp.id !== expenseId);
            localStorage.setItem('expenses', JSON.stringify(this.app.expenses));
            this.app.showToast('تم حذف المصروف بنجاح', 'success');
            await this.app.loadExpenses();
        } catch (error) {
            console.error('خطأ في حذف المصروف:', error);
            this.app.showToast('خطأ في حذف المصروف', 'error');
        }
    }

    filterExpenses() {
        const periodFilter = document.getElementById('expense-period-filter').value;
        const typeFilter = document.getElementById('expense-type-filter').value;
        
        let filtered = this.app.expenses;

        if (periodFilter) {
            filtered = filtered.filter(expense => expense.period === periodFilter);
        }

        if (typeFilter) {
            filtered = filtered.filter(expense => expense.type === typeFilter);
        }

        const container = document.getElementById('expenses-list');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = filtered.map(expense => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${expense.label}</h4>
                    <p>📅 ${this.app.formatPeriod(expense.period)}</p>
                    <p>🏷️ ${this.getExpenseTypeLabel(expense.type)}</p>
                    <p>💰 ${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-secondary" onclick="app.expensesManager.editExpense('${expense.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.expensesManager.deleteExpense('${expense.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    generateReport() {
        const year = document.getElementById('report-year').value;
        const month = document.getElementById('report-month').value;
        
        if (!year || !month) {
            this.app.showToast('يرجى اختيار السنة والشهر', 'warning');
            return;
        }

        const period = `${year}-${month}`;
        this.generateMonthlyReport(period);
    }

    generateMonthlyReport(period) {
        try {
            // جمع بيانات الفواتير للشهر المحدد
            const periodInvoices = this.app.invoices.filter(invoice => invoice.period === period);
            
            // جمع بيانات المصاريف للشهر المحدد
            const periodExpenses = this.app.expenses.filter(expense => expense.period === period);

            // حساب المجاميع
            const totalConsumption = periodInvoices.reduce((sum, invoice) => sum + invoice.consumptionKwh, 0);
            const totalInvoicesUsd = periodInvoices.reduce((sum, invoice) => sum + invoice.totalUsd, 0);
            const totalInvoicesLbp = periodInvoices.reduce((sum, invoice) => sum + invoice.totalLbp, 0);

            // حساب المصاريف
            const totalExpensesUsd = periodExpenses
                .filter(exp => exp.amountCurrency === 'USD')
                .reduce((sum, exp) => sum + exp.amountValue, 0);
            
            const totalExpensesLbp = periodExpenses
                .filter(exp => exp.amountCurrency === 'LBP')
                .reduce((sum, exp) => sum + exp.amountValue, 0);

            // حساب الصافي
            const netUsd = totalInvoicesUsd - totalExpensesUsd;
            const netLbp = totalInvoicesLbp - totalExpensesLbp;

            // عرض التقرير
            const reportContent = document.getElementById('report-content');
            reportContent.innerHTML = `
                <div class="report-container">
                    <div class="report-header">
                        <h3>تقرير شهري - ${this.app.formatPeriod(period)}</h3>
                        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-LB')}</p>
                    </div>

                    <div class="report-section">
                        <h4>📊 إحصائيات الفواتير</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">عدد الفواتير</span>
                                <span class="stat-value">${periodInvoices.length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">إجمالي الاستهلاك</span>
                                <span class="stat-value">${totalConsumption.toFixed(2)} كيلو واط</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">إجمالي الفواتير (USD)</span>
                                <span class="stat-value">${this.app.formatCurrency(totalInvoicesUsd, 'USD')}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">إجمالي الفواتير (LBP)</span>
                                <span class="stat-value">${this.app.formatCurrency(totalInvoicesLbp, 'LBP')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h4>💸 المصاريف</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">عدد المصاريف</span>
                                <span class="stat-value">${periodExpenses.length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">إجمالي المصاريف (USD)</span>
                                <span class="stat-value">${this.app.formatCurrency(totalExpensesUsd, 'USD')}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">إجمالي المصاريف (LBP)</span>
                                <span class="stat-value">${this.app.formatCurrency(totalExpensesLbp, 'LBP')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h4>💰 النتيجة المالية</h4>
                        <div class="financial-summary">
                            <div class="financial-item ${netUsd >= 0 ? 'profit' : 'loss'}">
                                <span class="financial-label">الصافي (USD)</span>
                                <span class="financial-value">${this.app.formatCurrency(netUsd, 'USD')}</span>
                            </div>
                            <div class="financial-item ${netLbp >= 0 ? 'profit' : 'loss'}">
                                <span class="financial-label">الصافي (LBP)</span>
                                <span class="financial-value">${this.app.formatCurrency(netLbp, 'LBP')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="report-section">
                        <h4>📋 تفاصيل الفواتير</h4>
                        <div class="invoices-details">
                            ${periodInvoices.length === 0 ? 
                                '<p>لا توجد فواتير لهذا الشهر</p>' :
                                periodInvoices.map(invoice => {
                                    const customer = this.app.customers.find(c => c.id === invoice.customerId);
                                    return `
                                        <div class="invoice-detail">
                                            <span>${customer ? customer.name : 'زبون محذوف'}</span>
                                            <span>${invoice.consumptionKwh} كيلو واط</span>
                                            <span>${this.app.formatCurrency(invoice.totalUsd, 'USD')}</span>
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    </div>

                    <div class="report-section">
                        <h4>📋 تفاصيل المصاريف</h4>
                        <div class="expenses-details">
                            ${periodExpenses.length === 0 ? 
                                '<p>لا توجد مصاريف لهذا الشهر</p>' :
                                periodExpenses.map(expense => `
                                    <div class="expense-detail">
                                        <span>${expense.label}</span>
                                        <span>${this.getExpenseTypeLabel(expense.type)}</span>
                                        <span>${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('خطأ في إنشاء التقرير:', error);
            this.app.showToast('خطأ في إنشاء التقرير', 'error');
        }
    }

    exportReport() {
        const year = document.getElementById('report-year').value;
        const month = document.getElementById('report-month').value;
        
        if (!year || !month) {
            this.app.showToast('يرجى اختيار السنة والشهر أولاً', 'warning');
            return;
        }

        const period = `${year}-${month}`;
        this.exportToExcel(period);
    }

    exportToExcel(period) {
        try {
            // جمع البيانات
            const periodInvoices = this.app.invoices.filter(invoice => invoice.period === period);
            const periodExpenses = this.app.expenses.filter(expense => expense.period === period);

            // إنشاء CSV
            let csvContent = '\uFEFF'; // BOM for UTF-8
            
            // عنوان التقرير
            csvContent += `تقرير شهري - ${this.app.formatPeriod(period)}\n`;
            csvContent += `تاريخ التقرير,${new Date().toLocaleDateString('ar-LB')}\n\n`;

            // إحصائيات الفواتير
            csvContent += `إحصائيات الفواتير\n`;
            csvContent += `عدد الفواتير,${periodInvoices.length}\n`;
            csvContent += `إجمالي الاستهلاك,${periodInvoices.reduce((sum, inv) => sum + inv.consumptionKwh, 0).toFixed(2)} كيلو واط\n`;
            csvContent += `إجمالي الفواتير (USD),${periodInvoices.reduce((sum, inv) => sum + inv.totalUsd, 0).toFixed(2)}\n`;
            csvContent += `إجمالي الفواتير (LBP),${periodInvoices.reduce((sum, inv) => sum + inv.totalLbp, 0)}\n\n`;

            // إحصائيات المصاريف
            csvContent += `إحصائيات المصاريف\n`;
            csvContent += `عدد المصاريف,${periodExpenses.length}\n`;
            csvContent += `إجمالي المصاريف (USD),${periodExpenses.filter(exp => exp.amountCurrency === 'USD').reduce((sum, exp) => sum + exp.amountValue, 0).toFixed(2)}\n`;
            csvContent += `إجمالي المصاريف (LBP),${periodExpenses.filter(exp => exp.amountCurrency === 'LBP').reduce((sum, exp) => sum + exp.amountValue, 0)}\n\n`;

            // تفاصيل الفواتير
            csvContent += `تفاصيل الفواتير\n`;
            csvContent += `اسم الزبون,الاستهلاك (كيلو واط),المجموع (USD),المجموع (LBP)\n`;
            periodInvoices.forEach(invoice => {
                const customer = this.app.customers.find(c => c.id === invoice.customerId);
                csvContent += `${customer ? customer.name : 'زبون محذوف'},${invoice.consumptionKwh},${invoice.totalUsd.toFixed(2)},${invoice.totalLbp}\n`;
            });

            csvContent += `\n`;

            // تفاصيل المصاريف
            csvContent += `تفاصيل المصاريف\n`;
            csvContent += `الوصف,النوع,المبلغ,العملة\n`;
            periodExpenses.forEach(expense => {
                csvContent += `${expense.label},${this.getExpenseTypeLabel(expense.type)},${expense.amountValue},${expense.amountCurrency}\n`;
            });

            // تحميل الملف
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `تقرير_${period}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.app.showToast('تم تصدير التقرير بنجاح', 'success');

        } catch (error) {
            console.error('خطأ في تصدير التقرير:', error);
            this.app.showToast('خطأ في تصدير التقرير', 'error');
        }
    }
}

// إضافة ExpensesReportsManager إلى التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.app.expensesManager = new ExpensesReportsManager(window.app);
    }
});
