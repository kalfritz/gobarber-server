import {
  startOfDay,
  endOfDay,
  setHours,
  format,
  setSeconds,
  setMinutes,
  setHours,
  isAfter,
  addHours,
  isSameSecond
} from "date-fns";
import pt from "date-fns/locale/pt";
import { Op } from "sequelize";
import Appointment from "../models/Appointment";

class AvailableController {
  async index(req, res) {
    const { providerId: provider_id } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Invalid date" });
    }
    console.log(`date: ${date}`);
    const searchDate = Number(date);
    console.log(`search date: ${searchDate}`);

    const appointments = await Appointment.findAll({
      where: {
        provider_id,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)]
        }
      }
    });
    const schedule = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00"
    ];
    const available = schedule.map(time => {
      const [hour, minute] = time.split(":");
      let value = setSeconds(setMinutes(setHours(searchDate, hour), minute), 0);

      /*My node is on GMT-2 while my SO and browser are at GMT-3
      this resolves this problem if the date is on GMT-2
      
      Even my node returning the right GMT, because of the
      way my algorithm works it will break. schedule.map is looping on 
      hard coded hours and if it is on GMT-2 it will gonna set that to these hours 
      so instead of 08:00 on gmt-3 resulting 11:00. its gonna be 08:00 on gmt-2, resulting
      10:00. Adding 1 hour if gmt == 2 will make the trick */
      if (value.getTimezoneOffset() === 120) {
        value = addHours(value, 1);
      }
      return {
        time, //08:00 09:00 etc
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssXXX", { locale: pt }),
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => isSameSecond(a.date, value))
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
