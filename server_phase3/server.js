var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
//The code for password hashing is referenced to: https://github.com/davidwood/node-password-hash
var passwordHash = require('password-hash');
var nodemailer = require('nodemailer');

var app = express()

app.engine('.html', require('ejs').__express);
//app.set('view engine', 'ejs');
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



//////////////////////////////////////////////// Routers - Homepage & Register & Log-in & Reset Password /////////////////////////////////////////////////

app.get('/', function(req,res){
  if(req.session.loggedIn==true){
    res.redirect('/dashboardPrep');
  }
  else
    res.render('index');
});


app.get('/TermsOfUse', function(req,res){
  res.render('Terms_Of_Use');
});

app.get('/PrivacyPolicy', function(req,res){
  res.render('privacy_policy');
});

app.get('/login', function(req,res){
  res.render('login',{wrongPassword:false, notActivated:false, wrongAccount:false});
});

app.post('/checkLogin', function(req,res){
  var passwordFlag=false;
  var accountFlag=false;
  var activationFlag=false;
  var userName=req.body.email;
  var password=req.body.password;

  user.find({ email:userName }, function(err,userFound) {
    console.log(userFound);
    if(userFound.length==0){
      console.log("User doesn't exist");
      accountFlag=true;
    }
    else {
      if (userFound.activated==false){
        console.log("Account hasn't been activated");
        activationFlag=true;
      }
      else{
        if (passwordHash.verify(password, userFound[0].password)) {
          console.log("welcome!");
          req.session.status=userFound.status;
        }
        else {
          console.log("password error!");
          passwordFlag=true;
        }
      }
    }

    if(!passwordFlag&&!accountFlag&&!activationFlag){
      req.session.email=userName;
      req.session.status=userFound[0].status;
      req.session.loggedIn=true;
      res.redirect('/dashboardPrep');
    }
    else{
      res.render('login',{wrongPassword:passwordFlag, notActivated:activationFlag, wrongAccount:accountFlag});
    }

  });

});

app.get('/registration_step1', function(req,res){
  var emailFlag=false;
  res.render('registration_step1',  {duplicate:emailFlag});
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

  user.find({ email:emailAddr }, function(err,userFound) {
    //console.log(userFound);
    if (userFound.length!=0) {
      console.log("dup!!!");
      emailFlag=true;
      res.render("registration_step1",{duplicate:emailFlag});
    }
    else{
      var hashedPassword = passwordHash.generate(passwordCache);
      console.log(hashedPassword);

      var newUser = new user({
        status: userStatusCache,
        givenName: givenNameCache,
        familyName: familyNameCache,
        email: emailAddr,
        password: hashedPassword,
        securityQuestion: securityQuestionCache,
        securityAnswer: securityAnswerCache,
        // "activated" will be set to true by default until the SMTP middleware is tested and work in service
        activated: true
      });
      newUser.save(function (err) {
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

      res.redirect("/registration_step2");
    }
  });


});

app.get('/registration_step2', function(req,res){
  res.render('registration_step2');
});


// use regular expression to handle the GET query
/*
app.get('/xxxxxxxxxx', function(req,res){
  if(req.query.method =="activation"){
    user.find({ _id:req.query.userID }, function(err,user) {
      if (err)
        throw err;
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
*/

app.get('/resetPassword_step1',function(req,res){
  res.render('resetPassword_step1');
});

app.post('/resetPassword_emailCheck',function(req,res){
  var userName=req.body.email;
  user.find({ email:userName }, function(err,userFound) {
    if(userFound.length==0){
      console.log("no such email addr");
    }
    else{
        req.session.userEmail=userName;
        req.session.securityQ=userFound.securityQuestion;
        req.session.securityA=userFound.securityQuestion;
        res.redirect("/resetPassword_step2");
    }
  });
});

app.get('/resetPassword_step2',function(req,res){
    res.render('resetPassword_step2',{question:req.session.securityQ});
});

app.post('/securityQACheck',function(req,res){
    var answer=req.body.answer;
    if(answer===req.session.answer){
        //This part can only be tested once the website is registered with a specific domain.
       // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
       var mailConfirmation = {
         from: 'teameet.contact@gmail.com',
         to: req.session.userEmail,
         subject: 'Temporary Password - Teameet',
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

       res.redirect('/resetPassword_step3');
    }
    else{
        res.send("fake");
    }
});

app.get('/resetPassword_step3',function(req,res){
    res.render('resetPassword_step3');
});


app.get("/dashboardPrep", function(req,res){
  if (req.session.loggedIn) {
    console.log(req.session.status);
    if(req.session.status==="instructor")
      res.redirect('/instructor_welcome');
    else if(req.session.status==="student")
      res.redirect('/student_welcome');
    else
      res.redirect('/admin_welcome');
  }
  else
    res.redirect('/');
});




////////////////////////////////////////////////// Routers - Admin ////////////////////////////////////////////////////

app.get("/admin_welcome",function(req,res){
  res.render('admin_welcome');
});

//////////////////////////////////////////////// Routers - Instructor /////////////////////////////////////////////////

app.get("/instructor_welcome",function(req,res){
  res.render('instructor');
});

app.get('/courses-create', function (req, res) {
  res.render('courses-create');
});


app.post('/checkCourse', function (req, res) {


  var newCourse = new course({
    university: "uoft",
    instructor: "bg",
    courseCode: req.body.courseCode,
    courseName: req.body.courseName,
    courseDescription: req.body.courseDescription,
    numberLimit: 1,
    deadline: new Date(),
    requirements: "String",
    deadlinePassed: true,
    createTime: new Date()
  });
  newCourse.save(function (err) {
    if (err)
      throw err;
    console.log('Course created!');

  });
  res.redirect("/instructor_welcome")
});



///////////////////////////////////////////////// Routers - Student ///////////////////////////////////////////////////

app.get('/student_welcome', function (req, res) {
  group.find({}, function (err, groups) {
    if (err) throw err;
    res.render('select', {
      select_groups: groups,
    });
  });
});

app.get('/join-team', function (req, res) {
  res.render('join-team');
});

app.get('/student-profile', function (req, res) {
  res.render('student-profile');
});

app.get('/student-setting', function (req, res) {
  res.render('student-setting');
});

app.get('/create-team', function (req, res) {
  res.render('create-team');
});

app.post('/checkteam', function (req, res) {
  var newTeam = new group({
    university: "UofT",
    course: req.body.course,
    section: req.body.section,
    status: req.body.status,
    leaderName: req.body.leadername,
    leaderEmail: req.body.leaderemail,
    groupName: req.body.groupname,
    groupId: 1
  });
  newTeam.save(function (err) {
    if (err)
      throw err;
    console.log('Team created!');

  });
  res.redirect("/join-team")
});

app.post('/checkresult', function (req, res) {
  var course = req.body.course;
  //res.render('result', {coursenum:course});
  group.find({}, function (err, groups) {
    if (err) throw err;
    res.render('result', {
      groups: groups,
      coursenum: course,
    });
  });

  //  res.redirect("/result")
});

app.listen(process.env.PORT || 3000);
console.log('Listening on port 3000');
