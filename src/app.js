


const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 9000;



app.use(session({
    secret : 'osama',
    resave : 'false',
    saveUninitialized :  'true',
}))






app.listen(port,()=>{
    console.log(`app is running on port : ${port}`);
})