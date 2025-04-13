document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:8000/v1/auth";
  const accountLink = document.getElementById("account-link");
  const logoutLink = document.getElementById("logout-link");

  // Hàm tạo chữ viết tắt từ firstName và lastName
  function getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Hàm cập nhật giao diện người dùng
  function updateUserInterface(userData) {
    if (accountLink && logoutLink) {
      if (userData && userData.firstName && userData.lastName) {
        // Đã đăng nhập: Hiển thị avatar với chữ viết tắt và nút Logout
        const initials = getInitials(userData.firstName, userData.lastName);
        accountLink.classList.add("avatar");
        accountLink.textContent = initials;
        accountLink.href = "javascript:void(0);";
        logoutLink.style.display = "inline"; // Hiển thị nút Logout
      } else {
        // Chưa đăng nhập: Hiển thị "Tài Khoản" và ẩn Logout
        accountLink.classList.remove("avatar");
        accountLink.innerHTML = '<i class="fa fa-user-o"></i> Tài Khoản';
        accountLink.href = "account.html";
        logoutLink.style.display = "none"; // Ẩn nút Logout
        accountLink.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.href = "account.html";
        });
      }
    }
  }

  // Kiểm tra và cập nhật giao diện khi tải trang
  function initializeUserInterface() {
    const savedUserData = localStorage.getItem("userData");
    if (savedUserData) {
      updateUserInterface(JSON.parse(savedUserData));
    } else {
      updateUserInterface(null);
    }
  }

  // Khởi tạo giao diện khi tải trang
  initializeUserInterface();

  // Hàm logout toàn cục
  window.logout = function () {
    fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
      },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        initializeUserInterface();
        alert(data.message || "Đăng xuất thành công!");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        window.location.href = "index.html";
      });
  };
});
