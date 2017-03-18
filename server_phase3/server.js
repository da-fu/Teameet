var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongodb = require('mongodb');
// The code of Mongoose is referenced to:
// http://sstruct.github.io/2016/05/15/%E8%AF%91-%E7%94%A8-Mongoose-%E8%BD%BB%E6%9D%BE%E5%BC%80%E5%8F%91-Node-js-MongoDB-%E5%BA%94%E7%94%A8/
var mongoose = require('mongoose');
//The code for password hashing is referenced to: https://github.com/davidwood/node-password-hash
var passwordHash = require('password-hash');
var nodemailer = require('nodemailer');
var {ObjectId} = require('mongodb');
var moment = require('moment');
var generator = require('generate-password');
var app = express();

app.engine('.html', require('ejs').__express);
//app.set('view engine', 'ejs');
app.set('view engine', 'html');

app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/'));


app.use(session({
  secret: 'teameetSession',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 300000 }
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
db.once('open', function () {
  console.log('database: connection established');
});

var userSchema = mongoose.Schema({
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

var profileSchema = mongoose.Schema({});
var profile = mongoose.model('profile', profileSchema);

var settingSchema = mongoose.Schema({});
var setting = mongoose.model('setting', settingSchema);


var groupSchema = mongoose.Schema({
  university: String,
  course: String,
  section: String,
  status: String,
  leaderName: String,
  leaderEmail: String,
  groupName: String,
  groupId: Number,
  groupDescription: String
});
var group = mongoose.model('group', groupSchema);


var courseSchema = mongoose.Schema({
  university: String,
  instructor: String,
  ins_email: String,
  courseCode: String,
  courseName: String,
  courseDescription: String,
  numberLimit: Number,
  deadline: String,
  requirements: String,
  deadlinePassed: Boolean,
  createTime: String
});
var course = mongoose.model('course', courseSchema);


var membershipSchema = mongoose.Schema({
  studentEmail: String,
  groupID: String
});
var membership = mongoose.model('membership', membershipSchema);


var messageSchema = mongoose.Schema({
  title: String,
  time: String,
  sender: String,
  content: String
});
var message = mongoose.model('message', messageSchema);

var requestSchema = mongoose.Schema({
  sender: String,
  receiver: String,
  groupid: String,
  content: String,
  time: Date
});
var request = mongoose.model('request', requestSchema);

//////////////////////////////////////////////// Routers - Homepage & Register & Log-in & Reset Password /////////////////////////////////////////////////

app.get('/', function (req, res) {
    if (req.session.loggedIn == true) {
        res.redirect('/dashboardPrep');
    }
    else{
        var totalNumberStudent;
        var totalNumberInstructor;
        var totalNumberTeam;

        user.find({status:"student"}).count(function (err, stuCount) {
            totalNumberStudent = stuCount;
            user.find({status:"instructor"}).count(function (err, insCount) {
                totalNumberInstructor=insCount;
                group.find().count(function (err, groupCount) {
                    totalNumberTeam=groupCount;
                    res.render('index', {countStudent:totalNumberStudent, countInstructor:totalNumberInstructor, countGroup:totalNumberTeam});
                });
            });
        });
    }

});


app.get('/TermsOfUse', function (req, res) {
    res.render('Terms_Of_Use');
});

app.get('/PrivacyPolicy', function (req, res) {
    res.render('privacy_policy');
});

app.get('/login', function (req, res) {
    res.render('login', {wrongPassword: false, notActivated: false, wrongAccount: false});
});

app.post('/checkLogin', function (req, res) {
    var passwordFlag = false;
    var accountFlag = false;
    var activationFlag = false;
    var userName = req.body.email;
    var password = req.body.password;

    user.find({email: userName}, function (err, userFound) {
        console.log(userFound);
        if (userFound.length == 0) {
            console.log("User doesn't exist");
            accountFlag = true;
        }
        else {
            if (userFound.activated == false) {
                console.log("Account hasn't been activated");
                activationFlag = true;
            }
            else {
                if (passwordHash.verify(password, userFound[0].password)) {
                    console.log("welcome!");
                    if(userFound[0].lastLoginTime){
                        userFound[0].lastLoginTime=userFound[0].currentLoginTime;
                        userFound[0].currentLoginTime=moment().format('MMMM Do YYYY, h:mm:ss a');
                        req.session.lastLoginTime=userFound[0].lastLoginTime;
                        req.session.currentLoginTime=userFound[0].currentLoginTime;
                    }
                    else{
                        userFound[0].lastLoginTime=moment().format('MMMM Do YYYY, h:mm:ss a');
                        userFound[0].currentLoginTime=moment().format('MMMM Do YYYY, h:mm:ss a');
                        req.session.lastLoginTime=userFound[0].lastLoginTime;
                        req.session.currentLoginTime=userFound[0].currentLoginTime;
                    }
                    req.session.status = userFound.status;
                }
                else {
                    console.log("password error!");
                    passwordFlag = true;
                }
            }
        }

        if (!passwordFlag && !accountFlag && !activationFlag) {
            req.session.email = userName;
            req.session.status = userFound[0].status;
            req.session.loggedIn = true;
            req.session.firstName=userFound[0].givenName;
            req.session.lastName=userFound[0].familyName;
            res.redirect('/dashboardPrep');
        }
        else {
            res.render('login', {wrongPassword: passwordFlag, notActivated: activationFlag, wrongAccount: accountFlag});
        }

    });

});

app.get('/registration_step1', function (req, res) {
    var emailFlag = false;
    var passwordFlag = false;
    res.render('registration_step1', {duplicate: emailFlag, pwNotSame: passwordFlag});
});

app.post('/checkReg', function (req, res) {

    var userStatusCache = req.body.status;
    //console.log(userStatus);
    var givenNameCache = req.body.givenName;
    //console.log(givenName);
    var familyNameCache = req.body.familyName;
    //console.log(familyName);
    var emailAddr = req.body.email;
    //console.log(emailAddr);
    var passwordCache = req.body.password;
    //console.log(passwordCache);
    var passwordconfirmCache = req.body.passwordCheck;
    //console.log(passwordconfirmCache);
    var securityQuestionCache = req.body.securityQuestion;
    //console.log(securityQuestion);
    var securityAnswerCache = req.body.securityAnswer;
    //console.log(securityAnswer);

    var emailFlag = false;
    var passwordFlag = false;

    user.find({email: emailAddr}, function (err, userFound) {
        //console.log(userFound);
        if (userFound.length != 0) {
            console.log("dup!!!");
            emailFlag = true;
            //res.render("registration_step1",{duplicate:emailFlag,pwNotSame:passwordFlag});
        }
        if (passwordconfirmCache != passwordCache) {
            passwordFlag = true;
        }
        if (passwordFlag || emailFlag) {
            res.render("registration_step1", {duplicate: emailFlag, pwNotSame: passwordFlag});
        }
        else {
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
                console.log('A new user registered!');


                //This part can only be tested once the website is registered with a specific domain.
                user.find({email:emailAddr}, function(err, user) {
                    if (err)
                        throw err;
                    else{
                        // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
                        var mailConfirmation = {
                            from: 'teameet.contact@gmail.com',
                            to: emailAddr,
                            subject: 'Thank you for choosing Teameet',
                            //text: 'Thank you for choosing Teameet! Please click the link below to activate your account.',
                            html: 'Thank you for choosing Teameet! Please click <a href="http://127.0.0.1:3000/activation_email_user?id='+user[0]._id+'">here </a>to activate your account.'

                        };

                        // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
                        mailServer.sendMail(mailConfirmation, function(error, info){
                            if(error){
                                console.log(error);
                            }else{
                                console.log('Message sent: ' + info.response);
                            }
                        });

                    }
                });
            });

            res.redirect("/registration_step2");
        }
    });


});

app.get('/registration_step2', function (req, res) {
    res.render('registration_step2');
});


 app.get('/activation_email_user', function(req,res){
    var userID=req.query.id;
     //console.log(userID);
     user.findOneAndUpdate({_id:userID},
         {activated: true}, function (err, user) {
             if (err) throw err;
             res.redirect("/registration_step3");
         });

 });

app.get('/registration_step3', function (req, res) {
    res.render('registration_step3');
});


app.get('/resetPassword_step1', function (req, res) {
    res.render('resetPassword_step1');
});

var userEmail_resetPassword;

app.post('/resetPassword_emailCheck', function (req, res) {
    var userName = req.body.email;
    user.find({email: userName}, function (err, userFound) {
        if (userFound.length == 0) {
            console.log("no such email addr");
        }
        else {
            userEmail_resetPassword = userName;
            req.session.securityQ = userFound[0].securityQuestion;
            req.session.securityA = userFound[0].securityAnswer;
            console.log(req.session.securityA);
            res.redirect("/resetPassword_step2");
        }
    });
});

app.get('/resetPassword_step2', function (req, res) {
    //console.log(req.session.securityQ);
    res.render('resetPassword_step2', {question: req.session.securityQ,failure:false});
});

app.post('/securityQACheck', function (req, res) {
    var answer = req.body.answer;
    if (answer == req.session.securityA) {

        user.find({email:userEmail_resetPassword},function(err,userGroup){
            if (err)
                throw err;
            //This part can only be tested once the website is registered with a specific domain.
            // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/

            var passwordCache = generator.generate({
                length: 10,
                numbers: true
            });
            var hashedPassword = passwordHash.generate(passwordCache);

            user.findOneAndUpdate({email:userEmail_resetPassword}, {password: hashedPassword}, function (err, user) {
                    if (err) throw err;

                var mailConfirmation = {
                    from: 'teameet.contact@gmail.com',
                    to: userEmail_resetPassword,
                    subject: 'Password Recovery - Teameet',
                    text: 'We strongly suggest you change the current password for security purpose. Here is the password of your account: '+passwordCache
                };

                // The code of nodemailer is referenced to: http://blog.fens.me/nodejs-email-nodemailer/
                mailServer.sendMail(mailConfirmation, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });

                res.redirect('/resetPassword_step3');

                });

        });

    }
    else {
        res.render('resetPassword_step2',{question: req.session.securityQ,failure:true})
    }
});

app.get('/resetPassword_step3', function (req, res) {
    res.render('resetPassword_step3');
});


app.get("/dashboardPrep", function (req, res) {
    if (req.session.loggedIn) {
        console.log(req.session.status);
        if (req.session.status === "instructor")
            res.redirect('/instructor_welcome');
        else if (req.session.status === "student")
            res.redirect('/student_welcome');
        else
            res.redirect('/admin_welcome');
    }
    else
        res.redirect('/');
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/");
});



////////////////////////////////////////////////// Routers - Admin ////////////////////////////////////////////////////

app.get("/admin_welcome", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        var totalNumberUser;
        user.find().count(function (err, count) {
            totalNumberUser = count;
            var totalNumberRequests;
            message.find().count(function (err, countTemp) {
                totalNumberRequests = countTemp;
                console.log(countTemp);
                res.render('admin_welcome', {
                    userNumber: totalNumberUser,
                    messageNumber: totalNumberRequests,
                    lastLogin: moment(req.session.lastLoginTime, 'MMMM Do YYYY, h:mm:ss a').fromNow()
                });
            });
        });
    }
    else{
        res.redirect("/login");
    }

});


