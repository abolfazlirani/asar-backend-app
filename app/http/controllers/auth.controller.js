import { OtpCode, User } from "../../database/postgres_sequelize.js";
import { generateJWT, generateOtpCode } from "../../utils/functions.js";
import axios from "axios";

class AuthController {
  constructor() {
    this.authenticateUser = this.authenticateUser.bind(this);
    this.confirmCode = this.confirmCode.bind(this);
  }

  async authenticateUser(req, res, next) {
    try {
      let code = generateOtpCode();
      let { phone } = req.body;
      let user = await User.findOne({ where: { phone } });

      if (user) {
        if (!user.dataValues.is_active) {
          await user.update({ is_active: true });
        }

        let sentOtp = await OtpCode.findOne({
          where: { userId: user.dataValues.id },
          order: [["createdAt", "DESC"]],
          include: { model: User },
        });

        if (sentOtp) {
          let sentDate = new Date(sentOtp.dataValues.createdAt);
          let nowDate = new Date();
          let difference = nowDate - sentDate;
          if (difference < 2 * 60 * 1000) {
            return res.status(400).json({ message: "Code already sent" });
          } else {
            this._sendCode(res, next, code, user.dataValues.id, phone);
            return;
          }
        }

        await this._sendCode(res, next, code, user.dataValues.id, phone);
      } else {
        user = await User.create({ phone });
        await this._sendCode(res, next, code, user.dataValues.id, phone);
      }
    } catch (e) {
      next(e);
    }
  }

  async confirmCode(req, res, next) {
    try {
      const { code, phone } = req.body;

      const sentCode = await OtpCode.findOne({
        where: { code, phone },
        include: { model: User },
      });

      if (!sentCode) {
        return res.status(400).json({ message: "Invalid code or phone number" });
      }

      const sentDate = new Date(sentCode.createdAt);
      const now = new Date();
      const has5minPassed = now - sentDate > 5 * 60 * 1000;

      if (has5minPassed) {
        return res.status(400).json({ message: "Invalid code or phone number" });
      }

      const user = sentCode.User;
      const token = generateJWT(user.id, user.role);

      const userProfile = {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        profile_pic: user.profile_pic,
        role: user.role,
        createdAt: user.created_at,
      };

      return res.status(200).json({
        message: "authorized",
        token,
        user: userProfile,
      });
    } catch (e) {
      next(e);
    }
  }

  async _sendCode(res, next, code, userId, phone) {
    try {
      await OtpCode.create({ userId, phone, code });

      if (process.env.APP_STATE === "dev") {
        return res.status(200).json({
          status: res.statusCode,
          message: "code sent (dev)",
          code,
        });
      }

      const smsBody = {
        code: "57c69p4z7h3qjr4",
        sender: "+983000505",
        recipient: phone,
        variable: { code: parseInt(code) },
      };

      const headers = {
        accept: "*/*",
        apikey: "1z-md3uydxJbdjt759QENA-Pmq0tJL11jjYECOD3zWY=",
        "Content-Type": "application/json",
      };

      const response = await axios.post(
          "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
          smsBody,
          { headers }
      );

      return res.status(200).json({
        status: res.statusCode,
        message: "code sent",
      });
    } catch (err) {
      return next({
        status: 500,
        message: "SMS failed",
        ERR: err.response?.data || err.message || err,
      });
    }
  }
}

export const authController = new AuthController();