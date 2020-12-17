const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const clientIo = require('socket.io-client'); 
const {v4: uuidV4} = require('uuid');
const path = require('path')
const mySQLConnector = require('mysql');


// Variables used.

const connector = mySQLConnector.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Daman6232'
});

connector.connect((err)=>{
	if (err) throw err;
	console.log("Connected");
})



const roomsCreated = [];


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'/static')));

app.get('/', (req, res)=>{	
	res.render('index');
})

app.get('/generateRoom', (req, res)=>{	
	let roomCode = uuidV4();
	roomsCreated.push(roomCode);
	res.redirect(`/${roomCode}`);
});

app.get('/:room', (req, res)=>{
	if(roomsCreated.find(ele => ele===req.params.room)){
		res.render('meeting', {roomId: req.params.room})
	}else{
		// res.render('errorPage');
		res.render('errorPage');
	}
	
})

io.on('connection', socket =>{
	socket.on('join-room', (roomId, userId)=>{
		socket.join(roomId);
		socket.to(roomId).broadcast.emit('user-connected', userId);
		socket.on('disconnect', ()=>{
			socket.to(roomId).broadcast.emit('user-disconnected', userId);
		})
	})
})

server.listen(3000, ()=>{
	console.log('server has started');
})