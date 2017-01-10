var IceServers = [];
var sdpConstraints = {};
var first;

if(window.webkitRTCPeerConnection != undefined) { // chrome
    var peerConnection = new webkitRTCPeerConnection({iceServers: IceServers});
    sdpConstraints.mandatory = {
        "OfferToReceiveAudio": false,
        "OfferToReceiveVideo": false
    };
} else { // ff
    var peerConnection = new RTCPeerConnection({iceServers: IceServers});
    sdpConstraints = {
        "OfferToReceiveAudio": false,
        "OfferToReceiveVideo": false
    };
}

$(function() {
    $("#firstPlayer").click(offer);
    $("#secondPlayer").click(answer);
    
    $("#offerSDP textarea").change(setOfferSDP);
    $("#answerSDP textarea").val('');
    $("#answerSDP textarea").change(setAnswerSDP);
});

function offer() {
    //console.log('offer');
    
    createChannel('localMouse');
    
    first = true;
    
    peerConnection.createOffer(getOfferSDP, createOfferFailure, sdpConstraints);
    
    $("#firstPlayer, #secondPlayer").hide();
}

function answer() {
    //console.log('answer');
    
    first = false;
    
    $("#offerSDP").show();
    
    $("#firstPlayer, #secondPlayer").hide();
}

function setOfferSDP() {
    //console.log($("#offerSDP textarea").val())
    
    var obj = JSON.parse($("#offerSDP textarea").val());
    //console.log(obj);
    var rsd = new RTCSessionDescription(obj);

    //console.log(rsd);

    peerConnection.setRemoteDescription(rsd, setRemoteDescriptionSuccess, setRemoteDescriptionFailure);    
}

function setAnswerSDP() {
    var obj = JSON.parse($("#answerSDP textarea").val());

    var rsd = new RTCSessionDescription(obj);

    //console.log(rsd);

    peerConnection.setRemoteDescription(rsd, setRemoteDescriptionSuccess, setRemoteDescriptionFailure);
}

function sendData(data) {
    if(first == true) {
        sendChannel.send(data);
    } else {
        receiveChannel.send(data);
    }
}

/* Connection */

function getOfferSDP(offerSDP) {
    //console.log('getOfferSDP');
    //console.log(offerSDP);
    
    peerConnection.setLocalDescription(offerSDP, setLocalDescriptionSuccess, setLocalDescriptionFailure);
}

function createOfferFailure(data) {
    console.log('createOfferFailure');
    console.log(data);
}

function setLocalDescriptionSuccess() {
    //console.log('setLocalDescriptionSuccess');
    
    if(peerConnection.localDescription.type == "offer") {
        $("#offer").html(JSON.stringify(peerConnection.localDescription)).show();
        $("#answerSDP").show();
    } else if(peerConnection.localDescription.type == "answer") {
        $("#answer").html(JSON.stringify(peerConnection.localDescription)).show();
    }
}

function setLocalDescriptionFailure(data) {
    console.log('setLocalDescriptionFailure');
    console.log(data);    
}

/**/

function setRemoteDescriptionSuccess(data) {
    //console.log('setRemoteDescription');
    //console.log(data);    
    
    if(first == false) {
        peerConnection.createAnswer(createAnswerSuccess, createAnswerFailure);
    }
}

function setRemoteDescriptionFailure(data) {
    //console.log('setRemoteDescriptionFailure');
    //console.log(data);
}

/**/

function createAnswerSuccess(answer) {
    //console.log('createAnswerSuccess');
    //console.log(answer);
    
    peerConnection.setLocalDescription(answer, setLocalDescriptionSuccess, setLocalDescriptionFailure);
}

function createAnswerFailure(data) {
    console.log('createAnswerFailure');
    console.log(data);
}


/* Data Channel */

var sendChannel ;
        
function createChannel(title) {
    sendChannel = peerConnection.createDataChannel(title, { ordered: false });

    //console.log(sendChannel);

    sendChannel.onopen = channelOpen;

    sendChannel.onclose = channelClose;

    sendChannel.onmessage = channelMessage;

    sendChannel.onerror = channelError;
}

/**/

var receiveChannel;

peerConnection.ondatachannel = function (event) {
    //console.log('ondatachannel');
    //console.log(event);

    receiveChannel = event.channel;
    
    receiveChannel.onopen = channelOpen;

    receiveChannel.onclose = channelClose;

    receiveChannel.onmessage = channelMessage;

    receiveChannel.onerror = channelError;
};

/**/

function channelOpen(data) {
    //console.log('channelOpen');
    //console.log(data);
    //console.log(this);
    
    $("#offer, #answerSDP, #offerSDP, #answer").hide();
    
    startGame();
};

function channelClose(data) {
    console.log('channelClose');
    console.log(data);
};

function channelMessage(data) {
    //console.log('channelMessage');
    //console.log(data);

    processingData(data);
};
    
function channelError(data) {
    console.log('channelError');
    console.log(data);
};    

/* Game */

function startGame() {
    $("#playField").mousemove(playerPosition).show();
    
    $("#mouseCursorFirst").offset($("#playField").offset()).show();
    $("#mouseCursorSecond").offset($("#playField").offset()).show();
    
    if(first == true) {
        createRedDot();
    }
}

function playerPosition(event) {
    var playFieldOffset = $("#playField").offset();
    playFieldOffset.left = Math.round(playFieldOffset.left);
    playFieldOffset.top = Math.round(playFieldOffset.top);

    if((event.pageX - playFieldOffset.left) > ($("#playField").width() - $("#mouseCursorFirst").width()) || (event.pageY - playFieldOffset.top) > ($("#playField").height() - $("#mouseCursorFirst").width())) {
        return;
    }

    if(first == true) {
        $("#mouseCursorFirst").offset({ top: event.pageY, left: event.pageX });    
        
        sendData([ 1, event.pageY - playFieldOffset.top, event.pageX - playFieldOffset.left ])
    } else {
        $("#mouseCursorSecond").offset({ top: event.pageY, left: event.pageX });

        sendData([ 1, event.pageY - playFieldOffset.top, event.pageX - playFieldOffset.left ])
    }
}

function processingData(data) {
    var obj = ((data.data).split(",")).map(function (x) { return parseInt(x, 10) });

    var command = obj[0];
    obj.shift();
    
    switch (command) {
        case 1:
            opponentMove(obj);
            break;
    }
}

function opponentMove(obj) {
    var playFieldOffset = $("#playField").offset();
    
    if(first == true) {
        $("#mouseCursorSecond").offset({ top: playFieldOffset.top + obj[0], left: playFieldOffset.left + obj[1] });
    } else {
        $("#mouseCursorFirst").offset({ top: playFieldOffset.top + obj[0], left: playFieldOffset.left + obj[1] });    
    }        
}

function createRedDot() {
    
}


/**/
