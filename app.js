const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {v4: uuidV4} = require('uuid');
const path = require('path')
const DBConnector = require('./Database/Connector');
const jwt = require('jsonwebtoken')
var cookieParser = require('cookie-parser');
app.use(cookieParser())



// Setting up the view engine and static directory.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'/static')));


// Loading Secret from .env file or using a default one if none found.
const ourLittleSecret = process.env['SECRET_KEY'] || 'little Secret';


// Parsing request data.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handling get requests.
app.get('/', checkToken,(req, res)=>{	
	res.render('index');
});

app.get('/login', (req, res)=>{
	res.render('login');
})

app.get('/register', (req, res) => {
	res.render('register');
})


app.post('/login', (req, res)=>{
	// let { username, password } = req.body;
	let username = req.body.username;
	let password = req.body.password;

	// Checking if request body has username and password.
	if (!username || !password) {
		return res.send("Please send username and password");
	}

	DBConnector.loginUser(username, password)
	.then((user)=>{
		// Creating a token.
		jwt.sign(user, ourLittleSecret, (err, token) => {
			if (err) throw err;
			else res.json({
				AccessToken: token
			});
		});
	}).catch((err)=>{
		console.log(err);
		res.send("Something went wrong.");
	})
})


// End point for registering new user. 
app.post('/register', (req, res) => {	
	// let { username, password } = req.body;
	let username = req.body.username;
	let password = req.body.password;

	// Checking if request body has username and password.
	if (!username || !password) {
		return res.send("Please send username and password");
	}

	//  Storing credentials in database.
	DBConnector.addUser(username, password).then((userId) => {

		// Wrapping username into an object for creating a JWT.
		const user = {
			username,
			userId
		}

		// Creating a token.
		jwt.sign(user, ourLittleSecret, (err, token) => {
			if (err) throw err;
			else res.json({
				AccessToken: token
			});
		})
	}).catch((err) => {
		console.log(err);
		res.send('OOPS! something went wrong');
	})


});


// Generate room
app.get('/generateRoom', checkToken,(req, res)=>{	
	let roomCode = uuidV4();	
	DBConnector.addRoom(roomCode)
	.then(()=>{
		res.redirect(`/r/${roomCode}`);
	})
	.catch((err)=>{
		res.send('OOPS! something went wrong.')
	})
	
});




app.get('/r/:room', checkToken,(req, res)=>{
	// Checking if room is present in DB
	DBConnector.checkRoomInDB(req.params.room).then(()=>{
		res.render('meeting', {roomId: req.params.room});

		// incrementing userCount in DB
		DBConnector.updateUserCount(req.params.room, true);

	}).catch(()=>{
		res.render('errorPage');
	});	
});

app.get('/endCall', (req, res)=>{
	res.render('endCall');
})


// Socket on connection getting established
io.on('connection', socket =>{
	socket.on('join-room', (roomId, userId)=>{
		socket.join(roomId);
		socket.to(roomId).broadcast.emit('user-connected', userId);
		socket.on('disconnect', ()=>{
			socket.to(roomId).broadcast.emit('user-disconnected', userId);
		})
	})
});


// Middleware for checking if token is present.

function checkToken(req, res, next) {

	const bearer = req.cookies.authorization;

	if (!bearer) {
		return res.redirect('/login');
	}

	const token = bearer.split(' ')[1];

	// Verifying Token
	try {
		jwt.verify(token, ourLittleSecret, (err, user) => {
			if (err) {
				res.send('Error');
				throw err;
			}
			else {
				req.user = user;
				next();
			}
		})
	} catch (err) {
		console.log(err);
	}

}



// Establishing connection with database.
DBConnector.establishConnection({
	host: 'localhost',
	user: 'root',
	password: 'Daman6232'
})
.then(()=>{
	return DBConnector.setupSchema()
}).then(()=>{
	// setting server to listen to port 3000
	server.listen(3000, () => {
		console.log('server has started');

	});
})
.catch((err)=>{
	console.log("Error establishing connection to database");
	console.log(err.message);
})

