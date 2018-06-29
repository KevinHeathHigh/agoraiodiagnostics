/*jshint esversion: 6 */

var client;
var channel_name;
var user_name;
var local_uid;

var local_signal;
var local_stream;
var selected_remote_uid;
var selected_remote_stream;
var remote_streams = [];

$(() => {
    logger("AgoraSDK Version: 2.2.0");
    logger("Agora Function: <b style='color:indigo'>AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.DEBUG)</b>");
    AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.DEBUG);

    function logger() {
        var message = "";
        for (var i = 0; i < arguments.length; i++) {
            message += arguments[i] + " ";
        }
        $("#logging tbody").append(`<tr><td style="font-size:xx-small; font-family: Courier New, Courier, monospace">${message}</td></tr>`);
        $("#logging-table").scrollTop = $("#logging-table").scrollHeight;
    }

    var compatible = AgoraRTC.checkSystemRequirements();
    logger("Agora Function: <b style='color:indigo'>AgoraRTC.checkSystemRequirements()</b>");
    if (compatible) {
        logger("<b style='color:green'>System Compatible</b>");
        $("#system_check").css("color", "green");
        $("#system_check").html("Browser Compatible");
    } else {
        logger("<b style='color:red'>System Incompatible</b>");
        $("#system_check").css("color", "red");
        $("#system_check").html("Browser Not Compatible");
    }

    logger("AgoraRTC:", JSON.stringify(AgoraRTC, null, 1));

    $('[data-toggle="tooltip"]').tooltip();

    $("#btn_create_client").click((e) => {
        e.preventDefault();
        logger("Create Client Button Clicked");
        connenctAgoraRTC();
    });

    $("#app_id").keyup(() => {
        if ($("#app_id").val() == "") {
            disableButton("#btn_init");
        } else {
            enableButton("#btn_init");
        }
    });

    $("#btn_init").click((e) => {
        e.preventDefault();
        logger("Client Initialize Button Clicked");
        var app_id = $("#app_id").val().trim();
        logger("App ID:", app_id);
        initClient(app_id);
    });

    $("#channel_name").keyup(() => {
        if ($("#channel_name").val() == "") {
            disableButton("#btn_join");
        } else {
            enableButton("#btn_join");
        }
    });

    $("#btn_join").click((e) => {
        e.preventDefault();
        logger("Create Client Button Clicked");
        channel_name = $("#channel_name").val().trim();
        logger("Channel Name:", channel_name);
        joinChannel();
    });

    $("#btn_create_local_stream").click((e) => {
        e.preventDefault();
        logger("Create Local Stream Button Clicked");
        createLocalStream();
    });

    $("#btn_init_local_stream").click((e) => {
        e.preventDefault();
        logger("Initialize Local Stream Button Clicked");
        initLocalStream();
    });

    $("#btn_publish_local_stream").click((e) => {
        e.preventDefault();
        logger("Publish Local Stream Button Clicked");
        publishLocalStream();
    });

    $("#btn_play_local_media").click((e) => {
        e.preventDefault();
        logger("Play Local Media Button Clicked");
        playLocalMedia();
    });

    $("#btn_mute_local_audio").click((e) => {
        e.preventDefault();
        logger("Mute Local Audio Button Clicked");
        muteLocalAudio();
    });

    $("#btn_mute_local_video").click((e) => {
        e.preventDefault();
        logger("Local Video Mute Button Clicked");
        muteLocalVideo();
    });

    $("#btn_local_stats").click((e) => {
        e.preventDefault();
        logger("Local Stats Button Clicked");
        getLocalStats();
    });

    $("#btn_subscribe_remote_stream").click((e) => {
        e.preventDefault();
        logger("Remote Stream Subscribe Button Clicked");
        subscribeRemoteStream();
    });

    $("#btn_play_remote_media").click((e) => {
        e.preventDefault();
        logger("Play Remote Media Button Clicked");
        playRemoteMedia();
    });

    $("#btn_remote_audio_mute").click((e) => {
        e.preventDefault();
        logger("Mute Remote Audio Button CLicked");
        muteRemoteAudio();
    });

    $("#btn_remote_video_mute").click((e) => {
        e.preventDefault();
        logger("Mute Remote Video Button Clicked");
        muteRemoteVideo();
    });

    $("#btn_remote_stats").click((e) => {
        e.preventDefault();
        logger("Remote Stats Button Clicked");
        getRemoteStats();
    });


    function connenctAgoraRTC() {
        logger("Local Function: <b style='color:darkBlue'>connectAgoraRTC()</b>");
        var interop_mode = $("#interop_mode").val();
        var interop = '';
        if (interop_mode != 'none') {
            interop = { mode: interop_mode };
        }
        logger("AgoraRTC Function: <b style='color:indigo'>AgoraRTC.createClient(", JSON.stringify(interop, null, 1), ")</b>");
        client = AgoraRTC.createClient(interop);
        logger("Client: ", JSON.stringify(client, null, 1));
        $("#btn_create_client").html("Client Created");
        clientCallbacks();
    }

    function initClient(appId) {
        logger("Local Function: <b style='color:darkBlue'>initClient(" + appId + ")</b>");
        logger("AgoraRTC Function: <b style='color:indigo'>client.init(" + appId + ")</b>");
        client.init(appId, (obj) => {
            $("#btn_init").html("Client Initialized");
            displayDevices();
        });
    }

    function displayDevices() {
        logger("Local Function: <b style='color:darkBlue'>displayDevices()</b>");
        logger("Agora Function: <b style='color:indigo'>AgoraRTC.checkSystemRequirements()</b>");
        AgoraRTC.getDevices((devices) => {
            logger("Displaying Devices: <b style='color:darkBlue'>AgoraRTC.getDevices()</b>");
            $("#devices tbody").empty();
            for (var i = 0; i != devices.length; ++i) {
                var device = devices[i];
                $("#devices tbody").append(`<tr style='font-size:10px'><th>${device.deviceId}</th><td>${device.lablel}</td><td>${device.kind}</td></tr>`);
            }
        });
    }

    function clientCallbacks() {
        logger("Local Function: <b style='color:darkBlue'>clientCallbacks()</b>");
        client.on('stream-published', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'stream-published'</b>");
            logger("Published local stream successfully");
            enableButton("#btn_play_local_media");
            $("#btn_publish_local_stream").html("Unpublish");
        });

        //Remote
        client.on('stream-added', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'stream-added'</b>");
            remote_streams.push(event.stream);
            var uid = event.stream.getId();
            logger("Remote Stream Detected: ", uid);
            addRemoteUser(uid, event.stream);
        });

        client.on('stream-removed', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'stream-removed'</b>");
            var stream = event.stream;
            logger("Remote Stream Removed: ", stream.getId());
            removeRemoteUser(stream.getId());
        });

        client.on('stream-subscribed', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'stream-subscribed'</b>");
            selected_remote_stream = event.stream;
            logger("Reomote Stream Subscribed: ", selected_remote_stream.getId());
            enableButton("#btn_play_remote_media");
            $("#btn_subscribe_remote_stream").html("Unsubscribe");
        });

        client.on('peer-leave', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'peer-leave'</b>");
            var uid = event.uid;
            logger('Remote User Left: ', uid);
        });

        client.on('mute-audio', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'mute-audio'</b>");
            var uid = event.uid;
            logger('Audio Muted:', uid);
            $("#btn_mute_local_audio").html("Unmute Audio");
        });

        client.on('unmute-audio', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'unmute-audio'</b>");
            var uid = event.uid;
            logger("Unmute Audio:", uid);
            $("#btn_mute_local_audio").html("Mute Audio");
        });

        client.on('mute-video', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'mute-video'</b>");
            var uid = event.uid;
            logger('Mute Video:', uid);
            $("#btn_mute_local_video").html("Unmute Video");
        });

        client.on('unmute-video', (event) => {
            logger("Agora Client Event: 'unmute-video'");
            var uid = event.uid;
            logger("Unmute Video:", uid);
            $("#btn_mute_local_video").html("Mute Video");
        });

        client.on('active-speaker', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'active-speaker'</b>");
            var uid = event.uid;
            logger('Active Speaker: ', uid);
        });

        client.on('client-banned', (event) => {
            logger("Agora Client Event: <b style='color:darkGreen'>'client-banned'</b>");
            var uid = event.uid;
            var attr = event.attr;
            logger('Client Banned:', uid, attr);
        });
    }

    function localStreamCallbacks() {
        logger("Local Function: <b style='color:darkBlue'>localStreamCallbacks()</b>");
        local_stream.on('accessAllowed', () => {
            logger("Agora Local Stream Event: <b style='color:darkGreen'>'accessAllowed'</b>");
            $("#media_auth").css("color", "green");
            $("#media_auth").html(' - Local Stream Access Allowed');
            $("#btn_init_local_stream").html("Close");
            enableButton("#btn_publish_local_stream");
        });

        local_stream.on('accessDenied', () => {
            logger("Agora Local Steam Event: <b style='color:darkGreen'>'accessDenied'</b>");
            $("#media_auth").css("color", "red");
            $("#media_auth").html(' - Local Stream Access Denied');
        });
    }

    //Join or Leave the channel named in the channel name texted box.
    function joinChannel() {
        logger("Local Function: <b style='color:darkBlue'>joinChannel()</b>");
        channel_name = $("#channel_name").val();
        logger("Channel Name:", channel_name);
        if (channel_name != "") {
            if ($("#btn_join").html() == 'Join Channel') {
                logger("Agora Function: <b style='color:indigo'>client.join(null, " + channel_name + ", null,)</b>");
                client.join(null, channel_name, null, (uid) => {
                    logger("<b style='color:darkRed'>client.join(...)</b> returned UID:", uid);
                    local_uid = uid;
                    $("#local_uid").empty();
                    $("#local_uid").append(`Local Media <b>UID:</b> ${uid}`);
                    $("#btn_join").html("Leave Channel");
                    disableButton("#channel_name");
                    enableButton("#btn_create_local_stream");
                });
            } else {
                logger("Agora Function: <b style='color:indigo'>client.leave()</b>");
                client.leave(() => {
                    $("#local_uid").empty();
                    $("#local_uid").append(`Local Media`);
                    $("#btn_join").html("Join Channel");
                    enableButton("#channel_name");
                    disableButton("#btn_create_local_stream");
                });
            }
        }
    }

    //Adds Rows to User Table to show Remote Users as they get added.
    function addRemoteUser(uid, stream) {
        logger("Local Function: <b style='color:darkBlue'addRemoteUser(", uid, ")</b>");
        logger("Remote Stream Has Video: ", stream.hasVideo());
        logger("Remote Stream Has Audio: ", stream.hasAudio());
        logger(JSON.stringify(stream, null, 1));
        $("#users tbody").append(`<tr id=${uid}><td>${uid}</td><td>${stream.hasVideo()}</td><td>${stream.hasAudio()}</td></tr>`);
        $(`#${uid}`).click((e) => {
            e.preventDefault();
            logger("Remote User Clicked");
            logger(JSON.stringify(e));
            selectRemoteUser(uid);
        });
    }

    //Called when a user is clicked on the User table, will allow this user to be viewed
    //in the remote user media div
    function selectRemoteUser(uid) {
        logger("Local Function: <b style='color:darkBlue'>selectRemoteUser(", uid, ")</b>");
        $("#" + selected_remote_uid).removeClass('table-light');
        selected_remote_uid = uid;
        $('#' + uid).addClass('table-dark');
        $("#remote_uid").empty();
        $("#remote_uid").append(`Remote Media <b>UID:</b> <i>${uid}</i>`);
        //TODO: un subscribe current remote user
        //Loop through the remote user's stream array and grab the stream for the selected remote user
        remote_streams.forEach((stream, index) => {
            if (stream.getId() == uid) {
                selected_remote_stream = stream;
            }
        });
        if (selected_remote_stream.hasAudio) {
            $("#has_remote_audio").prop('checked', true);
        }
        if (selected_remote_stream.hasVideo) {
            $("#has_remote_video").prop('checked', true);
        }
        enableButton("#btn_subscribe_remote_stream");
    }

    //Remove users from Table when user 
    function removeRemoteUser(uid) {
        logger(`Local Function: <b style='color:darkBlue'>removeRemoteUser(${uid})</b>`);
        var rwIndx = $("#" + uid).parentNode.parentNode.rowIndex;
        $("#users").deleteRow(rwIndx);
    }

    //Creates the local media stream 
    function createLocalStream() {
        logger("Local Function: <b style='color:darkBlue'>createLocalStream()</b>");
        var requestAudio = $("#local_audio").prop('checked');
        var requestVideo = $("#local_video").prop('checked');
        logger("Request Audio:", requestAudio, " Request Video:", requestVideo);
        var streamConfig = { streamID: local_uid, audio: requestAudio, video: requestVideo, screen: false };
        logger("Stream Config:", JSON.stringify(streamConfig, null, 1));
        local_stream = AgoraRTC.createStream(streamConfig);
        logger("Agora Function: AgoraRTC.createStream(", JSON.stringify(streamConfig, null, 1), ")");
        local_stream.setVideoProfile('240P_4');
        localStreamCallbacks();
        enableButton("#btn_init_local_stream");
    }

    function initLocalStream() {
        logger("Local Function: <b style='color:darkBlue'>initLocalStream()</b>");
        if ($("#btn_init_local_stream").html() == "Init") {
            logger("Agora Function: <b style='color:indigo'>local_stream.init()</b>");
            local_stream.init(() => {
                logger("Local Stream Initialized");
            });
        } else {
            logger("Agora Function: <b style='color:indigo'>local_stream.close()</b>");
            local_stream.close();
        }
    }

    function publishLocalStream() {
        logger("Local Function: <b style='color:darkBlue'>publishLocalStream()</b>");
        if ($("#btn_publish_local_stream").html() == "Publish") {
            logger("Agora Function: <b style='color:indigo'>client.publish(", JSON.stringify(local_stream, null, 1), ")</b>");
            client.publish(local_stream, (error) => {
                logger("Publish Local Stream Error <em style='color:red'>", error, "</em>");
            });
        } else {
            logger("Agora Function: <b style='color:indigo'>client.unpublish()</b>");
            client.unpublish(local_stream, (error) => {
                logger("Unpublish Local Stream Error <em style='color:red'>", error, "</em>");
            });
            $("#btn_publish_local_stream").html("Publish");
        }
    }

    function playLocalMedia() {
        logger("Local Function: <b style='color:darkBlue'>playLocalMedia()</b>");
        if ($("#btn_play_local_media").html() == "Play") {
            logger("Agora Function: <b style='color:indigo'>local_stream.play('local-media')</b>");
            local_stream.play('local-media');
            $("#local_attributes").append(local_stream.getAttributes());
            $("#btn_play_local_media").html('Stop');
            if ($("#local_audio").prop('checked')) {
                enableButton("#btn_mute_local_audio");
            }
            if ($("#local_video").prop('checked')) {
                enableButton("#btn_mute_local_video");
            }
        } else {
            logger("Agora Function: <b style='color:indigo'>local_stream.stop()</b>");
            local_stream.stop();
            $("#local_attributes").html("");
            $("#btn_play_local_media").html('Play');
            disableButton("#btn_mute_local_audio");
            disableButton("#btn_mute_local_video");
        }
    }

    //Mutes the local audio stream
    function muteLocalAudio() {
        logger("Local Function: <b style='color:darkBlue'>muteLocalAudio()</b>");
        if ($("#btn_mute_local_audio").html() == "Mute Audio") {
            logger("Agora Function: <b style='color:indigo'>local_stream.disableAudio()</b>");
            local_stream.disableAudio();
        } else {
            logger("Agora Function: <b style='color:indigo'>local_stream.enableAudio()</b>");
            local_stream.enableAudio();
        }
    }

    //Mutes the local video stream
    function muteLocalVideo() {
        logger("Local Function: <b style='color:darkBlue'>muteLocalVideo()</b>");
        if ($("#btn_mute_local_video").html() == "Mute Video") {
            logger("Agora Function: <b style='color:indigo'>local_stream.disableVideo()</b>");
            local_stream.disableVideo();
        } else {
            logger("Agora Function: <b style='color:indigo'>local_stream.enableVideo()</b>");
            local_stream.enableVideo();
        }
    }

    function subscribeRemoteStream() {
        logger("Local Function: <b style='color:darkBlue'>subscribeRemoteStream()</b>");
        if ($("#btn_subscribe_remote_stream").html() == "Subscribe") {
            logger("Agora Function: <b style='color:indigo'>client.subscribe(", selected_remote_stream, ")</b>");
            client.subscribe(selected_remote_stream, (error) => {
                logger("Subscribe Remote Stream");
                $("#btn_subscribe_remote_stream").html("Unsubscribe");
            });
        } else {
            logger("Agora Function: <b style='color:indigo'>client.unsubscribe(", selected_remote_stream, ")</b>");
            client.unsubscribe(selected_remote_stream, (error) => {
                logger("Unsubscribe Remote Stream");
                $("#btn_subscribe_remote_stream").html("Subscribe");
                disableButton("#btn_play_remote_media");
            });
        }
    }

    function playRemoteMedia() {
        logger("Local Function: <b style='color:darkBlue'>playRemoteMedia()</b>");
        if ($("#btn_play_remote_media").html() == "Play") {
            logger("Agora Function: <b style='color:indigo'>selected_remote_stream.play('remote-media')</b>");
            selected_remote_stream.play('remote-media');
            if ($("#has_remote_audio").prop('checked')) {
                enableButton("#btn_remote_audio_mute");
            }
            if ($("#has_remote_video").prop('checked')) {
                enableButton("#btn_remote_video_mute");
            }
            $("#btn_play_remote_media").html("Stop");
        } else {
            logger("Agora Function: <b style='color:indigo'>selected_remote_stream.stop()</b>");
            selected_remote_stream.stop();
            if ($("#has_remote_audio").prop('checked')) {
                disableButton("#btn_remote_audio_mute");
                $("#has_remote_audio").prop('checked', false);
            }
            if ($("#has_remote_video").prop('checked')) {
                disableButton("#btn_remote_video_mute");
                $("#has_remote_video").prop('checked', false);
            }
        }
    }

        function muteRemoteAudio() {
            logger("Local Function: <b style='color:darkBlue'>muteRemoteAudio()</b>");
            if ($("#btn_remote_audio_mute").html() == "Mute Audio") {
                logger("Agora Function: <b style='color:indigo'>selected_remote_stream.disableAudio()</b>");
                selected_remote_stream.disableAudio();
            } else {
                logger("Agora Function: <b style='color:indigo'>selected_remote_stream.enableAudio()</b>");
                selected_remote_stream.enableAudio();
            }
        }

        function muteRemoteVideo() {
            logger("Local Function: <b style='color:darkBlue'>muteRemoteVideo()</b>");
            if ($("#btn_remote_video_mute").html() == "Mute Video") {
                logger("Agora Function: <b style='color:indigo'>selected_remote_stream.disableVideo()</b>");
                selected_remote_stream.disableVideo();
            } else {
                logger("Agora Function: <b style='color:indigo'>selected_remote_stream.enableVideo()</b>");
                selected_remote_stream.enableVideo();
            }
        }

        function getLocalStats() {
            logger("Local Function: <b style='color:darkBlue'>getLocalStats()</b>");
            logger("Agora Function: <b style='color:indigo'>local_stream.getStats()</b>");
            setInterval(() => {
                local_stream.getStats((stats) => {
                    $("#local_stats tbody").empty();
                    for (var key in stats) {
                        if (stats.hasOwnProperty(key)) {
                            $("#local_stats tbody").append(`<tr style="font-size:x-small"><td><b>${key}</b></td><td>:</td><td nowrap>${stats[key]}</td></tr>`);
                        }
                    }
                });
            }, 1000);
        }

        function getRemoteStats() {
            logger("Local Function: <b style='color:darkBlue'>getRemoteStats()</b>");
            logger("Agora Function: <b style='color:indigo'>selected_remote_stream.getStats()</b>");
            setInterval(() => {
                selected_remote_stream.getStats((stats) => {
                    $("#remote_stats tbody").empty();
                    for (var key in stats) {
                        if (stats.hasOwnProperty(key)) {
                            $("#remote_stats tbody").append(`<tr style="font-size:x-small"><td><b>${key}</b></td><td>:</td><td nowrap>${stats[key]}</td></tr>`);
                        }
                    }
                });
            }, 1000);
        }

        function enableButton(button) {
            $(button).prop('disabled', false);
        }

        function disableButton(button) {
            $(button).prop('disabled', true);
        }
    });