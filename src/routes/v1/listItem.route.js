const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const listItemValidation = require('../../validations/listItem.validation');
const listItemController = require('../../controllers/lisItem.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), validate(listItemValidation.getListItem), listItemController.getListItem)
  .patch(
    auth(),
    validate(listItemValidation.updateListItemPricesByProductNumber),
    listItemController.updateListItemPricesByProductNumber
  );

router.route('/:id').get(auth(), listItemController.getListItemById);

router
  .route('/quantity')
  .patch(auth(), validate(listItemValidation.updateListItemQuantity), listItemController.updateListItemQuantity);

router
  .route('/price')
  .patch(auth(), validate(listItemValidation.updateListItemPrice), listItemController.updateListItemPrice);

module.exports = router;
