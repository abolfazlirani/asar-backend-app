import { User } from "../../database/postgres_sequelize.js";
import { getFileAddress } from "../../utils/multer.config.js";

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

            // Validate role if provided
            if (role && !["admin", "user", "editor"].includes(role)) {
                return res.status(400).json({
                    message: "Invalid role. Valid roles are: admin, user, editor",
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
            const {
                firstname,
                lastname,
                phone,
                national_code,
                role,
                is_active,
                email,
                gender,
                birthday,
                education
            } = req.body;
            const profilePicAddress = getFileAddress(req);

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Validate role if provided
            if (role && !["admin", "user", "editor"].includes(role)) {
                return res.status(400).json({
                    message: "Invalid role. Valid roles are: admin, user, editor",
                });
            }

            // Track who assigned the role if role is being changed
            const updateData = {
                firstname: firstname ?? user.firstname,
                lastname: lastname ?? user.lastname,
                phone: phone ?? user.phone,
                national_code: national_code ?? user.national_code,
                role: role ?? user.role,
                is_active: is_active ?? user.is_active,
                profile_pic: profilePicAddress ?? user.profile_pic,
                email: email ?? user.email,
                gender: gender ?? user.gender,
                birthday: birthday ?? user.birthday,
                education: education ?? user.education,
            };

            // If role is being changed, track who made the change
            if (role && role !== user.role) {
                updateData.roled_by = req.user.id;
            }

            await user.update(updateData);

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
                    profile_pic: user.profile_pic,
                    email: user.email,
                    gender: user.gender,
                    birthday: user.birthday,
                    education: user.education,
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

    // Get logged-in user's profile
    async getMyProfile(req, res, next) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: [
                    "id",
                    "firstname",
                    "lastname",
                    "phone",
                    "email",
                    "profile_pic",
                    "gender",
                    "birthday",
                    "education",
                    "role",
                    "created_at",
                ],
            });

            if (!user) {
                return res.status(404).json({
                    status: 404,
                    message: "User not found",
                });
            }

            return res.status(200).json({
                status: 200,
                data: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    phone: user.phone,
                    email: user.email,
                    profile_pic: user.profile_pic,
                    gender: user.gender,
                    birthday: user.birthday,
                    education: user.education,
                    role: user.role,
                    createdAt: user.created_at,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Update logged-in user's profile
    async updateMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { firstname, lastname, email, gender, birthday, education } = req.body;
            const profilePicAddress = getFileAddress(req);

            // Validate email format if provided
            if (email && email.trim() !== "") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid email format",
                    });
                }
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    status: 404,
                    message: "User not found",
                });
            }

            // Helper function to handle empty strings and return null or trimmed value
            const sanitizeValue = (value, currentValue) => {
                if (value === undefined) return currentValue;
                if (typeof value === 'string' && value.trim() === '') return null;
                return typeof value === 'string' ? value.trim() : value;
            };

            // Validate and sanitize birthday
            let sanitizedBirthday = user.birthday;
            if (birthday !== undefined) {
                if (birthday === null || birthday === '' || birthday.trim() === '') {
                    sanitizedBirthday = null;
                } else {
                    // Validate date format (YYYY-MM-DD)
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(birthday)) {
                        return res.status(400).json({
                            status: 400,
                            message: "Invalid birthday format. Use YYYY-MM-DD format.",
                        });
                    }

                    // Validate if it's a valid date
                    const date = new Date(birthday);
                    if (isNaN(date.getTime())) {
                        return res.status(400).json({
                            status: 400,
                            message: "Invalid birthday date.",
                        });
                    }

                    sanitizedBirthday = birthday;
                }
            }

            // Update user profile (phone is not updatable)
            await user.update({
                firstname: sanitizeValue(firstname, user.firstname),
                lastname: sanitizeValue(lastname, user.lastname),
                email: sanitizeValue(email, user.email),
                profile_pic: profilePicAddress || user.profile_pic,
                gender: sanitizeValue(gender, user.gender),
                birthday: sanitizedBirthday,
                education: sanitizeValue(education, user.education),
            });

            return res.status(200).json({
                status: 200,
                message: "Profile updated successfully",
                data: {
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    phone: user.phone,
                    email: user.email,
                    profile_pic: user.profile_pic,
                    gender: user.gender,
                    birthday: user.birthday,
                    education: user.education,
                    role: user.role,
                    createdAt: user.created_at,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();