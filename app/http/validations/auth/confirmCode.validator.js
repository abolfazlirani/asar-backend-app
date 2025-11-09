import { body } from "express-validator";

function confirmCodeValidator() {
  return [
    body("phone")
      .not()
      .isEmpty()
      .withMessage("phone number must not be empty")
      .isMobilePhone("fa-IR")
      .withMessage("invalid phone number"),
    body("code")
    .not()
    .isEmpty()
    .withMessage("code must not be empty"),
  ];
}

export { confirmCodeValidator };
