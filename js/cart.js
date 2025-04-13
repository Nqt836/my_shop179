document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:8000/v1/cart";

  async function fetchCart() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";

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
          return;
        }
        throw new Error("Lỗi khi lấy giỏ hàng");
      }
      const cart = await response.json();
      displayCart(cart);
    } catch (error) {
      console.error("Fetch cart error:", error);
      alert("Đã xảy ra lỗi khi tải giỏ hàng: " + error.message);
    } finally {
      if (loading) loading.style.display = "none";
    }
  }

  function displayCart(cart) {
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    cartList.innerHTML = "";
    let total = 0;

    if (!cart || !cart.items || cart.items.length === 0) {
      cartList.innerHTML = "<p>Giỏ hàng của bạn đang trống.</p>";
      cartTotal.textContent = "0 VNĐ";
      return;
    }

    cart.items.forEach((item) => {
      const product = item.productId;
      total += item.quantity * product.discountedPrice;
      cartList.innerHTML += `
        <div class="product-widget">
          <div class="product-img">
            <img src="http://localhost:8000/${product.image}" alt="${
        product.name
      }">
          </div>
          <div class="product-body">
            <h3 class="product-name"><a href="product.html?id=${product._id}">${
        product.name
      }</a></h3>
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

    cartTotal.textContent = `${total.toLocaleString()} VNĐ`;

    // Gắn sự kiện xóa sản phẩm
    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = button.getAttribute("data-id");
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
          await removeFromCart(productId);
        }
      });
    });
  }

  async function removeFromCart(productId) {
    try {
      const response = await fetch(`${BASE_URL}/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Lỗi khi xóa sản phẩm khỏi giỏ hàng");
      fetchCart(); // Làm mới giỏ hàng
    } catch (error) {
      console.error("Remove from cart error:", error);
      alert("Đã xảy ra lỗi khi xóa sản phẩm: " + error.message);
    }
  }

  fetchCart();
});
