import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { fileURLToPath } from "url";
import { join, dirname } from "path";
import fs from 'fs';
import { Sequelize } from "sequelize";

dotenv.config();

/**
 * Generates a random alphanumeric code of specified length.
 * @param {number} length - The length of the code (default: 8).
 * @returns {string} Random code.
 */
export function generateRandomCode(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

/**
 * Maps validation errors to a structured object.
 * @param {Array} errors - Array of validation error objects.
 * @returns {Object} Mapped error messages by field.
 */
export function validatorMapper(errors = []) {
  let message = {};
  errors.forEach((error) => {
    if (!message[error.path]) {
      message[error.path] = [];
    }
    message[error.path].push(error.msg);
  });
  return message;
}

/**
 * Generates a random OTP code based on environment variable OTP_LENGTH.
 * @returns {string} OTP code.
 */
export function generateOtpCode() {
  const otpLength = process.env.OTP_LENGTH || 4;
  const min = Math.pow(10, otpLength - 1);
  const max = Math.pow(10, otpLength) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Generates a JWT token for a user.
 * @param {number} userId - The ID of the user.
 * @param {string} role - The role of the user.
 * @returns {string} JWT token.
 */
export function generateJWT(userId, role) {
  let token = jwt.sign(
      {
        id: userId,
        role,
      },
      process.env.JWT_PASS,
      {
        expiresIn: "1y",
      }
  );
  return token;
}

/**
 * Generates pagination metadata.
 * @param {number} total_count - Total number of items.
 * @param {number} limit - Items per page.
 * @param {number} page - Current page number.
 * @returns {Object} Pagination metadata.
 */
export function generatePaginationInfo(total_count, limit, page) {
  const total_pages = Math.ceil(total_count / limit);
  const has_last_page = page > 1;
  const has_next_page = page < total_count && total_count > limit;
  let metadata = {
    total_count,
    total_pages,
    has_last_page,
    has_next_page,
  };
  console.log(metadata);
  return metadata;
}

/**
 * Creates a directory path for uploads if it doesn't exist.
 * @param {string} fieldName - The field name for the upload directory.
 * @returns {string} The created upload path.
 */
export function createUploadPath(fieldName) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  let folderPath = join(__dirname, '..', '..', 'public', 'upload', fieldName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  let createdPath = join('public', 'upload', fieldName);
  return createdPath;
}

/**
 * Checks for uniqueness of specified fields in the User model.
 * @param {Object} fields - Fields to check for uniqueness.
 * @param {number} excludeUserId - ID to exclude from uniqueness check.
 * @returns {Array} Array of fields with uniqueness conflicts.
 */
export async function checkForUniqueFields(fields, excludeUserId) {
  const errors = [];

  if (fields.user_name) {
    const user = await User.findOne({ where: { user_name: fields.user_name } });
    if (user && user.id !== excludeUserId) {
      errors.push("user_name");
    }
  }

  if (fields.instagram_id) {
    const user = await User.findOne({ where: { instagram_id: fields.instagram_id } });
    if (user && user.id !== excludeUserId) {
      errors.push("instagram_id");
    }
  }

  if (fields.fcm_token) {
    const user = await User.findOne({ where: { fcm_token: fields.fcm_token } });
    if (user && user.id !== excludeUserId) {
      errors.push("fcm_token");
    }
  }

  if (fields.avatar) {
    const user = await User.findOne({ where: { avatar: fields.avatar } });
    if (user && user.id !== excludeUserId) {
      errors.push("avatar");
    }
  }

  return errors;
}