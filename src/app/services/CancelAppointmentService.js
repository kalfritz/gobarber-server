import { isBefore, subHours } from 'date-fns';

import Appointment from '../models/Appointment';
import User from '../models/User';

import CancellationMail from '../jobs/cancellationMail';

import Queue from '../../lib/Queue';
import Cache from '../../lib/Cache';

class CancelAppointmentService {
  async run({ userId, appointment_id }) {
    const appointment = await Appointment.findByPk(appointment_id, {
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
      throw new Error('You do not have permission to cancel this appointment');
    }
    if (appointment.canceled_at) {
      throw new Error('This appointment have already being deleted');
    }
    if (isBefore(subHours(appointment.date, 2), new Date())) {
      throw new Error('You can only cancel an appointment 2 hours in advance');
    }

    appointment.canceled_at = new Date();
    await appointment.save();

    await Queue.add(CancellationMail.key, { appointment });

    await Cache.invalidatePrefix(`user:${userId}:appointments`);

    return appointment;
  }
}

export default new CancelAppointmentService();
