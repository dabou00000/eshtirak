// وظائف الفواتير والسجلات
class InvoiceManager {
    constructor(app) {
        this.app = app;
    }

    showInvoiceModal(invoice = null) {
        const modal = document.getElementById('invoice-modal');
        const title = document.getElementById('invoice-modal-title');
        const form = document.getElementById('invoice-form');

        // تحديث قائمة الزبائن
        this.updateCustomerSelect();

        if (invoice) {
            title.textContent = 'تعديل الفاتورة';
            this.populateInvoiceForm(invoice);
            form.dataset.invoiceId = invoice.id;
        } else {
            title.textContent = 'إصدار فاتورة جديدة';
            form.reset();
            delete form.dataset.invoiceId;
            
            // تعيين القيم الافتراضية
            const currentDate = new Date();
            const currentMonth = currentDate.getFullYear() + '-' + 
                String(currentDate.getMonth() + 1).padStart(2, '0');
            document.getElementById('invoice-period').value = currentMonth;
        }

        this.calculateConsumption();
        modal.classList.add('active');
    }

    updateCustomerSelect() {
        const select = document.getElementById('invoice-customer');
        select.innerHTML = '<option value="">اختر الزبون</option>';
        
        this.app.customers.filter(c => c.status === 'active').forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }

    populateInvoiceForm(invoice) {
        document.getElementById('invoice-customer').value = invoice.customerId;
        document.getElementById('invoice-period').value = invoice.period;
        document.getElementById('meter-previous').value = invoice.meterPrev;
        document.getElementById('meter-current').value = invoice.meterCurr;
        document.getElementById('price-per-kwh-usd').value = invoice.pricePerKwhUsd || 0;
        document.getElementById('price-per-kwh-lbp').value = invoice.pricePerKwhLbp || 0;
        document.getElementById('fixed-fee').value = invoice.fixedFeeValue;
        document.getElementById('discount-amount').value = invoice.discountAmount || 0;
        document.getElementById('invoice-note').value = invoice.note || '';

        // تحديث الدفعات الإضافية
        this.updateExtrasList(invoice.extras || []);
    }

    updateExtrasList(extras) {
        const container = document.getElementById('extras-list');
        container.innerHTML = '';
        
        extras.forEach((extra, index) => {
            this.addExtraItem(extra.label, extra.value, index);
        });
    }

    updateCustomerData() {
        const customerId = document.getElementById('invoice-customer').value;
        if (!customerId) return;

        const customer = this.app.customers.find(c => c.id === customerId);
        if (customer) {
            // تحديث قراءة العداد السابقة
            document.getElementById('meter-previous').value = customer.lastMeterReading || 0;
            
            // تحديث الأسعار والاشتراك
            document.getElementById('price-per-kwh-usd').value = customer.priceUsd;
            document.getElementById('price-per-kwh-lbp').value = customer.priceLbp;
            document.getElementById('fixed-fee').value = customer.subscription;
            
            this.calculateConsumption();
        }
    }

    calculateConsumption() {
        const previous = parseFloat(document.getElementById('meter-previous').value) || 0;
        const current = parseFloat(document.getElementById('meter-current').value) || 0;
        const consumption = current - previous;
        
        document.getElementById('consumption-display').textContent = consumption.toFixed(2);
        
        if (consumption < 0) {
            document.getElementById('consumption-display').style.color = 'red';
        } else {
            document.getElementById('consumption-display').style.color = 'green';
        }
    }

