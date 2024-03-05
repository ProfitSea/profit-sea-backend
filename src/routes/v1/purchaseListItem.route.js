const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const purchaseListItemValidation = require('../../validations/purchaseListItem.validation');
const purchaseLisItemController = require('../../controllers/purchaseLisItem.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), validate(purchaseListItemValidation.getPurchaseListsItems), purchaseLisItemController.getPurchaseListItems);

router
  .route('/:purchaseListItemId?')
  .get(
    auth(),
    validate(purchaseListItemValidation.getPurchaseListItemById),
    purchaseLisItemController.getPurchaseListItemById
  );

module.exports = router;
