const Notification = require("../models/Notification");

const upsertOrderNotification = async ({
  userId,
  orderId,
  status,
  message
}) => {
  return await Notification.findOneAndUpdate(
    { user: userId, order: orderId },
    {
      status,
      message,
      isRead: false,
      createdAt: new Date()
    },
    {
      new: true,
      upsert: true
    }
  );
};

module.exports = { upsertOrderNotification };
