var client;
var channel_name;
var user_name;
var local_uid;

var local_signal;
var local_stream;
var remote_stream;

$(() => {
    AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.DEBUG);
    var compatible = AgoraRTC.checkSystemRequirements();
    if (compatible) {
        $("#system_check").html("Browser Compatible");
    } else {
        $("#system_check").html("Browser Not Compatible");
    }

    console.log("AgoraRTC: ", JSON.stringify(AgoraRTC));
    console.log("Logger: ", JSON.stringify(AgoraRTC.Logger));

    $('[data-toggle="tooltip"]').tooltip();

    $("#btn_create_client").click((e) => {
        e.preventDefault();
        connenctAgoraRTC();
    })

    $("#btn_init").click((e) => {
        e.preventDefault();
        var app_id = $("#app_id").val().trim();
        initClient(app_id);
    })

    $("#btn_join").click((e) => {
        e.preventDefault();
        channel_name = $("#channel_name").val().trim();
        joinChannel();
    })

    $("#btn_add").click((e) => {
        e.preventDefault();
        user_name = $("#user_name").val().trim();
    })

    $("#btn_create_local_media").click((e) => {
        e.preventDefault();
        createLocalStream();
    })

    $("#btn_init_local_stream").click((e) => {
        e.preventDefault();
        initLocalStream();
    })

    $("#btn_publish_local_stream").click((e) => {
        e.preventDefault();
        publishLocalStream();
    })

    $("#btn_play_local_media").click((e) => {
        e.preventDefault();
        playLocalMedia();
    })

    $("#btn_local_audio_mute").click((e) => {
        e.preventDefault();
        localAudioMute();
    })

    $("#btn_local_video_mute").click((e) => {
        e.preventDefault();
        localVideoMute();
    })

    $("#btn_local_stats").click((e) => {
        e.preventDefault();
        getLocalStats();
    })

    $("#btn_subscribe_remote_stream").click((e) => {
        e.preventDefault();
        subscribeRemoteStream();
    })

    $("#btn_play_remote_media").click((e) => {
        e.preventDefault();
        playRemoteMedia();
    })

    $("#btn_remote_stats").click((e) => {
        e.preventDefault();
        getRemoteStats();
    })

    function connenctAgoraRTC() {
        var interop_mode = $("#interop_mode").val();
        var interop = '';
        if (interop_mode != 'none') {
            interop = { mode: interop_mode };
        }
        client = AgoraRTC.createClient(interop);
        $("#btn_create_client").html("Client Created");
        clientCallbacks();
    }

    function initClient(app_id) {
        console.log("Initializing Client");
        client.init(app_id, (obj) => {
            console.log("Client Initialized: ", JSON.stringify(obj), JSON.stringify(client));
            $("#btn_init").html("Client Initialized");
            displayDevices();
        });
        local_signal = Signal(app_id);
        console.log("Signaling Initialized: ", JSON.stringify(local_signal));
    }

    function displayDevices() {
        AgoraRTC.getDevices((devices) => {
            $("#devices tbody").empty();
            for (var i = 0; i != devices.length; ++i) {
                var device = devices[i];
                $("#devices tbody").append(`<tr><th scope="row">${device.deviceId}</th><td>${device.lablel}</td><td>${device.kind}</td></tr>`);
            }
        });
    }

    function clientCallbacks() {
        //Local
        client.on('stream-published', (event) => {
            console.log("Published local stream successfully");
            console.log("Event: ", event);
        });

        //Remote
        client.on('stream-added', (event) => {
            remote_stream = event.stream;
            var uid = remote_stream.getId();
            console.log("Remoted Stream Detected: ", uid);
            $("#remote_uid").empty();
            $("#remote_uid").append(`Remote Media <b>UID:</b> <i>${uid}</i>`);
            addRemoteUser(uid);
        });

        client.on('stream-removed', (event) => {
            var stream = event.stream;
            console.log("Remote Stream Removed: ", stream.getId());
        });

        client.on('stream-subscribed', (event) => {
            remote_stream = event.stream;
            console.log("Reomote Stream Subscribed: ", remote_stream.getId());
        });

        client.on('peer-leave', (event) => {
            var uid = event.uid;
            console.log('Remote User Left: ', uid);
        });

        client.on('mute-audio', (event) => {
            var uid = event.uid;
            console.log('Mute Audio:', uid);
        });

        client.on('unmute-audio', (event) => {
            var uid = event.uid;
            console.log("Unmute Audio:", uid);
        });

        client.on('mute-video', (event) => {
            var uid = event.uid;
            console.log('Mute Video:', uid);
        });

        client.on('unmute-video', (event) => {
            var uid = event.uid;
            console.log("Unmute Video:", uid);
        });

        client.on('active-speaker', (event) => {
            var uid = event.uid;
            console.log('Active Speaker: ', uid);
        });

        client.on('client-banned', (event) => {
            var uid = event.uid;
            var attr = event.attr;
            console.log('Client Banned:', uid, attr);
        });
    }

    function localStreamCallbacks() {
        local_stream.on('accessAllowed', () => {
            console.log('Local Stream Access Allowed');
        });

        local_stream.on('accessDenied', () => {
            console.log('Local Stream Access Denied');
        });
    }

    function joinChannel() {
        if ($("#btn_join").html() == 'Join') {
            client.join(null, channel_name, null, (uid) => {
                local_uid = uid;
                $("#local_uid").empty();
                $("#local_uid").append(`Local Media <b>UID:</b> ${uid}`);
                $("#btn_join").html("Leave");
                $("#btn_join").removeAttr('title');
                $("#btn_join").attr('title', 'client.leave()');
            });
        } else {
            client.leave(() => {
                $("#local_uid").empty();
                $("#local_uid").append(`Local Media`);
                $("#btn_join").html("Join");
            });
        }
    }

    function addRemoteUser(uid) {
        $("#users tbody").append(`<tr><th scope="row">${uid}</th></tr>`);
    }

    function createLocalStream() {
        local_stream = AgoraRTC.createStream({ streamID: local_uid, audio: true, video: true, screen: false });
        local_stream.setVideoProfile('240P_4');
        localStreamCallbacks();
    }

    function initLocalStream() {
        local_stream.init(() => {
            console.log("Local Stream Initialized");
        });
    }

    function publishLocalStream() {
        client.publish(local_stream, (error) => {
            console.log("Publish Local Stream Error", error);
        });
    }

    function playLocalMedia() {
        local_stream.play('local-media');
    }

    function getLocalStats() {
        setInterval(() => {
            local_stream.getStats((stats) => {
                $("#local_stats").empty();
                $("#local_stats").append(`<table><tbody>`);
                for (var key in stats) {
                    if (stats.hasOwnProperty(key)) {
                        $("#local_stats").append(`<tr><td>${key}</td><td>${stats[key]}</td></tr>`);
                    }
                }
                $("#local_stats").append(`</tbody></table>`);
            });
        }, 1000);
    }

    function subscribeRemoteStream() {
        client.subscribe(remote_stream, (error) => {
            console.log("Subscribe Remote Stream");
        });
    }

    function playRemoteMedia() {
        remote_stream.play('remote-media');
    }

    function getRemoteStats() {
        setInterval(() => {
            remote_stream.getStats((stats) => {
                $("#remote_stats").empty();
                $("#remote_stats").append(`<table><tbody>`);
                for (var key in stats) {
                    if (stats.hasOwnProperty(key)) {
                        $("#remote_stats").append(`<tr><td>${key}</td><td>${stats[key]}</td></tr>`);
                    }
                }
                $("#remote_stats").append(`</tbody></table>`);
            });
        }, 1000);
    }
})