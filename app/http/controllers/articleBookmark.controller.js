import { Article, ArticleBookmark, User, PostCategory } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { Sequelize } from "sequelize";

class ArticleBookmarkController {

    async toggleBookmark(req, res, next) {
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

            const existingBookmark = await ArticleBookmark.findOne({
                where: { userId, articleId },
            });

            if (existingBookmark) {
                await existingBookmark.destroy();
                return res.status(200).json({ status: 200, message: "Bookmark removed successfully." });
            } else {
                const bookmark = await ArticleBookmark.create({ userId, articleId });
                return res.status(201).json({ status: 201, message: "Article bookmarked successfully.", data: bookmark });
            }
        } catch (e) {
            next(e);
        }
    }

    async getMyBookmarks(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows } = await ArticleBookmark.findAndCountAll({
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

            const bookmarks = rows.map(bookmark => bookmark.Article);
            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { bookmarks, metadata },
            });

        } catch (e) {
            next(e);
        }
    }

    async getAllBookmarksAdmin(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const { userId } = req.query;

            let whereClause = {};
            if (userId) {
                whereClause.userId = userId;
            }

            const { count, rows } = await ArticleBookmark.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'firstname', 'lastname', 'phone']
                    },
                    {
                        model: Article,
                        attributes: ['id', 'title']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { bookmarks: rows, metadata }
            });

        } catch (e) {
            next(e);
        }
    }
}

export const articleBookmarkController = new ArticleBookmarkController();