app.get("/admin_settings_settings", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        res.render('admin_settings_settings');
    }
    else{
        res.redirect("/login");
    }
});


app.get("/admin_settings_profile", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        res.render('admin_settings_profile', {passwordCheck: false, changed: false});
    }
    else{
        res.redirect("/login")
    }
});


app.get("/admin_requests", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        message.find({}, function (err, texts) {
            res.render('admin_requests', {list: texts});
        });
    }
    else{
        res.redirect("/login")
    }
});

app.post("/postNewMessage", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        var messageContent = req.body.text;

        var newMessage = new message({
            title: "System Notification",
            time: moment().format('MMMM Do YYYY, h:mm:ss a'),
            sender: "Admin",
            content: messageContent
        });

        newMessage.save(function (err) {
            if (err)
                throw err;
            res.redirect('/admin_requests');

        });
    }
    else{
        res.redirect("/login")
    }

});


app.get("/admin_database", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        user.find({}, function (err, users) {
            res.render('admin_database', {list: users});
        });
    }
    else{
        res.redirect("/login")
    }
});


app.post("/admin_profileChangeCheck", function (req, res) {
    if (req.session.email || req.session.status == "admin") {
        var gName = req.body.givenName;
        var fName = req.body.lastName;
        var pw = req.body.password;
        var pwCheck = req.body.passwordCheck;
        var sQ = req.body.securityQuestion;
        var sA = req.body.securityAnswer;
        var passwordFlag = false;
        var changeSuccess = false;

        if (pw) {
            if (pw !== pwCheck) {
                passwordFlag = true;
            }
            else {
                var hashedPassword = passwordHash.generate(pw);
                user.findOneAndUpdate({email: req.session.email},
                    {password: hashedPassword}, function (err, user) {
                        if (err) throw err;
                    });
                changeSuccess = true;
            }

        }


        if (gName) {
            user.findOneAndUpdate({email: req.session.email},
                {givenName: gName}, function (err, user) {
                    if (err) throw err;
                });
            changeSuccess = true;
        }

        if (fName) {
            user.findOneAndUpdate({email: req.session.email},
                {familyName: fName}, function (err, user) {
                    if (err) throw err;
                });
            changeSuccess = true;
        }

        if (sQ) {
            user.findOneAndUpdate({email: req.session.email},
                {securityQuestion: sQ}, function (err, user) {
                    if (err) throw err;
                });
            changeSuccess = true;
        }

        if (sA) {
            user.findOneAndUpdate({email: req.session.email},
                {securityAnswer: sA}, function (err, user) {
                    if (err) throw err;
                });
            changeSuccess = true;
        }

        res.render("admin_settings_profile", {passwordCheck: passwordFlag, changed: changeSuccess});
    }
    else{
        res.redirect("/login")
    }
});

