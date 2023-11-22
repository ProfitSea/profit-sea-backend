const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const listItemValidation = require('../../validations/listItem.validation');
const listItemController = require('../../controllers/lisItem.controller');

const router = express.Router();

router
  .route('/quantity')
  .patch(auth(), validate(listItemValidation.updateListItemQuantity), listItemController.updateListItemQuantity);

router
  .route('/price')
  .patch(auth(), validate(listItemValidation.updateListItemPrice), listItemController.updateListItemPrice);

module.exports = router;
