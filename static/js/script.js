// Connecting to the socket
const socket = io('http://localhost:3000/');

// Targeting the video container
const videoContainer = document.getElementById('videoContainer');

// Using peerJs for handling peer to peer connections
const myPeer = new Peer(undefined, {
	host: '/',
	port: '3001'
});

// For maintaining list of people joined
const peers = {};

// setting up your own video
const myVideo = document.createElement('video');
myVideo.muted = true;

// Getting user media(mic and webcam)
navigator.mediaDevices.getUserMedia({video:true ,audio: true})
.then(stream=>{
	// Streaming it locally.
	addVideoStream(myVideo, stream);

	// event listener on getting a call
	myPeer.on('call', call=>{

		// Sending our stream to caller on answering the call
		call.answer(stream);

		// On getting user's stream, adding it to the page
		const video = document.createElement('video');
		call.on('stream', userVideoStream=>{
				addVideoStream(video, userVideoStream);
		})

	})
	
	// Event listener for when a new user gets connected
	socket.on('user-connected', userId=>{
		connectToNewUser(userId, stream);
	})
})

function connectToNewUser(userId, stream){
	// Calling the new user and sending him our stream.
	const call = myPeer.call(userId, stream)
	const video = document.createElement('video');

	// When we get stream from user.
	call.on('stream', userVideoStream=>{
		addVideoStream(video, userVideoStream);
	})

	// When user disconnects
	call.on('close', ()=>{
		video.remove()
	});

	// Logging the user in register.
	peers[userId] = call;
}



// When peer connection is established and user has joined the room.
myPeer.on('open', id=>{
	socket.emit('join-room', ROOM_ID, id);	
})

// When a user disconnects from the call.
socket.on('user-connected', (userId)=>{
	console.log(userId);
	
});

// When a user disconnects from call.
socket.on('user-disconnected', (userId)=>{
	console.log('A user has disconnected');
	if(peers[userId]){
		peers[userId].close();
	}
});

// Adding a video stream.
function addVideoStream(video, stream){
	video.srcObject = stream;
	video.addEventListener('loadedmetadata', ()=>{
		video.play();
	})
	videoContainer.append(video);
}
