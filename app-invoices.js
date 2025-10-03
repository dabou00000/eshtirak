// وظائف الوصولات والنفقات والتقارير
class InvoiceManager {
    constructor(app) {
        this.app = app;
    }

    showInvoiceModal(invoice = null) {
        const modal = document.getElementById('invoice-modal');
        const title = document.getElementById('invoice-modal-title');
        const form = document.getElementById('invoice-form');

        // تحديث قائمة المشتركين
        this.updateCustomerSelect();

        if (invoice) {
            title.textContent = 'تعديل الوصل';
            this.populateInvoiceForm(invoice);
            form.dataset.invoiceId = invoice.id;
        } else {
            title.textContent = 'إضافة وصل جديد';
            form.reset();
            delete form.dataset.invoiceId;
            
            // تعيين القيم الافتراضية
            const currentDate = new Date();
            const currentMonth = currentDate.getFullYear() + '-' + 
                String(currentDate.getMonth() + 1).padStart(2, '0');
            document.getElementById('invoice-period').value = currentMonth;
            document.getElementById('exchange-rate-override').value = this.app.settings.exchangeRate || 90000;
        }

        this.updatePricingMode();
        this.calculateConsumption();
        modal.classList.add('active');
    }

    updateCustomerSelect() {
        const select = document.getElementById('invoice-customer');
        select.innerHTML = '<option value="">اختر المشترك</option>';
        
        this.app.customers.forEach(customer => {
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
        document.getElementById('pricing-mode').value = invoice.pricingMode;
        document.getElementById('price-per-kwh-usd').value = invoice.pricePerKwhUsd || '';
        document.getElementById('price-per-kwh-lbp').value = invoice.pricePerKwhLbp || '';
        document.getElementById('fixed-fee').value = invoice.fixedFeeValue || '';
        document.getElementById('invoice-note').value = invoice.note || '';
        document.getElementById('exchange-rate-override').value = invoice.exchangeRateUsed || this.app.settings.exchangeRate;

        // تحديث الدفعات الإضافية
        this.updateExtrasList(invoice.extras || []);
    }

    updatePricingMode() {
        const mode = document.getElementById('pricing-mode').value;
        const usdGroup = document.getElementById('price-usd-group');
        const lbpGroup = document.getElementById('price-lbp-group');

        usdGroup.style.display = mode === 'LBP' ? 'none' : 'block';
        lbpGroup.style.display = mode === 'USD' ? 'none' : 'block';

        // تحديث التسميات
        const fixedFeeLabel = document.querySelector('label[for="fixed-fee"]');
        if (mode === 'USD') {
            fixedFeeLabel.textContent = 'الاشتراك الشهري (USD)';
        } else if (mode === 'LBP') {
            fixedFeeLabel.textContent = 'الاشتراك الشهري (LBP)';
        } else {
            fixedFeeLabel.textContent = 'الاشتراك الشهري';
        }
    }

    calculateConsumption() {
        const previous = parseFloat(document.getElementById('meter-previous').value) || 0;
        const current = parseFloat(document.getElementById('meter-current').value) || 0;
        const consumption = Math.max(0, current - previous);
        
        document.getElementById('consumption-display').textContent = consumption.toFixed(2);
        return consumption;
    }

    addExtraItem() {
        const container = document.getElementById('extras-list');
        const extraDiv = document.createElement('div');
        extraDiv.className = 'extra-item';
        extraDiv.innerHTML = `
            <input type="text" placeholder="وصف الدفعة" class="extra-label">
            <input type="number" placeholder="القيمة" step="0.01" class="extra-value">
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">حذف</button>
        `;
        container.appendChild(extraDiv);
    }

    updateExtrasList(extras) {
        const container = document.getElementById('extras-list');
        container.innerHTML = '';
        
        extras.forEach(extra => {
            const extraDiv = document.createElement('div');
            extraDiv.className = 'extra-item';
            extraDiv.innerHTML = `
                <input type="text" placeholder="وصف الدفعة" class="extra-label" value="${extra.label}">
                <input type="number" placeholder="القيمة" step="0.01" class="extra-value" value="${extra.value}">
                <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">حذف</button>
            `;
            container.appendChild(extraDiv);
        });
    }

    calculateInvoice() {
        try {
            const consumption = this.calculateConsumption();
            const pricingMode = document.getElementById('pricing-mode').value;
            const priceUsd = parseFloat(document.getElementById('price-per-kwh-usd').value) || 0;
            const priceLbp = parseFloat(document.getElementById('price-per-kwh-lbp').value) || 0;
            const fixedFee = parseFloat(document.getElementById('fixed-fee').value) || 0;
            const exchangeRate = parseFloat(document.getElementById('exchange-rate-override').value) || this.app.settings.exchangeRate;

            // جمع الدفعات الإضافية
            const extras = [];
            document.querySelectorAll('.extra-item').forEach(item => {
                const label = item.querySelector('.extra-label').value;
                const value = parseFloat(item.querySelector('.extra-value').value) || 0;
                if (label && value !== 0) {
                    extras.push({ label, value });
                }
            });

            let energyCost, totalUsd, totalLbp;

            if (pricingMode === 'USD') {
                energyCost = consumption * priceUsd;
                const extrasUsd = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalUsd = energyCost + fixedFee + extrasUsd;
                totalLbp = this.app.roundLBP(totalUsd * exchangeRate);
            } else if (pricingMode === 'LBP') {
                energyCost = consumption * priceLbp;
                const extrasLbp = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalLbp = this.app.roundLBP(energyCost + fixedFee + extrasLbp);
                totalUsd = totalLbp / exchangeRate;
            } else { // DUAL
                const energyUsd = consumption * priceUsd;
                const energyLbp = consumption * priceLbp;
                const extrasUsd = extras.reduce((sum, extra) => sum + extra.value, 0);
                const extrasLbp = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalUsd = energyUsd + fixedFee + extrasUsd;
                totalLbp = this.app.roundLBP(energyLbp + fixedFee + extrasLbp);
            }

            // عرض النتائج
            this.displayCalculationResults({
                consumption,
                energyCost,
                fixedFee,
                extras,
                totalUsd,
                totalLbp,
                pricingMode
            });

        } catch (error) {
            console.error('خطأ في الحساب:', error);
            this.app.showToast('خطأ في الحساب', 'error');
        }
    }

    displayCalculationResults(results) {
        const container = document.getElementById('calculation-results');
        container.innerHTML = `
            <div class="calculation-item">
                <span>الاستهلاك:</span>
                <span>${results.consumption.toFixed(2)} كيلو واط</span>
            </div>
            <div class="calculation-item">
                <span>كلفة الطاقة:</span>
                <span>${this.app.formatCurrency(results.energyCost, results.pricingMode === 'LBP' ? 'LBP' : 'USD')}</span>
            </div>
            <div class="calculation-item">
                <span>الاشتراك الشهري:</span>
                <span>${this.app.formatCurrency(results.fixedFee, results.pricingMode === 'LBP' ? 'LBP' : 'USD')}</span>
            </div>
            ${results.extras.map(extra => `
                <div class="calculation-item">
                    <span>${extra.label}:</span>
                    <span>${this.app.formatCurrency(extra.value, results.pricingMode === 'LBP' ? 'LBP' : 'USD')}</span>
                </div>
            `).join('')}
            <div class="calculation-item">
                <span>المجموع النهائي (USD):</span>
                <span>${this.app.formatCurrency(results.totalUsd, 'USD')}</span>
            </div>
            <div class="calculation-item">
                <span>المجموع النهائي (LBP):</span>
                <span>${this.app.formatCurrency(results.totalLbp, 'LBP')}</span>
            </div>
        `;
    }

    async saveInvoice() {
        try {
            const consumption = this.calculateConsumption();
            const pricingMode = document.getElementById('pricing-mode').value;
            const priceUsd = parseFloat(document.getElementById('price-per-kwh-usd').value) || 0;
            const priceLbp = parseFloat(document.getElementById('price-per-kwh-lbp').value) || 0;
            const fixedFee = parseFloat(document.getElementById('fixed-fee').value) || 0;
            const exchangeRate = parseFloat(document.getElementById('exchange-rate-override').value) || this.app.settings.exchangeRate;

            // التحقق من صحة البيانات
            if (consumption < 0) {
                this.app.showToast('العداد الحالي يجب أن يكون أكبر من أو يساوي العداد السابق', 'error');
                return;
            }

            if (pricingMode === 'USD' && priceUsd <= 0) {
                this.app.showToast('يرجى إدخال سعر صحيح للكيلو واط بالدولار', 'error');
                return;
            }

            if (pricingMode === 'LBP' && priceLbp <= 0) {
                this.app.showToast('يرجى إدخال سعر صحيح للكيلو واط بالليرة', 'error');
                return;
            }

            if (pricingMode === 'DUAL' && (priceUsd <= 0 || priceLbp <= 0)) {
                this.app.showToast('يرجى إدخال أسعار صحيحة للكيلو واط بالعملتين', 'error');
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
            let totalUsd, totalLbp;

            if (pricingMode === 'USD') {
                const energyCost = consumption * priceUsd;
                const extrasUsd = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalUsd = energyCost + fixedFee + extrasUsd;
                totalLbp = this.app.roundLBP(totalUsd * exchangeRate);
            } else if (pricingMode === 'LBP') {
                const energyCost = consumption * priceLbp;
                const extrasLbp = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalLbp = this.app.roundLBP(energyCost + fixedFee + extrasLbp);
                totalUsd = totalLbp / exchangeRate;
            } else { // DUAL
                const energyUsd = consumption * priceUsd;
                const energyLbp = consumption * priceLbp;
                const extrasUsd = extras.reduce((sum, extra) => sum + extra.value, 0);
                const extrasLbp = extras.reduce((sum, extra) => sum + extra.value, 0);
                totalUsd = energyUsd + fixedFee + extrasUsd;
                totalLbp = this.app.roundLBP(energyLbp + fixedFee + extrasLbp);
            }

            const invoiceData = {
                customerId: document.getElementById('invoice-customer').value,
                period: document.getElementById('invoice-period').value,
                meterPrev: parseFloat(document.getElementById('meter-previous').value),
                meterCurr: parseFloat(document.getElementById('meter-current').value),
                consumptionKwh: consumption,
                pricingMode,
                pricePerKwhUsd: pricingMode !== 'LBP' ? priceUsd : null,
                pricePerKwhLbp: pricingMode !== 'USD' ? priceLbp : null,
                fixedFeeValue: fixedFee,
                extras,
                exchangeRateUsed: exchangeRate,
                totalUsd,
                totalLbp,
                note: document.getElementById('invoice-note').value,
                issuedAt: firebase.serverTimestamp(),
                createdBy: this.app.currentUser.uid
            };

            const form = document.getElementById('invoice-form');
            const invoiceId = form.dataset.invoiceId;

            if (invoiceId) {
                // تعديل وصل موجود
                await firebase.updateDoc(
                    firebase.doc(firebase.db, `tenants/${this.app.currentTenant.id}/invoices`, invoiceId),
                    invoiceData
                );
                this.app.showToast('تم تعديل الوصل بنجاح', 'success');
            } else {
                // إضافة وصل جديد
                await firebase.addDoc(
                    firebase.collection(firebase.db, `tenants/${this.app.currentTenant.id}/invoices`),
                    invoiceData
                );
                this.app.showToast('تم إضافة الوصل بنجاح', 'success');
            }

            this.app.closeModal(document.getElementById('invoice-modal'));
            await this.app.loadInvoices();
            
            // عرض معاينة الوصل
            this.showInvoicePreview(invoiceData);

        } catch (error) {
            console.error('خطأ في حفظ الوصل:', error);
            this.app.showToast('خطأ في حفظ الوصل', 'error');
        }
    }

    showInvoicePreview(invoiceData) {
        const customer = this.app.customers.find(c => c.id === invoiceData.customerId);
        if (!customer) return;

        const modal = document.getElementById('print-modal');
        const preview = document.getElementById('invoice-preview');
        
        preview.innerHTML = this.generateInvoiceHTML(invoiceData, customer);
        modal.classList.add('active');
    }

    generateInvoiceHTML(invoice, customer) {
        const periodText = this.app.formatPeriod(invoice.period);
        
        return `
            <div class="invoice-header">
                <h2>${this.app.settings.name}</h2>
                <p>${this.app.settings.address}</p>
                <p>📞 ${this.app.settings.phone}</p>
            </div>
            
            <div class="invoice-details">
                <table>
                    <tr><th>المشترك:</th><td>${customer.name}</td></tr>
                    <tr><th>الهاتف:</th><td>${customer.phone || '-'}</td></tr>
                    <tr><th>العنوان:</th><td>${customer.address || '-'}</td></tr>
                    <tr><th>الشهر:</th><td>${periodText}</td></tr>
                    <tr><th>العداد السابق:</th><td>${invoice.meterPrev}</td></tr>
                    <tr><th>العداد الحالي:</th><td>${invoice.meterCurr}</td></tr>
                    <tr><th>الاستهلاك:</th><td>${invoice.consumptionKwh.toFixed(2)} كيلو واط</td></tr>
                </table>
            </div>
            
            <div class="invoice-totals">
                <table>
                    <tr><td>سعر الكيلو واط:</td><td>${this.getPriceDisplay(invoice)}</td></tr>
                    <tr><td>كلفة الطاقة:</td><td>${this.getEnergyCostDisplay(invoice)}</td></tr>
                    <tr><td>الاشتراك الشهري:</td><td>${this.getFixedFeeDisplay(invoice)}</td></tr>
                    ${invoice.extras.map(extra => `
                        <tr><td>${extra.label}:</td><td>${this.getExtraDisplay(extra, invoice.pricingMode)}</td></tr>
                    `).join('')}
                    <tr class="total-row">
                        <td>المجموع النهائي:</td>
                        <td>${this.app.formatCurrency(invoice.totalUsd, 'USD')} / ${this.app.formatCurrency(invoice.totalLbp, 'LBP')}</td>
                    </tr>
                </table>
            </div>
            
            ${invoice.note ? `<div class="invoice-note"><strong>ملاحظة:</strong> ${invoice.note}</div>` : ''}
            
            <div class="invoice-footer">
                <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-LB')}</p>
                <p>شكراً لاستخدام خدماتنا</p>
            </div>
        `;
    }

    getPriceDisplay(invoice) {
        if (invoice.pricingMode === 'USD') {
            return `$${invoice.pricePerKwhUsd.toFixed(2)}`;
        } else if (invoice.pricingMode === 'LBP') {
            return `${this.app.formatNumber(invoice.pricePerKwhLbp)} ل.ل`;
        } else {
            return `$${invoice.pricePerKwhUsd.toFixed(2)} / ${this.app.formatNumber(invoice.pricePerKwhLbp)} ل.ل`;
        }
    }

    getEnergyCostDisplay(invoice) {
        if (invoice.pricingMode === 'USD') {
            return `$${(invoice.consumptionKwh * invoice.pricePerKwhUsd).toFixed(2)}`;
        } else if (invoice.pricingMode === 'LBP') {
            return `${this.app.formatNumber(invoice.consumptionKwh * invoice.pricePerKwhLbp)} ل.ل`;
        } else {
            const usdCost = invoice.consumptionKwh * invoice.pricePerKwhUsd;
            const lbpCost = invoice.consumptionKwh * invoice.pricePerKwhLbp;
            return `$${usdCost.toFixed(2)} / ${this.app.formatNumber(lbpCost)} ل.ل`;
        }
    }

    getFixedFeeDisplay(invoice) {
        if (invoice.pricingMode === 'USD') {
            return `$${invoice.fixedFeeValue.toFixed(2)}`;
        } else if (invoice.pricingMode === 'LBP') {
            return `${this.app.formatNumber(invoice.fixedFeeValue)} ل.ل`;
        } else {
            return `$${invoice.fixedFeeValue.toFixed(2)} / ${this.app.formatNumber(invoice.fixedFeeValue)} ل.ل`;
        }
    }

    getExtraDisplay(extra, pricingMode) {
        if (pricingMode === 'USD') {
            return `$${extra.value.toFixed(2)}`;
        } else if (pricingMode === 'LBP') {
            return `${this.app.formatNumber(extra.value)} ل.ل`;
        } else {
            return `$${extra.value.toFixed(2)} / ${this.app.formatNumber(extra.value)} ل.ل`;
        }
    }

    printInvoice() {
        window.print();
    }

    renderInvoices() {
        const container = document.getElementById('invoices-list');
        if (this.app.invoices.length === 0) {
            container.innerHTML = '<div class="list-item"><p>لا يوجد وصولات</p></div>';
            return;
        }

        container.innerHTML = this.app.invoices.map(invoice => {
            const customer = this.app.customers.find(c => c.id === invoice.customerId);
            const customerName = customer ? customer.name : 'مشترك محذوف';
            
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customerName}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)}</p>
                        <p>⚡ ${invoice.consumptionKwh.toFixed(2)} كيلو واط</p>
                        <p>💰 ${this.app.formatCurrency(invoice.totalUsd, 'USD')} / ${this.app.formatCurrency(invoice.totalLbp, 'LBP')}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">معاينة</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.editInvoice('${invoice.id}')">تعديل</button>
                        <button class="btn btn-danger" onclick="app.invoiceManager.deleteInvoice('${invoice.id}')">حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    editInvoice(invoiceId) {
        const invoice = this.app.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            this.showInvoiceModal(invoice);
        }
    }

    async deleteInvoice(invoiceId) {
        if (!confirm('هل أنت متأكد من حذف هذا الوصل؟')) return;

        try {
            await firebase.deleteDoc(
                firebase.doc(firebase.db, `tenants/${this.app.currentTenant.id}/invoices`, invoiceId)
            );
            this.app.showToast('تم حذف الوصل بنجاح', 'success');
            await this.app.loadInvoices();
        } catch (error) {
            console.error('خطأ في حذف الوصل:', error);
            this.app.showToast('خطأ في حذف الوصل', 'error');
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
            const customerName = customer ? customer.name : 'مشترك محذوف';
            
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${customerName}</h4>
                        <p>📅 ${this.app.formatPeriod(invoice.period)}</p>
                        <p>⚡ ${invoice.consumptionKwh.toFixed(2)} كيلو واط</p>
                        <p>💰 ${this.app.formatCurrency(invoice.totalUsd, 'USD')} / ${this.app.formatCurrency(invoice.totalLbp, 'LBP')}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-secondary" onclick="app.invoiceManager.showInvoicePreview(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">معاينة</button>
                        <button class="btn btn-primary" onclick="app.invoiceManager.editInvoice('${invoice.id}')">تعديل</button>
                        <button class="btn btn-danger" onclick="app.invoiceManager.deleteInvoice('${invoice.id}')">حذف</button>
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
