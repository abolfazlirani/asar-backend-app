import { Article, PostCategory, ArticleLike, ArticleBookmark, Comment, CommentLike } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { getFileAddress } from "../../utils/multer.config.js";
import { Sequelize, Op } from "sequelize";

class ArticleController {
    async createArticle(req, res, next) {
        try {
            const { title, content, categoryId, lang, post_type } = req.body;
            const filePaths = getFileAddress(req);

            const imageAddres = filePaths?.image || null;
            const sourceAddress = filePaths?.source || null;

            if (!title) {
                return res.status(400).json({
                    status: 400,
                    message: "Field `title` is required.",
                });
            }

            if (!post_type) {
                return res.status(400).json({
                    status: 400,
                    message: "Field `post_type` is required.",
                });
            }

            if (post_type === "article") {
                if (!content) {
                    return res.status(400).json({
                        status: 400,
                        message: "Field `content` is required for articles.",
                    });
                }
            } else {
                if (!sourceAddress) {
                    return res.status(400).json({
                        status: 400,
                        message: "Field `source` file is required for this post type.",
                    });
                }
            }

            if (categoryId) {
                const category = await PostCategory.findByPk(categoryId);
                if (!category) {
                    return res.status(404).json({
                        status: 404,
                        message: "Category not found.",
                    });
                }
            }

            const article = await Article.create({
                title,
                post_type,
                content: content,
                source: post_type !== "article" ? sourceAddress : null,
                image: imageAddres,
                categoryId: categoryId || null,
                lang: lang || "fa",
            });

            return res.status(201).json({
                status: 201,
                message: "Article created successfully",
                data: article,
            });
        } catch (e) {
            next(e);
        }
    }

