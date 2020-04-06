window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('button'),
        result = document.getElementById('result'),
        btnClear = document.getElementById('btnClear'),
        btnCopy = document.getElementById('btnCopy');

  let listening = false,
      transcript = '',
      selectId = 'camera',
      unselectId = 'transcript';

  let videoBlobs, audioBlobs, audioRecorder, videoRecorder;

  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  const isMobile = () => {
    let check = false;
    (a => { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  };

  const toggleView = (id, ev) => {
    if (selectId !== id) {
      unselectId = selectId;
      selectId = id;

      document.getElementById(selectId).classList.remove('hidden');
      document.getElementById(unselectId).classList.add('hidden');

      const selected = document.getElementById(`btn-${selectId}`);
      const unselected = document.getElementById(`btn-${unselectId}`);

      selected.classList.remove('tab-inactive');
      selected.classList.add('tab-active');
      selected.parentElement.classList.add('tab-selected');

      unselected.classList.remove('tab-active');
      unselected.classList.add('tab-inactive');
      unselected.parentElement.classList.remove('tab-selected');
    }
    if(ev) {
      ev.preventDefault();
    }
  };

  const showInfo = s => {
    const info = document.getElementById('info');
    const infoMessages = info.getElementsByTagName('p');
    if (s) {
      for (let i = 0; i < infoMessages.length; i++) {
        const child = infoMessages[i];
        if (child.style) {
          child.style.display = child.id === s ? 'inline' : 'none';
        }
      }
      info.classList.remove('hidden');
    } else {
      info.classList.add('hidden');
    }
  };

  const startAudio = () => {
    navigator.getUserMedia({
      audio: true,
      video: false
    }, stream => {
      const options = { mimeType: "audio/webm" };
      audioRecorder = new MediaRecorder(stream, options);
      audioRecorder.ondataavailable = ev => {
        if (ev.data && ev.data.size > 0) {
          audioBlobs.push(ev.data);
        }
      };
      audioRecorder.start();
    }, error => console.log);
  };

  const startVideo = () => {
    navigator.getUserMedia({
      audio: {
        echoCancellation: { exact: true }
      },
      video: {
        mandatory: {
          minWidth: 374,
          maxWidth: 374,
          minHeight: 245,
          maxHeight: 245
        }
      }
    }, stream => {
      videoTag.srcObject = stream;
      videoTag.play();

      const options = { mimeType: "video/webm;codecs=vp9" };
      videoRecorder = new MediaRecorder(stream, options);
      videoRecorder.ondataavailable = ev => {
        if(ev.data && ev.data.size > 0) {
          videoBlobs.push(ev.data);
        }
      };
      videoRecorder.start();
    }, error => console.log);
  };

  const setButtons = () => {
    const actionBtns = [btnClear, btnCopy, document.getElementById('btnSave')];
    for (const btn of actionBtns) {
      if (transcript) {
        btn.classList.remove('btn-disable');
        btn.classList.add('btn-hover');
        btn.disabled = false;
      } else {
        btn.classList.add('btn-disable');
        btn.classList.remove('btn-hover');
        btn.disabled = true;
      }
    }
  };

  const setView = () => {
    const videoImg = document.getElementById('videoImg');
    const videoTag = document.getElementById('videoTag');
    const messageImg = document.getElementById('messageImg');
    const messageTag = document.getElementById('messageTag');
    const playImg = document.getElementById('playImg');
    const pauseImg = document.getElementById('pauseImg');

    audioBlobs = [];
    videoBlobs = [];

    if(listening) {
      showInfo('info_start');
      button.querySelector('span').textContent = "Start";
      videoTag.pause();
      videoRecorder.stop();
      audioRecorder.stop();
      videoTag.classList.add('hidden');
      videoImg.classList.remove('hidden');
      pauseImg.classList.add('hidden');
      playImg.classList.remove('hidden');
      transcript = result.innerText.trim().replace(/\n\n/g, '\n');
      if (!transcript) {
        messageTag.classList.add('hidden');
        messageImg.classList.remove('hidden');
      } else {
        if (isMobile()) {
          toggleView('transcript');
        }
      }
    } else {
      showInfo('info_speak_now');
      button.querySelector('span').textContent = "Stop";
      startVideo();
      startAudio();
      videoImg.classList.add('hidden');
      messageImg.classList.add('hidden');
      playImg.classList.add('hidden');
      videoTag.classList.remove('hidden');
      messageTag.classList.remove('hidden');
      pauseImg.classList.remove('hidden');
      result.innerHTML = "";
      transcript = '';
    }
    setButtons();
  };

  const saveRecording = type => {
    const blob = new Blob(type === 'audio' ? audioBlobs : videoBlobs, { type: `${type}/webm` });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${type.toUpperCase()}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  btnClear.addEventListener('click', () => {
    result.innerHTML = "";
    transcript = '';
    messageTag.classList.add('hidden');
    messageImg.classList.remove('hidden');
    setButtons();
    if (isMobile()) {
      toggleView('camera');
    }
  }, false);

  btnCopy.addEventListener('click', () => {
    const el = document.createElement('textarea');
    el.value = transcript;
    el.setAttribute('readonly', '');
    el.style = { position: 'absolute', left: '-9999px' };
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }, false);

  document.getElementById('btnSaveText').addEventListener('click', () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript));
    element.setAttribute('download', `${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, false);

  document.getElementById('btnSaveAudio').addEventListener('click', () => saveRecording('audio'), false);
  document.getElementById('btnSaveVideo').addEventListener('click', () => saveRecording('video'), false);
  document.getElementById('btn-camera').addEventListener('click', ev => toggleView('camera', ev), false);
  document.getElementById('btn-transcript').addEventListener('click', ev => toggleView('transcript', ev), false);

  const startSpeech = () => {
    const start_timestamp = event.timeStamp;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (typeof SpeechRecognition !== "undefined") {
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = event => {
        result.innerHTML = "";
        for (const res of event.results) {
          const text = document.createTextNode(res[0].transcript);
          const p = document.createElement("p");
          if (res.isFinal) {
            p.classList.add("final");
          }
          p.appendChild(text);
          result.appendChild(p);
        }
      };

      recognition.onerror = event => {
        if (event.error == 'no-speech') {
          showInfo('info_no_speech');
        }
        if (event.error == 'audio-capture') {
          showInfo('info_no_microphone');
        }
        if (event.error == 'not-allowed') {
          if (event.timeStamp - start_timestamp < 100) {
            showInfo('info_blocked');
          } else {
            showInfo('info_denied');
          }
        }
      };

      button.addEventListener("click", event => {
        setView();
        listening ? recognition.stop() : recognition.start();
        listening = !listening;
        event.preventDefault();
      });

      showInfo('info_start');
    } else {
      document.getElementById('main').classList.add('hidden');
      showInfo('info_upgrade');
    }
  };

  startSpeech();
});
