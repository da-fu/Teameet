read -p $'\nCreate user'
curl -X "POST" "http://localhost:3000/checkReg" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    "status": "student",
    "givenName": "willie",
    "familyName": "hwc",
    "email": "williehwc@gmail.com",
    "password": "asdf",
    "passwordCheck": "asdf",
    "securityQuestion": "what",
    "securityAnswer": "what"
}'

read -p $'\nLog in user just created'
curl -X "POST" "http://localhost:3000/checkLogin" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    "email": "williehwc@gmail.com",
    "password": "asdf"
}'

read -p $'\nUpdate user info'
curl -X "POST" "http://localhost:3000/stu_profile_check" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    "password": "1234",
    "passwordCheck": "1234",
    "securityQuestion": "how",
    "securityAnswer": "how"
}'

read -p $'\nSearch a team'
curl -X "POST" "http://localhost:3000/checkresult" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    "course": "CIV101",
    "section": "01"
}'

read -p $'\nCreate a team'
curl -X "POST" "http://localhost:3000/checkteam" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    "course": "CIV101",
    "section": "01",
    "status": "1/4",
    "groupname": "awesomeGroup",
    "description": "awesome"
}'

read -p $'\nLogout'
curl -X "GET" "http://localhost:3000/logout" \
-H "Content-Type: application/json; charset=utf-8" \
-d $'{
    
}'
