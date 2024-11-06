document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();

    // Event listener for category filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
});

// Store cart and wishlist items
let cartItems = [];
let wishlist = [];

// Store products for use in various functions
let products = [];

// Load products from JSON and render them
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const products = await response.json();

        renderProducts(products);
        renderCategories(products);
        setupAutocomplete(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Function to render category checkboxes dynamically
function renderCategories(products) {
    const categoryContainer = document.querySelector('.sidebar .filter-checkbox-container');
    const categories = [...new Set(products.map(product => product.category))];

    categoryContainer.innerHTML = '';

    // Generate checkboxes for each unique category
    categories.forEach(category => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('filter-checkbox');
        checkbox.value = category;

        const label = document.createElement('label');
        label.textContent = category;

        categoryContainer.appendChild(checkbox);
        categoryContainer.appendChild(label);
        categoryContainer.appendChild(document.createElement('br'));
    });

    applyCheckboxListeners();
}

// Function to reapply filter listeners to new checkboxes
function applyCheckboxListeners() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}

// function setupAutocomplete(products) {
//     // Extract product titles for autocomplete
//     const productTitles = products.map(item => item.title);

//     // Apply jQuery autocomplete
//     $('.search-bar-container input[type="search"]').autocomplete({
//         source: productTitles,
//         minLength: 2,
//         select: function (event, ui) {
//             const selectedProduct = products.find(item => item.title === ui.item.value);
//             if (selectedProduct) {
//                 renderProducts([selectedProduct]);
//             }
//             $(this).val(ui.item.value);
//             return false;
//         }
//     });

//     // Show all products again when the search box is cleared
//     $('.search-bar-container input[type="search"]').on('input', function () {
//         const searchTerm = $(this).val();
//         if (searchTerm === '') {
//             renderProducts(products);
//         }
//     });
// }

// Jquery auto complete
function setupAutocomplete(products) {
    // Extract product titles and unique categories for autocomplete
    const productTitles = products.map(item => item.title);
    const productCategories = [...new Set(products.map(item => item.category))];
    const autocompleteOptions = [...productTitles, ...productCategories];

    // Apply jQuery autocomplete
    $('.search-bar-container input[type="search"]').autocomplete({
        source: autocompleteOptions,
        minLength: 2,
        select: function (event, ui) {
            const selectedValue = ui.item.value;

            // Check if selected value is a category
            const matchingCategoryProducts = products.filter(item => item.category === selectedValue);

            if (matchingCategoryProducts.length > 0) {
                // Display products in the selected category
                renderProducts(matchingCategoryProducts);
            } else {
                // Otherwise, search by product title
                const selectedProduct = products.find(item => item.title === selectedValue);
                if (selectedProduct) {
                    renderProducts([selectedProduct]);
                }
            }
            $(this).val(ui.item.value);
            return false;
        }
    });

    // Show all products again when the search box is cleared
    $('.search-bar-container input[type="search"]').on('input', function () {
        const searchTerm = $(this).val();
        if (searchTerm === '') {
            renderProducts(products);
        }
    });
}