/* This part will be in service after we complete the mail system
 app.post("/profileChangeCheck",function(req,res){

 });
 */

app.get("/accountSuspension", function (req, res) {
    if (req.session.email || req.session.status) {
        user.findOneAndRemove({email: req.session.email}, function (err) {
            if (err) throw err;
            req.session.destroy();
            res.redirect("/");
        });
    }
    else
        res.redirect("/login");
});

//////////////////////////////////////////////// Routers - Instructor /////////////////////////////////////////////////

app.get("/instructor_welcome", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    course.find({}, function (err, courseList) {
      var fullName = req.session.firstName + " " + req.session.lastName;
      message.find({}, function (err, messages) {
        res.render('instructor', { list: courseList, fullName: fullName, messages: messages, cur_user: req.session.email });
      });

    });
  }
});

app.get("/instructor-setting", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    var fullName = req.session.firstName + " " + req.session.lastName;
    var userEmail = req.session.email;
    message.find({}, function (err, messages) {
      res.render('instructor-setting', { fullName: fullName, email: userEmail, messages: messages });
    });
  }
});

app.get("/instructor-profile", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    var fullName = req.session.firstName + " " + req.session.lastName;
    var userEmail = req.session.email;
    message.find({}, function (err, messages) {
      res.render("instructor-profile", { passwordCheck: false, changed: false, fullName: fullName, email: userEmail, messages: messages });
    });
  }
});

