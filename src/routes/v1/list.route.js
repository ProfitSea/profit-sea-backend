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

router
.route('/:listId/analysis')
.get(auth(), validate(listValidation.getList), listController.getListAnalysis)

router.route('/:listId/name').patch(auth(), validate(listValidation.updateListName), listController.updateListName);

router.route('/:listId/list-item').post(auth(), validate(listValidation.addListItem), listController.addListItem);

router
  .route('/:listId/list-item/:listItemId')
  .delete(auth(), validate(listValidation.removeListItem), listController.removeListItem);

module.exports = router;
