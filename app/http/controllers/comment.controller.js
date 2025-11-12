import { Article, Comment, CommentLike, User } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { Sequelize, Op } from "sequelize";

class CommentController {

    async createComment(req, res, next) {
        try {
            const userId = req.user.id;
            const { articleId, content, parentId } = req.body;

            if (!content || !articleId) {
                return res.status(400).json({
                    status: 400,
                    message: "Fields `content` and `articleId` are required.",
                });
            }

            const article = await Article.findByPk(articleId);
            if (!article) {
                return res.status(404).json({
                    status: 404,
                    message: "Article not found.",
                });
            }

            if (parentId) {
                const parentComment = await Comment.findByPk(parentId);
                if (!parentComment) {
                    return res.status(404).json({
                        status: 404,
                        message: "Parent comment not found.",
                    });
                }
            }

            const comment = await Comment.create({
                userId,
                articleId,
                content,
                parentId: parentId || null,
                is_active: false,
            });

            return res.status(201).json({
                status: 201,
                message: "Comment submitted successfully and awaiting approval.",
                data: comment,
            });
        } catch (e) {
            next(e);
        }
    }

    async likeComment(req, res, next) {
        try {
            const userId = req.user.id;
            const { id: commentId } = req.params;
            const { status } = req.body;

            if (!status || !['like', 'dislike', 'none'].includes(status)) {
                return res.status(400).json({
                    status: 400,
                    message: "Field `status` must be 'like', 'dislike', or 'none'.",
                });
            }

            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({
                    status: 404,
                    message: "Comment not found.",
                });
            }

            const existingLike = await CommentLike.findOne({
                where: { userId, commentId },
            });

            if (status === 'none') {
                if (existingLike) {
                    await existingLike.destroy();
                    return res.status(200).json({ status: 200, message: "Action removed successfully." });
                }
                return res.status(200).json({ status: 200, message: "No action to remove." });
            }

            if (existingLike) {
                if (existingLike.status === status) {
                    await existingLike.destroy();
                    return res.status(200).json({ status: 200, message: "Action removed successfully." });
                } else {
                    existingLike.status = status;
                    await existingLike.save();
                    return res.status(200).json({ status: 200, message: `Comment updated to ${status}.`, data: existingLike });
                }
            } else {
                const newLike = await CommentLike.create({ userId, commentId, status });
                return res.status(201).json({ status: 201, message: `Comment ${status}d successfully.`, data: newLike });
            }

        } catch (e) {
            next(e);
        }
    }

    async getCommentLikeStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const { id: commentId } = req.params;

            const existingLike = await CommentLike.findOne({
                where: { userId, commentId },
                attributes: ['status']
            });

            if (!existingLike) {
                return res.status(200).json({
                    status: 200,
                    data: { status: 'none' }
                });
            }

            return res.status(200).json({
                status: 200,
                data: { status: existingLike.status }
            });

        } catch (e) {
            next(e);
        }
    }

    async getCommentsForArticle(req, res, next) {
        try {
            const { articleId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const userId = req.user?.id;

            const subQueryAttributes = (commentAlias = 'Comment') => {
                const attributes = [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM \`comment_likes\` AS \`likes\`
                            WHERE
                                \`likes\`.\`commentId\` = \`${commentAlias}\`.\`id\` AND \`likes\`.\`status\` = 'like'
                        )`),
                        'likes_count'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM \`comment_likes\` AS \`dislikes\`
                            WHERE
                                \`dislikes\`.\`commentId\` = \`${commentAlias}\`.\`id\` AND \`dislikes\`.\`status\` = 'dislike'
                        )`),
                        'dislikes_count'
                    ]
                ];

                if (userId) {
                    attributes.push([
                        Sequelize.literal(`(
                            SELECT \`status\`
                            FROM \`comment_likes\`
                            WHERE
                                \`comment_likes\`.\`commentId\` = \`${commentAlias}\`.\`id\` AND \`comment_likes\`.\`userId\` = '${userId}'
                        )`),
                        'userLikeStatus'
                    ]);
                }

                return attributes;
            };

            const { count, rows } = await Comment.findAndCountAll({
                where: {
                    articleId,
                    is_active: true,
                    parentId: null
                },
                attributes: {
                    include: subQueryAttributes('Comment'),
                    exclude: ['updatedAt', 'articleId']
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'firstname', 'lastname', 'profile_pic']
                    },
                    {
                        model: Comment,
                        as: 'replies',
                        where: { is_active: true },
                        required: false,
                        attributes: {
                            include: subQueryAttributes('replies'),
                            exclude: ['updatedAt', 'articleId']
                        },
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'firstname', 'lastname', 'profile_pic']
                        }]
                    }
                ],
                limit,
                offset,
                order: [['created_at', 'DESC']],
                distinct: true
            });

            const comments = rows.map(comment => {
                const c = comment.toJSON();
                if (userId) {
                    c.userLikeStatus = c.userLikeStatus || 'none';
                    if(c.replies) {
                        c.replies.forEach(reply => {
                            reply.userLikeStatus = reply.userLikeStatus || 'none';
                        });
                    }
                }
                return c;
            });


            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { comments, metadata },
            });

        } catch (e) {
            next(e);
        }
    }

    async getAllCommentsAdmin(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const isActive = req.query.is_active;

            let whereClause = {};
            if (isActive !== undefined) {
                whereClause.is_active = (isActive === 'true');
            }

            const { count, rows } = await Comment.findAndCountAll({
                where: whereClause,
                include: [
                    { model: User, as: 'user', attributes: ['id', 'phone'] },
                    { model: Article, attributes: ['id', 'title'] }
                ],
                limit,
                offset,
                order: [['created_at', 'DESC']]
            });

            const metadata = generatePaginationInfo(count, limit, page);

            return res.status(200).json({
                status: 200,
                data: { comments: rows, metadata }
            });

        } catch (e) {
            next(e);
        }
    }

    async updateCommentAdmin(req, res, next) {
        try {
            const { id } = req.params;
            const { content, is_active } = req.body;

            const comment = await Comment.findByPk(id);
            if (!comment) {
                return res.status(404).json({
                    status: 404,
                    message: "Comment not found."
                });
            }

            if (content !== undefined) {
                comment.content = content;
            }
            if (is_active !== undefined) {
                comment.is_active = is_active;
            }

            await comment.save();

            return res.status(200).json({
                status: 200,
                message: "Comment updated successfully.",
                data: comment
            });

        } catch (e) {
            next(e);
        }
    }

    async deleteCommentAdmin(req, res, next) {
        try {
            const { id } = req.params;

            const comment = await Comment.findByPk(id);
            if (!comment) {
                return res.status(404).json({
                    status: 404,
                    message: "Comment not found."
                });
            }

            await CommentLike.destroy({ where: { commentId: id } });
            await Comment.destroy({ where: { parentId: id } });
            await comment.destroy();

            return res.status(200).json({
                status: 200,
                message: "Comment and its replies deleted successfully."
            });

        } catch (e) {
            next(e);
        }
    }
}

export const commentController = new CommentController();