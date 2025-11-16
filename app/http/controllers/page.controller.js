import { Page } from "../../database/postgres_sequelize.js";
import { PageService } from "../../services/page.service.js";
import { generatePaginationInfo } from "../../utils/functions.js";

const pageService = new PageService();

class PageController {

    async getPageBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const lang = req.query.lang || "fa";

            const page = await Page.findOne({
                where: {
                    slug,
                    language: lang,
                    is_active: true,
                },
            });

            if (!page) {
                return res.status(404).json({
                    status: 404,
                    message: "Page not found",
                });
            }

            let layout;
            try {
                layout = JSON.parse(page.layout_json);
            } catch (e) {
                return res.status(500).json({
                    status: 500,
                    message: "Failed to parse page layout",
                });
            }

            const resolvedLayout = await pageService.resolvePageLayout(layout);

            const responseData = {
                slug: page.slug,
                language: page.language,
                title: page.title,
                ...resolvedLayout,
            };

            return res.status(200).json({
                status: 200,
                data: responseData,
            });

        } catch (e) {
            next(e);
        }
    }

    async createPage(req, res, next) {
        try {
            const { title, slug, language, layout_json } = req.body;

            if (!slug || !language || !layout_json) {
                return res.status(400).json({
                    status: 400,
                    message: "Fields slug, language, and layout_json are required.",
                });
            }

            try {
                JSON.parse(layout_json);
            } catch (e) {
                return res.status(400).json({
                    status: 400,
                    message: "Field layout_json contains invalid JSON.",
                });
            }

            const existingPage = await Page.findOne({ where: { slug, language } });
            if (existingPage) {
                return res.status(409).json({
                    status: 409,
                    message: "A page with this slug and language already exists.",
                });
            }

            const page = await Page.create({
                title,
                slug,
                language,
                layout_json,
                is_active: req.body.is_active ?? true,
            });

            return res.status(201).json({
                status: 201,
                message: "Page created successfully",
                data: page,
            });
        } catch (e) {
            next(e);
        }
    }

    async getAllPages(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await Page.findAndCountAll({
                order: [["created_at", "DESC"]],
                limit,
                offset,
            });

            const metadata = generatePaginationInfo(count, limit, page);
            const responseData = {
                pages: rows,
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

    async getPageById(req, res, next) {
        try {
            const { id } = req.params;
            const page = await Page.findByPk(id);

            if (!page) {
                return res.status(404).json({
                    status: 404,
                    message: "Page not found",
                });
            }

            return res.status(200).json({
                status: 200,
                data: page,
            });
        } catch (e) {
            next(e);
        }
    }

    async updatePage(req, res, next) {
        try {
            const { id } = req.params;
            const { title, slug, language, layout_json, is_active } = req.body;

            const page = await Page.findByPk(id);
            if (!page) {
                return res.status(404).json({
                    status: 404,
                    message: "Page not found",
                });
            }

            if (layout_json) {
                try {
                    JSON.parse(layout_json);
                } catch (e) {
                    return res.status(400).json({
                        status: 400,
                        message: "Field layout_json contains invalid JSON.",
                    });
                }
            }

            if (slug && language && (slug !== page.slug || language !== page.language)) {
                const existingPage = await Page.findOne({ where: { slug, language } });
                if (existingPage && existingPage.id !== id) {
                    return res.status(409).json({
                        status: 409,
                        message: "A page with this slug and language already exists.",
                    });
                }
            }

            await page.update({
                title: title ?? page.title,
                slug: slug ?? page.slug,
                language: language ?? page.language,
                layout_json: layout_json ?? page.layout_json,
                is_active: is_active ?? page.is_active,
            });

            return res.status(200).json({
                status: 200,
                message: "Page updated successfully",
                data: page,
            });
        } catch (e) {
            next(e);
        }
    }

    async deletePage(req, res, next) {
        try {
            const { id } = req.params;

            const page = await Page.findByPk(id);
            if (!page) {
                return res.status(404).json({
                    status: 404,
                    message: "Page not found",
                });
            }

            await page.destroy();

            return res.status(200).json({
                status: 200,
                message: "Page deleted successfully",
            });
        } catch (e) {
            next(e);
        }
    }
}

export const pageController = new PageController();