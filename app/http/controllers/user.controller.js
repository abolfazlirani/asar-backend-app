import { User } from "../../database/postgres_sequelize.js";

class UserController {
    async createUser(req, res, next) {
        try {
            const { firstname, lastname, national_code, phone, password, role } = req.body;

            const userExists = await User.findOne({ where: { phone } });
            if (userExists) {
                return res.status(409).json({
                    message: "User with this phone already exists",
                });
            }

            const user = await User.create({
                firstname,
                lastname,
                national_code,
                phone,
                password: password,
                role: role || "user",
            });

            return res.status(201).json({
                message: "User created successfully",
                user: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    phone: user.phone,
                    role: user.role,
                    is_active: user.is_active,
                    national_code: user.national_code,
                    createdAt: user.created_at,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req, res, next) {
        try {
            const users = await User.findAll({
                attributes: ["id", "firstname", "lastname", "phone", "role", "created_at", "is_active", "national_code"],
                order: [["created_at", "DESC"]],
            });

            return res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { firstname, lastname, phone, national_code, role, is_active } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            await user.update({
                firstname: firstname ?? user.firstname,
                lastname: lastname ?? user.lastname,
                phone: phone ?? user.phone,
                national_code: national_code ?? user.national_code,
                role: role ?? user.role,
                is_active: is_active ?? user.is_active,
            });

            return res.status(200).json({
                message: "User updated successfully",
                user: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    phone: user.phone,
                    role: user.role,
                    is_active: user.is_active,
                    national_code: user.national_code,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            await user.destroy();

            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();