// Handle click events for product cards
function handleProductClick(event) {
    const target = event.target;
    const card = target.closest('.card');

    // Prevent modal from opening when clicking on specific elements
    if (!card ||
        target.classList.contains('quantity-dropdown') ||
        target.classList.contains('add-to-cart') ||
        target.classList.contains('add-to-wishlist')) {
        return;
    }

    const brand = card.dataset.brand;
    const title = card.querySelector('.card-title').textContent.trim();
    const description = card.querySelector('.card-text').textContent.trim();
    const price = card.querySelector('[data-price]').getAttribute('data-price');
    const image = card.querySelector('img').getAttribute('src');
    const rating = card.dataset.rating;

    const productDetailsContainer = document.getElementById('productDetailsContainer');
    productDetailsContainer.innerHTML = `
        <div class="zoom-container" id="imageZoom" style="--url: url(${image}); --zoom-x: 0%; --zoom-y: 0%; cursor: zoom-in;">
            <img src="${image}" alt="${title}" class="img-fluid mb-3" style="max-height: 300px; object-fit: cover;">
        </div>
        <h4>${brand}</h5>
        <h5>${title}</h5>
        <p>${description}</p>
        <p><strong>Rating:</strong> ${rating} ⭐</p> <!-- Added rating here -->
        <p><strong>Price:</strong> ₹${price}</p>
    `;

    // Show the modal
    const productDetailsModal = new bootstrap.Modal(document.getElementById('productDetailsModal'));
    productDetailsModal.show();

    // Setup zoom effect on hover
    const imageZoom = document.getElementById('imageZoom');
    imageZoom.addEventListener('mousemove', (event) => {
        imageZoom.style.setProperty('--display', 'block');
        const pointer = {
            x: (event.offsetX * 100) / imageZoom.offsetWidth,
            y: (event.offsetY * 100) / imageZoom.offsetHeight
        };
        imageZoom.style.setProperty('--zoom-x', pointer.x + '%');
        imageZoom.style.setProperty('--zoom-y', pointer.y + '%');
    });

    imageZoom.addEventListener('mouseout', () => {
        imageZoom.style.setProperty('--display', 'none');
    });

    // Add event listeners for modal buttons
    document.querySelector('.add-to-cart-modal').addEventListener('click', () => addProductToCartFromModal(title, price, image, card));
    document.querySelector('.add-to-wishlist-modal').addEventListener('click', () => addToWishlist({ title, price: parseFloat(price), image }));
}


