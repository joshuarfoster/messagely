const Router = require("express").Router;
const User = require("../models/user");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");
const Message = require("../models/message")

const router = new Router();
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function (req,res,next) {
    let id = req.params.id;
    let message = await Message.get(id);
    let to_username = message.to_user.username;
    let from_username = message.from_user.username;
    if (req.user.username!==to_username&&req.user.username!==from_username){
        return next({status: 401, message: "Unauthorized" });
    }
    return res.json(message)
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req,res,next){
    let from_username = req.user.username;
    console.log(from_username)
    let {to_username, body} = req.body;
    let message = await Message.create({from_username,to_username,body})
    return res.json({message})
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function(req, res, next){
    let id = req.params.username;
    let wholeMessage = await Message.get(id)
    let to_username = wholeMessage.to_user.username
    if (req.user.username!==to_username){
        return next({status: 401, message: "Unaithorised"})
    }
    let message = Message.markRead(id)
    return res.json({message})
})

module.exports = router;