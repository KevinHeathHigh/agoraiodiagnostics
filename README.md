# AgoraDiagnostics

[Agora.io](https://agora.io) Web Sample App for exploring the AgroaRTC SDK.

Requires an [Agora.io](https://agora.io) account.

AgoraRTC SDK and Agora Signaling SDK can be downloaded at https://www.agora.io/en/download/
Currently localated in `public/js`.  Currently Signaling is not used.  Will add at some point in the future.

This is a [Node.js](https://nodejs.org) app utilizing [Express.js](http://expressjs.com/) framework.


## Running:

Clone repository, from `AgoraDiagnostics` subdirectory

```
npm install
npm start
```

Open WebRTC compatible browser to URL http://localhost:3000


## Note
This project uses [Express](http://expressjs.com/) to stand up a Web server, though there is no logic in the node app
itself in relation to the actual Agora Diagnostics tool.  The the contents of the `./public` folder can be exposed on
web server and the app will run just fine.

WebRTC compatable browsers do not allow media to be invoked on non-secure connections except for `localhost`.   To run
this app outside of you local developement envrionment will require security certificates setup on your weberver/domain.
