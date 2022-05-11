const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');

const Category = require('../models/category');

const getCategories = async (req,res,next) =>{
    let categories;
    try{
        categories = await Category.find({});
    }catch(err){
        const error = new HttpError(
            'Fetching Categories failed, please try again later.',
            500
        )
    }
    
    res.json({ categories: categories.map(category => category.toObject({ getters: true }))});
}
const getCategoryById = async (req,res,next) => {
    const categoryId = req.params.cid;
    let category;
    try{
      category =  await Category.findById(categoryId);
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not find a category.',
            500
        );
        return next(error);
    }
    if(!category){
        const error = new HttpError(
            'Could not find a post for the provided id.',
            404
        );
        return next(error);
    }
    res.json({category: category.toObject({getters:true})});
}

const createCategory = async (req,res,next) => {
    const errors = validationResult(req);
      if(!errors.isEmpty()){
          return next(
              new HttpError('Invalid inputs passed, please check your data.',422)
          );
      }
      const {title} = req.body;

      let existingCategory;
      try{
          existingCategory = await Category.findOne({title: title});
      }catch(err){
          const error = new HttpError(
          'Fetching Category failed, please try again later.',500
          );
          return next(error);
      }

      if(existingCategory){
        const error = new HttpError(
            'Category exists already, please try another instead.',
            422
          );
          return next(error);
    }

      const createdCategory = new Category({
          title,
          filter
      });
      try{
          const sess = await mongoose.startSession();
          sess.startTransaction();
          await createdCategory.save({session:sess});
          await sess.commitTransaction();
      }catch(err){
        const error = new HttpError('Creating post failed, please try again', 500);
        return next(error);
    }
res.status(201).json({category: createdCategory});
}

const updateCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(
            new HttpError('Invalid inputs passed, please check your data.',422)
        );
    }
    const {title} = req.body;
  
    const categoryId = req.params.cid;
    let category;
    try{
        category = await Category.findById(categoryId);
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not update category',500
        );
        return next(error);
    }

    category.title = title
    

    try{
        await category.save();
    }catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update category.',500
        );
        return next(error);
    }
    res.status(200).json({category: category.toObject({getters:true})});
}

const deleteCategory = async (req, res, next) => {
    const categoryId = req.params.cid;

    let category;
    try{
        category = await Category.findById(categoryId);
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not delete category.',
            500
        );
        return next(error)
    }
    if(!category){
        const error = new HttpError('Could not find category for this id.', 404);
        return next(error);
    }
    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await category.remove({session:sess});
        await sess.commitTransaction();
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not delete category.',
            500
        );
        return next(error);
    }
    res.status(200).json({message: 'Deleted category.'});
}

exports.deleteCategory = deleteCategory;
exports.updateCategory = updateCategory;
exports.createCategory = createCategory;
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;