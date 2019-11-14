import User from '../models/User';
import Appointment from '../models/Appointment';
import File from '../models/File';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

class ScheduleController {
  async index(req, res) {
    const { userId } = req;
    const { date } = req.query;

    const checkProvider = await User.findAll({
      where: {
        id: userId,
        provider: true,
      },
    });
    if (!checkProvider) {
      return res.status(400).json({ error: 'User must be a provider' });
    }
    const dayStart = startOfDay(parseISO(date));
    const dayEnding = endOfDay(parseISO(date));

    const appointments = await Appointment.findAll({
      where: {
        provider_id: userId,
        canceled_at: null,
        date: {
          [Op.between]: [dayStart, dayEnding],
        },
      },
      order: ['date'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });
    return res.json(appointments);
  }
}
export default new ScheduleController();
