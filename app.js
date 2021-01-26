const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const flash = require("connect-flash");
const session= require("express-session");
const multer = require("multer");
const path = require("path");
var db = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : ''    ,
  database : 'pfmaker'
});
db.connect((err) =>{
  if(err){
    console.log(err);
  }
  console.log("MySql started");
});
app.use(flash());
app.use(session({secret:"notagoodsecret",
                 resave:true,
                 saveUninitialized:true
                  }
                ));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

const storage = multer.diskStorage({
  destination: './public/img/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage
}).single('image');


/// All routes
app.get("/dbcreated" , (req, res)=>{
let sql = "CREATE database PFmaker";
db.query(sql, (err, result)=>{
  if(err)  throw err;
  else  res.send("databse created");
})
})
app.get("/createTbl", (req, res)=>{
  let sql = "CREATE table users(id int auto_increment, username varchar(255),image varchar(120), password varchar(255), email varchar(255), Primary key (id))";
  db.query(sql, (err, result)=>{
    if(err) throw err;
    else res.send("table has been created");
  })
})

app.get("/alterTbl", (req, res)=>{
  let sql = "Alter table users add image varchar(120)";
  db.query(sql, (err, result)=>{
    if(err) throw err;
    else res.send("table has been altered");
  })
})

app.get("/", (req, res)=>{
  res.render("home.ejs");
});

app.get("/register",(req, res)=>{
  res.render("reg.ejs",{msg:' '});
})

app.post("/register",async(req, res)=>{
  upload(req,res,async(err)=>{
    if(err){
      res.render("reg.ejs",{msg:err})
    }
    else if(req.file==undefined){
      res.render("reg.ejs", {msg:"No file choosen"})
    }
    else{
      const {username, email, password}=req.body;
      let pw = await bcrypt.hash(password, 10);
      let sql = "insert into users set ?";
      let data ={username:username, email:email, password:pw,image:`img/${req.file.filename}`};
      db.query(sql, data, (err , result)=>{
        if(err){
          console.log(err);
        }
        else{
          res.redirect('/login');
        }
      });
    }
  })
});


app.get("/login",(req, res)=>{
  res.render("login.ejs",{msg:" "});
})

app.post("/login", async (req, res)=>{
  const{username, password}= req.body;
  let sql=`Select * from users where username='${username}'`;
  await db.query(sql, async(err, result)=>{
    if(err) throw err;
    else {
      const verify = await bcrypt.compare(password, result[0].password);
      if(!verify){
         req.flash('failure', "Wrong password or username");
         res.render("login.ejs", {msg: req.flash('failure') });
      }
      else{
        req.session.user_id=result[0].id;
        res.redirect('/secret');
      }
    }
  })
})

app.get("/secret", (req, res)=>{
  if(req.session.user_id){
    let sql=`select * from users where id=${req.session.user_id}`
    db.query(sql,(err,result)=>{
      if(err){
        console.log(err);
      }
      else{
        res.render("profile.ejs",{result:result});
      }
    })

  }
  else{
    req.flash('failure1',"To reach that route you have to login first");
    res.render("login.ejs", {
    msg:req.flash('failure1')
  });
  }
})
app.listen(3030,()=> console.log("server is started at port 3030"));
