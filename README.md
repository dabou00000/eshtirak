# نظام إدارة اشتراكات الكهرباء

نظام ويب خفيف لإدارة مشتركي اشتراك كهرباء في لبنان، مع إصدار وصولات شهرية وحساب الاستهلاك والعملة (USD/LBP)، وأرشفة وتقارير ونفقات.

## الميزات

- ✅ إدارة المشتركين (إضافة/تعديل/حذف)
- ✅ إنشاء وصلات شهرية مع حسابات تلقائية
- ✅ دعم العملات المزدوجة (USD/LBP) مع سعر صرف قابل للتعديل
- ✅ إدارة النفقات (ثمن مازوت ونفقات أخرى)
- ✅ تقارير شهرية شاملة مع إمكانية التصدير
- ✅ نظام طباعة متقدم (A5/80mm حراري)
- ✅ واجهة RTL محسنة للهواتف المحمولة
- ✅ عمل بدون إنترنت (Firebase Offline)
- ✅ أمان متقدم مع Firebase Authentication

## التقنيات المستخدمة

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Authentication + Cloud Firestore)
- **الخطوط**: Noto Kufi Arabic
- **التصميم**: Mobile-first, RTL

## متطلبات التشغيل

- متصفح حديث يدعم ES6 Modules
- اتصال بالإنترنت (للمصادقة والمزامنة)
- حساب Firebase

## خطوات التثبيت

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. فعّل Authentication (Email/Password)
4. فعّل Cloud Firestore
5. فعّل Hosting (اختياري)

### 2. إعداد Firebase

1. انسخ إعدادات المشروع من Firebase Console
2. افتح ملف `firebase.js`
3. استبدل القيم في `firebaseConfig` بقيم مشروعك:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 3. تطبيق قواعد الأمان

1. اذهب إلى Firestore Database في Firebase Console
2. انقر على "Rules"
3. انسخ محتوى ملف `firestore.rules` والصقه
4. انقر "Publish"

### 4. رفع الملفات

#### الطريقة الأولى: Firebase Hosting (موصى بها)

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# تهيئة المشروع
firebase init hosting

# رفع الملفات
firebase deploy
```

#### الطريقة الثانية: خادم محلي

```bash
# استخدام Python
python -m http.server 8000

# أو استخدام Node.js
npx http-server

# أو استخدام PHP
php -S localhost:8000
```

### 5. إنشاء حساب المستخدم

1. افتح التطبيق في المتصفح
2. استخدم أي بريد إلكتروني وكلمة مرور لإنشاء الحساب الأول
3. سيتم إنشاء اشتراك افتراضي تلقائياً

## هيكل قاعدة البيانات

```
/tenants/{tenantId}
  ├── ownerUid: string
  ├── name: string
  ├── address: string
  ├── phone: string
  ├── defaultCurrencyMode: "USD" | "LBP" | "DUAL"
  ├── exchangeRate: number
  ├── lbpRounding: 100 | 1000
  ├── printTemplate: "A5" | "THERMAL_80"
  └── timestamps

/tenants/{tenantId}/customers/{customerId}
  ├── name: string
  ├── phone?: string
  ├── address?: string
  ├── meterRef?: string
  └── timestamps

/tenants/{tenantId}/invoices/{invoiceId}
  ├── customerId: string
  ├── period: "YYYY-MM"
  ├── meterPrev: number
  ├── meterCurr: number
  ├── consumptionKwh: number
  ├── pricingMode: "USD" | "LBP" | "DUAL"
  ├── pricePerKwhUsd?: number
  ├── pricePerKwhLbp?: number
  ├── fixedFeeValue: number
  ├── extras: array
  ├── exchangeRateUsed: number
  ├── totalUsd: number
  ├── totalLbp: number
  ├── note?: string
  └── timestamps

/tenants/{tenantId}/expenses/{expenseId}
  ├── period: "YYYY-MM"
  ├── type: "DIESEL" | "OTHER"
  ├── label?: string
  ├── amountValue: number
  ├── amountCurrency: "USD" | "LBP"
  └── timestamps
```

## دليل الاستخدام

### إعداد النظام

1. **الإعدادات**: اذهب إلى تبويب "الإعدادات" وأدخل:
   - اسم الاشتراك
   - العنوان ورقم الهاتف
   - العملة الافتراضية
   - سعر الصرف الحالي
   - إعدادات التقريب والطباعة

### إدارة المشتركين

1. **إضافة مشترك**: انقر "إضافة مشترك" وأدخل البيانات
2. **تعديل مشترك**: انقر "تعديل" في قائمة المشتركين
3. **حذف مشترك**: انقر "حذف" (تأكد من عدم وجود وصولات مرتبطة)

### إنشاء الوصولات

1. **إضافة وصل**: انقر "إضافة وصل جديد"
2. **اختيار المشترك والشهر**
3. **إدخال قراءات العداد** (سيتم حساب الاستهلاك تلقائياً)
4. **اختيار وضع التسعير**:
   - USD: سعر بالدولار فقط
   - LBP: سعر بالليرة فقط
   - DUAL: أسعار بالعملتين
5. **إدخال المقطوعية والدفعات الإضافية**
6. **حساب** ثم **حفظ وإصدار**
7. **طباعة** الوصل

### إدارة النفقات

1. **إضافة نفقة**: انقر "إضافة نفقة"
2. **اختيار النوع**: ثمن مازوت أو أخرى
3. **إدخال المبلغ والعملة**
4. **حفظ**

### التقارير

1. **اختيار الشهر** من القائمة المنسدلة
2. **عرض التقرير** لرؤية:
   - إجمالي الوصولات والنفقات
   - الصافي (الربح/الخسارة)
   - تفاصيل كل وصل ونفقة
3. **تصدير CSV** للاحتفاظ بنسخة

## نصائح للاستخدام

- **النسخ الاحتياطي**: Firebase يحفظ البيانات تلقائياً في السحابة
- **العمل بدون إنترنت**: يمكن قراءة البيانات المحفوظة محلياً
- **الطباعة**: استخدم قالب A5 للطباعة العادية أو 80mm للطابعات الحرارية
- **سعر الصرف**: حدث سعر الصرف بانتظام في الإعدادات
- **التقريب**: اختر تقريب مناسب لليرة (100 أو 1000)

## استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في تسجيل الدخول**:
   - تأكد من تفعيل Email/Password في Firebase Authentication
   - تحقق من صحة البريد الإلكتروني وكلمة المرور

2. **خطأ في حفظ البيانات**:
   - تأكد من تطبيق قواعد Firestore Security
   - تحقق من اتصال الإنترنت

3. **مشاكل في الطباعة**:
   - تأكد من إعدادات الطابعة
   - جرب قالب طباعة مختلف (A5/80mm)

4. **البيانات لا تظهر**:
   - تحقق من قواعد الأمان
   - تأكد من تسجيل الدخول

### دعم فني

للحصول على المساعدة:
1. تحقق من وحدة تحكم المتصفح للأخطاء
2. راجع إعدادات Firebase
3. تأكد من تطبيق جميع الخطوات بشكل صحيح

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.

## التحديثات المستقبلية

- [ ] دعم عدة اشتراكات لنفس المستخدم
- [ ] إشعارات تذكيرية
- [ ] رسوم بيانية للتقارير
- [ ] دعم العملات الإضافية
- [ ] تطبيق جوال منفصل