app.post("/inst_profile_check", function (req, res) {
  var gName = req.body.givenName;
  var fName = req.body.lastName;
  var pw = req.body.password;
  var pwCheck = req.body.passwordCheck;
  var sQ = req.body.securityQuestion;
  var sA = req.body.securityAnswer;
  var passwordFlag = false;
  var changeSuccess = false;

  if (pw) {
    if (pw !== pwCheck) {
      passwordFlag = true;
    }
    else {
      var hashedPassword = passwordHash.generate(pw);
      user.findOneAndUpdate({ email: req.session.email },
        { password: hashedPassword }, function (err, user) {
          if (err) throw err;
        });
      changeSuccess = true;
    }

  }

  if (gName) {
    user.findOneAndUpdate({ email: req.session.email },
      { givenName: gName }, function (err, user) {
        if (err) throw err;
      });
    req.session.firstName = gName;
    changeSuccess = true;
  }

  if (fName) {
    user.findOneAndUpdate({ email: req.session.email },
      { familyName: fName }, function (err, user) {
        if (err) throw err;
      });
    req.session.lastName = fName;
    changeSuccess = true;
  }

  if (sQ) {
    user.findOneAndUpdate({ email: req.session.email },
      { securityQuestion: sQ }, function (err, user) {
        if (err) throw err;
      });
    changeSuccess = true;
  }

  if (sA) {
    user.findOneAndUpdate({ email: req.session.email },
      { securityAnswer: sA }, function (err, user) {
        if (err) throw err;
      });
    changeSuccess = true;
  }

  var fullName = req.session.firstName + " " + req.session.lastName;
  var userEmail = req.session.email;
  message.find({}, function (err, messages) {
    res.render("instructor-profile", { passwordCheck: passwordFlag, changed: changeSuccess, fullName: fullName, email: userEmail, messages: messages });
  });

});

