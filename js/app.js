window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('button');
  const result = document.getElementById('result');

  const btnClear = document.getElementById('btnClear');
  const btnCopy = document.getElementById('btnCopy');

  let listening = false;
  let transcript = '';
  let videoBlobs;
  let audioBlobs;
  let audioRecorder;
  let videoRecorder;

  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

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
