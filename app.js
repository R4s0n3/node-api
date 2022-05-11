const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const HttpError = require('./models/http-error');

const usersRoutes = require('./routes/users-routes');
const postsRoutes = require('./routes/posts-routes');
const categoriesRoutes = require('./routes/categories-routes');


const app = express();
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(bodyParser.json());

app.use((req,res, next)=> {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
    next();
});

app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);

app.use((req,res,next)=>{
    const error = new HttpError("Could not find this route", 404);
    throw error;
});

app.use((error, req, res, next)=> {
    if(res.headerSent){
        return next(error);
    }

    res.status(error.code || 500);
    res.json({message: error.message || "An unknown error occured!"});
});

mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bfnl3.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    ,{ useNewUrlParser: true, useUnifiedTopology: true  })
.then(()=>{
    app.listen(process.env.PORT || 8000);
    console.log('Server is running on 8000')
})
.catch(err=>{
    console.log(err);
});