app.get("/courses", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    course.find({}, function (err, courseList) {
      message.find({}, function (err, messages) {
        res.render('courses', { list: courseList, messages: messages, cur_user: req.session.email });
      });
    });
  }
});

app.get("/courses-create", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    var fullName = req.session.firstName + " " + req.session.lastName;
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('courses-create', {
        duplicatedCourse: false,
        fullName: fullName,
        messages: messages
      });
    });
  }
});

var resultCache = new Array();
var courseInfoCache;

app.post("/courseFind", function (req, res) {


  var courseCodeCache = req.body.courseCode;
  resultCache=new Array();
  course.find({ courseCode: courseCodeCache }, function (err, courseFound) {
    courseInfoCache = courseFound[0];
    group.find({ course: courseFound[0].courseCode }, function (err, groupFound) {

      for (var i = 0; i < groupFound.length; i++) {
        console.log(groupFound[i]);
        resultCache.push({
          teamStatus: groupFound[i].status, teamName: groupFound[i].groupName,
          leaderName: groupFound[i].leaderName, leaderEmail: groupFound[i].leaderEmail
        });
      }

    });
    res.redirect('/course-detail');
  });
});

app.get("/course-detail", function (req, res) {
  if (!req.session.email || req.session.status != "instructor") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('course-detail', {
        list: resultCache,
        courseInfo: courseInfoCache,
        messages: messages
      });
    });
  }
})

app.post("/checkCourse", function (req, res) {
  var fullName = req.session.firstName + " " + req.session.lastName;
  user.find({ email: req.session.email }, function (err, userFound) {
    course.find({ courseCode: req.body.courseCode.toUpperCase() }, function (err, courseFound) {
      if (courseFound.length == 0) {
        var firstName = userFound[0].givenName;
        var lastName = userFound[0].familyName;
        var newCourse = new course({
          university: "University of Toronto",
          instructor: firstName + " " + lastName,
          ins_email: req.session.email,
          courseCode: req.body.courseCode.toUpperCase(),
          courseName: req.body.courseName,
          courseDescription: req.body.courseDescription,
          numberLimit: req.body.teamLimit,
          deadline: req.body.deadline,
          requirements: req.body.requirements,
          deadlinePassed: false,
          createTime: moment().format('MMMM Do YYYY, h:mm:ss a')
        });
        newCourse.save(function (err) {
          if (err)
            throw err;
          console.log('A new course registered!');
          res.redirect('/courses');
        });
      }
      else {
        res.redirect('/courses');
      }
    });


  });


});



///////////////////////////////////////////////// Routers - Student ///////////////////////////////////////////////////


app.get('/student_welcome', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    group.find({}, function (err, groups) {
      if (err) throw err;
      request.find({}, function (err, requests) {
        if (err) throw err;
        membership.find({}, function (err, memberships) {
          if (err) throw err;
          message.find({}, function (err, messages) {
            if (err) throw err;
            console.log(messages);
            res.render('select', {
              messages: messages,
              cur_user: req.session.email,
              select_groups: groups,
              requests: requests,
              memberships: memberships,
              name: name
            });
          });
        });

      });
    });
  }

});






app.get('/join-team', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('join-team', {
        messages: messages,
        name: name
      });
    });
  }
});



