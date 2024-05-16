import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  const userId = req.user._id;

  try {
    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};

export const deleteNotifications = async (req, res) => {
  const userId = req.user._id;

  try {
    await Notification.deleteMany({ to: userId });
    return res
      .status(200)
      .json({ message: "Notifications deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error with server" });
  }
};
