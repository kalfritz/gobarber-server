import { isBefore, subHours } from 'date-fns';
import Appointment from '../models/Appointment';
import File from '../models/File';
import User from '../models/User';

import CancellationMail from '../jobs/cancellationMail';
import Queue from '../../lib/Queue';

import CreateAppointmentService from '../services/CreateAppointmentService';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const { userId: user_id } = req;

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

    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });
    if (appointment.user_id !== userId) {
      return res.status(400).json({
        error: `You do not have permission to cancel this appointment`,
      });
    }
    if (appointment.canceled_at) {
      return res.status(400).json({
        error: `This appointment have already being deleted`,
      });
    }
    const { date } = appointment;
    if (isBefore(subHours(date, 2), new Date())) {
      return res.status(401).json({
        error: `You can only cancel an appointment 2 hours in advance`,
      });
    }
    appointment.canceled_at = new Date();
    await appointment.save();

    if (process.env.NODE_ENV === 'development') {
      await Queue.add(CancellationMail.key, { appointment });
    }

    return res.json(appointment);
  }
}

export default new AppointmentController();
