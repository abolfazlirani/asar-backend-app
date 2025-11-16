import { Op } from "sequelize";
import { Article, PostCategory } from "../database/postgres_sequelize.js";
import { buildDeepLink } from "../utils/deep_link.helper.js";

export class PageService {

    async resolvePageLayout(layout) {
        if (!layout || !Array.isArray(layout.rows)) {
            return { rows: [] };
        }

        const resolvedRows = [];

        for (const row of layout.rows) {
            if (row.dataSource) {
                const items = await this._resolveDataSource(row.dataSource);
                resolvedRows.push({ ...row, items, dataSource: undefined });
            } else {
                resolvedRows.push(row);
            }
        }

        return { rows: resolvedRows };
    }

    async _resolveDataSource(dataSource) {
        try {
            switch (dataSource.type) {
                case "posts":
                    return await this._fetchPosts(dataSource);
                case "categories":
                    return await this._fetchCategories(dataSource);
                default:
                    return [];
            }
        } catch (error) {
            console.error("Failed to resolve data source:", error);
            return [];
        }
    }

    async _fetchPosts(dataSource) {
        let whereClause = {
            is_active: true,
        };

        if (Array.isArray(dataSource.postIds) && dataSource.postIds.length > 0) {
            whereClause.id = { [Op.in]: dataSource.postIds };
        }

        if (dataSource.filters?.lang) {
            whereClause.lang = dataSource.filters.lang;
        }

        const limit = dataSource.limit || 5;
        const sort = dataSource.sort === "popular" ? ["share_count", "DESC"] : ["created_at", "DESC"];

        const articles = await Article.findAll({
            where: whereClause,
            limit: limit,
            order: [sort],
        });

        return articles.map(article => ({
            id: article.id,
            title: article.title,
            subtitle: null,
            imageUrl: article.image,
            link: buildDeepLink("post", article.id),
        }));
    }

    async _fetchCategories(dataSource) {
        let whereClause = {
            is_active: true,
        };

        if (Array.isArray(dataSource.categoryIds) && dataSource.categoryIds.length > 0) {
            whereClause.id = { [Op.in]: dataSource.categoryIds };
        }

        if (dataSource.filters?.lang) {
            whereClause.lang = dataSource.filters.lang;
        }

        const limit = dataSource.limit || 5;

        const categories = await PostCategory.findAll({
            where: whereClause,
            limit: limit,
            order: [["name", "ASC"]],
        });

        return categories.map(category => ({
            id: category.id,
            title: category.name,
            subtitle: null,
            imageUrl: category.image,
            link: buildDeepLink("category", category.id),
        }));
    }
}