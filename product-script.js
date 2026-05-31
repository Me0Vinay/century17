// ===== PRODUCT DETAIL PAGE SCRIPT =====
// Shared helpers (config, convertDriveLink, parseCSV, processProducts,
// showCartAnimation, shuffle, cache constants) live in common.js,
// which is loaded before this file.
let allProducts = [];
let currentProduct = null;
let suggestedProducts = [];
let cart = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadAndDisplayProduct();
    initializeEventListeners();
});

// ===== LOAD AND DISPLAY SINGLE PRODUCT =====
// Live: pulls from the Google Sheet (gviz) with a products.json fallback.
async function loadAndDisplayProduct() {
    const container = document.getElementById('productDetailContainer');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        container.innerHTML =
            '<div class="loading">No product selected. <a href="index.html">Back to all toys</a></div>';
        return;
    }

    const showProductOrNotFound = () => {
        currentProduct = allProducts.find(p => p.id === productId);
        if (!currentProduct) {
            container.innerHTML =
                `<div class="loading">Product "${productId}" not found. <a href="index.html">Back to all toys</a></div>`;
            return false;
        }
        renderProductDetail();
        loadSuggestedProducts();
        return true;
    };

    try {
        allProducts = processProducts(parseCSV(await getSheetCSV()));
        showProductOrNotFound();
    } catch (error) {
        console.error('Live sheet unavailable, using bundled products.json:', error);
        try {
            const fallback = await fetch('products.json', { cache: 'no-cache' });
            allProducts = processProducts(await fallback.json());
            showProductOrNotFound();
        } catch (e) {
            container.innerHTML =
                '<div class="loading">Error loading product details. Please try again later.</div>';
        }
    }
}

// ===== RENDER PRODUCT DETAIL =====
function renderProductDetail() {
    const container = document.getElementById('productDetailContainer');
    
    // Check if product is in cart
    const cartItem = cart.find(item => item.productId === currentProduct.id);
    const inCart = !!cartItem;
    const cartQuantity = cartItem ? cartItem.quantity : 0;

    const detailHTML = `
        <div class="product-detail-wrapper">
            <!-- Images Gallery Section -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <img id="mainImage" src="${currentProduct.imageFront}" 
                         alt="${currentProduct.name}" 
                         onerror="this.src='https://via.placeholder.com/600x600/f5f3ff/8b5cf6?text=${encodeURIComponent(currentProduct.name)}'">
                </div>
                
                <!-- Thumbnail Images -->
                <div class="thumbnail-grid">
                    <div class="thumbnail-wrapper">
                        <img class="thumbnail" src="${currentProduct.imageFront}" 
                             alt="Front View" 
                             onclick="switchImage('${currentProduct.imageFront}')"
                             title="Front View"
                             onerror="this.src='https://via.placeholder.com/100x100/f5f3ff/8b5cf6?text=Front'">
                        <span class="thumbnail-label">Front</span>
                    </div>
                    <div class="thumbnail-wrapper">
                        <img class="thumbnail" src="${currentProduct.imageTop}" 
                             alt="Top View" 
                             onclick="switchImage('${currentProduct.imageTop}')"
                             title="Top View"
                             onerror="this.src='https://via.placeholder.com/100x100/f5f3ff/8b5cf6?text=Top'">
                        <span class="thumbnail-label">Top</span>
                    </div>
                    <div class="thumbnail-wrapper">
                        <img class="thumbnail" src="${currentProduct.imageSide}" 
                             alt="Side View" 
                             onclick="switchImage('${currentProduct.imageSide}')"
                             title="Side View"
                             onerror="this.src='https://via.placeholder.com/100x100/f5f3ff/8b5cf6?text=Side'">
                        <span class="thumbnail-label">Side</span>
                    </div>
                    <div class="thumbnail-wrapper">
                        <img class="thumbnail" src="${currentProduct.imageProjection}" 
                             alt="360 Projection" 
                             onclick="switchImage('${currentProduct.imageProjection}')"
                             title="360 Projection"
                             onerror="this.src='https://via.placeholder.com/100x100/f5f3ff/8b5cf6?text=360'">
                        <span class="thumbnail-label">360°</span>
                    </div>
                </div>
            </div>

            <!-- Product Information Section -->
            <div class="product-info-detail">
                <h1 class="product-title">${currentProduct.name}</h1>
                
                <div class="product-category-badge">
                    <span class="badge">${currentProduct.category}</span>
                </div>

                <div class="product-specs">
                    <div class="spec-item">
                        <span class="spec-label">Size:</span>
                        <span class="spec-value">${currentProduct.size}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Color:</span>
                        <span class="spec-value">${currentProduct.color}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Material:</span>
                        <span class="spec-value">${currentProduct.fabric}</span>
                    </div>
                </div>

                <div class="price-section">
                    <span class="price">₹${currentProduct.price.toFixed(2)}</span>
                    ${currentProduct.incrementBy > 1 ? `<div class="moq-info">MOQ: ${currentProduct.incrementBy}</div>` : ''}
                </div>

                <div class="product-actions">
                    ${inCart ? `
                        <div class="cart-controls">
                            <button class="qty-btn-detail" onclick="updateProductQuantityDetail('${currentProduct.id}', -1)">−</button>
                            <span class="qty-display-detail">${cartQuantity}</span>
                            <button class="qty-btn-detail" onclick="updateProductQuantityDetail('${currentProduct.id}', 1)">+</button>
                            <button class="remove-from-cart-btn" onclick="removeFromCartById('${currentProduct.id}')">Remove</button>
                        </div>
                    ` : `
                        <button class="add-to-cart-btn btn-large" onclick="addToCart('${currentProduct.id}')">
                            Add to Cart
                        </button>
                    `}
                </div>

                <!-- Description Section -->
                <div class="product-description-section">
                    <h3>Product Description</h3>
                    <p class="product-description">
                        Premium quality ${currentProduct.baseName} with ${currentProduct.fabric} material. 
                        Perfect for kids and collectors. Available in ${currentProduct.color} color. 
                        Size: ${currentProduct.size}. This delightful toy is soft, cuddly, and safe for children.
                    </p>
                </div>
            </div>
        </div>

        <!-- Video Section -->
        ${currentProduct.youtubeVideo ? `
            <div class="video-section">
                <h2>Product Video</h2>
                <div class="video-container">
                    <iframe id="productVideo"
                            width="100%" 
                            height="500" 
                            src="${currentProduct.youtubeVideo}" 
                            title="Product Video"
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        ` : ''}
    `;

    container.innerHTML = detailHTML;
}

