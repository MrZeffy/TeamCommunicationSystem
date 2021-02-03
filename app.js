const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const clientIo = require('socket.io-client'); 
const {v4: uuidV4} = require('uuid');
const path = require('path')
//const mySQLConnector = require('mysql');


// Variables used.


// Database connectivity.
/*const connector = mySQLConnector.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Daman6232'
});*/


// Establishing a connection with sql server.
/*connector.connect((err)=>{
	if (err) throw err;
	
})*/

// Database/Table creation

/*connector.query("CREATE DATABASE IF NOT EXISTS videoCallRooms", (err, res)=>{
	if (err) throw err;	
});*/

// Using the databse that has been created
/*connector.query("USE videoCallRooms", (err, res)=>{
	if (err) throw err;	
	
});*/

// Creating a new table for keeping track of rooms that have been created along with their users
/*connector.query("CREATE TABLE IF NOT EXISTS room_records(room_no VARCHAR(50) PRIMARY KEY, users INT DEFAULT 0);", (err, res)=>{
	if (err) throw err;	
	
});*/






// Setting up the view engine and static directory.
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'/static')));

// Handling get requests.
app.get('/', (req, res)=>{	
	res.render('index');
});

app.get('/generateRoom', (req, res)=>{	
	let roomCode = uuidV4();	
	/*connector.query(`INSERT INTO room_records(room_no) VALUES ("${roomCode}");`, (err, res)=>{
		if (err) throw err;	
		
	});*/	
	res.redirect(`/r/${roomCode}`);
	
});




app.get('/r/:room', (req, res)=>{
	// Checking if room is present in DB
	res.render('meeting', {roomId: req.params.room});
	/*checkRoomInDB(req.params.room).then(()=>{
		

		
		updateUserCount(req.params.room, true);

	}).catch((err)=>{
		
		res.render('errorPage');
	});*/	
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

// setting server to listen to port 3000
server.listen(443, ()=>{
	console.log('server has started');

});



// Checks if room code is present in DB
let checkRoomInDB = function(roomCode){
	return new Promise((resolve, reject)=>{
		
		let dataIsPresent = true;
		connector.query(`SELECT room_no FROM room_records WHERE room_no = "${roomCode}"`, (err, res)=>{
			if (err) throw err;		
			
			
			if(!res[0]){
				
				return reject(err);
			}		
			resolve(res[0]);
		});		
	});	
};

// Gets data from DB
let getDataFromDB = async function(query){	
	return new Promise((resolve, reject)=>{
		connector.query(query, (err, res)=>{
			if (err) throw err;
			if(!res[0]){
				return reject('No data');
			}
			resolve(res);
		});
	});	
};

// Used for queries that don't need to return anything
let writeDataToDB = async function(query){
	return new Promise((resolve, reject)=>{
		connector.query(query, (err, res)=>{
			if (err){
				reject(err);
			}
			resolve();
		});
	});
};

// updates the user count of particular room.
let updateUserCount = function(roomCode, increment){
	let query = `UPDATE room_records SET users = users ${increment?"+":"-"} 1 WHERE room_no = '${roomCode}'`;
	writeDataToDB(query);
};

