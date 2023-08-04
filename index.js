require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const md5 = require("md5");
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

//var listItems=["one","two","three"];
var listitems = [];
var events = ["Freshers", "President selections"];
var eventcodes = ["fre001", "pre002"];
var selected = ""; //to store usn of candidate whose checkbox is ticked
var count = 0; //to keep count fo votes of each candidate separately

// mongoose.connect("mongodb://127.0.0.1:27017/usersDB", {
//   useNewUrlParser: true,
// });
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
  } catch (err) {
    console.log(error);
    process.exit(1);
  }
};

//for all users
userSchema = new mongoose.Schema({
  name: String,
  voterid: String,
  password: String,
});

//for candidates
candidateSchema = new mongoose.Schema({
  name: String,
  voterid: String,
  password: String,
});

fresherSchema = new mongoose.Schema({
  event: String,
  code: { type: String, default: "fre001" },
});

presidentSchema = new mongoose.Schema({
  event: String,
  code: { type: String, default: "pre002" },
});

votersListSchema = new mongoose.Schema({
  voterid: String,
});
//for results
votingListSchema = new mongoose.Schema({
  name: String,
  voterid: String,
  votes: { type: Number, default: 0 },
});

const User = new mongoose.model("User", userSchema);
const Candidate = new mongoose.model("Candidate", candidateSchema);
const Vote = new mongoose.model("Vote", votingListSchema);
const Voter = new mongoose.model("Voter", votersListSchema);
const Fresher = new mongoose.model("Fresher", fresherSchema);
const President = new mongoose.model("President", presidentSchema);
connectDB().then(() => {
  app.listen(PORT, function (req, res) {
    console.log("started at 3000");
  });
});

//function for home page
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index copy.html");
});