// ===== IMAGE SWITCHING =====
function switchImage(imageSrc) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageSrc;
    
    // Add animation
    mainImage.style.opacity = '0.7';
    setTimeout(() => {
        mainImage.style.opacity = '1';
    }, 200);
}

// ===== LOAD SUGGESTED PRODUCTS =====
function loadSuggestedProducts() {
    if (!currentProduct || !allProducts) return;

    // Get products from the same category (excluding current product)
    const sameCategory = allProducts.filter(p => 
        p.category === currentProduct.category && 
        p.id !== currentProduct.id
    );

    // Get random products from different categories
    const otherProducts = allProducts.filter(p => 
        p.category !== currentProduct.category
    );

    // Shuffle and combine
    suggestedProducts = [
        ...shuffle(sameCategory).slice(0, 3),
        ...shuffle(otherProducts).slice(0, 3)
    ].slice(0, 6);

    renderSuggestedProducts();
}

// ===== RENDER SUGGESTED PRODUCTS =====
function renderSuggestedProducts() {
    const grid = document.getElementById('suggestedProductsGrid');

    if (suggestedProducts.length === 0) {
        grid.innerHTML = '<div class="loading">No similar products found.</div>';
        return;
    }

    grid.innerHTML = suggestedProducts.map(product => {
        const cartItem = cart.find(item => item.productId === product.id);
        const inCart = !!cartItem;
        const cartQuantity = cartItem ? cartItem.quantity : 0;

        return `
            <div class="product-card suggestion-card" onclick="navigateToProduct('${product.id}')" style="cursor:pointer;">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/400x400/f5f3ff/8b5cf6?text=${encodeURIComponent(product.name)}'">
                    ${product.incrementBy > 1 ? `<div class="moq-badge">MOQ: ${product.incrementBy}</div>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-meta">
                        <span class="product-tag">${product.category}</span>
                    </div>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                    ${inCart ? `
                        <div class="product-qty-controls" onclick="event.stopPropagation()">
                            <button class="qty-btn-product" onclick="event.stopPropagation(); updateProductQuantity('${product.id}', -1)">−</button>
                            <span class="qty-display-product">${cartQuantity}</span>
                            <button class="qty-btn-product" onclick="event.stopPropagation(); updateProductQuantity('${product.id}', 1)">+</button>
                        </div>
                    ` : `
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            Add to Cart
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// ===== NAVIGATE TO PRODUCT =====
function navigateToProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// ===== CART FUNCTIONS (Shared with main script) =====
function loadCart() {
    const saved = localStorage.getItem('century17_cart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('century17_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += incrementBy;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            size: product.size,
            color: product.color,
            fabric: product.fabric,
            quantity: incrementBy,
            incrementBy: incrementBy
        });
    }

    saveCart();
    renderProductDetail();
    renderSuggestedProducts(); // update suggestion cards (btn → qty controls)
    showCartAnimation();
}

function updateProductQuantity(productId, delta) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const cartItemIndex = cart.findIndex(item => item.productId === productId);

    if (cartItemIndex >= 0) {
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[cartItemIndex].quantity += change;

        if (cart[cartItemIndex].quantity <= 0) {
            cart.splice(cartItemIndex, 1);
        }
        saveCart();
        renderSuggestedProducts();
    }
}

function updateProductQuantityDetail(productId, delta) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const incrementBy = product.incrementBy || 1;
    const cartItemIndex = cart.findIndex(item => item.productId === productId);

    if (cartItemIndex >= 0) {
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[cartItemIndex].quantity += change;

        if (cart[cartItemIndex].quantity <= 0) {
            cart.splice(cartItemIndex, 1);
        }
        saveCart();
        renderProductDetail();
    }
}

// Cart sidebar +/- buttons (used by updateCartUI on this page).
function updateCartQuantity(index, delta) {
    if (cart[index]) {
        const incrementBy = cart[index].incrementBy || 1;
        const change = delta > 0 ? incrementBy : -incrementBy;
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        // Keep the detail view and suggestions in sync with the cart.
        if (currentProduct) renderProductDetail();
        renderSuggestedProducts();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function removeFromCartById(productId) {
    const index = cart.findIndex(item => item.productId === productId);
    if (index >= 0) {
        removeFromCart(index);
    }
}

function updateCartUI() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    count.textContent = totalItems;
    total.textContent = `₹${totalPrice.toFixed(2)}`;

    if (cart.length === 0) {
        items.innerHTML = `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
                <small>Add some toys to get started!</small>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        items.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/80x80/f5f3ff/8b5cf6?text=Toy'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-variant">
                        ${[item.size, item.color, item.fabric].filter(Boolean).join(' • ')}
                    </div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, -1)">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }
}

// ===== CHECKOUT =====
function openCheckout() {
    const modal = document.getElementById('checkoutModal');
    const summaryItems = document.getElementById('orderSummaryItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    checkoutTotal.textContent = `₹${totalPrice.toFixed(2)}`;

    modal.classList.add('active');
    closeCart();
}

async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById('customerName').value;
    const mobile = document.getElementById('customerMobile').value;
    const address = document.getElementById('customerAddress').value;

    const orderDetails = cart.map(item =>
        `${item.name} (${[item.size, item.color].filter(Boolean).join(', ')}) × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productDetails = `${orderDetails}\n\nTotal: ₹${totalPrice.toFixed(2)}`;

    if (CONFIG.enableGoogleSheets) {
        try {
            const formData = new FormData();
            formData.append(CONFIG.formFields.productDetails, productDetails);
            formData.append(CONFIG.formFields.customerName, name);
            formData.append(CONFIG.formFields.customerMobile, mobile);
            formData.append(CONFIG.formFields.deliveryAddress, address);

            await fetch(CONFIG.googleFormURL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            console.log('Order submitted to Google Sheets');
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
        }
    } else {
        console.log('=== ORDER DETAILS ===');
        console.log('Customer:', name);
        console.log('Mobile:', mobile);
        console.log('Address:', address);
        console.log('Products:', productDetails);
    }

    cart = [];
    saveCart();

    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('successModal').classList.add('active');
    document.getElementById('checkoutForm').reset();
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Scroll animation for header
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const header = document.querySelector('.header');
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down
            if (header) header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            if (header) header.style.transform = 'translateY(0)';
        }
        lastScrollY = currentScrollY;
    });

    // Search: go to the home page with the term only when the user presses
    // Enter (the old code redirected on every keystroke, so you could never
    // type a full word from a product page).
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const term = e.target.value.trim();
            if (term) {
                window.location.href = `index.html?search=${encodeURIComponent(term)}`;
            }
        }
    });

    // Cart
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    });

    document.getElementById('closeCart').addEventListener('click', closeCart);

    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

    // Checkout Modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    document.getElementById('checkoutForm').addEventListener('submit', submitOrder);

    // Success Modal
    document.getElementById('closeSuccess').addEventListener('click', () => {
        document.getElementById('successModal').classList.remove('active');
    });

    // Overlay
    document.getElementById('overlay').addEventListener('click', () => {
        closeCart();
        document.getElementById('checkoutModal').classList.remove('active');
    });
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

