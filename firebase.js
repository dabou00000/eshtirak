// Firebase configuration
// يجب استبدال هذه القيم بقيم مشروع Firebase الخاص بك
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
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
