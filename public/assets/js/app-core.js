async function initLookPriceMe() {
    // 1. Config'i Backend'den çek
    const res = await fetch('/api/config');
    const config = await res.json();
    
    // 2. Firebase'i başlat
    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    // 3. Auth durumunu izle ve Dashboard/Login yönlendirmesini OTOMATİK yap
    firebase.auth().onAuthStateChanged(user => {
        const path = window.location.pathname;
        if (!user && path.includes('dashboard')) window.location.href = '/login';
        if (user && path.includes('login')) window.location.href = '/dashboard';
    });
}
initLookPriceMe();
