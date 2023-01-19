/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt")
const {BCRYPT_WORK_FACTOR} = require("../config.js")


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password,BCRYPT_WORK_FACTOR);
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let formattedDate = `${year}-${month}-${day}`;
    const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING username, password, first_name, last_name, phone`,[username, hashedPassword, first_name, last_name, phone, formattedDate, formattedDate]);
    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT password FROM users WHERE username = $1`,[username])
    const user = result.rows[0];
    if(user) {
      if (await bcrypt.compare(password,user.password) === true) {
        return true
      }
    }
    return false
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let formattedDate = `${year}-${month}-${day}`;
    await db.query(`UPDATE users SET last_login_at = $1 WHERE username = $2`,[formattedDate,username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    let result = await db.query(`SELECT username, first_name, last_name, phone FROM users`)
    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`,[username]);
    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    let result = await db.query(`SELECT id, body, sent_at, read_at, to_username FROM messages WHERE from_username = $1`,[username])
    for (let row of result.rows){
      let to_username = row['to_username']
      let res = await db.query(`SELECT username, first_name, last_name, phone FROM users WHERE username = $1`,[to_username])
    row['to_user'] = res.rows[0];
    delete row['to_username']
    }
    return result.rows
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let result = await db.query(`SELECT id, body, sent_at, read_at, from_username FROM messages WHERE to_username = $1`,[username])
    for (let row of result.rows){
      let from_username = row['from_username']
      let res = await db.query(`SELECT username, first_name, last_name, phone FROM users WHERE username = $1`,[from_username])
      row['from_user'] = res.rows[0];
      delete row['from_username'];
    }
    return result.rows
  }
}

module.exports = User;