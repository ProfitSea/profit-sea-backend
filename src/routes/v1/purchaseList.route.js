const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const purchaseListValidation = require('../../validations/purchaseList.validation');
const purchaseListController = require('../../controllers/purchaseList.controller');

const router = express.Router();

router
  .route('/upsert')
  .get(auth(), validate(purchaseListValidation.upsertPurchaseList), purchaseListController.upsertPurchaseList);

router.route('/').get(auth(), validate(purchaseListValidation.getPurchaseList), purchaseListController.getPurchaseList);

router
  .route('/:purchaseListId/name')
  .patch(auth(), validate(purchaseListValidation.updatePurchaseListName), purchaseListController.updatePurchaseListName);

router
  .route('/:purchaseListId/remove-item/:purchaseListItemId')
  .delete(
    auth(),
    validate(purchaseListValidation.removePurchaseListItemById),
    purchaseListController.removePurchaseListItemById
  );

module.exports = router;
