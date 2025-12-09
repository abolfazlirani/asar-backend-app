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

export async function initializeConnectionToPG() {
    try {
        await sequelize.authenticate()
        console.log("db connected")
        return true
    } catch (e) {
        console.error("db connection failed", e)
        throw e
    }
}


export class User extends Model { }
export class OtpCode extends Model { }
export class Notification extends Model { }
export class UserDeviceLog extends Model { }
export class Article extends Model { }
export class PostCategory extends Model { }
export class Comment extends Model { }
export class CommentLike extends Model { }
export class ArticleBookmark extends Model { }
export class ArticleLike extends Model { }
export class Page extends Model { }
PostCategory.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        parentId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'post_categories',
                key: 'id',
            },
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        lang: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "fa",
        },
    },
    {
        sequelize,
        modelName: "PostCategory",
        tableName: "post_categories",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
)
Article.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        post_type: {
            type: DataTypes.ENUM("article", "audio", "video", "poster"),
            allowNull: false,
            defaultValue: "article",
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        source: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        share_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        lang: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "fa",
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: PostCategory,
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: "Article",
        tableName: "articles",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
)
Page.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        language: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "fa",
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        layout_json: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: "Page",
        tableName: "pages",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {
                unique: true,
                fields: ['slug', 'language']
            }
        ]
    }
)
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        firstname: {
            type: DataTypes.STRING,

            allowNull: true, defaultValue: ""
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: true, defaultValue: ""
        },
        national_code: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true, defaultValue: ""
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true, defaultValue: ""
        },
        education: {
            type: DataTypes.STRING,
            allowNull: true, defaultValue: ""
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
            type: DataTypes.ENUM("admin", "user", "editor"),
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
UserDeviceLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: "id"
            }
        },
        firebase_token: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone_model: {
            type: DataTypes.STRING,
            allowNull: true
        },
        android_version: {
            type: DataTypes.STRING,
            allowNull: true
        },
        app_version: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        platform: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: "UserDeviceLog",
        tableName: "user_device_logs",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false
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
Comment.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        articleId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Article,
                key: 'id'
            }
        },
        parentId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'comments',
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: "Comment",
        tableName: "comments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

CommentLike.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM("like", "dislike"),
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        commentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Comment,
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: "CommentLike",
        tableName: "comment_likes",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);
ArticleLike.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        articleId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Article,
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: "ArticleLike",
        tableName: "article_likes",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);
ArticleBookmark.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User,
                key: 'id'
            }
        },
        articleId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: Article,
                key: 'id'
            }
        }
    },
    {
        sequelize,
        modelName: "ArticleBookmark",
        tableName: "article_bookmarks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);
User.hasMany(Notification, {
    foreignKey: "target_user_id",
    as: "Notifications",
})

Notification.belongsTo(User, {
    foreignKey: "target_user_id",
    as: "TargetUser",
})
User.hasMany(UserDeviceLog, {
    foreignKey: "user_id",
    as: "deviceLogs"
})

UserDeviceLog.belongsTo(User, {
    foreignKey: "user_id",
    as: "user"
})
User.hasMany(OtpCode, { foreignKey: "userId" })
OtpCode.belongsTo(User, { foreignKey: "userId" })
PostCategory.hasMany(PostCategory, { as: 'children', foreignKey: 'parentId' })
PostCategory.belongsTo(PostCategory, { as: 'parent', foreignKey: 'parentId' })
Article.belongsTo(PostCategory, { foreignKey: 'categoryId', as: 'category' })
PostCategory.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' })
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Comment, { foreignKey: 'userId' });

Comment.belongsTo(Article, { foreignKey: 'articleId' });
Article.hasMany(Comment, { foreignKey: 'articleId' });

Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });

Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId' });

User.hasMany(CommentLike, { foreignKey: 'userId' });
CommentLike.belongsTo(User, { foreignKey: 'userId' });
ArticleBookmark.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ArticleBookmark, { foreignKey: 'userId', as: 'articleBookmarks' });

ArticleBookmark.belongsTo(Article, { foreignKey: 'articleId' });
Article.hasMany(ArticleBookmark, { foreignKey: 'articleId', as: 'bookmarks' });
ArticleLike.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ArticleLike, { foreignKey: 'userId', as: 'articleLikes' });

ArticleLike.belongsTo(Article, { foreignKey: 'articleId' });
Article.hasMany(ArticleLike, { foreignKey: 'articleId', as: 'likes' });
