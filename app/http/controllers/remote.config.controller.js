import { UserDeviceLog, User } from "../../database/postgres_sequelize.js"
import { generatePaginationInfo } from "../../utils/functions.js"

class RemoteConfigController {
    constructor() {
        this.splash = this.splash.bind(this)
        this.getAllRemoteConfigs = this.getAllRemoteConfigs.bind(this)
    }

    async splash(req, res, next) {
        try {
            const user = req.user
            if (!user || !user.id) {
                return res.status(401).json({ message: "unauthorized" })
            }

            const { firebase_token, phone_model, android_version, app_version } = req.body

            const xff = req.headers["x-forwarded-for"]
            const ip =
                (typeof xff === "string" && xff.split(",")[0].trim()) ||
                req.ip ||
                req.connection?.remoteAddress ||
                null

            const platform = android_version ? "android" : "ios"

            await UserDeviceLog.create({
                user_id: user.id,
                firebase_token,
                phone_model,
                android_version,
                app_version,
                ip_address: ip,
                platform
            })

            return res.status(200).json({
                header: {
                    show_update_dialog: false,
                    force_update: false,
                    min_supported_version: "1.0.0"
                }
            })
        } catch (e) {
            next(e)
        }
    }

    async getAllRemoteConfigs(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 20
            const offset = (page - 1) * limit

            const whereClause = {}

            if (req.query.userId) {
                whereClause.user_id = req.query.userId
            }

            if (req.query.platform) {
                whereClause.platform = req.query.platform
            }
            const { count, rows } = await UserDeviceLog.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ["id", "firstname", "lastname", "phone", "email"],
                        required: false
                    }
                ],
                order: [["created_at", "DESC"]],
                limit,
                offset
            })

            const metadata = generatePaginationInfo(count, limit, page)

            const responseData = {
                logs: rows.map((log) => ({
                    id: log.id,
                    user: log.User
                        ? {
                            id: log.User.id,
                            firstname: log.User.firstname,
                            lastname: log.User.lastname,
                            phone: log.User.phone,
                            email: log.User.email
                        }
                        : null,
                    firebase_token: log.firebase_token,
                    phone_model: log.phone_model,
                    android_version: log.android_version,
                    app_version: log.app_version,
                    ip_address: log.ip_address,
                    platform: log.platform,
                    created_at: log.created_at
                })),
                metadata
            }

            return res.status(200).json({
                status: res.statusCode,
                data: responseData,
                cached: false
            })
        } catch (e) {
            next(e)
        }
    }
}

export const remoteConfigController = new RemoteConfigController()
