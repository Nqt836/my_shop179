const User = require("../models/User");

const userController = {
  //GET ALL USERS
  getAllUsers: async (req, res) => {
    try {
      const user = await User.find();
      res.status(200).json(user);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error ", error: err.message });
    }
  },

  //DElETE USER
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json("Không tìm thấy người dùng!");
      }
      res.status(200).json("User đã được xóa thành công!");
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Lỗi khi xóa user", error: err.message });
    }
  },
};

module.exports = userController;
