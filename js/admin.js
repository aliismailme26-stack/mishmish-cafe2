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

let allProducts = [];
let posCart = [];
let posActiveCat = '';
let isDrawerUnlocked = false;

function switchView(view) {
    ['pos', 'orders', 'drawer', 'menu'].forEach(v => document.getElementById('view-' + v).classList.add('d-none'));
    document.getElementById('view-' + view).classList.remove('d-none');
}

// Handle Category Select
function updateCategoryDropdowns() {
    const categories = [...new Set(allProducts.map(i => i.cat))];
    const addSelect = document.getElementById('add-prod-cat-select');
    let optionsHtml = '';
    categories.forEach(cat => optionsHtml += `<option value="${cat}">${cat}</option>`);
    optionsHtml += `<option value="__NEW_CAT__">+ قسم جديد</option>`;
    if (addSelect) addSelect.innerHTML = optionsHtml;
}

function toggleNewCatInput(selectEl, customDivId) {
    document.getElementById(customDivId).classList.toggle('d-none', selectEl.value !== '__NEW_CAT__');
}

function handleImageUpload(input, previewId, hiddenInputId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).src = e.target.result;
            document.getElementById(previewId).classList.remove('d-none');
            document.getElementById(hiddenInputId).value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function verifyDrawerPassword() {
    const input = document.getElementById('drawer-password-input').value;
    if (input === "12345678") {
        isDrawerUnlocked = true;
        document.getElementById('drawer-auth-box').classList.add('d-none');
        document.getElementById('drawer-content').classList.remove('d-none');
    } else {
        document.getElementById('drawer-pass-error').classList.remove('d-none');
    }
}

// Sync Menu Items
db.ref('menu_items').on('value', snapshot => {
    const data = snapshot.val() || {};
    allProducts = Object.keys(data).map(id => ({ id, ...data[id] }));
    updateCategoryDropdowns();
    renderPosCategories();
    renderPosProducts();
    renderAdminProductsList(data);
});

function renderPosCategories() {
    const categories = [...new Set(allProducts.map(i => i.cat))];
    if (categories.length > 0 && (!posActiveCat || !categories.includes(posActiveCat))) posActiveCat = categories[0];
    const tabs = document.getElementById('pos-cats');
    tabs.innerHTML = '';
    categories.forEach(cat => {
        tabs.innerHTML += `<li class="nav-item"><button class="nav-link btn-sm fw-bold ${cat === posActiveCat ? 'active bg-warning text-white' : 'bg-light text-dark'}" onclick="selectPosCat('${cat}')">${cat}</button></li>`;
    });
}

function selectPosCat(cat) {
    posActiveCat = cat;
    renderPosCategories();
    renderPosProducts();
}

function renderPosProducts() {
    const container = document.getElementById('pos-grid');
    container.innerHTML = '';
    const filtered = allProducts.filter(i => i.cat === posActiveCat);
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="col-6 col-md-3">
                <div class="card pos-card" onclick="addToPosCart('${p.name}', ${p.price})">
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

function filterPosProducts() {
    const query = document.getElementById('pos-search').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    const container = document.getElementById('pos-grid');
    container.innerHTML = '';
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="col-6 col-md-3">
                <div class="card pos-card" onclick="addToPosCart('${p.name}', ${p.price})">
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

function addToPosCart(name, price) {
    const existing = posCart.find(c => c.name === name);
    if (existing) existing.qty++;
    else posCart.push({ name, price, qty: 1 });
    updatePosCartUI();
}

function updatePosCartUI() {
    const cartCol = document.getElementById('pos-cart-col');
    const productsCol = document.getElementById('pos-products-col');
    const container = document.getElementById('pos-cart-items');
    container.innerHTML = '';
    let total = 0;

    if (posCart.length === 0) {
        cartCol.classList.add('d-none');
        productsCol.className = 'col-md-12';
        document.getElementById('pos-total').innerText = '0 ج.م';
        return;
    }

    cartCol.classList.remove('d-none');
    productsCol.className = 'col-md-8';

    posCart.forEach((item, index) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="d-flex justify-content-between align-items-center bg-light p-2 rounded">
                <div><strong class="small d-block">${item.name}</strong><small class="text-muted">${item.price} ج.م × ${item.qty}</small></div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="changePosQty(${index}, -1)">-</button>
                    <span class="fw-bold">${item.qty}</span>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="changePosQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });
    document.getElementById('pos-total').innerText = total + ' ج.م';
}

function clearPosCart() {
    posCart = [];
    updatePosCartUI();
}

function changePosQty(index, delta) {
    posCart[index].qty += delta;
    if (posCart[index].qty <= 0) posCart.splice(index, 1);
    updatePosCartUI();
}

function sendPosOrder() {
    if (posCart.length === 0) return alert('سلة الطلب فارغة!');
    const tableVal = document.getElementById('pos-table').value.trim() || 'طاولة 1';
    db.ref('orders').push({
        table: tableVal,
        items: posCart,
        total: posCart.reduce((a, b) => a + (b.price * b.qty), 0),
        status: 'قيد التحضير',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }).then(() => {
        alert("تم إرسال الطلب بنجاح!");
        posCart = [];
        updatePosCartUI();
    });
}

// Live Sales & Sequential Numbering (#1, #2, #3...)
db.ref('sales').on('value', snapshot => {
    const tbody = document.getElementById('sales-tbody');
    tbody.innerHTML = '';
    const sales = snapshot.val() || {};
    let totalSales = 0;
    Object.keys(sales).forEach((id, index) => {
        const s = sales[id];
        totalSales += s.total;
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-primary">#${index + 1}</td>
                <td><span class="badge bg-dark">${s.table}</span></td>
                <td class="small">${s.items.map(i => `${i.name} (${i.qty})`).join('، ')}</td>
                <td class="fw-bold text-success">${s.total} ج.م</td>
                <td>${s.time}</td>
            </tr>
        `;
    });
    document.getElementById('stat-sales').innerText = totalSales + ' ج.م';
});

function clearSales() {
    if (confirm("هل أنت تأكد من مسح جميع المبيعات وتصفير الحسابات؟")) db.ref('sales').remove();
}

function addNewProduct() {
    const name = document.getElementById('add-prod-name').value.trim();
    const selectCat = document.getElementById('add-prod-cat-select').value;
    const customCat = document.getElementById('add-prod-cat-custom').value.trim();
    const price = parseFloat(document.getElementById('add-prod-price').value);
    const img = document.getElementById('add-prod-img-data').value || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400';
    const cat = (selectCat === '__NEW_CAT__') ? customCat : selectCat;

    if (!name || !cat || isNaN(price)) return alert("يرجى ملء كافة البيانات المطلوبة");

    db.ref('menu_items').push({ name, cat, price, img }).then(() => {
        alert("تم إضافة المنتج بنجاح!");
        document.getElementById('add-prod-name').value = '';
        document.getElementById('add-prod-price').value = '';
    });
}

function renderAdminProductsList(data) {
    const container = document.getElementById('admin-products-list');
    container.innerHTML = '';
    if (!data) return;
    Object.keys(data).forEach(id => {
        const p = data[id];
        container.innerHTML += `
            <div class="d-flex justify-content-between align-items-center border p-2 rounded bg-white shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <img src="${p.img}" style="width:40px; height:40px; object-fit:cover; border-radius:8px;">
                    <div><strong class="d-block text-dark">${p.name}</strong><small class="text-muted">${p.cat} - ${p.price} ج.م</small></div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="db.ref('menu_items/${id}').remove()"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}