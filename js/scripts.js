// KavaCraft interactive cart & GA4 e-commerce funnel tracking

const cart = [];

function trackEvent(eventName, params) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (countEl) countEl.textContent = totalCount;
    if (totalEl) totalEl.textContent = totalPrice + ' грн';
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (!itemsEl) return;
    if (cart.length === 0) {
        itemsEl.innerHTML = '<p class="text-muted mb-0">Кошик порожній. Оберіть каву з каталогу!</p>';
        return;
    }

    itemsEl.innerHTML = cart.map((item, idx) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <strong>${item.name}</strong>
                <div class="small text-muted">${item.price} грн × ${item.qty}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="fw-bold">${item.price * item.qty} грн</span>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${idx})">&times;</button>
            </div>
        </div>
    `).join('');
}

window.addToCart = function (name, price, id) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    updateCartUI();

    trackEvent('add_to_cart', {
        currency: 'UAH',
        value: price,
        items: [{ item_id: id, item_name: name, price: price, quantity: 1 }]
    });

    const toastEl = document.getElementById('cartToast');
    const toastBody = document.getElementById('cartToastBody');
    if (toastEl && toastBody && window.bootstrap) {
        toastBody.textContent = `«${name}» додано до кошика!`;
        bootstrap.Toast.getOrCreateInstance(toastEl).show();
    }
};

window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartUI();
};

document.addEventListener('DOMContentLoaded', () => {
    // Track view_item when user clicks "Детальніше" or product card
    document.querySelectorAll('.js-view-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const price = Number(btn.dataset.price);
            const id = btn.dataset.id;
            trackEvent('view_item', {
                currency: 'UAH',
                value: price,
                items: [{ item_id: id, item_name: name, price: price }]
            });
        });
    });

    const cartModalEl = document.getElementById('cartModal');
    if (cartModalEl) {
        cartModalEl.addEventListener('show.bs.modal', () => {
            if (cart.length > 0) {
                const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
                trackEvent('begin_checkout', { currency: 'UAH', value: total });
            }
        });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            trackEvent('purchase', {
                transaction_id: 'KC-' + Date.now(),
                currency: 'UAH',
                value: total
            });
            cart.length = 0;
            updateCartUI();
            document.getElementById('order-success').classList.remove('d-none');
            setTimeout(() => {
                document.getElementById('order-success').classList.add('d-none');
            }, 4000);
        });
    }
});
