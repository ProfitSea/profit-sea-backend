const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const listValidation = require('../../validations/list.validation');
const listController = require('../../controllers/list.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(listValidation.createList), listController.createList)
  .get(auth(), validate(listValidation.getLists), listController.getLists);

router
  .route('/:listId')
  .get(auth(), validate(listValidation.getList), listController.getList)
  .patch(auth(), validate(listValidation.updateList), listController.updateList)
  .delete(auth(), validate(listValidation.deleteList), listController.deleteList);

module.exports = router;
