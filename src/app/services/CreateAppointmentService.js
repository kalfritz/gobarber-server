import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';

class CreateAppointmentService {
  async run({ provider_id, userId, date }) {
    const provider = await User.findOne({
      where: {
        provider: true,
        id: provider_id,
      },
    });

    if (!provider) {
      throw new Error('You can only create appointments with providers');
    }

    const hourStart = startOfHour(parseISO(date));
    //Check for past dates
    if (isBefore(hourStart, new Date())) {
      throw new Error('Past dates are not permited');
    }

    //Check data availability
    const checkAvailabity = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailabity) {
      throw new Error('Appointment date is not available');
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

    return appointment;
  }
}

export default new CreateAppointmentService();
