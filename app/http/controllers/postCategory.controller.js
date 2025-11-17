import { PostCategory } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { Sequelize } from "sequelize";
import { getFileAddress } from "../../utils/multer.config.js";

class PostCategoryController {

    async createCategory(req, res, next) {
        try {
            const { name, parentId, lang } = req.body;
            var imageAddres = getFileAddress(req);

            if (!name) {
                return res.status(400).json({
                    status: 400,
                    message: "Field `name` is required.",
                });
            }

            const category = await PostCategory.create({
                name,
                image: imageAddres || null,
                parentId: parentId || null,
                lang: lang || "fa",
            });


            return res.status(201).json({
                status: 201,
                message: "Category created successfully",
                data: category,
            });
        } catch (e) {
            next(e);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { name, parentId, lang, is_active } = req.body;
            const imageAddres = getFileAddress(req);

            const category = await PostCategory.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    status: 404,
                    message: "Category not found",
                });
            }

            if (parentId && parentId === id) {
                return res.status(400).json({
                    status: 400,
                    message: "Category cannot be its own parent.",
                });
            }

            await category.update({
                name: name ?? category.name,
                image: imageAddres ?? category.image,
                parentId: parentId ?? category.parentId,
                lang: lang ?? category.lang,
                is_active: is_active ?? category.is_active,
            });


            return res.status(200).json({
                status: 200,
                message: "Category updated successfully",
                data: category,
            });
        } catch (e) {
            next(e);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;

            const category = await PostCategory.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    status: 404,
                    message: "Category not found",
                });
            }

            const childrenCount = await PostCategory.count({ where: { parentId: id } });
            if (childrenCount > 0) {
                return res.status(400).json({
                    status: 400,
                    message: "Cannot delete category, it has sub-categories.",
                });
            }

            await category.destroy();


            return res.status(200).json({
                status: 200,
                message: "Category deleted successfully",
            });
        } catch (e) {
            next(e);
        }
    }

    async getCategories(req, res, next) {
        try {
            const lang = req.query.lang || "fa";
            const parentId = req.query.parentId || null;

            const whereClause = {
                lang,
                is_active: true,
                parentId: parentId,
            };

            const includeChildren = {
                model: PostCategory,
                as: 'children',
                required: false,
                include: []
            };

            const level3 = JSON.parse(JSON.stringify(includeChildren));
            const level2 = JSON.parse(JSON.stringify(includeChildren));
            level2.include = [level3];
            const level1 = JSON.parse(JSON.stringify(includeChildren));
            level1.include = [level2];


            const categories = await PostCategory.findAll({
                where: whereClause,
                order: [["name", "ASC"]],
                include: [
                    {
                        model: PostCategory,
                        as: 'children',
                        required: false,
                        include: [
                            {
                                model: PostCategory,
                                as: 'children',
                                required: false,
                                include: [
                                    {
                                        model: PostCategory,
                                        as: 'children',
                                        required: false,
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            const responseData = { categories };

            return res.status(200).json({
                status: 200,
                data: responseData,
            });
        } catch (e) {
            next(e);
        }
    }

    async getAllCategoriesAdmin(req, res, next) {
        try {
            const lang = req.query.lang || "fa";

            const whereClause = {
                lang,
            };

            const categories = await PostCategory.findAll({
                where: whereClause,
                order: [["name", "ASC"]],
            });

            const responseData = { categories };

            return res.status(200).json({
                status: 200,
                data: responseData,
            });
        } catch (e) {
            next(e);
        }
    }
}

export const postCategoryController = new PostCategoryController();