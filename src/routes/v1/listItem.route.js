const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const listItemValidation = require('../../validations/listItem.validation');
const listItemController = require('../../controllers/lisItem.controller');

const router = express.Router();

router
  .route('/:baseListItemId/add-comparison-product/:comparisonListItemId?')
  .post(auth(), validate(listItemValidation.addComparisonProduct), listItemController.addComparisonProduct);

router
  .route('/:baseListItemId/remove-comparison-product/:comparisonListItemId?')
  .post(auth(), validate(listItemValidation.removeComparisonProduct), listItemController.removeComparisonProduct);
router
  .route('/')
  .get(auth(), validate(listItemValidation.getListItem), listItemController.getListItem)
  .patch(
    auth(),
    validate(listItemValidation.updateListItemPricesByProductNumber),
    listItemController.updateListItemPricesByProductNumber
  );

router.route('/:id').get(auth(), validate(listItemValidation.getListItemById), listItemController.getListItemById);
router
  .route('/toggle-anchor/:id')
  .patch(auth(), validate(listItemValidation.toggleListItemAnchor), listItemController.toggleListItemAnchor);

router
  .route('/toggle-isSelected/:id')
  .patch(auth(), validate(listItemValidation.toggleListItemIsSelected), listItemController.toggleListItemIsSelected);

// router
//   .route('/toggle-isRejected/:id')
//   .get(auth(), validate(listItemValidation.toggleListItemIsRejected), listItemController.toggleListItemIsRejected);

router
  .route('/quantity')
  .patch(auth(), validate(listItemValidation.updateListItemQuantity), listItemController.updateListItemQuantity);

router
  .route('/price')
  .patch(auth(), validate(listItemValidation.updateListItemPrice), listItemController.updateListItemPrice);

module.exports = router;
