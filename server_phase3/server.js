var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
//https://github.com/davidwood/node-password-hash
var passwordHash = require('password-hash');
var nodemailer = require('nodemailer');


var app = express();
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

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


///////////////////////////////////////////// Email SMTP //////////////////////////////////////////////////

// The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
var mailServer = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'teameet.contact@gmail.com',
    pass: 'csc309teameet'
  }
});



////////////////////////////////////////// Database Configuration //////////////////////////////////////////

mongoose.connect('mongodb://localhost/teameet-test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'database: connection error:'));
db.once('open', function() {
  console.log('database: connection established');
});

var userSchema=mongoose.Schema({
  status: String,
  givenName: String,
  familyName: String,
  email: String,
  password: String,
  securityQuestion: String,
  securityAnswer: String,
  activated: Boolean,
  createTime: Date
});
var user = mongoose.model('user', userSchema);

var profileSchema=mongoose.Schema({

});
var profile = mongoose.model('profile', profileSchema);

var settingSchema=mongoose.Schema({

});
var setting = mongoose.model('setting', settingSchema);


var groupSchema=mongoose.Schema({
  university: String,
  course: String,
  section: String,
  status: String,
  leaderName: String,
  leaderEmail: String,
  groupName: String,
  groupId: Number
});
var group = mongoose.model('group',groupSchema);


var courseSchema=mongoose.Schema({
  university: String,
  instructor: String,
  courseCode: String,
  courseName: String,
  courseDescription: String,
  numberLimit: Number,
  deadline: Date,
  requirements: String,
  deadlinePassed: Boolean,
  createTime:Date
});
var course = mongoose.model('course', courseSchema);


var membershipSchema=mongoose.Schema({
  studentEmail: String,
  groupID: String
});
var membership = mongoose.model('membership', membershipSchema);


var messageSchema=mongoose.Schema({
  title: String,
  time: Date,
  sender: String,
  content: String
});
var message = mongoose.model('message', messageSchema);



//////////////////////////////////////////////// Routers /////////////////////////////////////////////////

app.get('/', function(req,res){
  /*
  var newUser = new user({
    status: "String",
    givenName: "String",
    familyName: "String",
    email: "String",
    password: "String",
    securityQuestion: "String",
    securityAnswer: "String",
    activated: false
  });
  newUser.save(function(err) {
    if (err)
      throw err;
    console.log('User created!');
  });
  */
  res.render('index');
});

app.get('/TermsOfUse', function(req,res){
  res.render('Terms_Of_Use');
});
app.get('/test', function(req,res){
  user.find({}, function(err, users) {
    if (err) throw err;
    res.render('test', {users:users});    
  });
});

app.get('/PrivacyPolicy', function(req,res){
  res.render('privacy_policy');
});

app.get('/login', function(req,res){
  res.render('login');
});

app.post('/checkLogin', function(req,req){

});
app.get('/courses-create', function(req,res){
  res.render('courses-create');
});
app.post('/checkCourse', function(req,res){

  
  var newCourse = new course({
    university: "uof",
    instructor: "bg",
    courseCode: req.body.courseCode,
    courseName: req.body.courseName,
    courseDescription: req.body.courseDescription,
    numberLimit: 1,
    deadline: new Date(),
    requirements: "String",
    deadlinePassed: true,
    createTime:new Date()
  });
  newCourse.save(function(err) {
    if (err)
      throw err;
    console.log('Course created!');
    
  });
   res.redirect("/select")
});

app.get('/select', function(req,res){
      course.find({}, function(err, courses) {
        if (err) throw err;
        res.render('select', {courses:courses});    
      });
});

app.get('/registration_step1', function(req,res){
  res.render('registration_step1');
});

app.post('/checkReg', function(req,res){

  var userStatusCache=req.body.status;
  //console.log(userStatus);
  var givenNameCache=req.body.givenName;
  //console.log(givenName);
  var familyNameCache=req.body.familyName;
  //console.log(familyName);
  var emailAddr=req.body.email;
  //console.log(emailAddr);
  var passwordCache=req.body.password;
  //console.log(password);
  var securityQuestionCache=req.body.securityQuestion;
  //console.log(securityQuestion);
  var securityAnswerCache=req.body.securityAnswer;
  //console.log(securityAnswer);

  var emailFlag=false;

  user.find({ email:emailAddr }, function(err,user) {
    if (user.email==emailAddr)
        emailFlag=true;
  });


  var newUser = new user({
    status: userStatusCache,
    givenName: givenNameCache,
    familyName: familyNameCache,
    email: emailAddr,
    password: passwordCache,
    securityQuestion: securityQuestionCache,
    securityAnswer: securityAnswerCache,
    // "activated" will be set to false by default until the SMTP middleware is in service
    activated: true
  });
  newUser.save(function(err) {
    if (err)
      throw err;
    console.log('User created!');
    
  });

  //This part can only be tested once the website is registered with a specific domain.
  /*
  var userID;
  User.find({email:emailAddr}, function(err, user) {
    if (err)
      throw err;
    else
      userID=user._id;
  });

  // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
  var mailConfirmation = {
    from: 'teameet.contact@gmail.com',
    to: emailAddr,
    subject: 'Thank you for choosing Teameet',
    text: 'Thank you for choosing Teameet! Please click the link below to activate your account.',
    html: '<a href="http://localhost:3000/?method=activation&userID='+userID+'">'
  };

  // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
  mailServer.sendMail(mailConfirmation, function(error, info){
    if(error){
      console.log(error);
    }else{
      console.log('Message sent: ' + info.response);
    }
  });

  */

  res.redirect("/registration_step2")

});

app.get('/registration_step2', function(req,res){
  res.render('registration_step2');
});


// use regular expression to handle the GET query
app.get('/xxxxxxxxxx', function(req,res){
  if(req.query.method =="activation"){
    user.find({ _id:req.query.userID }, function(err,user) {
      if (err)
        throw err
      else{
        if (user.activated===false){
          req.session.userEmail=user.email;
          res.render('registration_step3');
        }
        else{
          res.send("This account has been activated!");
        }
      }
    });
  }
  else{
    res.send("The page requested is invalid!");
  }
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
