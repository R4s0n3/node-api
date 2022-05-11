const express = require('express');
const {check} = require('express-validator'); // for signup validation
const categoriesControllers = require('../controllers/categories-controllers');
const checkAuth = require('../middleware/check-auth');
const router = express.Router();

router.get('/', categoriesControllers.getCategories);
router.get('/:cid', categoriesControllers.getCategoryById);

router.use(checkAuth); // !!! EVERYTHING SAVE BELOW !!!

router.post('/',[
    check('title').not().isEmpty()
], categoriesControllers.createCategory);
router.patch('/:cid', categoriesControllers.updateCategory);
router.delete('/:cid', categoriesControllers.deleteCategory);


module.exports = router;