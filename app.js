const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initialDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.messege}`);
    process.exit(1);
  }
};
initialDb();

app.get("/users/", async (request, response) => {
  const GetQuery = `SELECT * FROM user;`;
  const Query = await db.all(GetQuery);
  response.send(Query);
  console.log(Query);
});

//validate
const Validate = (password) => {
  return password.length > 4;
};

//Register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPass = await bcrypt.hash(password, 10);
  const selectedUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedUser);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user (username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPass}','${gender}','${location}');`;
    if (Validate(password)) {
      await db.run(createUserQuery);
      console.log("User Created");
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
      console.log("Password is too Short");
    }
  } else {
    response.status(400);
    console.log("user Already Exists");
    response.send("User already exists");
  }
});

//Login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUsers = `SELECT *  FROM user WHERE username='${username}';`;
  const dbUser = await db.get(getUsers);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
    console.log("Invalid user");
  } else {
    const checkPass = await bcrypt.compare(password, dbUser.password);
    if (checkPass === true) {
      response.send("Login success!");
      console.log("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
      console.log("Invalid password");
    }
  }
});

//Change-Password

// app.put("/change-password", async (request, response) => {
//   const { username, oldPassword, newPassword } = request.body;
//   const UserDb = `SELECT * FROM user WHERE username = '${username}';`;
//   const dbUser = await db.get(UserDb);
//   if (dbUser === undefined) {
//     response.status(400);
//     response.send("Invalid user");
//   } else {
//     const comparePass = await bcrypt.compare(oldPassword, dbUser.password);
//     if (comparePass === true) {
//       if (Validate(password) === true) {
//         const hashedPass = await bcrypt.hash(newPassword, 10);
//         const setNew = `UPDATE user SET password='${hashedPass}' WHERE username='${username}';`;
//         await db.run(setName);
//         response.send("Password updated");
//         console.log("Password updated");
//       } else {
//         response.status(400);
//         response.send("Password is too short");
//         console.log("Password is too short");
//       }
//     } else {
//       response.status(400);
//       response.send("Invalid current password");
//       console.log("Invalid current password");
//     }
//   }
// });

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (Validate(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await db.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
