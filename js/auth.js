document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "http://localhost:8000/v1/auth";

  async function fetchWithToken(url, options = {}) {
    let accessToken = localStorage.getItem("accessToken");
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken || ""}`,
    };

    let response = await fetch(url, {
      ...options,
      credentials: "include",
    }).catch((error) => {
      console.error("Fetch error:", error);
      throw new Error("Không thể kết nối đến server");
    });

    if (response.status === 403 || response.status === 401) {
      accessToken = await refreshToken();
      options.headers["Authorization"] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, credentials: "include" }).catch(
        (error) => {
          console.error("Refresh fetch error:", error);
          throw new Error("Làm mới token thất bại");
        }
      );
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Lỗi không xác định" }));
      throw new Error(errorData.message || `Lỗi HTTP ${response.status}`);
    }

    return response;
  }

  async function refreshToken() {
    try {
      const response = await fetch(`${BASE_URL}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể làm mới token");
      }
      localStorage.setItem("accessToken", data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      window.location.href = "index.html";
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    updateAccountStatus();
    alert("Đăng xuất thành công!");
    window.location.href = "index.html";
  }

  async function updateAccountStatus() {
    const accountLink = document.getElementById("account-link");
    const loggedInUser = document.getElementById("logged-in-user");
    const userAvatar = document.getElementById("user-avatar");
    const logoutLink = document.getElementById("logout-link");

    if (!accountLink || !loggedInUser || !userAvatar || !logoutLink) {
      console.warn("Một hoặc nhiều phần tử không được tìm thấy.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    if (token) {
      accountLink.style.display = "none";
      loggedInUser.style.display = "flex";

      let userInitial = "U";
      if (userData.firstName && userData.lastName) {
        userInitial = (
          userData.firstName.charAt(0) + userData.lastName.charAt(0)
        ).toUpperCase();
      } else {
        try {
          const response = await fetchWithToken(`${BASE_URL}/me`);
          const user = await response.json();
          userInitial = (
            user.firstName.charAt(0) + user.lastName.charAt(0)
          ).toUpperCase();
          localStorage.setItem(
            "userData",
            JSON.stringify({
              firstName: user.firstName,
              lastName: user.lastName,
            })
          );
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng:", error);
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "account.html";
          return;
        }
      }
      userAvatar.textContent = userInitial;
      logoutLink.style.display = "inline-flex";
    } else {
      accountLink.style.display = "flex";
      loggedInUser.style.display = "none";
      logoutLink.style.display = "none";
    }
  }

  const loginForm = document.querySelector("#login-form form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginButton = loginForm.querySelector("button[type='submit']");
      loginButton.disabled = true;
      loginButton.textContent = "Đang đăng nhập...";

      try {
        const response = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: document.getElementById("login-username").value,
            password: document.getElementById("login-password").value,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại");
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
          })
        );
        alert("Đăng nhập thành công!");
        updateAccountStatus();
        window.location.href = "index.html";
      } catch (error) {
        loginForm.insertAdjacentHTML(
          "beforeend",
          `<p style="color: red;">${error.message}</p>`
        );
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Đăng nhập";
      }
    });
  }

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  updateAccountStatus();
});
