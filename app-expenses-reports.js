// وظائف النفقات والتقارير
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
        const labelGroup = document.getElementById('expense-label-group');
        const labelInput = document.getElementById('expense-label');
        
        if (type === 'DIESEL') {
            labelGroup.style.display = 'none';
            labelInput.value = 'ثمن مازوت';
        } else {
            labelGroup.style.display = 'block';
            if (labelInput.value === 'ثمن مازوت') {
                labelInput.value = '';
            }
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
                createdAt: firebase.serverTimestamp()
            };

            const form = document.getElementById('expense-form');
            const expenseId = form.dataset.expenseId;

            if (expenseId) {
                // تعديل نفقة موجودة
                await firebase.updateDoc(
                    firebase.doc(firebase.db, `tenants/${this.app.currentTenant.id}/expenses`, expenseId),
                    expenseData
                );
                this.app.showToast('تم تعديل النفقة بنجاح', 'success');
            } else {
                // إضافة نفقة جديدة
                await firebase.addDoc(
                    firebase.collection(firebase.db, `tenants/${this.app.currentTenant.id}/expenses`),
                    expenseData
                );
                this.app.showToast('تم إضافة النفقة بنجاح', 'success');
            }

            this.app.closeModal(document.getElementById('expense-modal'));
            await this.app.loadExpenses();
        } catch (error) {
            console.error('خطأ في حفظ النفقة:', error);
            this.app.showToast('خطأ في حفظ النفقة', 'error');
        }
    }

    renderExpenses() {
        const container = document.getElementById('expenses-list');
        if (this.app.expenses.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا يوجد نفقات</p></div>';
            return;
        }

        container.innerHTML = this.app.expenses.map(expense => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${expense.label}</h4>
                    <p>📅 ${this.app.formatPeriod(expense.period)}</p>
                    <p>🏷️ ${expense.type === 'DIESEL' ? 'ثمن مازوت' : 'أخرى'}</p>
                    <p>💰 ${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-primary" onclick="app.expensesManager.editExpense('${expense.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.expensesManager.deleteExpense('${expense.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    editExpense(expenseId) {
        const expense = this.app.expenses.find(e => e.id === expenseId);
        if (expense) {
            this.showExpenseModal(expense);
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('هل أنت متأكد من حذف هذه النفقة؟')) return;

        try {
            await firebase.deleteDoc(
                firebase.doc(firebase.db, `tenants/${this.app.currentTenant.id}/expenses`, expenseId)
            );
            this.app.showToast('تم حذف النفقة بنجاح', 'success');
            await this.app.loadExpenses();
        } catch (error) {
            console.error('خطأ في حذف النفقة:', error);
            this.app.showToast('خطأ في حذف النفقة', 'error');
        }
    }

    filterExpenses() {
        const periodFilter = document.getElementById('expense-period-filter').value;
        
        let filtered = this.app.expenses;
        
        if (periodFilter) {
            filtered = filtered.filter(expense => expense.period === periodFilter);
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
                    <p>🏷️ ${expense.type === 'DIESEL' ? 'ثمن مازوت' : 'أخرى'}</p>
                    <p>💰 ${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-primary" onclick="app.expensesManager.editExpense('${expense.id}')">تعديل</button>
                    <button class="btn btn-danger" onclick="app.expensesManager.deleteExpense('${expense.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    async generateReport() {
        const period = document.getElementById('report-period').value;
        if (!period) {
            this.app.showToast('يرجى اختيار الشهر', 'warning');
            return;
        }

        try {
            // جمع بيانات الوصولات للشهر المحدد
            const periodInvoices = this.app.invoices.filter(invoice => invoice.period === period);
            
            // جمع بيانات النفقات للشهر المحدد
            const periodExpenses = this.app.expenses.filter(expense => expense.period === period);

            // حساب الإحصائيات
            const stats = this.calculateReportStats(periodInvoices, periodExpenses);
            
            // عرض التقرير
            this.displayReport(period, stats, periodInvoices, periodExpenses);

        } catch (error) {
            console.error('خطأ في إنشاء التقرير:', error);
            this.app.showToast('خطأ في إنشاء التقرير', 'error');
        }
    }

    calculateReportStats(invoices, expenses) {
        // حساب إجمالي الوصولات
        const totalInvoicesUsd = invoices.reduce((sum, invoice) => sum + invoice.totalUsd, 0);
        const totalInvoicesLbp = invoices.reduce((sum, invoice) => sum + invoice.totalLbp, 0);
        
        // حساب إجمالي الاستهلاك
        const totalConsumption = invoices.reduce((sum, invoice) => sum + invoice.consumptionKwh, 0);
        
        // حساب النفقات بالدولار والليرة
        const expensesUsd = expenses
            .filter(exp => exp.amountCurrency === 'USD')
            .reduce((sum, exp) => sum + exp.amountValue, 0);
        
        const expensesLbp = expenses
            .filter(exp => exp.amountCurrency === 'LBP')
            .reduce((sum, exp) => sum + exp.amountValue, 0);
        
        // تحويل النفقات بالليرة إلى دولار (بسعر الصرف الحالي)
        const exchangeRate = this.app.settings.exchangeRate || 90000;
        const expensesUsdConverted = expensesLbp / exchangeRate;
        const totalExpensesUsd = expensesUsd + expensesUsdConverted;
        
        // تحويل النفقات بالدولار إلى ليرة
        const expensesLbpConverted = expensesUsd * exchangeRate;
        const totalExpensesLbp = expensesLbp + expensesLbpConverted;
        
        // حساب الصافي
        const netUsd = totalInvoicesUsd - totalExpensesUsd;
        const netLbp = totalInvoicesLbp - totalExpensesLbp;

        return {
            totalInvoicesUsd,
            totalInvoicesLbp,
            totalConsumption,
            expensesUsd,
            expensesLbp,
            totalExpensesUsd,
            totalExpensesLbp,
            netUsd,
            netLbp,
            invoiceCount: invoices.length,
            expenseCount: expenses.length
        };
    }

    displayReport(period, stats, invoices, expenses) {
        const container = document.getElementById('report-content');
        
        container.innerHTML = `
            <div class="report-header">
                <h3>تقرير شهر ${this.app.formatPeriod(period)}</h3>
                <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-LB')}</p>
            </div>
            
            <div class="report-summary">
                <div class="report-card">
                    <h4>عدد الوصولات</h4>
                    <div class="value">${stats.invoiceCount}</div>
                </div>
                <div class="report-card">
                    <h4>إجمالي الاستهلاك</h4>
                    <div class="value">${stats.totalConsumption.toFixed(2)} كيلو واط</div>
                </div>
                <div class="report-card">
                    <h4>إجمالي الوصولات (USD)</h4>
                    <div class="value">${this.app.formatCurrency(stats.totalInvoicesUsd, 'USD')}</div>
                </div>
                <div class="report-card">
                    <h4>إجمالي الوصولات (LBP)</h4>
                    <div class="value">${this.app.formatCurrency(stats.totalInvoicesLbp, 'LBP')}</div>
                </div>
                <div class="report-card">
                    <h4>إجمالي النفقات (USD)</h4>
                    <div class="value">${this.app.formatCurrency(stats.totalExpensesUsd, 'USD')}</div>
                </div>
                <div class="report-card">
                    <h4>إجمالي النفقات (LBP)</h4>
                    <div class="value">${this.app.formatCurrency(stats.totalExpensesLbp, 'LBP')}</div>
                </div>
                <div class="report-card">
                    <h4>الصافي (USD)</h4>
                    <div class="value ${stats.netUsd < 0 ? 'negative' : ''}">${this.app.formatCurrency(stats.netUsd, 'USD')}</div>
                </div>
                <div class="report-card">
                    <h4>الصافي (LBP)</h4>
                    <div class="value ${stats.netLbp < 0 ? 'negative' : ''}">${this.app.formatCurrency(stats.netLbp, 'LBP')}</div>
                </div>
            </div>
            
            <div class="report-details">
                <h4>تفاصيل الوصولات</h4>
                ${this.generateInvoicesTable(invoices)}
            </div>
            
            <div class="report-details">
                <h4>تفاصيل النفقات</h4>
                ${this.generateExpensesTable(expenses)}
            </div>
            
            <div class="report-actions">
                <button class="btn btn-primary" onclick="app.expensesManager.exportReport('${period}')">تصدير CSV</button>
            </div>
        `;
    }

    generateInvoicesTable(invoices) {
        if (invoices.length === 0) {
            return '<p>لا توجد وصولات لهذا الشهر</p>';
        }

        const tableRows = invoices.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            const customerName = customer ? customer.name : 'مشترك محذوف';
            
            return `
                <tr>
                    <td>${customerName}</td>
                    <td>${invoice.consumptionKwh.toFixed(2)}</td>
                    <td>${this.app.formatCurrency(invoice.totalUsd, 'USD')}</td>
                    <td>${this.app.formatCurrency(invoice.totalLbp, 'LBP')}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>المشترك</th>
                        <th>الاستهلاك (كيلو واط)</th>
                        <th>المبلغ (USD)</th>
                        <th>المبلغ (LBP)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    generateExpensesTable(expenses) {
        if (expenses.length === 0) {
            return '<p>لا توجد نفقات لهذا الشهر</p>';
        }

        const tableRows = expenses.map(expense => `
            <tr>
                <td>${expense.label}</td>
                <td>${expense.type === 'DIESEL' ? 'ثمن مازوت' : 'أخرى'}</td>
                <td>${this.app.formatCurrency(expense.amountValue, expense.amountCurrency)}</td>
            </tr>
        `).join('');

        return `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    exportReport(period) {
        try {
            const periodInvoices = this.app.invoices.filter(invoice => invoice.period === period);
            const periodExpenses = this.app.expenses.filter(expense => expense.period === period);
            const stats = this.calculateReportStats(periodInvoices, periodExpenses);

            // إنشاء بيانات CSV
            let csvContent = 'تقرير شهر ' + this.app.formatPeriod(period) + '\n\n';
            
            // إحصائيات عامة
            csvContent += 'الإحصائيات العامة\n';
            csvContent += 'عدد الوصولات,' + stats.invoiceCount + '\n';
            csvContent += 'إجمالي الاستهلاك (كيلو واط),' + stats.totalConsumption.toFixed(2) + '\n';
            csvContent += 'إجمالي الوصولات (USD),' + stats.totalInvoicesUsd.toFixed(2) + '\n';
            csvContent += 'إجمالي الوصولات (LBP),' + stats.totalInvoicesLbp + '\n';
            csvContent += 'إجمالي النفقات (USD),' + stats.totalExpensesUsd.toFixed(2) + '\n';
            csvContent += 'إجمالي النفقات (LBP),' + stats.totalExpensesLbp + '\n';
            csvContent += 'الصافي (USD),' + stats.netUsd.toFixed(2) + '\n';
            csvContent += 'الصافي (LBP),' + stats.netLbp + '\n\n';

            // تفاصيل الوصولات
            csvContent += 'تفاصيل الوصولات\n';
            csvContent += 'المشترك,الاستهلاك (كيلو واط),المبلغ (USD),المبلغ (LBP)\n';
            
            periodInvoices.forEach(invoice => {
                const customer = this.app.customers.find(c => c.id === invoice.customerId);
                const customerName = customer ? customer.name : 'مشترك محذوف';
                csvContent += `"${customerName}",${invoice.consumptionKwh.toFixed(2)},${invoice.totalUsd.toFixed(2)},${invoice.totalLbp}\n`;
            });

            csvContent += '\n';

            // تفاصيل النفقات
            csvContent += 'تفاصيل النفقات\n';
            csvContent += 'الوصف,النوع,المبلغ,العملة\n';
            
            periodExpenses.forEach(expense => {
                csvContent += `"${expense.label}","${expense.type === 'DIESEL' ? 'ثمن مازوت' : 'أخرى'}",${expense.amountValue},${expense.amountCurrency}\n`;
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
