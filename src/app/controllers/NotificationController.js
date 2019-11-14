import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    const { userId } = req;

    const checkIsProvider = await User.findOne({
      where: {
        provider: true,
        id: userId,
      },
    });

    if (!checkIsProvider) {
      return res
        .status(400)
        .json({ error: 'Only provider can load notifications' });
    }
    const notifications = await Notification.find({
      user: userId,
    })
      .sort(`-createdAt`)
      .limit(20);
    return res.json(notifications);
  }
  async update(req, res) {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    );
    res.json(notification);
  }
}
export default new NotificationController();
