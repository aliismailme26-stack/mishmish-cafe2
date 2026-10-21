const firebaseConfig = {
    apiKey: "AIzaSyArLZM_hv0uXWzA2YuLaKXWgHfYIN_Loks",
    authDomain: "mishmish-cafe.firebaseapp.com",
    databaseURL: "https://mishmish-cafe-default-rtdb.firebaseio.com",
    projectId: "mishmish-cafe",
    storageBucket: "mishmish-cafe.firebasestorage.app",
    messagingSenderId: "643341117574",
    appId: "1:643341117574:web:eff00a32210732682fc907"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let tableNum = new URLSearchParams(window.location.search).get('table') || 1;
document.getElementById('table-badge').innerText = 'طاولة: ' + tableNum;

let allProducts = [];
let activeCat = '';

db.ref('menu_items').on('value', snapshot => {
    const data = snapshot.val() || {};
    allProducts = Object.keys(data).map(id => ({ id, ...data[id] }));
    renderCategories();
    renderProducts();
});

function renderCategories() {
    const categories = [...new Set(allProducts.map(i => i.cat))];
    if (categories.length > 0 && (!activeCat || !categories.includes(activeCat))) activeCat = categories[0];
    const tabs = document.getElementById('cat-tabs');
    tabs.innerHTML = '';
    categories.forEach(cat => {
        tabs.innerHTML += `<li class="nav-item"><button class="nav-link ${cat === activeCat ? 'active bg-warning text-white' : 'bg-light text-dark'}" onclick="selectCat('${cat}')">${cat}</button></li>`;
    });
}

function selectCat(cat) {
    activeCat = cat;
    renderCategories();
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    const filtered = allProducts.filter(i => i.cat === activeCat);
    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="col-6 col-md-3">
                <div class="card pos-card">
                    <img src="${p.img}" class="card-img-top">
                    <div class="card-body p-2 text-center">
                        <h6 class="fw-bold mb-1 small">${p.name}</h6>
                        <span class="badge bg-warning text-dark fw-bold">${p.price} ج.م</span>
                    </div>
                </div>
            </div>
        `;
    });
}