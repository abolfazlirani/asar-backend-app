import { faker } from "@faker-js/faker";
import { Router } from "express";
import {
    Application_Section,
  Font,
  Plan,
  Post,
  PostCategory,
  Sticker,
  StickerCategory,
  Suggestions,
  User,
} from "../database/postgres_sequelize.js";
import { Sequelize } from "sequelize";
export const seedRouter = Router();

seedRouter.route("/").get(async (req, res) => {
  let fontLink = "https://storysaz-upload.storage.c2.liara.space/Tanha.ttf";
  let stickerCategoryImageLink =
    "https://storysaz-upload.storage.c2.liara.space/stickerCategory.png";
  let stickerImageLink =
    "https://storysaz-upload.storage.c2.liara.space/sticker.png";
  let postCategoryImage =
    "https://storysaz-upload.storage.c2.liara.space/postcategory.png";
  //create 6 user
  for (let i = 0; i < 6; i++) {
    let randNumber = Math.floor(Math.random() * 9);
    let user = {
      user_name: faker.internet.username(),
      full_name: faker.person.fullName(),
      instagram_id: faker.internet.displayName(),
      phone: `0919916217${randNumber}`,
      avatar: faker.image.avatarGitHub(),
      coin: faker.number.bigInt({ min: 1, max: 100 }),
    };
    await User.create(user);
  }

  // create  6 plan
  for (let i = 0; i < 6; i++) {
    let plan = {
      name: faker.commerce.productName(),
      discount: faker.number.bigInt({ min: 1, max: 1000 }),
      price: faker.number.bigInt({ min: 100, max: 1000 }),
      coin: faker.number.bigInt({ min: 1, max: 100 }),
      more_coins: faker.number.bigInt({ min: 1, max: 100 }),
      is_active: faker.datatype.boolean(),
      lang: faker.datatype.boolean() ? "fa" : "en",
    };
    await Plan.create(plan);
  }
  // create 6 font
  for (let i = 0; i < 6; i++) {
    let font = {
      name: faker.commerce.productName(),
      is_active: faker.datatype.boolean(),
      file: fontLink,
      lang: faker.datatype.boolean() ? "fa" : "en",
    };
    await Font.create(font);
  }
  // create 6 sticker category
  for (let i = 0; i < 6; i++) {
    let stickerCategory = {
      name: faker.commerce.productName(),
      image: stickerImageLink,
      lang: faker.datatype.boolean() ? "fa" : "en",
    };
    await StickerCategory.create(stickerCategory);
  }
  // create 6 sticker with random stickerCategory from database
  for (let i = 0; i < 6; i++) {
    let stickerLang = faker.datatype.boolean() ? "fa" : "en";
    //query random stickerCategory
    let category = await StickerCategory.findOne({
      where: {
        [Sequelize.Op.and]: [{ is_active: true }, { lang: stickerLang }],
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let sticker = {
      name: faker.commerce.productName(),
      image: stickerImageLink,
      categoryId: faker.number.bigInt({ min: 1, max: 6 }),
      lang: stickerLang,
      categoryId: category.dataValues.id,
    };
    await Sticker.create(sticker);
  }
  // create 6 post category
  let mainCatNames = ["reels", "covers", "story", "profile", "others"];
  for (let i = 0; i < mainCatNames.length; i++) {
    let postCategory = {
      name: mainCatNames[i],
      image: postCategoryImage,
      lang: faker.datatype.boolean() ? "fa" : "en",
    };
    await PostCategory.create(postCategory);
  }
  // sub category
  for (let i = 0; i < 6; i++) {
    let subCategoryLang = faker.datatype.boolean() ? "fa" : "en";
    let parentCategory = await PostCategory.findOne({
      where: {
        [Sequelize.Op.and]: [{ is_active: true }, { lang: subCategoryLang }],
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let postCategory = {
      name: faker.commerce.productName(),
      image: postCategoryImage,
      lang: faker.datatype.boolean() ? "fa" : "en",
      parentId: parentCategory.dataValues.id,
    };
    await PostCategory.create(postCategory);
  }
  for (let i = 0; i < 6; i++) {
    // select sub category where parentId not null same as lang and active
    let postLang = faker.datatype.boolean() ? "fa" : "en";
    let category = await PostCategory.findOne({
      where: {
        [Sequelize.Op.and]: [
          { is_active: true },
          { lang: postLang },
          { parentId: { [Sequelize.Op.ne]: null } },
        ],
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let user = await User.findOne({
      where: {
        is_active: true,
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let post = {
      name: faker.location.city(),
      image: stickerCategoryImageLink,
      lang: postLang,
      categoryId: category.dataValues.id,
      userId: user.dataValues.id,
      view: faker.number.bigInt({ min: 1, max: 1000 }),
      cost: faker.number.bigInt({ min: 1, max: 100000 }),
      json: `{"":"","":"","":""}`,
    };
    await Post.create(post);
  }
  res.status(200).json({ message: "seed created" });
});
seedRouter.route("/section").get(async (req, res, next) => {
  let sectionLang = "fa";
  let section = {
    name: faker.commerce.productName(),
    lang: sectionLang,
  };
  // select 10 rand posts
  let posts = await Post.findAll({
    where: {
      [Sequelize.Op.and]: [{ lang: sectionLang }, { is_active: true }],
    },
    limit: 10,
    order: [[Sequelize.fn("RANDOM")]],
  });
  let crteatedsec=await Application_Section.create(section);
  await crteatedsec.addPosts(posts);
  res.status(200).json({ message: "seed created" });
});
seedRouter.route('/suggestion').get(async (req, res, next) => {
  let suggestionLang = faker.datatype.boolean()?'fa':'en'
  let suggestionInfo = {
    type: faker.commerce.productName(),
    lang: suggestionLang,
  };
  // select 10 rand posts
  let posts = await Post.findAll({
    where: {
      [Sequelize.Op.and]: [{ lang: suggestionLang }, { is_active: true }],
    },
    limit: 10,
    order: [[Sequelize.fn("RANDOM")]],
  });
  let createdSuggestion=await Suggestions.create(suggestionInfo)
  await createdSuggestion.addPosts(posts);
  res.status(200).json({ message: "seed created" });
})
seedRouter.route('/posts').get(async (req, res, next) => {
  for (let i = 0; i < 10; i++) {
    // select sub category where parentId not null same as lang and active
    let postLang = "fa";
    let category = await PostCategory.findOne({
      where: {
        [Sequelize.Op.and]: [
          { is_active: true },
          { lang: postLang },
          { parentId: { [Sequelize.Op.ne]: null } },
        ],
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let user = await User.findOne({
      where: {
        is_active: true,
      },
      order: [[Sequelize.fn("RANDOM")]],
    });
    let post = {
      name: faker.location.city(),
      image: "https://storysaz-upload.storage.c2.liara.space/file/file-1744486037810-cover_template_1744486033588.png",
      lang: postLang,
      categoryId: "835581e5-a708-44b8-8ba6-5222dbe6b5e2",
      userId: user.dataValues.id,
      view: faker.number.bigInt({ min: 1, max: 1000 }),
      cost: faker.number.bigInt({ min: 1, max: 100000 }),
      json: `https://storysaz-upload.storage.c2.liara.space/file/file-1744486034335-json_template_1744486031925.json`,
    };
    await Post.create(post);
  }
  res.status(200).json({ message: "seed created" });
})