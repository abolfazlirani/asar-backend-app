import { Article, ArticleLike, User, PostCategory } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { Sequelize } from "sequelize";

class ArticleLikeController {

    async toggleLike(req, res, next) {
        try {
            const userId = req.user.id;
            const { id: articleId } = req.params;

            const article = await Article.findOne({
                where: { id: articleId, is_active: true }
            });

            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found or is inactive.",
                });
            }

            const existingLike = await ArticleLike.findOne({
                where: { userId, articleId },
            });

            if (existingLike) {
                await existingLike.destroy();
                return res.status(200).json({ status: 200, message: "Article unliked successfully." });
            } else {
                const like = await ArticleLike.create({ userId, articleId });
                return res.status(201).json({ status: 201, message: "Article liked successfully.", data: like });
            }
        } catch (e) {
            next(e);
        }
    }

    async getArticleLikeStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const { id: articleId } = req.params;

            const existingLike = await ArticleLike.findOne({
                where: { userId, articleId },
            });

            return res.status(200).json({
                status: 200,
                data: { liked: !!existingLike }
            });

        } catch (e) {
            next(e);
        }
    }

    async getMyLikedArticles(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await ArticleLike.findAndCountAll({
                where: { userId },
                include: [
                    {
                        model: Article,
                        where: { is_active: true },
                        required: true,
                        include: [{
                            model: PostCategory,
                            as: 'category',
                            attributes: ['id', 'name']
                        }]
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
                distinct: true
            });

            const articles = rows.map(like => like.Article);
            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { articles, metadata },
            });

        } catch (e) {
            next(e);
        }
    }

    async getArticleLikerListAdmin(req, res, next) {
        try {
            const { id: articleId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const article = await Article.findByPk(articleId);
            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found."
                });
            }

            const { count, rows } = await ArticleLike.findAndCountAll({
                where: { articleId },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'firstname', 'lastname', 'phone', 'profile_pic']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            const users = rows.map(like => like.User);
            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { users, metadata }
            });

        } catch (e) {
            next(e);
        }
    }
}

export const articleLikeController = new ArticleLikeController();