app.post("/stu_profile_check", function (req, res) {
  var gName = req.body.givenName;
  var fName = req.body.lastName;
  var pw = req.body.password;
  var pwCheck = req.body.passwordCheck;
  var sQ = req.body.securityQuestion;
  var sA = req.body.securityAnswer;
  var passwordFlag = false;
  var changeSuccess = false;

  if (pw) {
    if (pw !== pwCheck) {
      passwordFlag = true;
    }
    else {
      var hashedPassword = passwordHash.generate(pw);
      user.findOneAndUpdate({ email: req.session.email },
        { password: hashedPassword }, function (err, user) {
          if (err) throw err;
        });
      changeSuccess = true;
    }

  }

  if (gName) {
    user.findOneAndUpdate({ email: req.session.email },
      { givenName: gName }, function (err, user) {
        if (err) throw err;
      });
    req.session.firstName = gName;
    changeSuccess = true;
  }

  if (fName) {
    user.findOneAndUpdate({ email: req.session.email },
      { familyName: fName }, function (err, user) {
        if (err) throw err;
      });
    req.session.lastName = fName;
    changeSuccess = true;
  }

  if (sQ) {
    user.findOneAndUpdate({ email: req.session.email },
      { securityQuestion: sQ }, function (err, user) {
        if (err) throw err;
      });
    changeSuccess = true;
  }

  if (sA) {
    user.findOneAndUpdate({ email: req.session.email },
      { securityAnswer: sA }, function (err, user) {
        if (err) throw err;
      });
    changeSuccess = true;
  }

  var fullName = req.session.firstName + " " + req.session.lastName;
  var userEmail = req.session.email;
  message.find({}, function (err, messages) {
    res.render("student-profile", { passwordCheck: passwordFlag, changed: changeSuccess, fullName: fullName, email: userEmail, messages: messages });
  });

});


app.get("/student-profile", function (req, res) {
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    var fullName = req.session.firstName + " " + req.session.lastName;
    var userEmail = req.session.email;
    message.find({}, function (err, messages) {
      res.render("student-profile", { passwordCheck: false, changed: false, fullName: fullName, email: userEmail, messages: messages });
    });
  }
});
/*
app.get('/student-profile', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('student-profile', {
        messages: messages,
        name: name
      });
    });
  }

});
*/
app.get('/student-setting', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('student-setting', {
        messages: messages,
        name: name
      });
    });
  }

});

app.get('/create-team', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('create-team', {
        messages: messages,
        name: name
      });
    });
  }

});
app.get('/create_fail', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('create_fail', {
        messages: messages,
        name: name
      });
    });
  }

});

app.get('/no_course', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('no_course', {
        messages: messages,
        name: name
      });
    });
  }

});

app.post('/checkteam', function (req, res) {

  course.find({}, function (err, courses) {
    if (err) throw err;
    var flag = 0;
    courses.forEach(function (course) {
      if (course.courseCode == req.body.course) {
        flag = 1;
      }
    });
    if (!flag) {
      res.redirect("/no_course");
    }
    else {
      group.find({}, function (err, groups) {
        if (err) throw err;
        var flag = 0;
        groups.forEach(function (group) {
          if (group.leaderEmail == req.session.email && group.course == req.body.course) {
            //console.log("cnm");

            flag = 1;
          }
        });
        if (flag) {
          res.redirect("/create_fail");
        }
        else {
          var newTeam = new group({
            university: "UofT",
            course: req.body.course,
            section: req.body.section,
            status: req.body.status,
            leaderName: req.session.firstName + " " + req.session.lastName,
            leaderEmail: req.session.email,
            groupName: req.body.groupname,
            groupDescription: req.body.description,
            //groupId: 1
          });
          newTeam.save(function (err) {
            if (err)
              throw err;
            console.log('Team created!');

          });
          res.redirect("/student_welcome");
        }
      });
    }
  });


});

app.post('/checkresult', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  var course = req.body.course;
  var section = req.body.section;
  //res.render('result', {coursenum:course});
  group.find({}, function (err, groups) {
    if (err) throw err;
    message.find({}, function (err, messages) {
      if (err) throw err;
      res.render('result', {
        groups: groups,
        coursenum: course,
        section: section,
        messages: messages,
        name: name
      });
    });

  });

  //  res.redirect("/result")
});

