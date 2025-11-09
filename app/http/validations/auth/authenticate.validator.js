import { body } from "express-validator";

function authenticateUserValidator() {
  return [
    body("phone").not().isEmpty().withMessage('phone number must not be empty')
      .isMobilePhone("fa-IR")
      .withMessage("invalid phone number"),
  ];
}

export { authenticateUserValidator };
