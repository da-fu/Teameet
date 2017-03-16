var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
//https://github.com/davidwood/node-password-hash
var passwordHash = require('password-hash');


mongoose.connect('mongodb://localhost/teameet-test');

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


////////////////////////////////////////// Database Configuration //////////////////////////////////////////

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
  activated: Boolean
  createTime: Timestamp
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
  status: Float,
  leaderName: String,
  leaderEmail: String,
  groupName: String,
  groupId: Integer
});
var group = mongoose.model('group',groupSchema);


var courseSchema=mongoose.Schema({
  university: String,
  instructor: String,
  courseCode: String,
  courseName: String,
  courseDescription: String,
  numberLimit: Integer,
  deadline: Date,
  requirements: String,
  deadlinePassed: Boolean,
  createTime:Timestamp
});
var course = mongoose.model('course', courseSchema);


var membershipSchema=mongoose.Schema({
  studentEmail: String,
  groupID: String
});
var membership = mongoose.model('membership', membershipSchema);


var messageSchema=mongoose.Schema({
  title: String,
  time: Timestamp,
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
