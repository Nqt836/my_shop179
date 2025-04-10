const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const authController = {
  // REGISTER
  registerUser: [
    body("username")
      .isLength({ min: 6, max: 20 })
      .withMessage("Tên người dùng phải từ 6-20 ký tự"),
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 9 })
      .withMessage("Mật khẩu phải ít nhất 9 ký tự"),
    body("firstName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Tên phải từ 2-50 ký tự"),
    body("lastName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Họ phải từ 2-50 ký tự"),
    body("phone")
      .matches(/^[0-9]{10}$/)
      .withMessage("Số điện thoại phải là 10 chữ số"),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, firstName, lastName, phone } =
          req.body;
        const existingUser = await User.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          return res.status(400).json("Username hoặc email đã tồn tại!");
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const newUser = new User({
          username,
          email,
          password: hashed,
          firstName,
          lastName,
          phone, // Thêm phone vào newUser
        });

        const user = await newUser.save();
        res.status(200).json(user);
      } catch (err) {
        console.error("Register error details:", err); // Log chi tiết lỗi
        res
          .status(500)
          .json({ message: "Đã có lỗi xảy ra", error: err.message });
      }
    },
  ],

  // LOGIN
  loginUser: [
    body("username")
      .notEmpty()
      .withMessage("Tên người dùng không được để trống"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findOne({ username: req.body.username });
        if (!user) {
          return res.status(404).json("Tên người dùng không đúng");
        }

        const validPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (!validPassword) {
          return res.status(400).json("Mật khẩu không đúng");
        }

        const accessToken = authController.generateAccessToken(user);
        const refreshToken = authController.generateRefreshToken(user);

        await User.updateOne({ _id: user._id }, { refreshToken });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "strict",
        });

        const { password, ...others } = user._doc;
        res.status(200).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          accessToken,
        });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ message: "Đã có lỗi xảy ra", error: err.message });
      }
    },
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { username, email } = req.body;
        const existingUser = await User.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          return res.status(400).json("Username hoặc email đã tồn tại!");
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(req.body.password, salt);

        const newUser = new User({
          username,
          email,
          password: hashed,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        });

        const user = await newUser.save();
        res.status(200).json(user);
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ message: "Đã có lỗi xảy ra", error: err.message });
      }
    },
  ],

  // GET USER
  generateAccessToken: (user) => {
    return jwt.sign(
      { id: user._id, admin: user.admin },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "2d" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      { id: user._id, admin: user.admin },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "365d" }
    );
  },

  // REFRESH TOKEN
  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json("Bạn chưa được xác thực!");
    }

    // Kiểm tra refresh token trong database
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json("Refresh token không hợp lệ!");
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_KEY,
      async (err, decodedUser) => {
        if (err) {
          return res.status(403).json("Refresh token không hợp lệ!");
        }

        const newAccessToken = authController.generateAccessToken(user);
        const newRefreshToken = authController.generateRefreshToken(user);

        // Cập nhật refresh token mới trong database
        await User.updateOne(
          { _id: user._id },
          { refreshToken: newRefreshToken }
        );

        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });
        res.status(200).json({ accessToken: newAccessToken });
      }
    );
  },

  userLogout: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Xóa refresh token trong database
      await User.updateOne({ refreshToken }, { refreshToken: null });
    }
    res.clearCookie("refreshToken");
    res.status(200).json("Đăng xuất thành công!");
  },
};

module.exports = authController;