//function for signup page
app.get("/signup", function (req, res) {
  res.render("signup", { alert: "" });
});
app.post("/signup", function (req, res) {
  const useridnorm = req.body.signupid;
  const userid = useridnorm; //variable for credentials of signup page
  const passwordnorm = req.body.signuppass;
  const password = passwordnorm;
  //const usn = req.body.signupusn;
  const name = req.body.signupname;
  User.findOne({ voterid: useridnorm })
    .then((foundUsers) => {
      //console.log(foundUsers.voterid);
      if (foundUsers)
        res.render("signup", {
          alert: "user with same voterid already exists",
        });
      else {
        const userDetail = User({
          name: name,
          voterid: useridnorm,
          password: passwordnorm,
        });
        userDetail
          .save()
          .then(() => {
            res.redirect("/"); //change this page
          })
          .catch((err) => {
            console.log("Error : " + err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//function for login page
app.get("/login", function (req, res) {
  res.render("login", { alert: "" });
});

app.post("/login", function (req, res) {
  const loginid = req.body.loginid; //variables for credentials fo login page
  console.log(loginid);
  const loginPass = req.body.loginpass;
  console.log(loginPass);
  let i = 0;
  User.find({ voterid: loginid }) //checks in users collection
    .then((foundUser) => {
      console.log(foundUser);
      if (foundUser.length > 0) {
        if (
          foundUser[0].voterid != loginid ||
          foundUser[0].password != loginPass
        )
          res.render("login", { alert: "Incorrect id or password" });
        else res.redirect("/choice");
      else {
        res.render("login", {
          alert: "Account with these credentials doesnt exist please signup",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//function for choosing post
app.get("/choice", function (req, res) {
  res.sendFile(__dirname + "/voter_or_candidate.html");
});

//function for registration to become a candidate
app.get("/candreg", function (req, res) {
  res.render("candreg", { alert: "" });
});

app.post("/candreg", function (req, res) {
  const candid = req.body.candregid;
  console.log(candid);
  const eventcode = req.body.candevent;
  const candpassword = req.body.candregpass;
  const name = req.body.candregname;
  let i = 0;
  User.find({ voterid: candid })
    .then((foundUser) => {
      if (foundUser) {
        Candidate.find({})
          .then((foundCandidates) => {
            for (i = 0; i < foundCandidates.length; i++) {
              if (foundCandidates[i].voterid == candid) {
                res.render("candreg", { alert: "Voter id already exists" });
                break;
              }

              // if (foundCandidates[i].usn == candusn) {
              //   res.render("candreg", { alert: "USN already used" });
              //   break;
              //}

              if (foundCandidates[i].password == candpassword) {
                res.render("candreg", {
                  alert: "password already taken by other user",
                });
                break;
              }
            }
            if (foundCandidates.length == i) {
              const newCandidate = Candidate({
                name: name,
                voterid: candid,
                password: candpassword,
                // eventcode: eventcode,
              });
              newCandidate
                .save()
                .then(() => {
                  // res.render("candidate", {
                  //   listItems: foundCandidates,
                  // eventcodes: eventcodes,
                  // })
                  res.redirect("/candidate");
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("signup", {
          alert: "Please sign up before registering for elections",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//function for candidate to login to view list of candidates
app.get("/candlogin", function (req, res) {
  res.render("candlog", { alert: "" });
});
app.post("/candlogin", function (req, res) {
  const candid = req.body.candlogid;
  const candpass = req.body.candlogpass;
  //const candcode=req.body.candlogcode;

  User.find({ voterid: candid, password: candpass })
    .then((foundUsers) => {
      if (foundUsers) {
        Candidate.find({ voterid: candid, password: candpass })
          .then((foundCandidates) => {
            if (foundCandidates.length > 0) res.redirect("/candidate");
            else
              res.render("candlog", {
                alert: "Wrong credentials/your account doesnt exist",
              });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("candlog", {
          alert:
            "You have not signed in to the website/account doesnt exist.Please check your email and password",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/candidate", function (req, res) {
  Candidate.find({})
    .then((foundCandidates) => {
      res.render("candidate", {
        listItems: foundCandidates,
        event: "Elections",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
//function to display list of candidates to voters for voting process
app.get("/candvote", function (req, res) {
  Candidate.find({})
    .then((foundCandidates) => {
      res.render("candvote", { listItems: foundCandidates });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/candvote", function (req, res) {
  selected = req.body.elected;
  console.log(selected);
  res.render("confirm", {
    selectedcandid: selected,
    alert: "",
  });
});

//function to display confirmation page to confirm the vote. It also checks if candidate is registered or not
//This function also counts vote and saves the vote for each candidate.Also checks if the voters has already voted
app.post("/confirm", function (req, res) {
  const finalvote = req.body.confirmed;
  const votersid = req.body.confirmvoterid;
  Voter.find({ voterid: votersid }) //checks if voter has already voted
    .then((foundVoters) => {
      if (foundVoters.length > 0) {
        console.log(foundVoters);
        res.render("confirm", {
          alert: "You have already voted",
          selectedcandid: finalvote,
        });
      } else {
        const newVoter = new Voter({
          voterid: votersid,
        });
        newVoter.save().then((err) => {
          console.log(err);
        });

        Candidate.findOne({ voterid: selected }) //checks if candidate has already voted
          .then((foundCandidate) => {
            if (foundCandidate) {
              //console.log(foundCandidate.voterid);
              if (foundCandidate.voterid == finalvote) {
                //console.log("hey");
                Vote.findOne({
                  voterid: foundCandidate.voterid,
                  name: foundCandidate.name,
                }).then((foundname) => {
                  if (!foundname) {
                    count = 0;
                    count++;
                    const votedcand = Vote({
                      name: foundCandidate.name,
                      voterid: foundCandidate.voterid,
                      votes: count,
                    });
                    votedcand
                      .save()
                      .then(() => {
                        console.log("voted");
                        res.redirect("/");
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  } else {
                    count = foundname.votes;
                    count++;
                    Vote.updateOne(
                      { voterid: foundname.voterid },
                      { votes: count },
                      { new: true }
                    )
                      .then(() => {
                        console.log("updated");
                        res.redirect("/");
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  }
                });
              } else {
                res.render("confirm", {
                  selectedcand: foundCandidate.voterid,
                  selectcandname: foundCandidate.name,
                  alert: "id does not match with the selected id",
                });
              }
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//functin to display results fromm highest votes to lowest votes
app.get("/result", function (req, res) {
  Vote.find({})
    .sort({ votes: -1, usn: -1 })
    .then((founditems) => {
      res.render("result", { listItems: founditems, event: "Elections" });
    })
    .catch((err) => {
      console.log(err);
    });
});
