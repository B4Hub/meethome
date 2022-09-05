
    const socket = io();
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const toggleAudio = document.getElementById('toggleAudio');
    const toggleCamera = document.getElementById('toggleCamera');
    const remoteVideos = document.getElementById('remoteVideos');


    

    let peers = [];

    const configuration = {
        iceServers: [{
            urls: 'stun:stun1.l.google.com:19302'
        }]
    };



    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('saveuser',{
            username: '<%= name %>',
            userid: '<%= userid %>',
            roomid: '<%= roomid %>',
            picture: '<%= picture %>'
        });

        socket.emit('joinroom', {
            roomid: '<%= roomid %>',
            socketid: socket.id,
            username: '<%= name %>',
            picture: '<%= picture %>',
            userid: '<%= userid %>'
        });


        
    });

    
    
  
    let localStream;
    let remoteStream;
    let room;
    let camera = false;
    let mic = false;

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    }).then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        localVideo.muted = true;
        localVideo.play();
    }).catch(err => {
        console.log(err);
    });



    socket.on('answer', (data) => {
        peers[data.peerid].setRemoteDescription(JSON.parse(data.answer));
        console.log('Answer received');

    });



    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    toggleAudio.addEventListener('click', () => {
        mic = !mic;
        localStream.getAudioTracks()[0].enabled = mic;
        if (mic) {
            toggleAudio.innerHTML = 'Mute';
        } else {
            toggleAudio.innerHTML = 'Unmute';
        }
    });    
    

    toggleCamera.addEventListener('click', () => {
        camera = !camera;
        localStream.getVideoTracks()[0].enabled = camera;
        if (camera) {
            toggleCamera.innerHTML = 'Stop Video';
        } else {
            toggleCamera.innerHTML = 'Start Video';
        }
    });


    socket.on('userjoined', (data) => {

        const peer = new RTCPeerConnection();
        peer.peerid = "id" + Math.random().toString(16).slice(2);
        peer.oniceconnectionstatechange = e => console.log(peer.iceConnectionState);
        peer.peerChannel = peer.createDataChannel('chat');
        
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
        peer.peerChannel.onopen = () => {
            console.log('Channel Opened');
            
        };
        peer.peerChannel.onmessage = (event) => {
            console.log(event.data);
        };
        peer.peerChannel.onclose = () => {
            console.log('Channel Closed');
        };
        peer.peerChannel.onerror = (err) => {
            console.log(err);
        };
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {
                    candidate: event.candidate,
                    roomid: '<%= roomid %>',
                    peerid: peer.peerid,
                    username: '<%= name %>',
                    socketid: data.socketid,
                    picture: '<%= picture %>',
                    userid: '<%= userid %>'
                })
            }
        };
        const remoteVideo = document.createElement('video');
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.innerHTML = data.username;
        div.className = 'video bg-dark';
        div.appendChild(remoteVideo);
        div.appendChild(label);
        remoteVideo.srcObject = null;
        peer.ontrack = (event) => {
            console.log('Track received');
            
            remoteVideo.srcObject = event.streams[0];
        };
        
        remoteVideo.autoplay = true;
        remoteVideo.playsinline = true;
        remoteVideo.id = data.userid;
        remoteVideo.className = 'remoteVideo';
        remoteVideos.appendChild(div);
        peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit('offer', {
                offer: JSON.stringify(offer),
                peerid : peer.peerid,
                socketid: data.socketid,
                roomid: '<%= roomid %>',
                username: '<%= name %>',
                picture: '<%= picture %>',
                userid: '<%= userid %>'
            })
        });


        peers[peer.peerid] = peer;


        
    });

    socket.on('offer',(data)=>{
        const peer = new RTCPeerConnection();
        peer.peerid = data.peerid;
        peer.ondatachannel =  (event) => {
            peer.peerChannel = event.channel;
            peer.peerChannel.onopen = () => {
                console.log('Channel Opened');
                

            };
            peer.peerChannel.onmessage = (event) => {
                console.log(event.data);
            };
            peer.peerChannel.onclose = () => {
                console.log('Channel Closed');
            };
            peer.peerChannel.onerror = (err) => {
                console.log(err);
            };
            console.log('Data Channel Created');
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {
                    candidate: event.candidate,
                    socketid: data.socketid,
                    roomid: '<%= roomid %>',
                    peerid: peer.peerid,
                })
            }
        };
        
        const remoteVideo = document.createElement('video');
        const div = document.createElement('div');
        const label = document.createElement('label');
        label.innerHTML = data.username;
        div.className = 'video bg-dark';
        div.appendChild(remoteVideo);
        div.appendChild(label);


        remoteVideo.srcObject = null;
        peer.ontrack = (event) => {
            console.log('Track received');
            remoteVideo.srcObject = event.streams[0];

        };
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;
            remoteVideo.id = data.userid;
            remoteVideo.className = 'remoteVideo';
            remoteVideos.appendChild(div);

        peer.setRemoteDescription(JSON.parse(data.offer));
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                }).then(stream => {
                    localStream = stream;
                    localVideo.srcObject = null;
                    localVideo.srcObject = stream;
                    localVideo.muted = true;
                    localVideo.play();
                    
                }).then(()=>{
                    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
                    peer.createAnswer().then((answer) => {
                    peer.setLocalDescription(answer);
                    socket.emit('answer', {
                        answer: JSON.stringify(answer),
                        peerid : peer.peerid,
                        socketid: data.socketid,
                        roomid: '<%= roomid %>',
                        username: '<%= name %>',
                        picture: '<%= picture %>',
                        userid: '<%= userid %>'
                    })
                })
                }
                    
                    
                )
                
                .catch(err => {
                    console.log(err);
                });
        
        peers[peer.peerid] = peer;
    });
    socket.on('candidate', (data) => {
        peers[data.peerid].addIceCandidate(data.candidate);
    });

    socket.on('userleft', (data) => {
        const remoteVideo = document.getElementById(data.userid);
        remoteVideo.remove();
        console.log(data);
    });