    async getAllArticles(req, res, next) {
        try {
            const lang = req.query.lang || "fa";
            const categoryId = req.query.categoryId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let whereClause = {
                lang,
                is_active: true,
            };

            if (categoryId) {
                whereClause.categoryId = categoryId;
            }

            const { count, rows } = await Article.findAndCountAll({
                where: whereClause,
                include: [{
                    model: PostCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'image']
                }],
                order: [["created_at", "DESC"]],
                limit,
                offset,
            });

            const metadata = generatePaginationInfo(count, limit, page);
            const responseData = {
                articles: rows,
                metadata,
            };

            return res.status(200).json({
                status: 200,
                data: responseData,
            });
        } catch (e) {
            next(e);
        }
    }

    async getNewArticles(req, res, next) {
        try {
            const lang = req.query.lang || "fa";
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let whereClause = {
                lang,
                is_active: true,
            };

            const { count, rows } = await Article.findAndCountAll({
                where: whereClause,
                include: [{
                    model: PostCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'image']
                }],
                order: [["created_at", "DESC"]],
                limit,
                offset,
            });

            const metadata = generatePaginationInfo(count, limit, page);
            const responseData = {
                articles: rows,
                metadata,
            };

            return res.status(200).json({
                status: 200,
                data: responseData,
            });
        } catch (e) {
            next(e);
        }
    }

    async getSingleArticle(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const staticCounts = [
                [Sequelize.literal('(SELECT COUNT(*) FROM `article_likes` WHERE `article_likes`.`articleId` = `Article`.`id`)'), 'likes_count'],
                [Sequelize.literal('(SELECT COUNT(*) FROM `article_bookmarks` WHERE `article_bookmarks`.`articleId` = `Article`.`id`)'), 'bookmarks_count'],
                [Sequelize.literal('(SELECT COUNT(*) FROM `comments` WHERE `comments`.`articleId` = `Article`.`id` AND `comments`.`is_active` = true)'), 'comments_count']
            ];

            let userAttributes = [];
            if (userId) {
                userAttributes = [
                    [Sequelize.literal(`(EXISTS(SELECT 1 FROM \`article_likes\` WHERE \`article_likes\`.\`articleId\` = \`Article\`.\`id\` AND \`article_likes\`.\`userId\` = '${userId}'))`), 'is_liked'],
                    [Sequelize.literal(`(EXISTS(SELECT 1 FROM \`article_bookmarks\` WHERE \`article_bookmarks\`.\`articleId\` = \`Article\`.\`id\` AND \`article_bookmarks\`.\`userId\` = '${userId}'))`), 'is_bookmarked']
                ];
            } else {
                userAttributes = [
                    [Sequelize.literal(false), 'is_liked'],
                    [Sequelize.literal(false), 'is_bookmarked']
                ];
            }

            const article = await Article.findOne({
                where: {
                    id,
                    is_active: true,
                },
                include: [{
                    model: PostCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'image']
                }],
                attributes: {
                    exclude: ['updatedAt'],
                    include: [
                        ...staticCounts,
                        ...userAttributes
                    ]
                }
            });

            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found",
                });
            }

            const articleData = article.toJSON();
            articleData.is_liked = !!articleData.is_liked;
            articleData.is_bookmarked = !!articleData.is_bookmarked;

            return res.status(200).json({
                status: 200,
                data: { article: articleData },
            });
        } catch (e) {
            next(e);
        }
    }

    async searchArticles(req, res, next) {
        try {
            const { q, categoryId, post_type, lang } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let whereClause = {
                is_active: true,
                lang: lang || "fa",
            };

            if (categoryId) {
                whereClause.categoryId = categoryId;
            }

            if (post_type) {
                whereClause.post_type = post_type;
            }

            if (q && q.trim() !== "") {
                const searchQuery = `%${q.trim()}%`;
                whereClause[Op.or] = [
                    { title: { [Op.like]: searchQuery } },
                    { content: { [Op.like]: searchQuery } }
                ];
            }

            const { count, rows } = await Article.findAndCountAll({
                where: whereClause,
                include: [{
                    model: PostCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'image']
                }],
                order: [["created_at", "DESC"]],
                limit,
                offset,
                distinct: true
            });

            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: {
                    articles: rows,
                    metadata
                },
            });

        } catch (e) {
            next(e);
        }
    }

    async updateArticle(req, res, next) {
        try {
            const { id } = req.params;
            const { title, content, categoryId, lang, is_active, post_type } = req.body;
            const filePaths = getFileAddress(req);

            const imageAddres = filePaths?.image || null;
            const sourceAddress = filePaths?.source || null;

            const article = await Article.findByPk(id);
            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found",
                });
            }

            if (categoryId) {
                const category = await PostCategory.findByPk(categoryId);
                if (!category) {
                    return res.status(404).json({
                        status: 404,
                        message: "Category not found.",
                    });
                }
            }

            const newPostType = post_type ?? article.post_type;
            let newContent = content ?? article.content;
            let newSource = sourceAddress ?? article.source;

            if (newPostType === "article") {
                if (!newContent) {
                    return res.status(400).json({
                        status: 400,
                        message: "Field `content` is required for articles.",
                    });
                }
                newSource = null;
            } else {
                if (!newSource && !article.source) {
                    return res.status(400).json({
                        status: 400,
                        message: "Field `source` file is required for this post type.",
                    });
                }
                newContent = null;
            }

            await article.update({
                title: title ?? article.title,
                post_type: newPostType,
                content: newContent,
                source: newSource,
                image: imageAddres ?? article.image,
                categoryId: categoryId ?? article.categoryId,
                lang: lang ?? article.lang,
                is_active: is_active ?? article.is_active,
            });

            return res.status(200).json({
                status: 200,
                message: "Article updated successfully",
                data: article,
            });
        } catch (e) {
            next(e);
        }
    }

    async deleteArticle(req, res, next) {
        try {
            const { id } = req.params;

            const article = await Article.findByPk(id);
            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found",
                });
            }

            const comments = await Comment.findAll({
                where: { articleId: id },
                attributes: ['id']
            });
            const commentIds = comments.map(c => c.id);

            if (commentIds.length > 0) {
                await CommentLike.destroy({ where: { commentId: { [Op.in]: commentIds } } });

                await Comment.destroy({ where: { parentId: { [Op.in]: commentIds } } });
                await Comment.destroy({ where: { id: { [Op.in]: commentIds } } });
            }

            await ArticleBookmark.destroy({ where: { articleId: id } });
            await ArticleLike.destroy({ where: { articleId: id } });

            await article.destroy();

            return res.status(200).json({
                status: 200,
                message: "Article and all related data deleted successfully",
            });
        } catch (e) {
            next(e);
        }
    }

    async incrementShare(req, res, next) {
        try {
            const { id } = req.params;

            const article = await Article.findByPk(id);
            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found",
                });
            }

            const updatedArticle = await article.increment("share_count", { by: 1 });

            return res.status(200).json({
                status: 200,
                message: "Share count incremented",
                data: { share_count: updatedArticle.share_count },
            });
        } catch (e) {
            next(e);
        }
    }
}

export const articleController = new ArticleController();