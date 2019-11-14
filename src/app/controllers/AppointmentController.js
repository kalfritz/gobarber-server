import {
  startOfHour,
  endOfHour,
  parseISO,
  isBefore,
  format,
  subHours,
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import File from '../models/File';
import User from '../models/User';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/cancellationMail';
import Queue from '../../lib/Queue';

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
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { userId } = req;
    const { provider_id, date } = req.body;

    const provider = await User.findOne({
      where: {
        provider: true,
        id: provider_id,
      },
    });

    if (!provider) {
      return res
        .status(400)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));
    const hourEnding = endOfHour(parseISO(date));
    //Check for past dates
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    //Check data availability
    const checkAvailabity = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        //date: hourStart,
        date: {
          [Op.between]: [hourStart, hourEnding],
        },
      },
    });

    if (checkAvailabity) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: userId,
      provider_id,
      date: hourStart,
    });

    //Notify appointment provider
    const user = await User.findByPk(userId);
    const formattedDate = format(
      parseISO(date),
      "'dia' dd 'de' MMMM 'às' h':'mm'h'",
      {
        locale: pt,
      },
    );
    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
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

    await Queue.add(CancellationMail.key, { appointment });

    return res.json(appointment);
  }
}

export default new AppointmentController();