    addExtraItem(label = '', value = 0, index = null) {
        const container = document.getElementById('extras-list');
        const itemIndex = index !== null ? index : container.children.length;
        
        const extraItem = document.createElement('div');
        extraItem.className = 'extra-item';
        extraItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <input type="text" class="extra-label" placeholder="وصف الدفعة" value="${label}">
                </div>
                <div class="form-group">
                    <input type="number" class="extra-value" placeholder="القيمة" value="${value}" step="0.01">
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-danger remove-extra" onclick="this.parentElement.parentElement.parentElement.remove()">حذف</button>
                </div>
            </div>
        `;
        
        container.appendChild(extraItem);
    }

    calculateInvoice() {
        try {
            const consumption = this.calculateConsumption();
            const priceUsd = parseFloat(document.getElementById('price-per-kwh-usd').value) || 0;
            const priceLbp = parseFloat(document.getElementById('price-per-kwh-lbp').value) || 0;
            const fixedFee = parseFloat(document.getElementById('fixed-fee').value) || 0;
            const discount = parseFloat(document.getElementById('discount-amount').value) || 0;
            const exchangeRate = this.app.settings.exchangeRate;

            // التحقق من صحة البيانات
            if (consumption < 0) {
                this.app.showToast('العداد الحالي يجب أن يكون أكبر من أو يساوي العداد السابق', 'error');
                return;
            }

            // جمع الدفعات الإضافية
            const extras = [];
            document.querySelectorAll('.extra-item').forEach(item => {
                const label = item.querySelector('.extra-label').value;
                const value = parseFloat(item.querySelector('.extra-value').value) || 0;
                if (label && value !== 0) {
                    extras.push({ label, value });
                }
            });

            // حساب المجاميع
            const energyCostUsd = consumption * priceUsd;
            const energyCostLbp = consumption * priceLbp;
            const extrasTotal = extras.reduce((sum, extra) => sum + extra.value, 0);
            
            const subtotalUsd = energyCostUsd + fixedFee + extrasTotal;
            const subtotalLbp = energyCostLbp + (fixedFee * exchangeRate) + (extrasTotal * exchangeRate);
            
            const totalUsd = subtotalUsd - discount;
            const totalLbp = subtotalLbp - (discount * exchangeRate);

            // عرض النتائج
            const resultsContainer = document.getElementById('calculation-results');
            resultsContainer.innerHTML = `
                <div class="calculation-item">
                    <span>كلفة الطاقة (USD):</span>
                    <span>${this.app.formatCurrency(energyCostUsd, 'USD')}</span>
                </div>
                <div class="calculation-item">
                    <span>الاشتراك الشهري:</span>
                    <span>${this.app.formatCurrency(fixedFee, 'USD')}</span>
                </div>
                <div class="calculation-item">
                    <span>الدفعات الإضافية:</span>
                    <span>${this.app.formatCurrency(extrasTotal, 'USD')}</span>
                </div>
                <div class="calculation-item">
                    <span>المجموع الجزئي:</span>
                    <span>${this.app.formatCurrency(subtotalUsd, 'USD')}</span>
                </div>
                <div class="calculation-item">
                    <span>الخصم:</span>
                    <span>-${this.app.formatCurrency(discount, 'USD')}</span>
                </div>
                <div class="calculation-item total">
                    <span>المجموع النهائي (USD):</span>
                    <span id="total-usd">${this.app.formatCurrency(totalUsd, 'USD')}</span>
                </div>
                <div class="calculation-item total">
                    <span>المجموع النهائي (LBP):</span>
                    <span id="total-lbp">${this.app.formatCurrency(totalLbp, 'LBP')}</span>
                </div>
            `;

        } catch (error) {
            console.error('خطأ في حساب الفاتورة:', error);
            this.app.showToast('خطأ في حساب الفاتورة', 'error');
        }
    }

    async saveInvoice() {
        try {
            const consumption = this.calculateConsumption();
            const customerId = document.getElementById('invoice-customer').value;
            const period = document.getElementById('invoice-period').value;
            const priceUsd = parseFloat(document.getElementById('price-per-kwh-usd').value) || 0;
            const priceLbp = parseFloat(document.getElementById('price-per-kwh-lbp').value) || 0;
            const fixedFee = parseFloat(document.getElementById('fixed-fee').value) || 0;
            const discount = parseFloat(document.getElementById('discount-amount').value) || 0;
            const exchangeRate = this.app.settings.exchangeRate;

            // التحقق من صحة البيانات
            if (consumption < 0) {
                this.app.showToast('العداد الحالي يجب أن يكون أكبر من أو يساوي العداد السابق', 'error');
                return;
            }

            if (!customerId) {
                this.app.showToast('يرجى اختيار زبون', 'error');
                return;
            }

            // جمع الدفعات الإضافية
            const extras = [];
            document.querySelectorAll('.extra-item').forEach(item => {
                const label = item.querySelector('.extra-label').value;
                const value = parseFloat(item.querySelector('.extra-value').value) || 0;
                if (label && value !== 0) {
                    extras.push({ label, value });
                }
            });

            // حساب المجاميع
            const energyCostUsd = consumption * priceUsd;
            const energyCostLbp = consumption * priceLbp;
            const extrasTotal = extras.reduce((sum, extra) => sum + extra.value, 0);
            
            const subtotalUsd = energyCostUsd + fixedFee + extrasTotal;
            const subtotalLbp = energyCostLbp + (fixedFee * exchangeRate) + (extrasTotal * exchangeRate);
            
            const totalUsd = subtotalUsd - discount;
            const totalLbp = subtotalLbp - (discount * exchangeRate);

            const invoiceData = {
                customerId,
                period,
                meterPrev: parseFloat(document.getElementById('meter-previous').value),
                meterCurr: parseFloat(document.getElementById('meter-current').value),
                consumptionKwh: consumption,
                pricePerKwhUsd: priceUsd,
                pricePerKwhLbp: priceLbp,
                fixedFeeValue: fixedFee,
                extras,
                discountAmount: discount,
                exchangeRateUsed: exchangeRate,
                totalUsd,
                totalLbp,
                note: document.getElementById('invoice-note').value,
                issuedAt: new Date().toISOString(),
                createdBy: this.app.currentUser.uid
            };

            const form = document.getElementById('invoice-form');
            const invoiceId = form.dataset.invoiceId;

            if (invoiceId) {
                // تعديل فاتورة موجودة
                const index = this.app.invoices.findIndex(inv => inv.id === invoiceId);
                if (index !== -1) {
                    this.app.invoices[index] = { ...this.app.invoices[index], ...invoiceData };
                }
                this.app.showToast('تم تعديل الفاتورة بنجاح', 'success');
            } else {
                // إضافة فاتورة جديدة
                invoiceData.id = 'invoice_' + Date.now();
                invoiceData.createdAt = new Date().toISOString();
                this.app.invoices.push(invoiceData);
                this.app.showToast('تم إصدار الفاتورة بنجاح', 'success');

                // تحديث آخر قراءة عداد للزبون
                const customer = this.app.customers.find(c => c.id === customerId);
                if (customer) {
                    customer.lastMeterReading = invoiceData.meterCurr;
                    localStorage.setItem('customers', JSON.stringify(this.app.customers));
                }
            }

            // حفظ في LocalStorage
            localStorage.setItem('invoices', JSON.stringify(this.app.invoices));

            this.app.closeModal(document.getElementById('invoice-modal'));
            await this.app.loadInvoices();
            
            // عرض معاينة الفاتورة
            this.showInvoicePreview(invoiceData);
            
        } catch (error) {
            console.error('خطأ في حفظ الفاتورة:', error);
            this.app.showToast('خطأ في حفظ الفاتورة', 'error');
        }
    }

    showInvoicePreview(invoice) {
        const customer = this.app.customers.find(c => c.id === invoice.customerId);
        const modal = document.getElementById('print-modal');
        const preview = document.getElementById('invoice-preview');
        
        preview.innerHTML = `
            <div class="invoice-preview-content">
                <div class="invoice-header">
                    <h2>${this.app.settings.name}</h2>
                    <p>${this.app.settings.address}</p>
                    <p>📞 ${this.app.settings.phone}</p>
                </div>
                
                <div class="invoice-details">
                    <h3>فاتورة كهرباء</h3>
                    <div class="invoice-info">
                        <p><strong>رقم الفاتورة:</strong> ${invoice.id}</p>
                        <p><strong>التاريخ:</strong> ${new Date(invoice.issuedAt).toLocaleDateString('ar-LB')}</p>
                        <p><strong>الشهر:</strong> ${this.app.formatPeriod(invoice.period)}</p>
                    </div>
                </div>
                
                <div class="customer-info">
                    <h4>بيانات الزبون</h4>
                    <p><strong>الاسم:</strong> ${customer.name}</p>
                    ${customer.address ? `<p><strong>العنوان:</strong> ${customer.address}</p>` : ''}
                    ${customer.phone ? `<p><strong>الهاتف:</strong> ${customer.phone}</p>` : ''}
                </div>
                
                <div class="meter-info">
                    <h4>قراءات العداد</h4>
                    <p><strong>العداد السابق:</strong> ${invoice.meterPrev}</p>
                    <p><strong>العداد الحالي:</strong> ${invoice.meterCurr}</p>
                    <p><strong>الاستهلاك:</strong> ${invoice.consumptionKwh} كيلو واط</p>
                </div>
                
                <div class="calculation-details">
                    <h4>تفاصيل الحساب</h4>
                    <div class="calculation-row">
                        <span>كلفة الطاقة (${invoice.consumptionKwh} × $${invoice.pricePerKwhUsd}):</span>
                        <span>${this.app.formatCurrency(invoice.consumptionKwh * invoice.pricePerKwhUsd, 'USD')}</span>
                    </div>
                    <div class="calculation-row">
                        <span>الاشتراك الشهري:</span>
                        <span>${this.app.formatCurrency(invoice.fixedFeeValue, 'USD')}</span>
                    </div>
                    ${invoice.extras.map(extra => `
                        <div class="calculation-row">
                            <span>${extra.label}:</span>
                            <span>${this.app.formatCurrency(extra.value, 'USD')}</span>
                        </div>
                    `).join('')}
                    ${invoice.discountAmount > 0 ? `
                        <div class="calculation-row discount">
                            <span>الخصم:</span>
                            <span>-${this.app.formatCurrency(invoice.discountAmount, 'USD')}</span>
                        </div>
                    ` : ''}
                    <div class="calculation-row total">
                        <span><strong>المجموع النهائي:</strong></span>
                        <span><strong>${this.app.formatCurrency(invoice.totalUsd, 'USD')}</strong></span>
                    </div>
                    <div class="calculation-row total">
                        <span><strong>المجموع بالليرة:</strong></span>
                        <span><strong>${this.app.formatCurrency(invoice.totalLbp, 'LBP')}</strong></span>
                    </div>
                </div>
                
                ${invoice.note ? `
                    <div class="invoice-note">
                        <h4>ملاحظات</h4>
                        <p>${invoice.note}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.classList.add('active');
    }

    printInvoice() {
        const printContent = document.getElementById('invoice-preview').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>فاتورة كهرباء</title>
                    <style>
                        body { font-family: 'Noto Kufi Arabic', Arial, sans-serif; direction: rtl; text-align: right; }
                        .invoice-preview-content { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .invoice-details { margin-bottom: 20px; }
                        .customer-info, .meter-info, .calculation-details { margin-bottom: 20px; }
                        .calculation-row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .calculation-row.total { border-top: 1px solid #333; padding-top: 10px; font-weight: bold; }
                        .calculation-row.discount { color: red; }
                        .invoice-note { margin-top: 20px; padding: 10px; background: #f5f5f5; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    renderInvoices() {
        const container = document.getElementById('invoices-list');
        if (this.app.invoices.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد فواتير</p></div>';
            return;
        }

        container.innerHTML = this.app.invoices.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customer ? customer.name : 'زبون محذوف'}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)}</p>
                        <p>🔢 الاستهلاك: ${invoice.consumptionKwh} كيلو واط</p>
                        <p>💰 المجموع: ${this.app.formatCurrency(invoice.totalUsd, 'USD')}</p>
                        <p>📄 رقم الفاتورة: ${invoice.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview('${invoice.id}')">معاينة</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.printInvoiceFromList('${invoice.id}')">طباعة</button>
                        <button class="btn btn-danger" onclick="app.invoiceManager.deleteInvoice('${invoice.id}')">حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showInvoicePreview(invoiceId) {
        const invoice = this.app.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            this.showInvoicePreview(invoice);
        }
    }

    printInvoiceFromList(invoiceId) {
        const invoice = this.app.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            this.showInvoicePreview(invoice);
            setTimeout(() => {
                this.printInvoice();
            }, 500);
        }
    }

    async deleteInvoice(invoiceId) {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

        try {
            this.app.invoices = this.app.invoices.filter(inv => inv.id !== invoiceId);
            localStorage.setItem('invoices', JSON.stringify(this.app.invoices));
            this.app.showToast('تم حذف الفاتورة بنجاح', 'success');
            await this.app.loadInvoices();
        } catch (error) {
            console.error('خطأ في حذف الفاتورة:', error);
            this.app.showToast('خطأ في حذف الفاتورة', 'error');
        }
    }

    filterInvoices() {
        const periodFilter = document.getElementById('invoice-period-filter').value;
        const customerFilter = document.getElementById('invoice-customer-filter').value;
        
        let filtered = this.app.invoices;

        if (periodFilter) {
            filtered = filtered.filter(invoice => invoice.period === periodFilter);
        }

        if (customerFilter) {
            filtered = filtered.filter(invoice => invoice.customerId === customerFilter);
        }

        const container = document.getElementById('invoices-list');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = filtered.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customer ? customer.name : 'زبون محذوف'}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)}</p>
                        <p>🔢 الاستهلاك: ${invoice.consumptionKwh} كيلو واط</p>
                        <p>💰 المجموع: ${this.app.formatCurrency(invoice.totalUsd, 'USD')}</p>
                        <p>📄 رقم الفاتورة: ${invoice.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview('${invoice.id}')">معاينة</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.printInvoiceFromList('${invoice.id}')">طباعة</button>
                        <button class="btn btn-danger" onclick="app.invoiceManager.deleteInvoice('${invoice.id}')">حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadHistory() {
        const container = document.getElementById('history-list');
        if (this.app.invoices.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد سجلات</p></div>';
            return;
        }

        // ترتيب الفواتير حسب التاريخ
        const sortedInvoices = [...this.app.invoices].sort((a, b) => 
            new Date(b.issuedAt) - new Date(a.issuedAt)
        );

        container.innerHTML = sortedInvoices.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customer ? customer.name : 'زبون محذوف'}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)} - ${new Date(invoice.issuedAt).toLocaleDateString('ar-LB')}</p>
                        <p>🔢 الاستهلاك: ${invoice.consumptionKwh} كيلو واط</p>
                        <p>💰 المجموع: ${this.app.formatCurrency(invoice.totalUsd, 'USD')}</p>
                        <p>📄 رقم الفاتورة: ${invoice.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview('${invoice.id}')">عرض</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.printInvoiceFromList('${invoice.id}')">طباعة</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterHistory() {
        const customerFilter = document.getElementById('history-customer-filter').value;
        const yearFilter = document.getElementById('history-year-filter').value;
        const monthFilter = document.getElementById('history-month-filter').value;
        
        let filtered = this.app.invoices;

        if (customerFilter) {
            filtered = filtered.filter(invoice => invoice.customerId === customerFilter);
        }

        if (yearFilter) {
            filtered = filtered.filter(invoice => invoice.period.startsWith(yearFilter));
        }

        if (monthFilter) {
            filtered = filtered.filter(invoice => invoice.period === monthFilter);
        }

        // ترتيب حسب التاريخ
        filtered = filtered.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

        const container = document.getElementById('history-list');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا توجد نتائج</p></div>';
            return;
        }

        container.innerHTML = filtered.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customer ? customer.name : 'زبون محذوف'}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)} - ${new Date(invoice.issuedAt).toLocaleDateString('ar-LB')}</p>
                        <p>🔢 الاستهلاك: ${invoice.consumptionKwh} كيلو واط</p>
                        <p>💰 المجموع: ${this.app.formatCurrency(invoice.totalUsd, 'USD')}</p>
                        <p>📄 رقم الفاتورة: ${invoice.id}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview('${invoice.id}')">عرض</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.printInvoiceFromList('${invoice.id}')">طباعة</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// إضافة InvoiceManager إلى التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.app.invoiceManager = new InvoiceManager(window.app);
    }
});
