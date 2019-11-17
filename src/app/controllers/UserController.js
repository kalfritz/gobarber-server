import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import User from '../models/User';
import File from '../models/File';

import Cache from '../../lib/Cache';

class UserController {
  async index(req, res) {
    const users = await User.findAll({});
    return res.json(users);
  }
  async show(req, res) {
    const { userId } = req.params;
    const { id, name, email, provider } = await User.findByPk(userId);
    return res.json({ id, name, email, provider });
  }
  async store(req, res) {
    const userExists = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    if (provider) {
      await Cache.invalidate('providers');
    }

    return res.json({
      user: { id, name, email, provider },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
  async update(req, res) {
    const { userId } = req;
    const { email, oldPassword } = req.body;

    const user = await User.findByPk(userId);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: {
          email,
        },
      });
      if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }

    if (oldPassword) {
      if (!req.body.password) {
        return res.status(401).json({ error: 'Provide the new password' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);

    if (user.provider) {
      await Cache.invalidate('providers');
    }

    const { id, name, avatar } = await User.findByPk(userId, {
      include: [
        { model: File, as: 'avatar', attributes: ['id', 'path', 'url'] },
      ],
    });

    return res.json({ id, name, email, avatar });
  }
}

export default new UserController();
