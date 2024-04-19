const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const purchaseListValidation = require('../../validations/purchaseList.validation');
const purchaseListController = require('../../controllers/purchaseList.controller');

const router = express.Router();

router
  .route('/upsert')
  .get(auth(), validate(purchaseListValidation.upsertPurchaseList), purchaseListController.upsertPurchaseList);

// router
//   .route('/:purchaseListItemId')
//   .delete(auth(), validate(purchaseListValidation.removePurchaseListItem), purchaseListController.removePurchaseListItem);

router
  .route('/:listId')
  .get(auth(), validate(purchaseListValidation.getPurchaseList), purchaseListController.getPurchaseList);

// router
//   .route('/:purchaseListId')
//   .post(auth(), validate(purchaseListValidation.addPurchaseListItem), purchaseListController.addPurchaseListItem)
//   .delete(auth(), validate(purchaseListValidation.deleteList), purchaseListController.deletePurchaseList);

router
  .route('/:purchaseListId/name')
  .patch(auth(), validate(purchaseListValidation.updatePurchaseListName), purchaseListController.updatePurchaseListName);

// router
//   .route('/:purchaseListId')
//   .post(auth(), validate(purchaseListValidation.addPurchaseListItem), purchaseListController.addPurchaseListItem);

module.exports = router;
