import { PostCategory } from "../../database/postgres_sequelize.js";
import { generatePaginationInfo } from "../../utils/functions.js";
import { Sequelize } from "sequelize";
import {getFileAddress} from "../../utils/multer.config.js";

class PostCategoryController {

    /**
     * @desc    Create a new category (Admin)
     * @route   POST /api/admin/categories
     * @access  Private (Admin)
     */
    async createCategory(req, res, next) {
        try {
            const { name, image, parentId, lang } = req.body;

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

    /**
     * @desc    Update a category (Admin)
     * @route   PUT /api/admin/categories/:id
     * @access  Private (Admin)
     */
    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { name, image, parentId, lang, is_active } = req.body;

            const category = await PostCategory.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    status: 404,
                    message: "Category not found",
                });
            }

            // اگر parentId فرستاده شده بود، چک می‌کنیم که خود دسته‌بندی نباشد
            if (parentId && parentId === id) {
                return res.status(400).json({
                    status: 400,
                    message: "Category cannot be its own parent.",
                });
            }

            await category.update({
                name: name ?? category.name,
                image: image ?? category.image,
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

    /**
     * @desc    Delete a category (Admin)
     * @route   DELETE /api/admin/categories/:id
     * @access  Private (Admin)
     */
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

            // اطمینان از اینکه دسته‌بندی فرزند یا پستی نداشته باشد (اختیاری)
            const childrenCount = await PostCategory.count({ where: { parentId: id } });
            if (childrenCount > 0) {
                return res.status(400).json({
                    status: 400,
                    message: "Cannot delete category, it has sub-categories.",
                });
            }

            // (همچنین می‌توانی چک کنی که پستی به این دسته بندی متصل نباشد)
            // const postCount = await Post.count({ where: { categoryId: id } });
            // if (postCount > 0) { ... }


            await category.destroy();


            return res.status(200).json({
                status: 200,
                message: "Category deleted successfully",
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * @desc    Get all categories with children (Admin/User)
     * @route   GET /api/categories
     * @access  Public
     */
    async getCategories(req, res, next) {
        try {
            const lang = req.query.lang || "fa";


            const parentId = req.query.parentId || null;

            const cacheKey = `categories:all:lang:${lang}:parent:${parentId || 'root'}`;


            const whereClause = {
                lang,
                is_active: true,
                parentId: parentId,
            };

            const categories = await PostCategory.findAll({
                where: whereClause,
                order: [["name", "ASC"]],

            });

            const responseData = { categories };

            return res.status(200).json({
                status: 200,
                data: responseData,
                cached: false,
            });
        } catch (e) {
            next(e);
        }
    }
}

export const postCategoryController = new PostCategoryController();