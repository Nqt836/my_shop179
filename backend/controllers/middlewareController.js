const jwt = require("jsonwebtoken");

const middlewareController = {
  // verify token
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json("Bạn chưa được xác thực!");
    }

    const accessToken = token.split(" ")[1];
    jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(403).json("Token đã hết hạn!");
        }
        return res.status(403).json("Token không hợp lệ!");
      }
      req.user = user;
      next();
    });
  },

  // verify toke and admin
  verifyTokenAndAdminAuth: (req, res, next) => {
    middlewareController.verifyToken(req, res, () => {
      if (req.user.id === req.params.id || req.user.admin) {
        next();
      } else {
        return res.status(403).json("Bạn không được phép xóa!");
      }
    });
  },
};

module.exports = middlewareController;
