(function () {
  "use strict";

  var PLAY_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.04 1.04 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14Z"/></svg>';
  var PAUSE_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';

  var app = document.getElementById("app");

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  /**
   * One exclusive channel: only one track plays at a time.
   * SFX: switching stops and resets the previous track.
   * BGM: switching only pauses the previous track, keeping its position
   * so it resumes where it left off when played again.
   */
  function createChannel(resetOnSwitch) {
    var current = null;
    return {
      toggle: function (track) {
        if (current && current !== track) {
          if (resetOnSwitch) {
            current.stopAndReset();
          } else {
            current.pause();
          }
        }
        current = track;
        track.togglePlay();
        if (track.audio.paused && track.audio.currentTime === 0) {
          current = null;
        }
      },
    };
  }

  var sfxChannel = createChannel(true);
  var bgmChannel = createChannel(false);

  function createTrack(item) {
    var audio = new Audio(item.src);
    audio.preload = "metadata";
    if (item.type === "bgm") audio.loop = true;

    var card = document.createElement("div");
    card.className = "card" + (item.type === "bgm" ? "" : " card--sfx");
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    var row = document.createElement("div");
    row.className = "card__row";

    var playBtn = document.createElement("button");
    playBtn.className = "card__play-btn";
    playBtn.type = "button";
    playBtn.setAttribute("aria-label", "Play " + item.title);
    playBtn.innerHTML = PLAY_SVG;

    var title = document.createElement("div");
    title.className = "card__title";
    title.textContent = item.title;

    var body = null;
    if (item.type === "bgm") {
      body = document.createElement("div");
      body.className = "card__body";
      body.appendChild(title);
      row.appendChild(playBtn);
      row.appendChild(body);
    } else {
      row.appendChild(playBtn);
      row.appendChild(title);
    }
    card.appendChild(row);

    var progressFill = null;
    var seek = null;
    var timeCurrent = null;
    var timeTotal = null;

    if (item.type === "bgm") {
      var sliderRow = document.createElement("div");
      sliderRow.className = "slider-row";

      timeCurrent = document.createElement("span");
      timeCurrent.className = "slider-time";
      timeCurrent.textContent = "0:00";

      seek = document.createElement("input");
      seek.type = "range";
      seek.className = "seek";
      seek.min = "0";
      seek.max = "1000";
      seek.value = "0";
      seek.step = "1";
      seek.setAttribute("aria-label", "Seek " + item.title);

      timeTotal = document.createElement("span");
      timeTotal.className = "slider-time";
      timeTotal.textContent = "--:--";

      sliderRow.appendChild(timeCurrent);
      sliderRow.appendChild(seek);
      sliderRow.appendChild(timeTotal);
      body.appendChild(sliderRow);

      seek.addEventListener("input", function () {
        if (isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = (seek.value / 1000) * audio.duration;
        }
      });

      // Don't toggle play when interacting with the slider
      sliderRow.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      sliderRow.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
    }

    var seeking = false;
    if (seek) {
      seek.addEventListener("pointerdown", function () {
        seeking = true;
      });
      seek.addEventListener("pointerup", function () {
        seeking = false;
      });
      seek.addEventListener("change", function () {
        seeking = false;
      });
    }

    function updateUI() {
      var playing = !audio.paused && !audio.ended;
      card.classList.toggle("card--playing", playing);
      playBtn.innerHTML = playing ? PAUSE_SVG : PLAY_SVG;
      playBtn.setAttribute(
        "aria-label",
        (playing ? "Pause " : "Play ") + item.title
      );
    }

    function updateProgress() {
      var d = audio.duration;
      if (isFinite(d) && d > 0) {
        var pct = (audio.currentTime / d) * 100;
        if (progressFill) progressFill.style.width = pct + "%";
        if (seek && !seeking) {
          seek.value = String(Math.round((audio.currentTime / d) * 1000));
          seek.style.setProperty("--fill", pct + "%");
        }
        if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
      }
    }

    audio.addEventListener("loadedmetadata", function () {
      if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("play", updateUI);
    audio.addEventListener("pause", updateUI);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", function () {
      audio.currentTime = 0;
      updateProgress();
      updateUI();
    });
    audio.addEventListener("error", function () {
      title.textContent = "Missing: " + item.src;
    });

    var track = {
      audio: audio,
      togglePlay: function () {
        if (audio.paused) {
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
      },
      stopAndReset: function () {
        audio.pause();
        audio.currentTime = 0;
        updateProgress();
        updateUI();
      },
      pause: function () {
        audio.pause();
      },
    };

    function onActivate(e) {
      if (e) e.preventDefault();
      if (item.type === "bgm") {
        bgmChannel.toggle(track);
      } else {
        sfxChannel.toggle(track);
      }
    }

    card.addEventListener("click", onActivate);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") onActivate(e);
    });

    updateUI();
    return card;
  }

  function createSection(title, description, items) {
    var section = document.createElement("section");
    section.className = "section";

    var h2 = document.createElement("h2");
    h2.className = "section__title";
    h2.textContent = title;

    var p = document.createElement("p");
    p.className = "section__description";
    p.textContent = description;

    var list = document.createElement("div");
    list.className =
      "section__list" +
      (items[0] && items[0].type === "sound_effects"
        ? " section__list--grid"
        : "");

    items.forEach(function (item) {
      list.appendChild(createTrack(item));
    });

    section.appendChild(h2);
    section.appendChild(p);
    section.appendChild(list);
    return section;
  }

  var sfx = SOUNDS.filter(function (s) {
    return s.type === "sound_effects";
  });
  var bgm = SOUNDS.filter(function (s) {
    return s.type === "bgm";
  });

  if (sfx.length) {
    app.appendChild(
      createSection(
        "Sound Effects",
        "One at a time — playing a new one stops the current one.",
        sfx
      )
    );
  }
  if (bgm.length) {
    app.appendChild(
      createSection(
        "Background Music",
        "Loops with a seek slider. Plays alongside sound effects.",
        bgm
      )
    );
  }
  if (!sfx.length && !bgm.length) {
    var empty = document.createElement("p");
    empty.className = "section__description";
    empty.textContent = "No sounds yet — add entries to sounds.js.";
    app.appendChild(empty);
  }
})();
