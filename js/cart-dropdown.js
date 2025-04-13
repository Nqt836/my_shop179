document.addEventListener("DOMContentLoaded", () => {
  if (document.location.pathname.includes("index.html")) {
    updateCartDropdown();
  }
});

async function updateCartDropdown() {
  const BASE_URL = "http://localhost:8000/v1/cart";
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
      },
    });
    if (!response.ok) return;
    const cart = await response.json();
    const cartList = document.querySelector(".cart-dropdown .cart-list");
    const cartSummary = document.querySelector(".cart-dropdown .cart-summary");
    const qtyBadge = document.querySelector(".header-ctn .dropdown .qty");

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
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
          try {
            const response = await fetch(`${BASE_URL}/${productId}`, {
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
        }
      });
    });
  } catch (error) {
    console.error("Update cart dropdown error:", error);
  }
}
