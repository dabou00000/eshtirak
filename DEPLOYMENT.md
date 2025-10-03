# دليل النشر والتشغيل

## متطلبات النشر

### 1. حساب Firebase
- حساب Google
- مشروع Firebase جديد
- تفعيل الخدمات المطلوبة

### 2. المتصفحات المدعومة
- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

### 3. المتطلبات التقنية
- اتصال بالإنترنت
- JavaScript مفعل
- دعم ES6 Modules

## خطوات النشر

### المرحلة 1: إعداد Firebase

#### 1.1 إنشاء المشروع
```bash
# اذهب إلى Firebase Console
https://console.firebase.google.com/

# أنشئ مشروع جديد
# اختر اسم المشروع
# فعّل Google Analytics (اختياري)
```

#### 1.2 تفعيل Authentication
```bash
# في Firebase Console
# اذهب إلى Authentication > Sign-in method
# فعّل Email/Password
# احفظ الإعدادات
```

#### 1.3 تفعيل Firestore
```bash
# في Firebase Console
# اذهب إلى Firestore Database
# أنشئ قاعدة بيانات
# اختر "Start in test mode" (سيتم تطبيق القواعد لاحقاً)
# اختر موقع الخادم (يفضل us-central1)
```

#### 1.4 تفعيل Hosting (اختياري)
```bash
# في Firebase Console
# اذهب إلى Hosting
# اتبع التعليمات
# أو استخدم Firebase CLI
```

### المرحلة 2: إعداد المشروع

#### 2.1 الحصول على إعدادات Firebase
```bash
# في Firebase Console
# اذهب إلى Project Settings > General
# انقر "Add app" > Web
# سجل اسم التطبيق
# انسخ إعدادات Firebase
```

#### 2.2 تحديث ملف firebase.js
```javascript
// استبدل القيم في firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyC...", // من Firebase Console
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef..."
};
```

#### 2.3 تطبيق قواعد الأمان
```bash
# في Firebase Console
# اذهب إلى Firestore Database > Rules
# انسخ محتوى firestore.rules
# انقر "Publish"
```

### المرحلة 3: النشر

#### 3.1 النشر على Firebase Hosting
```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# تهيئة المشروع
firebase init hosting

# اختيار المشروع
# اختيار المجلد الحالي (.)
# اختيار index.html كصفحة رئيسية
# عدم إعادة كتابة index.html

# رفع الملفات
firebase deploy
```

#### 3.2 النشر على خادم آخر
```bash
# رفع جميع الملفات إلى الخادم
# التأكد من أن index.html في المجلد الجذر
# التأكد من دعم ES6 Modules
```

### المرحلة 4: الاختبار

#### 4.1 اختبار المصادقة
```bash
# افتح التطبيق في المتصفح
# جرب تسجيل الدخول بحساب جديد
# تحقق من إنشاء tenant تلقائياً
```

#### 4.2 اختبار قاعدة البيانات
```bash
# في Firebase Console
# اذهب إلى Firestore Database
# تحقق من إنشاء المجموعات:
# - tenants
# - tenants/{tenantId}/customers
# - tenants/{tenantId}/invoices
# - tenants/{tenantId}/expenses
```

#### 4.3 اختبار الوظائف
```bash
# إضافة مشترك
# إنشاء وصل
# إضافة نفقة
# إنشاء تقرير
# طباعة وصل
```

## إعدادات الإنتاج

### 1. تحسين الأداء
```javascript
// في firebase.js
// تفعيل Offline Persistence
try {
    await enableIndexedDbPersistence(db);
} catch (err) {
    console.log('Offline persistence not available');
}
```

### 2. إعدادات الأمان
```javascript
// في firestore.rules
// التأكد من تطبيق القواعد
// منع الوصول غير المصرح به
```

### 3. النسخ الاحتياطي
```bash
# في Firebase Console
# اذهب إلى Firestore Database > Backups
# فعّل النسخ الاحتياطي التلقائي
# اختر التكرار (يومي/أسبوعي)
```

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ في المصادقة
```bash
# التحقق من:
# - تفعيل Email/Password في Firebase
# - صحة إعدادات Firebase
# - اتصال الإنترنت
```

#### 2. خطأ في قاعدة البيانات
```bash
# التحقق من:
# - تطبيق قواعد Firestore
# - صحة ownerUid
# - صلاحيات المستخدم
```

#### 3. خطأ في الطباعة
```bash
# التحقق من:
# - إعدادات الطابعة
# - دعم المتصفح للطباعة
# - قالب الطباعة المناسب
```

### رسائل الخطأ الشائعة

#### "Firebase: Error (auth/user-not-found)"
```bash
# الحل: إنشاء حساب جديد أو التحقق من البريد الإلكتروني
```

#### "Firebase: Error (permission-denied)"
```bash
# الحل: التحقق من قواعد Firestore Security
```

#### "Failed to load resource"
```bash
# الحل: التحقق من اتصال الإنترنت وإعدادات Firebase
```

## الصيانة

### 1. مراقبة الاستخدام
```bash
# في Firebase Console
# اذهب إلى Usage
# مراقبة الاستخدام اليومي
# مراقبة التكاليف
```

### 2. تحديث البيانات
```bash
# تحديث سعر الصرف بانتظام
# مراجعة الإعدادات
# تنظيف البيانات القديمة
```

### 3. النسخ الاحتياطي
```bash
# تصدير البيانات بانتظام
# حفظ نسخة من الإعدادات
# توثيق التغييرات
```

## الأمان

### 1. حماية البيانات
```bash
# استخدام HTTPS
# تطبيق قواعد الأمان
# مراقبة الوصول
```

### 2. حماية الحساب
```bash
# كلمة مرور قوية
# تفعيل المصادقة الثنائية
# مراقبة نشاط الحساب
```

### 3. حماية التطبيق
```bash
# تحديث Firebase SDK
# مراجعة قواعد الأمان
# مراقبة الأخطاء
```

## الدعم الفني

### 1. مصادر المساعدة
- Firebase Documentation
- Firebase Console
- Google Cloud Support

### 2. التواصل
- Firebase Community
- Stack Overflow
- GitHub Issues

### 3. التحديثات
- مراقبة إعلانات Firebase
- تحديث SDK بانتظام
- مراجعة التغييرات

## قائمة التحقق النهائية

### قبل النشر
- [ ] إعدادات Firebase صحيحة
- [ ] قواعد الأمان مطبقة
- [ ] جميع الملفات موجودة
- [ ] الاختبارات تمت بنجاح

### بعد النشر
- [ ] التطبيق يعمل
- [ ] المصادقة تعمل
- [ ] قاعدة البيانات تعمل
- [ ] الطباعة تعمل
- [ ] التقارير تعمل

### الصيانة الدورية
- [ ] مراقبة الاستخدام
- [ ] تحديث سعر الصرف
- [ ] النسخ الاحتياطي
- [ ] مراجعة الأمان
