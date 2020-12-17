let inputField = null;
let joinButton = null;
let userChoiceForm = null;
let newMeetingButton = null;

document.addEventListener('DOMContentLoaded', ()=>{
	userChoiceForm = document.querySelector('.userMeetingChoiceForm');
	inputField = document.getElementById('meetingCodeField');
	joinButton = document.getElementById('joinButton');
	newMeetingButton = document.getElementById('newMeetingButton');
	inputField.addEventListener('focus', ()=>{
		
		joinButton.classList.remove('hideMe');
	});

	inputField.addEventListener('input', ()=>{
		joinButton.removeAttribute('disabled');
	})

	userChoiceForm.addEventListener('submit', (event)=>{
		event.preventDefault();
	});

	newMeetingButton.addEventListener('click', createANewRoom);

	joinButton.addEventListener('click', navigateToGivenCode);


});

let navigateToGivenCode = function (){
	
	window.location.replace(`${window.location.href}r/${inputField.value}`);
}

let createANewRoom = function(){
	console.log('Creating a new room');
	window.location.replace(`${window.location.href}generateRoom`);
}