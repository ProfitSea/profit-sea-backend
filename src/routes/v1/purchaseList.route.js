const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const purchaseListValidation = require('../../validations/purchaseList.validation');
const purchaseListController = require('../../controllers/purchaseList.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(purchaseListValidation.createPurchaseList), purchaseListController.createPurchaseList)
  .get(auth(), validate(purchaseListValidation.getPurchaseLists), purchaseListController.getPurchaseLists);

router
  .route('/:purchaseListId')
  .get(auth(), validate(purchaseListValidation.getPurchaseList), purchaseListController.getPurchaseList)
  .delete(auth(), validate(purchaseListValidation.deleteList), purchaseListController.deletePurchaseList);

router
  .route('/:purchaseListId/name')
  .patch(auth(), validate(purchaseListValidation.updatePurchaseListName), purchaseListController.updatePurchaseListName);

router
  .route('/:purchaseListId/list-item/:listItemId')
  .post(auth(), validate(purchaseListValidation.addPurchaseListItem), purchaseListController.addPurchaseListItem);

router
  .route('/:purchaseListId/list-item/:purchaseListItemId')
  .delete(auth(), validate(purchaseListValidation.removePurchaseListItem), purchaseListController.removePurchaseListItem);

module.exports = router;
