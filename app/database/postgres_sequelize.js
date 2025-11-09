import { Model, Sequelize, DataTypes } from "sequelize"
import dotenv from "dotenv"
import { generateRandomCode } from "../utils/functions.js"

dotenv.config()

console.log("connecting to db")
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
        logging: false,
        dialect: "mysql",
})

const _userRol = Object.freeze({
        admin: "admin",
        user: "user",
})

export function initializeConnectionToPG() {
        return new Promise((resolve, reject) => {
                try {
                        sequelize.authenticate()
                        resolve(true)
                } catch (e) {
                        reject(e)
                }
        })
}

export class User extends Model {}
export class OtpCode extends Model {}
export class Notification extends Model {}

User.init(
    {
            id: {
                    type: DataTypes.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
            },
            firstname: {
                    type: DataTypes.STRING,
                    allowNull: false,
            },
            lastname: {
                    type: DataTypes.STRING,
                    allowNull: false,
            },
            national_code: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
            },
            birthday: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
            },
            phone: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            email: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            gender: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            education: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            document_image: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            password: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            fcm_token: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            profile_pic: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            role: {
                    type: DataTypes.ENUM("admin", "user"),
                    defaultValue: "user",
            },
            roled_by: {
                    type: DataTypes.UUID,
                    allowNull: true,
            },
            is_active: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
            },
            blocked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
            },
    },
    {
            sequelize,
            modelName: "User",
            tableName: "users",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
    }
)

Notification.init(
    {
            id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
            },
            blurHash: {
                    type: DataTypes.STRING,
            },
            title: {
                    type: DataTypes.STRING,
                    allowNull: false,
            },
            description: {
                    type: DataTypes.TEXT,
                    allowNull: false,
            },
            image: {
                    type: DataTypes.STRING,
                    allowNull: true,
            },
            link: {
                    type: DataTypes.STRING,
                    allowNull: false,
            },
            type: {
                    type: DataTypes.ENUM("public", "private"),
                    allowNull: false,
                    defaultValue: "public",
            },
            target_user_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                            model: User,
                            key: "id",
                    },
            },
    },
    {
            sequelize,
            modelName: "Notification",
            tableName: "notifications",
            timestamps: true,
    }
)

OtpCode.init(
    {
            id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
            },
            code: { type: DataTypes.STRING, allowNull: false },
            phone: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, timestamps: true }
)

User.hasMany(Notification, {
        foreignKey: "target_user_id",
        as: "Notifications",
})

Notification.belongsTo(User, {
        foreignKey: "target_user_id",
        as: "TargetUser",
})

User.hasMany(OtpCode, { foreignKey: "userId" })
OtpCode.belongsTo(User, { foreignKey: "userId" })
