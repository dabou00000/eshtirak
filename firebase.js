// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCBHvfablQPFIC7I-FWi8dnybSp7hBlU5s",
    authDomain: "eshtirak-bc4ba.firebaseapp.com",
    projectId: "eshtirak-bc4ba",
    storageBucket: "eshtirak-bc4ba.firebasestorage.app",
    messagingSenderId: "633243793047",
    appId: "1:633243793047:web:329b6b3ac0af8e7a975bd2"
};

// استيراد Firebase SDK v9
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    serverTimestamp,
    enableIndexedDbPersistence 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// تفعيل العمل بدون إنترنت (اختياري)
try {
    await enableIndexedDbPersistence(db);
    console.log('تم تفعيل العمل بدون إنترنت');
} catch (err) {
    if (err.code === 'failed-precondition') {
        console.log('العمل بدون إنترنت غير متاح - قد يكون هناك تبويب آخر مفتوح');
    } else if (err.code === 'unimplemented') {
        console.log('المتصفح لا يدعم العمل بدون إنترنت');
    }
}

// تصدير المتغيرات للاستخدام في الملفات الأخرى
window.firebase = {
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp
};
