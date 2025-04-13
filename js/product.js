document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:8000/v1/product";
  const CART_URL = "http://localhost:8000/v1/cart";
  let allProducts = [];
  let currentPage = 1;
  const itemsPerPageDefault = 20;

  // Fetch tất cả sản phẩm từ backend
  async function fetchProducts() {
    try {
      const response = await fetch(BASE_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return [];
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const products = await response.json();
      localStorage.setItem("products", JSON.stringify(products)); // Lưu cache
      return products;
    } catch (error) {
      console.error("Fetch products error:", error.message);
      alert(`Đã xảy ra lỗi khi tải sản phẩm: ${error.message}`);
      return [];
    }
  }

  // Fetch sản phẩm theo ID
  async function fetchProductById(productId) {
    try {
      const response = await fetch(`${BASE_URL}/${productId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Fetch product error:", error.message);
      alert(`Đã xảy ra lỗi khi tải chi tiết sản phẩm: ${error.message}`);
      return null;
    }
  }

  // Fetch giỏ hàng
  async function fetchCart() {
    try {
      const response = await fetch(CART_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return null;
        }
        throw new Error("Lỗi khi lấy giỏ hàng");
      }
      return await response.json();
    } catch (error) {
      console.error("Fetch cart error:", error);
      return null;
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async function addToCart(productId, quantity = 1) {
    try {
      const response = await fetch(CART_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return;
        }
        throw new Error("Lỗi khi thêm vào giỏ hàng");
      }
      alert(
        "Đã thêm sản phẩm vào giỏ hàng! <a href='cart.html'>Xem giỏ hàng</a>"
      );
      updateCartDropdown();
    } catch (error) {
      console.error("Add to cart error:", error);
      alert(`Đã xảy ra lỗi khi thêm vào giỏ hàng: ${error.message}`);
    }
  }

  // Tạo HTML cho mỗi sản phẩm
  function createProductHTML(product) {
    const imageUrl = product.image
      ? `http://localhost:8000/${product.image}`
      : "default-image.jpg";
    return `
      <div class="product">
        <div class="product-img">
          <img src="${imageUrl}" alt="${product.name || "Sản phẩm"}" />
          ${
            product.isOnSale
              ? `<div class="product-label"><span class="sale">-${
                  product.salePercentage || 0
                }%</span></div>`
              : ""
          }
          ${
            product.isNewProduct
              ? `<div class="product-label"><span class="new">NEW</span></div>`
              : ""
          }
        </div>
        <div class="product-body">
          <p class="product-category">${
            product.category || "Không xác định"
          }</p>
          <h3 class="product-name"><a href="product.html?id=${
            product._id || ""
          }">${product.name || "Tên không có"}</a></h3>
          <h4 class="product-price">${(
            product.discountedPrice || 0
          ).toLocaleString()}VNĐ <del class="product-old-price">${(
      product.originalPrice || 0
    ).toLocaleString()}VNĐ</del></h4>
          <div class="product-rating">
            <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>
          </div>
          <div class="product-btns">
            <button class="add-to-wishlist"><i class="fa fa-heart-o"></i><span class="tooltipp">Yêu Thích</span></button>
            <button class="add-to-compare"><i class="fa fa-exchange"></i><span class="tooltipp">So Sánh</span></button>
            <button class="quick-view"><i class="fa fa-eye"></i><span class="tooltipp">Xem Sản Phẩm</span></button>
          </div>
        </div>
        <div class="add-to-cart">
          <button class="add-to-cart-btn" data-id="${
            product._id
          }"><i class="fa fa-shopping-cart"></i> Thêm Giỏ Hàng</button>
        </div>
      </div>
    `;
  }

  // Cập nhật dropdown giỏ hàng trong header
  async function updateCartDropdown() {
    const cartList = document.querySelector(".cart-dropdown .cart-list");
    const cartSummary = document.querySelector(".cart-dropdown .cart-summary");
    const qtyBadge = document.querySelector(".header-ctn .dropdown .qty");

    if (!cartList || !cartSummary || !qtyBadge) return;

    const cart = await fetchCart();
    cartList.innerHTML = "";
    let total = 0;
    let itemCount = 0;

    if (cart && cart.items && cart.items.length > 0) {
      cart.items.forEach((item) => {
        const product = item.productId;
        total += item.quantity * product.discountedPrice;
        itemCount += item.quantity;
        cartList.innerHTML += `
          <div class="product-widget">
            <div class="product-img">
              <img src="http://localhost:8000/${product.image}" alt="${
          product.name
        }">
            </div>
            <div class="product-body">
              <h3 class="product-name"><a href="product.html?id=${
                product._id
              }">${product.name}</a></h3>
              <h4 class="product-price"><span class="qty">${
                item.quantity
              }x</span>${product.discountedPrice.toLocaleString()} VNĐ</h4>
            </div>
            <button class="delete" data-id="${
              product._id
            }"><i class="fa fa-close"></i></button>
          </div>
        `;
      });
    } else {
      cartList.innerHTML = "<p>Giỏ hàng trống</p>";
    }

    cartSummary.innerHTML = `
      <small>${itemCount} Item(s) selected</small>
      <h5>SUBTOTAL: ${total.toLocaleString()} VNĐ</h5>
    `;
    qtyBadge.textContent = itemCount;

    // Gắn sự kiện xóa sản phẩm
    document.querySelectorAll(".cart-dropdown .delete").forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = button.getAttribute("data-id");
        try {
          const response = await fetch(`${CART_URL}/${productId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("accessToken") || ""
              }`,
            },
          });
          if (!response.ok) throw new Error("Lỗi khi xóa sản phẩm");
          updateCartDropdown();
        } catch (error) {
          console.error("Remove from cart error:", error);
          alert(`Đã xảy ra lỗi khi xóa sản phẩm: ${error.message}`);
        }
      });
    });
  }

  // Hiển thị sản phẩm cho index.html
  async function displayProductsForIndex() {
    const loading = document.createElement("div");
    loading.id = "loading";
    loading.style.textAlign = "center";
    loading.innerHTML =
      '<i class="fa fa-spinner fa-spin" style="font-size: 24px;"></i>';
    const newProductsContainer = document.querySelector(
      "#tab1 .products-slick"
    );
    const topRatedContainer = document.querySelector("#tab2 .products-slick");

    if (newProductsContainer)
      newProductsContainer.parentNode.insertBefore(
        loading,
        newProductsContainer
      );
    try {
      if (!allProducts.length) allProducts = await fetchProducts();

      updateCategoryCountsForIndex(allProducts);

      if (newProductsContainer) {
        newProductsContainer.innerHTML = "";
        const newProducts = allProducts
          .filter((p) => p.isNewProduct)
          .slice(0, 5);
        newProducts.forEach((product) => {
          newProductsContainer.innerHTML += createProductHTML(product);
        });
        if (!$(newProductsContainer).hasClass("slick-initialized")) {
          $(newProductsContainer).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2000,
            arrows: true,
            prevArrow: '<button type="button" class="slick-prev"></button>',
            nextArrow: '<button type="button" class="slick-next"></button>',
          });
        }
      }
      if (topRatedContainer) {
        topRatedContainer.innerHTML = "";
        const topRatedProducts = allProducts
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 5);
        topRatedProducts.forEach((product) => {
          topRatedContainer.innerHTML += createProductHTML(product);
        });
        if (!$(topRatedContainer).hasClass("slick-initialized")) {
          $(topRatedContainer).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2000,
            arrows: true,
            prevArrow: '<button type="button" class="slick-prev"></button>',
            nextArrow: '<button type="button" class="slick-next"></button>',
          });
        }
      }

      // Gắn sự kiện cho nút "Thêm Giỏ Hàng"
      attachCartEvents();
    } catch (error) {
      console.error("Display products error:", error);
      alert("Đã xảy ra lỗi khi tải sản phẩm: " + error.message);
    } finally {
      if (loading) loading.remove();
    }
  }

  // Hiển thị chi tiết sản phẩm cho product.html
  async function displayProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (!productId) return;

    const product = await fetchProductById(productId);
    if (!product) return;

    const productName = document.querySelector(".product-name");
    const productPrice = document.querySelector(".product-price");
    const productImage = document.querySelector(
      "#product-main-img .product-preview img"
    );
    const productThumb = document.querySelector(
      "#product-imgs .product-preview img"
    );
    const description = document.querySelector("#tab1 p");
    const specsContainer = document.querySelector("#tab2 .col-md-12");
    const breadcrumbActive = document.querySelector("#breadcrumb .active");

    if (productName) productName.textContent = product.name || "Tên không có";
    if (productPrice)
      productPrice.innerHTML = `${(
        product.discountedPrice || 0
      ).toLocaleString()}VNĐ <del class="product-old-price">${(
        product.originalPrice || 0
      ).toLocaleString()}VNĐ</del>`;
    if (productImage)
      productImage.src = product.image
        ? `http://localhost:8000/${product.image}`
        : "default-image.jpg";
    if (productThumb)
      productThumb.src = product.image
        ? `http://localhost:8000/${product.image}`
        : "default-image.jpg";
    if (description)
      description.textContent = product.description || "Không có mô tả";
    if (breadcrumbActive)
      breadcrumbActive.textContent = product.name || "Sản phẩm";
    if (specsContainer) {
      specsContainer.innerHTML = "<h3>Đặc tính sản phẩm</h3>";
      for (const [key, value] of Object.entries(product.specifications || {})) {
        specsContainer.innerHTML += `<p><strong>${key}:</strong> ${value}</p>`;
      }
    }

    // Gắn sự kiện cho nút "Thêm Giỏ Hàng"
    attachCartEvents();
  }

  // Lọc và hiển thị sản phẩm cho store.html
  async function filterProductsForStore() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get("category") || "";
    const categories = Array.from(
      document.querySelectorAll(".checkbox-filter input[id^='category-']")
    )
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const brands = Array.from(
      document.querySelectorAll(".checkbox-filter input[id^='brand-']")
    )
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    const priceMin = parseInt(document.getElementById("price-min")?.value) || 0;
    const priceMax =
      parseInt(document.getElementById("price-max")?.value) || Infinity;
    const sortBy = document.getElementById("sort-by")?.value || "popular";
    const itemsPerPage =
      parseInt(document.getElementById("items-per-page")?.value) ||
      itemsPerPageDefault;
    const searchQuery = document.getElementById("search-input")?.value || "";

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";

    try {
      // Tạo query string cho API lọc
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append("category", selectedCategory);
      else if (categories.length)
        queryParams.append("category", categories.join(","));
      if (brands.length) queryParams.append("brand", brands.join(","));
      if (priceMin) queryParams.append("minPrice", priceMin);
      if (priceMax !== Infinity) queryParams.append("maxPrice", priceMax);
      if (searchQuery) queryParams.append("search", searchQuery);
      queryParams.append("page", currentPage);
      queryParams.append("limit", itemsPerPage);

      const response = await fetch(
        `${BASE_URL}/filter?${queryParams.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi lọc sản phẩm");
      }

      const { products, total, page, totalPages } = await response.json();

      // Cập nhật số lượng danh mục và thương hiệu
      if (!allProducts.length) allProducts = await fetchProducts();
      updateCategoryAndBrandCounts(allProducts);

      // Hiển thị sản phẩm
      const productContainer = document.getElementById("product-list");
      if (productContainer) {
        productContainer.innerHTML = products
          .map(
            (product) =>
              `<div class="col-md-4 col-xs-6">${createProductHTML(
                product
              )}</div>`
          )
          .join("");
        document.getElementById(
          "store-qty"
        ).textContent = `Hiển Thị ${products.length} / ${total} Sản Phẩm`;
        document.getElementById("category-title").textContent = selectedCategory
          ? `${selectedCategory} (${total} Kết Quả)`
          : `Tất Cả Sản Phẩm (${total} Kết Quả)`;
        renderPagination(totalPages);
      }

      // Gắn sự kiện cho nút "Thêm Giỏ Hàng"
      attachCartEvents();
    } catch (error) {
      console.error("Filter products error:", error);
      alert("Đã xảy ra lỗi khi lọc sản phẩm: " + error.message);
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  // Cập nhật số lượng danh mục trên index.html
  function updateCategoryCountsForIndex(products) {
    const categoryCounts = {};
    products.forEach((p) => {
      const normalizedCategory = p.category.trim();
      categoryCounts[normalizedCategory] =
        (categoryCounts[normalizedCategory] || 0) + 1;
    });

    document.querySelectorAll(".shop").forEach((shop) => {
      const category = shop
        .querySelector(".cta-btn")
        .getAttribute("href")
        .split("=")[1]
        .replace(/%20/g, " ");
      const count = categoryCounts[category] || 0;
      if (count === 0) {
        console.warn(`No products found for category: ${category}`);
      }
      const h3 = shop.querySelector("h3");
      h3.innerHTML = h3.innerHTML.replace(/<small>.*<\/small>/, ""); // Xóa số cũ
      h3.innerHTML += `<small> (${count})</small>`;
    });
  }

  // Cập nhật số lượng danh mục và thương hiệu trên store.html
  function updateCategoryAndBrandCounts(products) {
    const categoryCounts = {};
    const brandCounts = {};
    products.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });

    document
      .querySelectorAll(".checkbox-filter input[id^='category-']")
      .forEach((cb) => {
        const count = categoryCounts[cb.value] || 0;
        cb.nextElementSibling.querySelector("small").textContent = `(${count})`;
      });
    document
      .querySelectorAll(".checkbox-filter input[id^='brand-']")
      .forEach((cb) => {
        const count = brandCounts[cb.value] || 0;
        cb.nextElementSibling.querySelector("small").textContent = `(${count})`;
      });
  }

  // Render phân trang
  function renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;
    pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = i === currentPage ? "active" : "";
      li.innerHTML = `<a href="#" onclick="changePage(${i}); return false;">${i}</a>`;
      pagination.appendChild(li);
    }
    const nextLi = document.createElement("li");
    nextLi.innerHTML = `<a href="#" onclick="changePage(${
      currentPage + 1
    }); return false;"><i class="fa fa-angle-right"></i></a>`;
    if (currentPage >= totalPages) nextLi.className = "disabled";
    pagination.appendChild(nextLi);
  }

  // Thay đổi trang
  window.changePage = function (page) {
    const itemsPerPage =
      parseInt(document.getElementById("items-per-page")?.value) ||
      itemsPerPageDefault;
    if (page > 0 && page <= Math.ceil(allProducts.length / itemsPerPage)) {
      currentPage = page;
      filterProductsForStore();
    }
  };

  // Gắn sự kiện cho nút "Thêm Giỏ Hàng"
  function attachCartEvents() {
    document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
      button.removeEventListener("click", handleAddToCart); // Tránh gắn trùng
      button.addEventListener("click", handleAddToCart);
    });
  }

  function handleAddToCart(event) {
    const productId = event.target.closest("button").getAttribute("data-id");
    if (productId) {
      addToCart(productId);
    }
  }

  // Gắn sự kiện cho bộ lọc
  function attachFilterEvents() {
    document
      .querySelectorAll(
        ".checkbox-filter input[id^='category-'], .checkbox-filter input[id^='brand-']"
      )
      .forEach((checkbox) => {
        checkbox.addEventListener("change", () => filterProductsForStore());
      });
    document
      .querySelectorAll(
        "#price-min, #price-max, #sort-by, #items-per-page, #search-input"
      )
      .forEach((input) => {
        input.addEventListener("input", () => filterProductsForStore());
      });
  }

  // Kiểm tra trang hiện tại và chạy hàm tương ứng
  if (document.location.pathname.includes("index.html")) {
    displayProductsForIndex();
    updateCartDropdown();
  } else if (document.location.pathname.includes("product.html")) {
    displayProductDetails();
  } else if (document.location.pathname.includes("store.html")) {
    attachFilterEvents();
    filterProductsForStore();
  }
});
