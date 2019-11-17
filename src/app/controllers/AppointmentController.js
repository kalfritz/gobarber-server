import Appointment from '../models/Appointment';
import File from '../models/File';
import User from '../models/User';

import CreateAppointmentService from '../services/CreateAppointmentService';
import CancelAppointmentService from '../services/CancelAppointmentService';

import Cache from '../../lib/Cache';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { userId: user_id } = req;

    const cacheKey = `user:${user_id}:appointments:${page}`;

    const cached = await Cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const appointments = await Appointment.findAll({
      where: {
        user_id,
        canceled_at: null,
      },
      order: [['date', 'DESC']],
      attributes: ['id', 'date', 'past', 'cancellable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    await Cache.set(cacheKey, appointments);

    return res.json(appointments);
  }
  async store(req, res) {
    const { userId } = req;
    const { provider_id, date } = req.body;

    const appointment = await CreateAppointmentService.run({
      userId,
      provider_id,
      date,
    });
    return res.json(appointment);
  }
  async delete(req, res) {
    const { userId } = req;
    const { id } = req.params;

    const appointment = await CancelAppointmentService.run({
      appointment_id: id,
      userId,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
