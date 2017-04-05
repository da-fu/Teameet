# Teamwork
to be used for your teamwork on the project

# Phase 2 - Use of framework
- Phase 2 is created using Bootstrap 3 and SB Admin 2 (https://startbootstrap.com/template-overviews/sb-admin-2/).
- The pages for students are located in /frontend/student/pages
- The pages for instructors are located in /frontend/instructor/pages, profile and settings page is shared with student-section.
- The pages of homepage, sign in & sign on, admin dashboard, privacy policy and terms of use are located in /frontend/admin-homepage-others (multiple external resources were used, see the in-code citation and Readme.md in /frontend/admin-homepage-others for details)
- Revised phase 1 document has been uploaded. Several changes were made.

# Phase 3 - Instruction & Acknowledgement
### Instruction
- All the files related to phase 3 are in the folder "server_phase3".
- Basically, mongod, npm install, npm start, import database, node server.js
- There are several accounts for testing purpose. If you get tired of our secured registration process, please feel free to use any of them. Passwords are all set to 12345678 by default.
- Part of the server is designed based on the previous lab on Chatserver.
- To run the website, use `npm start`.
- To run the test script, use `npm test`. May need to chmod -x on test.sh.
- The test script can test: create new user, login, update user info, search for a team, create a team, logout.

### Acknowledgement
- To avoid the possible delay caused by SMTP middleware, all the account are set "activated=true" currently, which means that you can directly log in to the account without checking the email for activation after registration. Nevertheless, you can still check the email for trial.
- The functionality of uploading the picture for profile and email notification are still in consideration, since they're a bit useless currently. And We just leave them on the webpage.  
- For testing purpose, we opened "admin" status for registration, in case if you want to test some features. We will disabled this once you mark Phase 3
- Since the webiste hasn't been hosted yet, Google API (verification and etc.) cannot work for now.

# Phase 4 - Notice
- Website Address: teameet.kwanstyle.com
- There are two folders in final_phase4 folder: one is for localhost use, the other one is the completed version of website hosted on AWS.
- There're several differences between two versions:
  - Routing (domains are different, localhost & teameet.kwanstyle.com)
  - Mail service (Mail templates for rendering requires to be stored in the node package. For localhost version, mail service uses plain text; but for hosted version, mail service uses template)
- If you have issues dealing with our localhost version (bugs and errors), please feel free to try our hosted version instead.
- There are multiple testing account on the hosted online version for trial.
  - Student 1: 1@1.com  
    Password: 111
  - Student 2: 2@2.com  
    Password: 222
  - Instructor: a@a.com
    Password: aaa
  - Admin: admin@admin.com
    Password: admin
- API keys for several third-party services are embedded in the file. Please do not release them to others.
- Extra functionality and design for bonus:
  - Mail notification service
  - Third-party API service
  - Data output
  - Filters for Search
  - Auto-complete for Input
  - Message Broadcast
  - Load Balancing using PM2
  - Online hosting using AWS
  - etc.
- Comprehensive API services of Slack, Facebook and Trello are still under testing and futher integration. Completed version will be shown during the demo for Phase 5.
- Before testing, don't forget to run mongodb

# Phase 5 - Further Improvement
- PDF file of poster design has been added in the root of repo
- Trello API has been tested and embedded in the phase 4 files, according to the Prof's request by email about merging codes for new progress.
