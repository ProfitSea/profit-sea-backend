const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const purchaseListValidation = require('../../validations/purchaseList.validation');
const purchaseListController = require('../../controllers/purchaseList.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(purchaseListValidation.createPurchaseList), purchaseListController.createPurchaseList);

module.exports = router;
