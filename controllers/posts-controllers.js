const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');

const Post = require('../models/post');
const User = require('../models/user');

const getPosts = async (req,res,next) =>{
    let posts;
    try{
        posts = await Post.find({}).populate('creator','name').populate('category').populate('report').sort({body:1});
    }catch(err){
        const error = new HttpError(
            'Fetching Posts failed, please try again later.',
            500
        )
    }
    
    res.json({ posts: posts.map(post => post.toObject({ getters: true }))});
}

const getPostById = async (req, res, next) => {
    const postId = req.params.pid;

    let post;
    try{
        post = await Post.findById(postId).populate('creator','name').populate('category','title').populate('report');
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not find a post.',
            500
        );
        return next(error);
    }
    if(!post){
        const error = new HttpError(
            'Could not find a post for the provided id.',
            404
        );
        return next(error);
    }
    res.json({post: post.toObject({getters:true})});
}

const getPostsByUserId = async (req, res, next) => {
    const userId = req.params.uid;
  
    let userWithPosts;
    try {
      userWithPlaces = await User.findById(userId).populate('posts');
    } catch (err) {
      const error = new HttpError(
        'Fetching posts failed, please try again later.',
        500
      );
      return next(error);
    }
  
    if (!userWithPosts || userWithPosts.posts.length === 0) {
      return next(
        new HttpError('Could not find posts for the provided user id.', 404)
      );
    }
  
    res.json({ posts: userWithPosts.posts.map(post => post.toObject({ getters: true })) });
  };
  
  const createPost = async(req, res, next) =>{
      const errors = validationResult(req);
      if(!errors.isEmpty()){
          return next(
              new HttpError('Invalid inputs passed, please check your data.',422)
          );
      }

      const {title, content, date, category, published, highlighted, report} = req.body;
        

      const createdPost = new Post({

          title,
          content,
          category,
          published,
          highlighted,
          creator: req.userData.userId

      });

      let user;

      try{
          user = await User.findById(req.userData.userId);
      }catch(err){
          const error = new HttpError(
              'Creating post failed, please try again1.',
              500
          );
          return next(error);
      }

      if(!user){
        const error = new HttpError('could not find a user for the provided user id.', 404);
        return next(error);
      }
    
      try{
          const sess = await mongoose.startSession();
          sess.startTransaction();
          await createdPost.save({session:sess});
          user.posts.push(createdPost);
          await user.save({session:sess});
          await sess.commitTransaction();
      }catch(err){
          const error = new HttpError('Creating post failed, please try again', 500);
          return next(error);
      }
res.status(201).json({post: createdPost});
  }

const updatePost = async (req, res, next) =>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const {title, content, published, highlighted, date, category} = req.body;
  const postId = req.params.pid;

  let post;
  try{
    post = await Post.findById(postId);
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not update post.',
      500
    );
    return next(error);
  }

  post.title = title;
  post.content = content;
  post.date = date;
  post.published = published;
  post.highlighted = highlighted;
  post.category = category;

  try{
    await post.save();
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not update post.',
      500
    );
    return next(error);
  }
  res.status(200).json({post: post.toObject({getters: true})});
}

const publishPost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const {published} = req.body;
  const postId = req.params.pid;

  let post;
  try{
    post = await Post.findById(postId);
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not update post.',
      500
    );
    return next(error);
  }

  post.published = published;

  try{
    await post.save();
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not publish post.',
      500
    );
    return next(error);
  }
  res.status(200).json({post: post.toObject({getters: true})});
}

const highlightPost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const {highlighted} = req.body;
  const postId = req.params.pid;

  let post;
  try{
    post = await Post.findById(postId);
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not update post.',
      500
    );
    return next(error);
  }

  post.highlighted = highlighted;

  try{
    await post.save();
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not highlight post.',
      500
    );
    return next(error);
  }
  res.status(200).json({post: post.toObject({getters: true})});
}


const deletePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try{
    post = await Post.findById(postId).populate('creator');
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not delete post.',
      500
    );
    return next(error);
  }

  if(!post){
    const error = new HttpError('Could not find post for this id.',404);
    return next(error);
  }
  if(post.creator.id !== req.userData.userId){
    const error = new HttpError('You are not allowed to delete this post.', 403);
    return next(error);
  }
  try{
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await post.remove({session:sess});
    post.creator.posts.pull(post);
    await post.creator.save({session:sess});
    await sess.commitTransaction();
  }catch(err){
    const error = new HttpError(
      'Something went wrong, could not delete post.',
      500
    );
    return next(error);
  }
  res.status(200).json({message: 'Deleted post.'});
}

exports.deletePost = deletePost;
exports.updatePost = updatePost;
exports.createPost = createPost;
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.highlightPost = highlightPost;
exports.publishPost = publishPost;
