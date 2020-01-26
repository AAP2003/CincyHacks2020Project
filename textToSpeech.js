function textToSpeech(txt) {
  var speaker = new SpeechSynthesisUtterance(txt);
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(txt));

  var out = new Promise(resolve => speaker.onend = function () {
    resolve("Finished");
  });

  var check = async () => {
    if (!window.speechSynthesis.speaking) {
      speaker.onend();
    } else {
      window.setTimeout(check, 500);
    }
  }

  check();

  return out;
}


class SpeechToText {

  finalTranscript;
  recognition;

  constructor() {
    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.finalTranscript = '';
    this.recognition = new window.SpeechRecognition();

    var temp = document.getElementById('para');

    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 10;
    this.recognition.continuous = false;

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
        let transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript;
        } else { 
          interimTranscript += transcript;
        }
      }

      temp.innerHTML = this.finalTranscript + interimTranscript;
    }
  }

  getText() {
    console.log("get text");
    this.running = true;
    this.recognition.start();

    return new Promise(resolve => {
      this.recognition.onend = function () {
        this.finalTranscript += this.interimTranscript;
        resolve(this.finalTranscript);
      }
    });
  }
}

