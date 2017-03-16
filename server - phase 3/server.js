var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongodb = require('mongodb');
var mongoose = require('mongoose');

var app = express();
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/'));


app.use(session({
  secret: 'teameetSession',
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false, maxAge: 300000}
}));


app.use(bodyParser.json());  
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req,res){
  res.render('index');
});

app.get('/TermsOfUse', function(req,res){
  res.render('Terms_Of_Use');
});

app.get('/PrivacyPolicy', function(req,res){
  res.render('privacy_policy');
});

app.get('/login', function(req,res){
  res.render('login');
});

app.post('/checkLogin', function(req,req){

});

app.get('/registration_step1', function(req,res){
  res.render('registration_step1');
});

app.post('/checkReg', function(req,res){

  var db=req.db;
  var collection = db.get('user');

  var userStatus=req.body.status;
  var givenName=req.body.givenName;
  var familyName=req.body.familyName;
  var email=req.body.email;
  var password=req.body.password;
  var passwordCheck=req.body.passwordCheck;
  var securityQuestion=req.body.securityQuestion;
  var securityAnswer=req.body.securityAnswer;

  var passwordFlag=false;
  var emailFlag=false;

  //if(password!==passwordCheck)
  //    passwordFlag=true;


});

app.get("/dashboardPrep", function(req,res){
  if (req.session.loggedIn) {
    if(req.session.status=="instructor")
      res.redirect('/instructor_welcome');

    else if(req.session.status=="student")
      res.redirect('/student_welcome');

    else
      res.redirect('/admin_welcome')


  }
  else
    res.redirect('/');
});


app.listen(process.env.PORT || 3000);
console.log('Listening on port 3000');
