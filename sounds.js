/**
 * Music/Sound data.
 * - title: display name
 * - src: path to the mp3, relative to index.html
 *        (same folder: "vine-boom.mp3", or a subfolder: "audio/vine-boom.mp3")
 * - type: "sound_effects" | "bgm"
 *
 * Add/edit entries below. Example:
 * { title: "Vine Boom", src: "audio/vine-boom.mp3", type: "sound_effects" },
 */
const SOUNDS = [
  // ---- Sound Effects ----
  { title: "CLAP", src: "audio/clap.mp3", type: "sound_effects" },
  { title: "DRUM", src: "audio/drum.mp3", type: "sound_effects" },
  { title: "ANNOUNCEMENT", src: "audio/announcement.mp3", type: "sound_effects" },
  { title: "HOST ENTRANCE", src: "audio/host.mp3", type: "sound_effects" },
  { title: "MANGARAP", src: "audio/mangarap.mp3", type: "sound_effects" },

  // ---- Background Music ----
  { title: "OFFICIAL BGM", src: "audio/tropical-summer-upbeat.mp3", type: "bgm" },
  { title: "MOF", src: "audio/men-of-fire.mp3", type: "bgm" },
  { title: "BLOOM", src: "audio/bloom.mp3", type: "bgm" },
  { title: "CLAW MACHINE", src: "audio/claw-machine.mp3", type: "bgm" },
];
