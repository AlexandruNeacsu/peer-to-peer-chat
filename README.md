# Peer-to-Peer Chat
> Privacy focused messaging app

A simple web based peer-to-peer chat app made using React and libp2p with a focus on privacy.
All messages are e2e encrypted and stored locally on the user's browser localStorage. 

The nameserver is a centralized server that allows adding contacts using a username. It's written with Express.js and 
uses sequelize with a DB of choice to store only pairs of username-ids.


## Features
- Uses a peer-to-peer network for finding and talking to contacts **securely and privately** using **end-to-end encryption**
- **Encrypt** and store all data **locally**
- Use on **mobile or desktop** via a browser
- Send **text messages and files**
- Start **video/voice calls**
- Pick and sync a **profile pic** to all your contacts
- **Block/remove** contacts 

## Install and usage
Install all dependencies for both the nameserver and web app using
```
npm install
```

You also need to run a signalling server for the web app on port 8080. I used the one that comes with 
the libp2p WebRTC transport: https://github.com/libp2p/js-libp2p-webrtc-star

For each one run
```
npm run start
```

## Screenshots
![Received contact request](/screenshots/requests_list.jpeg?raw=true)
![Contact page](/screenshots/chat_screen.jpeg?raw=true)
![Contact options](/screenshots/contact_options.jpeg?raw=true)
![Call alert modal](/screenshots/call_modal.jpeg?raw=true)
![Small draggable call window](/screenshots/draggable_call.jpeg?raw=true)
![Fullscreen call window](/screenshots/fullscren_call.jpeg?raw=true)