// Render products and add event listeners for cart, wishlist, and product details
function renderProducts(products) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = '';

    products.forEach((product) => {
        const productHTML = `
            <div class="col-10 col-sm-6 col-md-4 col-lg-3 col-xl-2-5 mb-4" data-category="${product.category}">
                <div class="card" data-rating="${product.rating}" data-brand="${product.brand}">
                    <div class="position-relative">
                        <!-- Product Image -->
                        <img src="${product.image}" class="card-img-top" alt="${product.title}">

                        <!-- Info Icon with Tooltip -->
                        <i class="fa fa-info-circle position-absolute top-0 end-0 m-2 info-icon"
                           data-bs-toggle="tooltip" data-bs-placement="right"
                           title="Brand: ${product.brand}<br>Rating: ${product.rating}⭐<br>Price: ₹${product.price}<br>Cloth: ${product.cloth}">
                        </i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text">${product.description}</p>
                        <p class="card-text" data-price="${product.price}">
                            Price: ₹${product.price}
                            <span class="original-price">
                                <span class="text-decoration-line-through">₹${product.originalPrice}</span>
                            </span>
                        </p>
                        <div class="input-group mb-3">
                            <select class="form-select dropdown quantity-dropdown" aria-label="Quantity">
                                <option value="1" selected>1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                            <button class="btn add-to-cart">Add to Cart</button>
                            <i class="fa-regular fa-heart wishlist-icon add-to-wishlist"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productContainer.innerHTML += productHTML;
    });

    // Attach event listeners for product cards
    productContainer.addEventListener('click', handleProductActions);
    productContainer.addEventListener('click', handleProductClick);

    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, { html: true });
    });
}



// Filter products based on selected checkboxes
function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.filter-checkbox:checked')).map(checkbox => checkbox.value);
    const productContainer = document.getElementById('product-container');
    const productElements = productContainer.querySelectorAll('.col-10');

    productElements.forEach((productElement) => {
        const productCategory = productElement.getAttribute('data-category');
        if (selectedCategories.length === 0 || selectedCategories.includes(productCategory)) {
            productElement.style.display = '';
        } else {
            productElement.style.display = 'none';
        }
    });
}

// Handle add to cart and wishlist actions
function handleProductActions(event) {
    const button = event.target;
    const cardBody = button.closest('.card-body');

    if (button.classList.contains('add-to-cart')) {
        const title = cardBody.querySelector('.card-title').textContent.trim();
        const price = parseFloat(cardBody.querySelector('[data-price]').getAttribute('data-price'));
        const quantity = parseInt(cardBody.querySelector('.quantity-dropdown').value, 10);
        const image = cardBody.closest('.card').querySelector('img').getAttribute('src');

        const item = { title, price, quantity, image };

        if (button.textContent === 'Add to Cart') {
            addItemToCart(item);
            button.textContent = 'Remove';
            button.classList.add('btn-danger');
        } else {
            removeItemFromCart(title);
            button.textContent = 'Add to Cart';
            button.classList.remove('btn-danger');
        }
    } else if (button.classList.contains('add-to-wishlist')) {
        const title = cardBody.querySelector('.card-title').textContent.trim();
        const price = parseFloat(cardBody.querySelector('[data-price]').getAttribute('data-price'));
        const image = cardBody.closest('.card').querySelector('img').getAttribute('src');

        const item = { title, price, image };
        addToWishlist(item);
    }
}

// Add product to cart from modal
function addProductToCartFromModal(title, price, image, card) {
    const item = { title, price: parseFloat(price), quantity: 1, image };
    addItemToCart(item);

    // Update the product card button
    const addToCartButton = card.querySelector('.add-to-cart');
    addToCartButton.textContent = 'Remove';
    addToCartButton.classList.add('btn-danger');

    const productDetailsModal = bootstrap.Modal.getInstance(document.getElementById('productDetailsModal'));
    productDetailsModal.hide();
}

// Add, remove, and update cart and wishlist
function addItemToCart(item) {
    const itemIndex = cartItems.findIndex(cartItem => cartItem.title === item.title);

    if (itemIndex === -1) {
        cartItems.push(item);
    }

    updateCartBadge();
    updateCartModal();
}

function removeItemFromCart(itemTitle) {
    cartItems = cartItems.filter(cartItem => cartItem.title !== itemTitle);
    updateCartBadge();
    updateCartModal();
}

function updateCartBadge() {
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.getElementById('cartItemCount');

    if (cartItemCount > 0) {
        cartBadge.style.display = 'inline-block';
        cartBadge.textContent = cartItemCount;
    } else {
        cartBadge.style.display = 'none';
    }
}

function updateCartModal() {
    const cartContainer = document.getElementById('cartItemsContainer');
    cartContainer.innerHTML = '';

    let totalPrice = 0;

    if (cartItems.length > 0) {
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item d-flex justify-content-between align-items-center mb-2';
            itemElement.innerHTML = `
                        <img src="${item.image}" alt="${item.title}" class="cart-item-img me-3" style="width: 150px; height: 150px; object-fit: cover;">
                        <span>${item.title} (x${item.quantity})</span>
                        <span>₹${item.price * item.quantity}</span>
                    `;
            totalPrice += item.price * item.quantity;
            cartContainer.appendChild(itemElement);
        });

        const totalElement = document.createElement('div');
        totalElement.className = 'd-flex justify-content-end align-items-center m-2';
        totalElement.innerHTML = `<strong>Total:</strong> <strong>₹${totalPrice}</strong>`;
        cartContainer.appendChild(totalElement);
    } else {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    }
}

function addToWishlist(item) {
    if (!wishlist.find(wishlistItem => wishlistItem.title === item.title)) {
        wishlist.push(item);
        updateWishlistModal();
    }
}

function updateWishlistModal() {
    const wishlistContainer = document.getElementById('wishlistItemsContainer');
    wishlistContainer.innerHTML = '';

    if (wishlist.length > 0) {
        wishlist.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'wishlist-item d-flex justify-content-between align-items-center mb-2';
            itemElement.innerHTML = `
                        <img src="${item.image}" alt="${item.title}" class="wishlist-item-img me-3" style="width: 150px; height: 150px; object-fit: cover;">
                        <span>${item.title}</span>
                        <span>₹${item.price}</span>
                    `;
            wishlistContainer.appendChild(itemElement);
        });
    } else {
        wishlistContainer.innerHTML = '<p>Your wishlist is empty.</p>';
    }
}