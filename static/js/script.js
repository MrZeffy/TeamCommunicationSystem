// Maintaining the user count
let userCount = 1;


// Connecting to the socket
const socket = io('http://ec2-3-80-60-218.compute-1.amazonaws.com:3000/');

// Targeting the containers
let videoContainer = null;
let userCountContainer = null;
let hourElement = null;
let minuteElement = null;
let muteRejectButtons = null;
let controlCenter = null;

document.addEventListener('DOMContentLoaded', ()=>{
	videoContainer = document.getElementById('videoContainer');
	userCountContainer = document.getElementById('participantCount');
	hourElement = document.getElementById('timerHour');
	minuteElement = document.getElementById('timerMinute');
	muteRejectButtons = document.getElementsByClassName('buttonContainer');
	controlCenter = document.getElementsByClassName('controlCenter')[0];
	updateUserCount();
	updateTime();
	activateControlButtons();
	setInterval(updateTime, 60000);


	document.addEventListener('mousemove', ()=>{
		toggleControlCenter(true);
	})

});




// Using peerJs for handling peer to peer connections
const myPeer = new Peer(undefined, {
	host: '/',
	port: '3001'
});

// For maintaining list of people joined
const peers = {};
let myStream = null;

// setting up your own video
const myVideo = document.createElement('video');
myVideo.muted = true;

// Getting user media(mic and webcam)
navigator.mediaDevices.getUserMedia({video:true ,audio: true})
.then(stream=>{
	// Streaming it locally.
	addVideoStream(myVideo, stream);
	myStream = stream;

	// event listener on getting a call
	myPeer.on('call', call=>{

		// Sending our stream to caller on answering the call
		call.answer(stream);
		userCount += 1;
		console.log('increment');
		updateUserCount();
		// On getting user's stream, adding it to the page
		const video = document.createElement('video');
		call.on('stream', userVideoStream=>{
				addVideoStream(video, userVideoStream);
		});
		call.on('close', ()=>{
			userCount -= 1;
			updateUserCount();
			console.log('User disconnects');
			video.remove()
		});				
	});
	
	// Event listener for when a new user gets connected
	socket.on('user-connected', userId=>{
		connectToNewUser(userId, stream);
	})
});



function connectToNewUser(userId, stream){
	// Calling the new user and sending him our stream.
	const call = myPeer.call(userId, stream);
	const video = document.createElement('video');

	// When we get stream from user.
	call.on('stream', userVideoStream=>{		
		addVideoStream(video, userVideoStream);
	});

	// When user disconnects
	call.on('close', ()=>{
		userCount -= 1;
		updateUserCount();
		console.log('User disconnects');
		video.remove()
	});

	// Logging the user in register.
	peers[userId] = call;
	userCount += 1;
	console.log('increment');
	updateUserCount();
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

function updateUserCount(){
	userCountContainer.innerHTML = userCount;
}


function updateTime(){

	let dateObject = new Date();

	hourElement.innerHTML = dateObject.getHours();
	minuteElement.innerHTML = dateObject.getMinutes()<10?`0${dateObject.getMinutes()}`:dateObject.getMinutes();		
}

function toggleAudio(){
	myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled);
}

function toggleVideo(){
	myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);
}


function activateControlButtons(){
	muteRejectButtons[0].addEventListener('click', ()=>{
		toggleAudio();
		toggleAudioButton();
	});

	muteRejectButtons[1].addEventListener('click', ()=>{
		window.location.href = `http://${location.host}/endCall/`;
	})

	muteRejectButtons[2].addEventListener('click', ()=>{
		toggleVideoButton();
		toggleVideo();
	});
}

function toggleAudioButton(){
	let noAudio = '<i class="fas fa-microphone-slash"></i>';
	let yesAudio = '<i class="fas fa-microphone"></i>';
	if(muteRejectButtons[0].innerHTML.includes('slash')){
		muteRejectButtons[0].innerHTML =yesAudio;	
		muteRejectButtons[0].classList.remove('disabledRedButton')	
	}else{
		muteRejectButtons[0].innerHTML =noAudio;	
		muteRejectButtons[0].classList.add('disabledRedButton')	
	}		
}

function toggleVideoButton(){
	let noVideo = '<i class="fas fa-video-slash"></i>';
	let yesVideo = '<i class="fas fa-video"></i>';
	if(muteRejectButtons[2].innerHTML.includes('slash')){
		muteRejectButtons[2].innerHTML =yesVideo;
		muteRejectButtons[2].classList.remove('disabledRedButton')	
	}else{
		muteRejectButtons[2].innerHTML =noVideo;
		muteRejectButtons[2].classList.add('disabledRedButton');
	}	
}


let controlCenterTimeoutId = null;
function toggleControlCenter(){
	if(controlCenterTimeoutId){
		window.clearTimeout(controlCenterTimeoutId);
	}	
	controlCenter.classList.add('showControlCenter');	
	controlCenterTimeoutId = window.setTimeout(()=>{
		controlCenter.classList.remove('showControlCenter');
	},2000)
}