app.post('/join', function (req, res) {
  var email = req.body.email;
  var course = req.body.course;
  var id = req.body.id;
  //res.render('result', {coursenum:course});
  //console.log(email);
  //console.log(course);
  var name;
  user.find({}, function (err, users) {
    if (err) throw err;
    users.forEach(function (user) {
      if (user.email == req.session.email) {

        name = user.givenName + " " + user.familyName;
        //console.log(name);
        var content = name + " wants to join your team for " + course;
        //console.log(id);
        var join_message = new request({
          groupid: id,
          time: new Date(),
          sender: req.session.email,
          content: content,
          receiver: email
        });
        join_message.save(function (err) {
          if (err)
            throw err;
          //console.log(join_message);

        });
      }
    });

  });

  //  res.redirect("/result")
});


app.post('/direct', function (req, res) {
  var email = req.body.directemail;
  var course = req.body.directnum;
  //res.render('result', {coursenum:course});
  //console.log(email);
  //console.log(course);
  var name;
  user.find({}, function (err, users) {
    if (err) throw err;
    group.find({}, function (err, groups) {
      if (err) throw err;
      groups.forEach(function (group) {
        if (group.course == course && group.leaderEmail == email) {
          var id = group._id;
          users.forEach(function (user) {
            if (user.email == req.session.email) {

              name = user.givenName + " " + user.familyName;
              //console.log(name);
              var content = name + " wants to join your team for " + course;
              //console.log(id);
              var join_message = new request({
                groupid: id,
                time: new Date(),
                sender: req.session.email,
                content: content,
                receiver: email
              });
              join_message.save(function (err) {
                if (err)
                  throw err;
                //console.log(join_message);

              });
            }
          });
        }
      });
    });


  });

  //  res.redirect("/result")
});

app.post('/accept', function (req, res) {
  //console.log(req.body.messageid);
  var requestid = req.body.requestid;
  request.find({}, function (err, requests) {
    if (err) throw err;
    requests.forEach(function (request) {
      if (request._id == requestid) {
        request.remove();
      }
    });
  });


  var newMember = new membership({
    studentEmail: req.body.useremail,
    groupID: req.body.groupid
  });
  newMember.save(function (err) {
    if (err)
      throw err;
    console.log('Member created!');

  });
});


app.post('/decline', function (req, res) {
  //console.log(req.body.messageid);
  var requestid = req.body.requestid;
  request.find({}, function (err, requests) {
    if (err) throw err;
    requests.forEach(function (request) {
      if (request._id == requestid) {
        request.remove();
      }
    });
  });
});

var groupid;
app.get('/team-info', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    membership.find({}, function (err, memberships) {
      if (err) throw err;
      //console.log(memberships);
      user.find({}, function (err, users) {
        if (err) throw err;
        //console.log(groupid);
        group.find({}, function (err, groups) {
          if (err) throw err;
          //console.log(groupid);
          message.find({}, function (err, messages) {
            if (err) throw err;
            res.render('team-info', {
              groupid: groupid,
              memberships: memberships,
              users: users,
              groups: groups,
              messages: messages,
              name: name
            });
          });


        });

      });

    });
  }

});

app.get('/team_info_result', function (req, res) {
  var name = req.session.firstName + " " + req.session.lastName;
  if (!req.session.email || req.session.status != "student") {
    res.redirect('/login');
  }
  else {
    membership.find({}, function (err, memberships) {
      if (err) throw err;
      //console.log(memberships);
      user.find({}, function (err, users) {
        if (err) throw err;
        //console.log(groupid);
        group.find({}, function (err, groups) {
          if (err) throw err;
          //console.log(groupid);
          message.find({}, function (err, messages) {
            if (err) throw err;
            res.render('team_info_result', {
              groupid: groupid,
              memberships: memberships,
              users: users,
              groups: groups,
              messages: messages,
              name: name
            });
          });

        });

      });

    });
  }

});

app.post('/detail', function (req, res) {
  //console.log(req.body.messageid);
  //console.log(req.body.groupid);
  groupid = req.body.groupid;
  /*
  var groupid = req.body.groupid;
  membership.find({}, function (err, memberships) {
    if (err) throw err;
    //console.log(memberships);
    user.find({}, function (err, users) {
      if (err) throw err;
      //console.log(groupid);
      res.render('team-info', {
        groupid: groupid,
        memberships: memberships,
        users: users
      });
    });

  });
  */
});


app.listen(process.env.PORT || 3000);
console.log('Listening on port 3000');
