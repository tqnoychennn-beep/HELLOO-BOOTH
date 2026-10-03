let camera1 = null;
let stream = null;
let photoBlob = null;
let photoPreviewUrl = null;
let selectedFrame = "wedding";
// Kode acara yang sedang dibuka
const eventId = new URLSearchParams(
  window.location.search
).get("event") || "default";
let cameraMode = "user";
let mirrorEnabled = false;
let adminSession = null;

let savedVoicePath = null;
let voiceTimer = null;

function stopVoiceTimer() {
  if (voiceTimer) clearInterval(voiceTimer);
  voiceTimer = null;
}

function startVoiceTimer() {
  stopVoiceTimer();

  const number = $("timerNumber");
  const circle = $("timerProgress");
  const duration = 15000;
  const circumference = 326.73;
  const start = performance.now();

  number.textContent = "15";
  circle.style.strokeDashoffset = "0";

  voiceTimer = setInterval(() => {
    const elapsed = Math.min(
      performance.now() - start,
      duration
    );

    number.textContent =
      Math.ceil((duration - elapsed) / 1000);

    circle.style.strokeDashoffset =
      circumference * elapsed / duration;

    if (elapsed >= duration) {
      stopVoiceTimer();
      stopVoiceRecording();
    }
  }, 100);
}
const OUTPUT_W = 1181;
const OUTPUT_H = 1772;
const OVERLAY_BUCKET = "booth-media";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const client = () => supabaseClient;
const $ = id => document.getElementById(id);

function hideAll() {
  document.querySelectorAll("main, section").forEach(el => el.style.display = "none");
}
function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  const video = $("camera");
  if (video) video.srcObject = null;
}
function goHome() { stopCamera(); hideAll(); $("home").style.display = "block"; }
function showTemplates() { stopCamera(); hideAll(); $("templates").style.display = "block"; }
async function chooseFrame(frame) {
  selectedFrame = frame;

  stopCamera();
  hideAll();
  $("cameraPage").style.display = "block";

  const video = $("camera");
  const overlay = $("liveOverlay");
  const frame2Cameras = $("frame2Cameras");
  const wrap = document.querySelector("#cameraPage .camera-wrap");

  const holders = [
    $("cameraSlot1"),
    $("cameraSlot2"),
    $("cameraSlot3")
  ];

  try {
    // RESET SEMUA
    camera1 = null;

    holders.forEach(holder => {
      if (!holder) return;

      holder.innerHTML = "";
      holder.style.display = "none";
      holder.style.background = "#000";
    });

    frame2Cameras.innerHTML = "";

    // Masukkan kembali holder karena innerHTML di atas menghapus isinya
    holders.forEach(holder => {
      if (holder) frame2Cameras.appendChild(holder);
    });

    frame2Cameras.style.display = "none";

    video.style.display = "none";
    video.style.visibility = "hidden";

    overlay.style.display = "none";

    // ==========================
    // BUKA SATU STREAM KAMERA
    // ==========================
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: cameraMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    // ==========================
    // LOAD FRAME CLIENT
    // ==========================
    const overlayUrl = await getOverlayUrl(selectedFrame);

    if (!overlayUrl) {
      throw new Error("Design frame tidak ditemukan.");
    }

    const img = await loadImage(overlayUrl);

    let slots = detectTransparentSlots(img)
      .sort((a, b) => (b.w * b.h) - (a.w * a.h))
      .slice(0, 3)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (!slots.length) {
      throw new Error("Area transparan untuk kamera tidak ditemukan.");
    }

    // ==========================
    // UKURAN FRAME
    // ==========================
    const frameRatio =
      img.naturalWidth / img.naturalHeight;

    const availableW = window.innerWidth - 24;
    const availableH = window.innerHeight - 145;

    let frameW = availableW;
    let frameH = frameW / frameRatio;

    if (frameH > availableH) {
      frameH = availableH;
      frameW = frameH * frameRatio;
    }

    wrap.style.setProperty(
      "width",
      frameW + "px",
      "important"
    );

    wrap.style.setProperty(
      "height",
      frameH + "px",
      "important"
    );

    wrap.style.setProperty(
      "max-width",
      "none",
      "important"
    );

    wrap.style.setProperty(
      "max-height",
      "none",
      "important"
    );

    wrap.style.setProperty(
      "aspect-ratio",
      img.naturalWidth + " / " + img.naturalHeight,
      "important"
    );

    wrap.style.position = "relative";
    wrap.style.overflow = "hidden";

    // ==========================
    // OVERLAY
    // ==========================
    overlay.src = overlayUrl;
    overlay.style.position = "absolute";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.objectFit = "fill";
    overlay.style.zIndex = "10";
    overlay.style.pointerEvents = "none";
    overlay.style.display = "block";

    // ==========================
    // CONTAINER SLOT
    // ==========================
    frame2Cameras.style.display = "block";
    frame2Cameras.style.position = "absolute";
    frame2Cameras.style.left = "0";
    frame2Cameras.style.top = "0";
    frame2Cameras.style.width = "100%";
    frame2Cameras.style.height = "100%";
    frame2Cameras.style.zIndex = "1";
    frame2Cameras.style.pointerEvents = "none";

    // ==========================
    // POSISI SLOT SESUAI PNG
    // ==========================
    slots.forEach((s, i) => {
      const holder = holders[i];

      if (!holder) return;

      holder.style.setProperty(
        "left",
        (s.x / img.naturalWidth * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "top",
        (s.y / img.naturalHeight * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "width",
        (s.w / img.naturalWidth * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "height",
        (s.h / img.naturalHeight * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "position",
        "absolute",
        "important"
      );

      holder.style.setProperty(
        "display",
        "block",
        "important"
      );

      holder.style.setProperty(
        "overflow",
        "hidden",
        "important"
      );

      holder.style.setProperty(
        "background",
        "#000",
        "important"
      );
    });

    // Slot yang tidak digunakan disembunyikan
    for (let i = slots.length; i < holders.length; i++) {
      if (holders[i]) {
        holders[i].style.setProperty(
          "display",
          "none",
          "important"
        );
      }
    }

    // ==========================
    // LIVE CAMERA DI SLOT 1
    // ==========================
    const liveVideo = document.createElement("video");

    liveVideo.autoplay = true;
    liveVideo.playsInline = true;
    liveVideo.muted = true;
    liveVideo.srcObject = stream;

    liveVideo.style.setProperty(
      "position",
      "absolute",
      "important"
    );

    liveVideo.style.setProperty(
      "left",
      "0",
      "important"
    );

    liveVideo.style.setProperty(
      "top",
      "0",
      "important"
    );

    liveVideo.style.setProperty(
      "width",
      "100%",
      "important"
    );

    liveVideo.style.setProperty(
      "height",
      "100%",
      "important"
    );

    liveVideo.style.setProperty(
      "object-fit",
      "cover",
      "important"
    );

    liveVideo.style.setProperty(
      "display",
      "block",
      "important"
    );

    liveVideo.style.transform =
      mirrorEnabled ? "scaleX(-1)" : "none";

    holders[0].innerHTML = "";
    holders[0].appendChild(liveVideo);

    await liveVideo.play();

    camera1 = liveVideo;

  } catch (error) {
    console.error(error);
    alert("FRAME GAGAL: " + error.message);
    goHome();
  }
}
  
async function switchCamera() {
  cameraMode = cameraMode === "user" ? "environment" : "user";
  await chooseFrame(selectedFrame);
}
function toggleMirror() {
  mirrorEnabled = !mirrorEnabled;
  $("camera").style.transform = mirrorEnabled ? "scaleX(-1)" : "none";
  if (camera1) {
  camera1.style.transform = mirrorEnabled
    ? "scaleX(-1)"
    : "none";
}
  $("mirrorButton").textContent = mirrorEnabled ? "MIRROR: ON" : "MIRROR: OFF";
}
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Overlay tidak bisa dibuka"));
    img.src = url;
  });
}
function coverDraw(ctx, img, width, height, x = 0, y = 0) {
  const iw = img.videoWidth || img.naturalWidth;
  const ih = img.videoHeight || img.naturalHeight;

  const scale = Math.max(width / iw, height / ih);

  const sw = width / scale;
  const sh = height / scale;

  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  ctx.drawImage(
    img,
    sx, sy, sw, sh,
    x, y, width, height
  );
}
function detectTransparentSlots(img) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;

  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const w = c.width;
  const h = c.height;
  const data = ctx.getImageData(0, 0, w, h).data;

  const step = 2;
  const visited = new Uint8Array(w * h);
  const found = [];

  function isTransparent(x, y) {
    return data[(y * w + x) * 4 + 3] < 40;
  }

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {

      const start = y * w + x;

      if (visited[start] || !isTransparent(x, y)) continue;

      const stack = [[x, y]];
      visited[start] = 1;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      let touchesEdge = false;

      while (stack.length) {
        const [cx, cy] = stack.pop();

        count++;

        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        if (
          cx <= step ||
          cy <= step ||
          cx >= w - step * 2 ||
          cy >= h - step * 2
        ) {
          touchesEdge = true;
        }

        const neighbours = [
          [cx + step, cy],
          [cx - step, cy],
          [cx, cy + step],
          [cx, cy - step]
        ];

        for (const [nx, ny] of neighbours) {

          if (
            nx < 0 ||
            ny < 0 ||
            nx >= w ||
            ny >= h
          ) continue;

          const index = ny * w + nx;

          if (
            !visited[index] &&
            isTransparent(nx, ny)
          ) {
            visited[index] = 1;
            stack.push([nx, ny]);
          }
        }
      }

      const slotW = maxX - minX + step;
      const slotH = maxY - minY + step;

      if (
        !touchesEdge &&
        count > 100 &&
        slotW > w * 0.08 &&
        slotH > h * 0.08
      ) {
        found.push({
          x: minX,
          y: minY,
          w: slotW,
          h: slotH,
          area: slotW * slotH
        });
      }
    }
  }

  // Ambil maksimal 3 lubang transparan terbesar
const biggest = found
  .sort((a, b) => b.area - a.area)
  .slice(0, 3);

  // Urutkan posisi atas ke bawah / kiri ke kanan
  biggest.sort((a, b) => a.y - b.y || a.x - b.x);

  return biggest.map(({ x, y, w, h }) => ({
    x, y, w, h
  }));
}
async function getOverlayUrl(category) {
  if (!eventId || eventId === "default") return null;

  const path = `frames/${eventId}/${category}.png`;

  const { data } = client()
    .storage
    .from(BUCKET)
    .getPublicUrl(path);

  if (!data || !data.publicUrl) return null;
return data.publicUrl + "?t=" + Date.now();
}
  async function chooseFrame(frame) {
  selectedFrame = frame;

  stopCamera();
  hideAll();
  $("cameraPage").style.display = "block";

  const video = $("camera");
  const overlay = $("liveOverlay");
  const frame2Cameras = $("frame2Cameras");
  const wrap = document.querySelector("#cameraPage .camera-wrap");

  const holders = [
    $("cameraSlot1"),
    $("cameraSlot2"),
    $("cameraSlot3")
  ];

  try {
    // RESET SEMUA
    camera1 = null;

    holders.forEach(holder => {
      if (!holder) return;

      holder.innerHTML = "";
      holder.style.display = "none";
      holder.style.background = "#000";
    });

    frame2Cameras.innerHTML = "";

    // Masukkan kembali holder karena innerHTML di atas menghapus isinya
    holders.forEach(holder => {
      if (holder) frame2Cameras.appendChild(holder);
    });

    frame2Cameras.style.display = "none";

    video.style.display = "none";
    video.style.visibility = "hidden";

    overlay.style.display = "none";

    // ==========================
    // BUKA SATU STREAM KAMERA
    // ==========================
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: cameraMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    // ==========================
    // LOAD FRAME CLIENT
    // ==========================
    const overlayUrl = await getOverlayUrl(selectedFrame);

    if (!overlayUrl) {
      throw new Error("Design frame tidak ditemukan.");
    }

    const img = await loadImage(overlayUrl);

    let slots = detectTransparentSlots(img)
      .sort((a, b) => (b.w * b.h) - (a.w * a.h))
      .slice(0, 3)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (!slots.length) {
      throw new Error("Area transparan untuk kamera tidak ditemukan.");
    }

    // ==========================
    // UKURAN FRAME
    // ==========================
    const frameRatio =
      img.naturalWidth / img.naturalHeight;

    const availableW = window.innerWidth - 24;
    const availableH = window.innerHeight - 145;

    let frameW = availableW;
    let frameH = frameW / frameRatio;

    if (frameH > availableH) {
      frameH = availableH;
      frameW = frameH * frameRatio;
    }

    wrap.style.setProperty(
      "width",
      frameW + "px",
      "important"
    );

    wrap.style.setProperty(
      "height",
      frameH + "px",
      "important"
    );

    wrap.style.setProperty(
      "max-width",
      "none",
      "important"
    );

    wrap.style.setProperty(
      "max-height",
      "none",
      "important"
    );

    wrap.style.setProperty(
      "aspect-ratio",
      img.naturalWidth + " / " + img.naturalHeight,
      "important"
    );

    wrap.style.position = "relative";
    wrap.style.overflow = "hidden";

    // ==========================
    // OVERLAY
    // ==========================
    overlay.src = overlayUrl;
    overlay.style.position = "absolute";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.objectFit = "fill";
    overlay.style.zIndex = "10";
    overlay.style.pointerEvents = "none";
    overlay.style.display = "block";

    // ==========================
    // CONTAINER SLOT
    // ==========================
    frame2Cameras.style.display = "block";
    frame2Cameras.style.position = "absolute";
    frame2Cameras.style.left = "0";
    frame2Cameras.style.top = "0";
    frame2Cameras.style.width = "100%";
    frame2Cameras.style.height = "100%";
    frame2Cameras.style.zIndex = "1";
    frame2Cameras.style.pointerEvents = "none";

    // ==========================
    // POSISI SLOT SESUAI PNG
    // ==========================
    slots.forEach((s, i) => {
      const holder = holders[i];

      if (!holder) return;

      holder.style.setProperty(
        "left",
        (s.x / img.naturalWidth * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "top",
        (s.y / img.naturalHeight * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "width",
        (s.w / img.naturalWidth * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "height",
        (s.h / img.naturalHeight * 100) + "%",
        "important"
      );

      holder.style.setProperty(
        "position",
        "absolute",
        "important"
      );

      holder.style.setProperty(
        "display",
        "block",
        "important"
      );

      holder.style.setProperty(
        "overflow",
        "hidden",
        "important"
      );

      holder.style.setProperty(
        "background",
        "#000",
        "important"
      );
    });

    // Slot yang tidak digunakan disembunyikan
    for (let i = slots.length; i < holders.length; i++) {
      if (holders[i]) {
        holders[i].style.setProperty(
          "display",
          "none",
          "important"
        );
      }
    }

    // ==========================
// =========================
// AWAL: CAMERA HANYA DI SLOT 1
// SLOT 2 & 3 TETAP HITAM
// =========================

holders.forEach((holder, i) => {
  if (!holder || i >= slots.length) return;

  holder.innerHTML = "";
  holder.style.setProperty("background", "#000", "important");
});

// Buat SATU live camera saja
const liveVideo = document.createElement("video");

liveVideo.autoplay = true;
liveVideo.playsInline = true;
liveVideo.muted = true;
liveVideo.srcObject = stream;

liveVideo.style.setProperty("position", "absolute", "important");
liveVideo.style.setProperty("left", "0", "important");
liveVideo.style.setProperty("top", "0", "important");
liveVideo.style.setProperty("width", "100%", "important");
liveVideo.style.setProperty("height", "100%", "important");
liveVideo.style.setProperty("object-fit", "cover", "important");
liveVideo.style.setProperty("display", "block", "important");

liveVideo.style.transform =
  mirrorEnabled ? "scaleX(-1)" : "none";

// Masukkan camera HANYA ke slot pertama
holders[0].appendChild(liveVideo);

await liveVideo.play();

camera1 = liveVideo;

  } catch (error) {
    console.error(error);
    alert("FRAME GAGAL: " + error.message);
    goHome();
  }
}
      async function takePhoto() {
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const countdown = $("countdown");
  const takeButton = $("takePhotoButton");

  if (!stream) {
    alert("Kamera belum siap.");
    return;
  }

  if (takeButton) takeButton.disabled = true;

  try {
    const overlayUrl = await getOverlayUrl(selectedFrame);

    if (!overlayUrl) {
      throw new Error("Overlay tidak ditemukan.");
    }

    const frame = await loadImage(overlayUrl);

    // Ambil maksimal 3 lubang transparan
    const slots = detectTransparentSlots(frame)
      .sort((a, b) => (b.w * b.h) - (a.w * a.h))
      .slice(0, 3)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (!slots.length) {
      throw new Error("Area transparan overlay tidak ditemukan.");
    }

    canvas.width = frame.naturalWidth;
    canvas.height = frame.naturalHeight;

    const photos = [];

    // Cari video yang benar-benar hidup
    function getLiveVideo() {
      if (
        camera1 &&
        camera1.readyState >= 2 &&
        camera1.videoWidth > 0 &&
        camera1.videoHeight > 0
      ) {
        return camera1;
      }

      const mainVideo = $("camera");

      if (
        mainVideo &&
        mainVideo.readyState >= 2 &&
        mainVideo.videoWidth > 0 &&
        mainVideo.videoHeight > 0
      ) {
        return mainVideo;
      }

      return null;
    }

    // FOTO 1, 2, 3 sesuai jumlah slot
    for (let i = 0; i < slots.length; i++) {

      countdown.style.display = "flex";

      for (let n = 3; n >= 1; n--) {
        countdown.textContent = n;
        await wait(1000);
      }

      countdown.textContent = "SMILE!";
      await wait(400);

      const liveVideo = getLiveVideo();

      if (!liveVideo) {
        throw new Error(
          "Kamera tidak siap pada foto " + (i + 1)
        );
      }

      // Tunggu frame kamera terbaru
      if (liveVideo.requestVideoFrameCallback) {
        await new Promise(resolve => {
          liveVideo.requestVideoFrameCallback(() => resolve());
        });
      } else {
        await wait(150);
      }

      

      const shot = document.createElement("canvas");

shot.width = camera1.videoWidth;
shot.height = camera1.videoHeight;

const shotCtx = shot.getContext("2d");

shotCtx.save();

if (mirrorEnabled) {
  shotCtx.translate(shot.width, 0);
  shotCtx.scale(-1, 1);
}

shotCtx.drawImage(
  camera1,
  0,
  0,
  shot.width,
  shot.height
);

shotCtx.restore();

// Simpan hasil foto sebagai IMAGE,
// bukan canvas video yang masih berubah
const capturedImage = new Image();

await new Promise((resolve, reject) => {
  capturedImage.onload = resolve;
  capturedImage.onerror = reject;
  capturedImage.src = shot.toDataURL("image/jpeg", 0.95);
});

photos.push(capturedImage);
// =====================================
// PINDAHKAN PREVIEW KE SLOT BERIKUTNYA
// =====================================
const previewHolder = document.getElementById(`cameraSlot${i + 1}`);

// Slot yang baru selesai difoto:
// ganti LIVE CAMERA menjadi foto hasil jepretan
if (previewHolder) {
  previewHolder.innerHTML = "";

  const previewPhoto = capturedImage.cloneNode();

  previewPhoto.style.position = "absolute";
  previewPhoto.style.left = "0";
  previewPhoto.style.top = "0";
  previewPhoto.style.width = "100%";
  previewPhoto.style.height = "100%";
  previewPhoto.style.objectFit = "cover";

  previewHolder.appendChild(previewPhoto);
}

// Kalau masih ada foto berikutnya,
// pindahkan SATU live camera ke slot berikutnya
if (i < slots.length - 1) {
  const nextHolder = document.getElementById(`cameraSlot${i + 2}`);

  if (nextHolder) {
    nextHolder.innerHTML = "";

    nextHolder.appendChild(camera1);

    camera1.style.position = "absolute";
    camera1.style.left = "0";
    camera1.style.top = "0";
    camera1.style.width = "100%";
    camera1.style.height = "100%";
    camera1.style.objectFit = "cover";
    camera1.style.display = "block";
  }
}

      countdown.style.display = "none";

      // Jangan matikan kamera.
      // Lanjut foto berikutnya.
      if (i < slots.length - 1) {
        countdown.style.display = "flex";
        countdown.textContent = "GANTI POSE!";
        await wait(1500);
        countdown.style.display = "none";
      }
    }

    // =========================
    // BUAT HASIL AKHIR
    // =========================

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    slots.forEach((slot, i) => {
      ctx.save();

      ctx.beginPath();
      ctx.rect(
        slot.x,
        slot.y,
        slot.w,
        slot.h
      );

      ctx.clip();

      coverDraw(
        ctx,
        photos[i],
        slot.w,
        slot.h,
        slot.x,
        slot.y
      );

      ctx.restore();
    });

    // PNG frame berada PALING ATAS
    ctx.drawImage(
      frame,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const rawBlob = await new Promise(resolve => {
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.95
      );
    });

    if (!rawBlob) {
      throw new Error("Gagal membuat hasil foto.");
    }

    // Jangan pakai setDpi300 dulu
    photoBlob = rawBlob;

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    photoPreviewUrl =
      URL.createObjectURL(photoBlob);

    $("resultPhoto").src =
      photoPreviewUrl;

    // Kamera baru dihentikan setelah
    // semua foto selesai
    stopCamera();

    hideAll();

    $("resultPage").style.display =
      "block";

    window.scrollTo(0, 0);

  } catch (error) {

    console.error(error);

    if (countdown) {
      countdown.style.display = "none";
    }

    alert(
      "Foto gagal: " +
      error.message
    );

  } finally {

    if (takeButton) {
      takeButton.disabled = false;
    }
  }
}

function retakePhoto() {
  chooseFrame(selectedFrame);
}
	async function applyGuestWish() {
  const name = $("guestName").value.trim();
  const wish = $("guestWish").value.trim();

  if (!wish) {
    alert("Tulis ucapan terlebih dahulu.");
    return;
  }

  if (!photoBlob) {
    alert("Foto belum tersedia.");
    return;
  }

  try {
    const img = await loadImage(
      URL.createObjectURL(photoBlob)
    );

    const canvas = $("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const w = canvas.width;
    const h = canvas.height;

    // Kotak ucapan transparan di bagian bawah foto
    // GUEST WISHES minimalis di bawah foto
const footerH = Math.round(h * 0.22);

// Simpan foto lama sebelum memperbesar canvas
const oldCanvas = document.createElement("canvas");
oldCanvas.width = w;
oldCanvas.height = h;
oldCanvas.getContext("2d").drawImage(canvas, 0, 0);

// Tambahkan ruang putih di bawah foto
canvas.height = h + footerH;
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(oldCanvas, 0, 0);

// Tulisan kecil dan minimalis
ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#888888";
ctx.font = `bold ${Math.round(w * 0.023)}px Arial`;
ctx.fillText("GUEST WISHES", w / 2, h + footerH * 0.15);

// Pecah ucapan menjadi maksimal 2 baris
ctx.fillStyle = "#333333";
ctx.textAlign = "center";
ctx.font = `italic ${Math.round(w * 0.032)}px Georgia`;

const words = wish.split(/\s+/);
const lines = [];
let line = "";
const maxWidth = w * 0.82;

for (const word of words) {
  const test = line ? line + " " + word : word;

  if (ctx.measureText(test).width > maxWidth && line) {
    lines.push(line);
    line = word;
  } else {
    line = test;
  }
}
if (line) lines.push(line);

lines.slice(0, 3).forEach((text, i) => {
  ctx.fillText(
    text,
    w / 2,
    h + footerH * (0.40 + i * 0.20)
  );
});

// Nama tamu
if (name) {
  ctx.fillStyle = "#b08a35";
  ctx.font = `italic ${Math.round(w * 0.019)}px Arial`;
  ctx.fillText(
    "— " + name,
    w / 2,
    h + footerH * (lines.length > 1 ? 0.88 : 0.68)
  );
}

    const newBlob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg", 0.94)
    );

    if (!newBlob) throw new Error("Gagal membuat foto.");

    photoBlob = newBlob;

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    photoPreviewUrl = URL.createObjectURL(photoBlob);
    $("resultPhoto").src = photoPreviewUrl;

    

  } catch (error) {
    alert("Gagal menambahkan ucapan: " + error.message);
  }
}
async function downloadUrl(url, name = "HELLOO-BOOTH-10x15-300DPI.jpg") {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download gagal");
    const blob = await response.blob(), objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = objectUrl; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch (error) { alert("Foto akan dibuka di browser."); window.open(url, "_blank"); }
}
async function uploadPhoto() {
  if (!photoBlob) { alert("Foto belum tersedia."); return; }
  const button = $("uploadButton"); button.disabled = true; button.textContent = "UPLOADING...";
  try {
    const sb = client();
    const filename =
  "events/" + eventId + "/photos/" +
  Date.now() + "-" +
  Math.random().toString(36).slice(2) + ".jpg";
    const { error } = await sb.storage.from(BUCKET).upload(filename, photoBlob, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;
    

// Hubungkan Voice Wishes dengan foto
if (savedVoicePath) {
  const voiceInfo = {
    photo: filename,
    voice: savedVoicePath
  };

  
const { error: linkError } = await sb.storage
  .from(BUCKET)
  .upload(
    "events/" + eventId + "/photo-voices/" +
      filename.split("/").pop() + ".json",
    new Blob([JSON.stringify(voiceInfo)], {
      type: "application/json"
    }),
    {
      contentType: "application/json",
      upsert: true
    }
  );


  if (linkError) {
    console.warn("Gagal menghubungkan suara:", linkError);
    alert("Foto tersimpan, tetapi suara belum terhubung.");
  } else {
    savedVoicePath = null;
  }
}


    const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
    const photoURL = data.publicUrl;
    $("qr").innerHTML = "";
    new QRCode($("qr"), { text: photoURL, width: 200, height: 200 });
    $("downloadButton").onclick = () => downloadUrl(photoURL);
    hideAll(); $("thankyou").style.display = "block";
  } catch (error) { alert("Upload gagal: " + error.message); }
  finally { button.disabled = false; button.textContent = "USE PHOTO"; }
}
async function openGallery() {
  stopCamera(); hideAll(); $("galleryPage").style.display = "block";
  const gallery = $("gallery"); gallery.textContent = "Loading...";
  try {
    const sb = client();
    const { data, error } = await sb.storage.from(BUCKET).list("events/" + eventId + "/photos", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    gallery.innerHTML = "";
    for (const file of data) {
      const { data: publicData } = sb.storage.from(BUCKET) .getPublicUrl("events/" + eventId + "/photos/"+ file.name);
      const link = document.createElement("a"), img = document.createElement("img");
      link.href = publicData.publicUrl;
      link.onclick = event => { event.preventDefault(); openPhoto(publicData.publicUrl); };
      img.src = publicData.publicUrl; img.loading = "lazy"; img.alt = "Foto galeri";
      link.appendChild(img);

const item = document.createElement("div");
item.className = "gallery-item";
item.appendChild(link);
// Cari rekaman suara yang terhubung dengan foto
const jsonPath =
  "events/" + eventId +
  "/photo-voices/" + file.name + ".json";

const { data: voiceFile, error: voiceError } =
  await sb.storage.from(BUCKET).download(jsonPath);

if (!voiceError && voiceFile) {
  const voiceInfo = JSON.parse(await voiceFile.text());

  if (voiceInfo.voice) {
    const { data: audioData } = sb.storage
      .from(BUCKET)
      .getPublicUrl(voiceInfo.voice);

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioData.publicUrl;
    audio.style.width = "100%";

    item.appendChild(audio);
  }
}

if (adminSession || (await sb.auth.getSession()).data.session) {
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "DELETE";
  deleteButton.className = "delete-photo";

  deleteButton.onclick = async () => {
    if (!confirm("Yakin ingin menghapus foto ini?")) return;

    deleteButton.disabled = true;

const path = "events/" + eventId + "/photos/" + file.name;
const { data: { user }, error: authError } =
  await sb.auth.getUser();

if (authError || !user) {
  alert("Sesi Admin tidak aktif. Silakan logout dan login ulang.");
  deleteButton.disabled = false;
  return;
}


const { data, error } = await sb.storage
  .from(BUCKET)
  .remove([path]);

if (error) {
  alert("DELETE GAGAL: " + error.message);
  deleteButton.disabled = false;
  return;
}

if (!data || data.length === 0) {
  alert("File tidak terhapus. Path: " + path);
  deleteButton.disabled = false;
  return;
}


item.remove();
  };

  item.appendChild(deleteButton);
}

gallery.appendChild(item);
    }
    if (!data.length) gallery.textContent = "Belum ada foto.";
  } catch (error) { gallery.textContent = "Gallery gagal dibuka: " + error.message; }
}
function openPhoto(url) {
  $("modalPhoto").src = url;
  $("modalDownload").onclick = () => downloadUrl(url);
  $("photoModal").style.display = "flex";
}
function closePhoto() { $("photoModal").style.display = "none"; }

// Admin menggunakan Supabase Auth. Akses tulis bucket overlays wajib dibatasi RLS ke admin.
async function openAdmin() {
  stopCamera(); hideAll(); $("adminPage").style.display = "block";
  const { data } = await client().auth.getSession();
  adminSession = data.session;
  $("adminLogin").style.display = adminSession ? "none" : "block";
  $("adminControls").style.display = adminSession ? "block" : "none";
  if (adminSession) refreshOverlayPreview();
  if (adminSession) loadClients();
}
async function adminLogin() {
  const button = $("loginButton"); button.disabled = true;
  $("loginMessage").textContent = "Sedang login...";
  try {
    const { data, error } = await client().auth.signInWithPassword({
      email: $("adminEmail").value.trim(), password: $("adminPassword").value
    });
    if (error) throw error;
    adminSession = data.session;
    $("adminPassword").value = "";
    $("loginMessage").textContent = "";
    $("adminLogin").style.display = "none";
    $("adminControls").style.display = "block";
refreshOverlayPreview();
loadClients();
  } catch (error) { $("loginMessage").textContent = "Login gagal: " + error.message; }
  finally { button.disabled = false; }
}
async function adminLogout() {
  await client().auth.signOut(); adminSession = null;
  $("adminControls").style.display = "none"; $("adminLogin").style.display = "block";
  $("overlayPreview").style.display = "none";
}
let localPreviewUrl = null;
async function refreshOverlayPreview() {
  if (localPreviewUrl) { URL.revokeObjectURL(localPreviewUrl); localPreviewUrl = null; }
  $("overlayFile").value = "";
  $("overlayPreview").style.display = "none";
  $("overlayStatus").textContent = "Memeriksa overlay tersimpan...";
  try {
    const url = await getOverlayUrl($("overlayCategory").value);
    if (url) { $("overlayPreview").src = url; $("overlayPreview").style.display = "block"; }
    $("overlayStatus").textContent = url ? "Overlay tersimpan. Unggah PNG baru untuk mengganti." : "Belum ada overlay. Bingkai bawaan digunakan.";
  } catch (error) { $("overlayStatus").textContent = error.message; }
}
async function previewSelectedOverlay() {
  const file = $("overlayFile").files[0];
  if (!file) return;
  if (file.type !== "image/png") { alert("Gunakan file PNG transparan."); $("overlayFile").value = ""; return; }
  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  localPreviewUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(localPreviewUrl);
    if (img.naturalWidth !== OUTPUT_W || img.naturalHeight !== OUTPUT_H) {
      throw new Error("Ukuran harus tepat 1181 × 1772 piksel.");
    }
    $("overlayPreview").src = localPreviewUrl;
    $("overlayPreview").style.display = "block";
    $("overlayStatus").textContent = "PNG siap diunggah. Tekan SIMPAN OVERLAY.";
  } catch (error) {
    $("overlayStatus").textContent = error.message;
    $("overlayFile").value = "";
  }
}
async function saveOverlay() {
  const file = $("overlayFile").files[0];
  if (!file) { alert("Pilih file PNG terlebih dahulu."); return; }
  const button = $("saveOverlayButton"); button.disabled = true;
  $("overlayStatus").textContent = "Mengunggah overlay...";
  try {
    const { data: sessionData } = await client().auth.getSession();
    if (!sessionData.session) throw new Error("Login admin diperlukan.");
    const img = await loadImage(URL.createObjectURL(file));
    if (img.naturalWidth !== OUTPUT_W || img.naturalHeight !== OUTPUT_H) throw new Error("Ukuran PNG tidak sesuai.");
    const { error } = await client().storage
  .from(BUCKET)
  .upload(
    "events/" + eventId + "/overlays/" +
      $("overlayCategory").value + ".png",
    file,
    {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600"
    }
  );
    if (error) throw error;
    $("overlayStatus").textContent = "Overlay berhasil disimpan!";
    await refreshOverlayPreview();
    $("overlayFile").value = "";
  } catch (error) { $("overlayStatus").textContent = "Gagal: " + error.message; }
  finally { button.disabled = false; }
}
function openWishPopup() {
  $("wishPopup").style.display = "flex";
}

function closeWishPopup() {
  $("wishPopup").style.display = "none";
}

async function saveWishPopup() {
  const name = $("guestName").value.trim();
  const wish = $("guestWish").value.trim();

  if (!wish) {
    alert("Tulis ucapan terlebih dahulu.");
    return;
  }

  await applyGuestWish();
  closeWishPopup();
}
goHome();

let voiceRecorder = null;
let voiceStream = null;
let voiceChunks = [];
let voiceBlob = null;
let voiceUrl = null;

function openVoiceWishes() {
  document.getElementById("voicePopup").style.display = "flex";
}

function closeVoiceWishes() {
  if (voiceRecorder?.state === "recording") {
    voiceRecorder.stop();
  }
  if (voiceStream) {
    voiceStream.getTracks().forEach(track => track.stop());
  }
  document.getElementById("voicePopup").style.display = "none";
}

async function startVoiceRecording() {
  try {
    if (!navigator.mediaDevices?.getUserMedia ||
        !window.MediaRecorder) {
      alert("Browser tidak mendukung rekaman suara.");
      return;
    }

    voiceStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    voiceChunks = [];
    voiceBlob = null;

    voiceRecorder = new MediaRecorder(voiceStream);

    voiceRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        voiceChunks.push(event.data);
      }
    };

    voiceRecorder.onstop = () => {
      voiceBlob = new Blob(voiceChunks, {
        type: voiceRecorder.mimeType
      });

      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      voiceUrl = URL.createObjectURL(voiceBlob);

      const player = document.getElementById("voicePlayback");
      player.src = voiceUrl;
      player.style.display = "block";

      document.getElementById("saveVoice").disabled = false;
      document.getElementById("recordStatus").textContent =
        "Rekaman selesai. Silakan dengarkan.";

      voiceStream.getTracks().forEach(track => track.stop());
      voiceStream = null;
    };

    voiceRecorder.start();
    startVoiceTimer();

    document.getElementById("startRecord").disabled = true;
    document.getElementById("stopRecord").disabled = false;
    document.getElementById("saveVoice").disabled = true;
    document.getElementById("voicePlayback").style.display = "none";
    document.getElementById("recordStatus").textContent =
      "Sedang merekam...";
  } catch (error) {
    alert("Mikrofon gagal dibuka: " + error.message);
  }
}

function stopVoiceRecording() {
	stopVoiceTimer();
  if (voiceRecorder?.state === "recording") {
    voiceRecorder.stop();
    document.getElementById("startRecord").disabled = false;
    document.getElementById("stopRecord").disabled = true;
  }
}

async function saveVoiceRecording() {
  if (!voiceBlob || voiceBlob.size === 0) {
    alert("Rekam suara terlebih dahulu.");
    return;
  }

  const saveButton = document.getElementById("saveVoice");
  saveButton.disabled = true;
  saveButton.textContent = "MENYIMPAN...";

  try {
    const extension = voiceBlob.type.includes("mp4")
      ? "m4a"
      : "webm";

    const filename =
  `events/${eventId}/voice-wishes/${Date.now()}-${Math.random()
    .toString(36).slice(2)}.${extension}`;

    const { error } = await client().storage
  .from(BUCKET)
      .upload(filename, voiceBlob, {
        contentType: voiceBlob.type,
        upsert: false
      });

    
if (error) throw error;

savedVoicePath = filename;
    document.getElementById("recordStatus").textContent =
      "Voice Wishes berhasil disimpan!";

    
    closeVoiceWishes();

  } catch (error) {
    alert("Gagal menyimpan: " + error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "SAVE";
  }
}
function toggleMusic() {
  const clientMusic = $("clientThemeMusic");
  const defaultMusic = $("bgMusic");
  const button = $("musicButton");

  // Kalau client punya musik theme, pakai itu.
  // Kalau tidak, pakai musik bawaan.
  const music =
    clientMusic && clientMusic.src
      ? clientMusic
      : defaultMusic;

  if (!music || !button) return;

  if (music.paused) {
    music.play().then(() => {
      button.textContent = "♫ ON";
    }).catch(() => {
      button.textContent = "♫ OFF";
    });
  } else {
    music.pause();
    button.textContent = "♫ OFF";
  }
}

async function addClient() {
  const input = document.getElementById("newClientName");
  const name = input.value.trim();

  if (!name) {
    alert("Masukkan nama client terlebih dahulu.");
    return;
  }

  const id = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!id) {
    alert("Gunakan nama client dengan huruf atau angka.");
    return;
  }

  try {
    const { error } = await client()
      .from("booth_clients")
      .insert({ id, name });

    if (error) throw error;

    input.value = "";
    await loadClients();
    alert("Client berhasil ditambahkan!");
  } catch (error) {
    alert("Gagal menambah client: " + error.message);
  }
}

async function loadClients() {
  const list = document.getElementById("clientList");
  list.innerHTML = "Memuat client...";

  const { data: clients, error } = await client()
    .from("booth_clients")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    list.textContent = "Gagal memuat client: " + error.message;
    return;
  }

  list.innerHTML = "";
list.style.display = "grid";
list.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
list.style.gap = "12px";
  clients.forEach(c => {
    const link = new URL(window.location.href);
    link.searchParams.set("event", c.id);

    const item = document.createElement("div");
    item.className = "client-item";
item.style.cssText = `
  background: #181818;
  border: 1px solid #d4af37;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  min-width: 0;
  overflow-wrap: anywhere;
`;
  
    const title = document.createElement("strong");
    title.textContent = c.name;
title.style.cssText = `
  display: block;
  font-size: 14px;
  color: #d4af37;
  margin-bottom: 12px;
  overflow-wrap: anywhere;
`;

title.textContent = "📁 " + c.name;
    const button = document.createElement("button");
    button.textContent = "SALIN LINK CLIENT";
button.style.cssText = `
  font-size: 11px;
  padding: 8px 6px;
  width: 100%;
  border-radius: 8px;
  line-height: 1.3;
`;
    button.onclick = () => {
      navigator.clipboard.writeText(link.href)
        .then(() => alert("Link client berhasil disalin!"))
        .catch(() => prompt("Salin link berikut:", link.href));
    };const designButton = document.createElement("button");
designButton.textContent = "KELOLA DESIGN";
designButton.style.cssText = `
  font-size:11px;
  padding:8px 6px;
  width:100%;
  border-radius:8px;
  line-height:1.3;
  margin-bottom:8px;
`;

designButton.onclick = () => {
  openFrameManager(c);
};
const themeButton = document.createElement("button");
themeButton.textContent = "🎨 EDIT THEME";
themeButton.style.cssText = `
  font-size:11px;
  padding:8px 6px;
  width:100%;
  border-radius:8px;
  margin-top:8px;
  font-weight:bold;
  cursor:pointer;
`;

themeButton.onclick = () => {
  openThemeManager(c);
};
designButton.insertAdjacentElement("afterend", themeButton);
title.style.cursor = "pointer";

title.onclick = () => {
  openClientDashboard(c, link.href);
};
const deleteButton = document.createElement("button");
deleteButton.textContent = "🗑 HAPUS CLIENT";
deleteButton.style.cssText = `
  font-size:11px;
  padding:8px 6px;
  width:100%;
  border-radius:8px;
  margin-top:8px;
  background:#b00020;
  color:white;
  font-weight:bold;
`;

deleteButton.onclick = async () => {
  const yakin = confirm(
    "Hapus client " + c.name + " beserta semua datanya?"
  );

  if (!yakin) return;

  try {
    // Hapus semua file frame client
    const { data: files, error: listError } = await client()
      .storage
      .from(BUCKET)
      .list("frames/" + c.id);

    if (listError) throw listError;

    if (files && files.length > 0) {
      const paths = files.map(
        file => "frames/" + c.id + "/" + file.name
      );

      const { error: removeError } = await client()
        .storage
        .from(BUCKET)
        .remove(paths);

      if (removeError) throw removeError;
    }

    // Hapus client dari database
    const { error: dbError } = await client()
      .from("booth_clients")
      .delete()
      .eq("id", c.id);

    if (dbError) throw dbError;

    await loadClients();

    alert("Client " + c.name + " berhasil dihapus.");

  } catch (error) {
    alert("Gagal menghapus client: " + error.message);
  }
};
    item.append(
  title,
  document.createElement("br"),
  designButton,
  button,
  deleteButton
);
    list.appendChild(item);
  });
}
function openClientDashboard(c, clientUrl) {
  const old = document.getElementById("clientDashboardPopup");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "clientDashboardPopup";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 25px;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    width: 100%;
    max-width: 340px;
    background: #181818;
    border: 1px solid #d4af37;
    border-radius: 16px;
    padding: 22px;
    text-align: center;
  `;

  const title = document.createElement("h3");
  title.textContent = "📁 " + c.name;
  title.style.cssText = `
    color: #d4af37;
    margin: 0 0 20px;
    font-size: 20px;
  `;

  const makeButton = (text, action) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = `
      width: 100%;
      margin: 6px 0;
      padding: 13px 10px;
      font-size: 14px;
      border-radius: 9px;
    `;
    btn.onclick = action;
    return btn;
  };

  const photoBtn = makeButton("BUKA PHOTOBOOTH", () => {
    window.open(clientUrl, "_blank");
  });

  const galleryBtn = makeButton("BUKA GALLERY", () => {
    const url = new URL(clientUrl);
    url.searchParams.set("gallery", "1");
    window.open(url.href, "_blank");
  });
const frameBtn = makeButton("KELOLA DESIGN", () => {
  openFrameManager(c);
});
const themeBtn = makeButton("🎨 EDIT THEME", () => {
  openThemeManager(c);
});
  const copyBtn = makeButton("SALIN LINK", () => {
    navigator.clipboard.writeText(clientUrl)
      .then(() => alert("Link client berhasil disalin!"))
      .catch(() => prompt("Salin link berikut:", clientUrl));
  });

  const closeBtn = makeButton("TUTUP", () => {
    overlay.remove();
  });

  box.append(title, photoBtn, galleryBtn, frameBtn, themeBtn, copyBtn, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
    async function openFrameManager(c) {
  const old = document.getElementById("frameManagerPopup");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "frameManagerPopup";
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.92);
    z-index:9999;
    overflow-y:auto;
    padding:25px 18px;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    max-width:600px;
    margin:auto;
    color:white;
    text-align:center;
  `;

  const title = document.createElement("h2");
  title.textContent = "KELOLA DESIGN - " + c.name;

  box.appendChild(title);

  const frames = [
  { number:1, name:"wedding" },
  { number:2, name:"birthday" },
  { number:3, name:"corporate" }
];

// Cari frame tambahan yang sudah pernah di-upload
const { data: extraFiles, error: extraError } = await client()
  .storage
  .from(BUCKET)
  .list("frames/" + c.id);

if (!extraError && extraFiles) {
  extraFiles.forEach(file => {
    const match = file.name.match(/^frame(\d+)\.png$/i);

    if (match) {
      const number = parseInt(match[1]);

      if (number >= 4) {
        frames.push({
          number: number,
          name: "frame" + number
        });
      }
    }
  });
}

// Urutkan Frame 1, 2, 3, 4, 5...
frames.sort((a, b) => a.number - b.number);

  for (const frame of frames) {

    const card = document.createElement("div");
    card.style.cssText = `
      border:1px solid #d4af37;
      border-radius:15px;
      padding:15px;
      margin:18px 0;
    `;

    const label = document.createElement("h3");
    label.textContent = "FRAME " + frame.number;

    const preview = document.createElement("img");

    const filePath =
      "frames/" + c.id + "/" + frame.name + ".png";

    const { data } = client()
      .storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    preview.src =
      data.publicUrl + "?t=" + Date.now();

    preview.style.cssText = `
      width:100%;
      max-height:300px;
      object-fit:contain;
      background:#222;
      border-radius:10px;
      margin-bottom:12px;
    `;

    const changeBtn = document.createElement("button");
    changeBtn.textContent = "GANTI FRAME " + frame.number;
    changeBtn.style.cssText = `
      width:100%;
      padding:14px;
      font-weight:bold;
    `;

    changeBtn.onclick = () => {

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png";

      input.onchange = async () => {

        const file = input.files[0];
        if (!file) return;

        changeBtn.textContent = "UPLOAD...";

        try {

          const { error } = await client()
            .storage
            .from(BUCKET)
            .upload(filePath, file, {
              upsert:true,
              contentType:"image/png"
            });

          if (error) throw error;

          preview.src =
            data.publicUrl + "?t=" + Date.now();

          alert(
            "FRAME " + frame.number +
            " untuk " + c.name +
            " berhasil diganti!"
          );

        } catch (error) {

          alert(
            "Gagal upload design: " +
            error.message
          );

        }

        changeBtn.textContent =
          "GANTI FRAME " + frame.number;
      };

      input.click();
    };

    card.append(
      label,
      preview,
      changeBtn
    );

    box.appendChild(card);
  }
// ==========================
// TAMBAH FRAME BARU
// ==========================
const addFrameBtn = document.createElement("button");
addFrameBtn.textContent = "+ TAMBAH FRAME";

addFrameBtn.style.cssText = `
  width:100%;
  padding:15px;
  margin:10px 0 20px;
  font-weight:bold;
  font-size:16px;
  border-radius:12px;
  cursor:pointer;
`;

addFrameBtn.onclick = async () => {

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png";

  input.onchange = async () => {

    const file = input.files[0];
    if (!file) return;

    // Nomor frame berikutnya
    const nextNumber =
      Math.max(...frames.map(f => f.number)) + 1;

    const frameName = "frame" + nextNumber;

    const filePath =
      "frames/" + c.id + "/" + frameName + ".png";

    addFrameBtn.disabled = true;
    addFrameBtn.textContent = "UPLOAD...";

    try {

      const { error } = await client()
        .storage
        .from(BUCKET)
        .upload(filePath, file, {
          upsert: true,
          contentType: "image/png"
        });

      if (error) throw error;

      alert(
        "FRAME " + nextNumber +
        " berhasil ditambahkan!"
      );

      // Tutup lalu buka ulang manager
      overlay.remove();
      openFrameManager(c);

    } catch (error) {

      alert(
        "Gagal menambah frame: " +
        error.message
      );

      addFrameBtn.disabled = false;
      addFrameBtn.textContent = "+ TAMBAH FRAME";
    }
  };

  input.click();
};

box.appendChild(addFrameBtn);
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "TUTUP";
  closeBtn.style.cssText = `
    width:100%;
    padding:15px;
    margin-bottom:30px;
    font-weight:bold;
  `;

  closeBtn.onclick = () => overlay.remove();

  box.appendChild(closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
async function loadClientFramePreviews() {
  if (!eventId || eventId === "default") return;

  // FRAME 1–3
  const frames = [
    { id: "framePreview1", file: "wedding.png" },
    { id: "framePreview2", file: "birthday.png" },
    { id: "framePreview3", file: "corporate.png" }
  ];

  frames.forEach(f => {
    const img = document.getElementById(f.id);
    if (!img) return;

    const { data } = client()
      .storage
      .from(BUCKET)
      .getPublicUrl("frames/" + eventId + "/" + f.file);

    if (data && data.publicUrl) {
      img.src = data.publicUrl + "?t=" + Date.now();
    }
  });

  // FRAME 4 DAN SETERUSNYA
  const extraFrames = document.getElementById("extraFrames");
  if (!extraFrames) return;

  extraFrames.innerHTML = "";

  const { data: files, error } = await client()
    .storage
    .from(BUCKET)
    .list("frames/" + eventId);

  if (error || !files) return;

  const extras = [];

  files.forEach(file => {
    const match = file.name.match(/^frame(\d+)\.png$/i);

    if (match) {
      const number = parseInt(match[1]);

      if (number >= 4) {
        extras.push({
          number: number,
          file: file.name
        });
      }
    }
  });

  extras.sort((a, b) => a.number - b.number);

  extras.forEach(frame => {
    const button = document.createElement("button");

    button.onclick = () => {
      chooseFrame("frame" + frame.number);
    };

    const img = document.createElement("img");

    const { data } = client()
      .storage
      .from(BUCKET)
      .getPublicUrl(
        "frames/" + eventId + "/" + frame.file
      );

    img.src = data.publicUrl + "?t=" + Date.now();
    img.alt = "FRAME " + frame.number;
    img.style.width = "100%";
    img.style.display = "block";

    button.appendChild(img);
    button.appendChild(
      document.createTextNode("FRAME " + frame.number)
    );

    extraFrames.appendChild(button);
  });
}

    window.addEventListener("load", () => {
  loadClientFramePreviews();
  loadClientTheme();

  const params = new URLSearchParams(window.location.search);

  if (params.get("gallery") === "1") {
    openGallery();
  }
});
async function openThemeManager(c) {
  const old = document.getElementById("themeManagerPopup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "themeManagerPopup";

  popup.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.85);
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    box-sizing:border-box;
  `;

  popup.innerHTML = `
    <div style="
      background:#fff;
      color:#111;
      width:100%;
      max-width:430px;
      max-height:90vh;
      overflow:auto;
      border-radius:18px;
      padding:20px;
      box-sizing:border-box;
    ">

      <h2 style="margin-top:0;">🎨 EDIT THEME</h2>

      <p style="font-weight:bold;">
        ${c.name || c.id}
      </p>

      <label>Nama Event</label>
      <input id="themeEventName"
        type="text"
        value="${c.name || ""}"
        style="width:100%;padding:10px;margin:6px 0 14px;box-sizing:border-box;">

      <label>Tulisan Opening</label>
      <input id="themeOpening"
        type="text"
        placeholder="Capture Beautiful Moments"
        style="width:100%;padding:10px;margin:6px 0 14px;box-sizing:border-box;">

      <label>Warna Tombol</label>
      <input id="themeButtonColor"
        type="color"
        value="#d9b536"
        style="width:100%;height:45px;margin:6px 0 14px;">

      <label>Logo</label>
      <input id="themeLogo"
        type="file"
        accept="image/*"
        style="width:100%;margin:6px 0 14px;">

      <label>Background Halaman</label>
      <input id="themeBackground"
        type="file"
        accept="image/*"
        style="width:100%;margin:6px 0 14px;">

      <label>Musik</label>
      <input id="themeMusic"
        type="file"
        accept="audio/*"
        style="width:100%;margin:6px 0 20px;">

      <button
        onclick="saveClientTheme('${c.id}')"
        style="width:100%;padding:14px;font-weight:bold;">
        💾 SIMPAN THEME
      </button>

      <button
        onclick="document.getElementById('themeManagerPopup').remove()"
        style="width:100%;padding:14px;margin-top:10px;">
        TUTUP
      </button>

    </div>
  `;

  document.body.appendChild(popup);
}
async function saveClientTheme(clientId) {
  const saveButton = document.querySelector(
    "#themeManagerPopup button[onclick^='saveClientTheme']"
  );

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "MENYIMPAN...";
  }

  try {
    const eventName =
      document.getElementById("themeEventName").value.trim();

    const openingText =
      document.getElementById("themeOpening").value.trim();

    const buttonColor =
      document.getElementById("themeButtonColor").value;

    const logoFile =
      document.getElementById("themeLogo").files[0];

    const backgroundFile =
      document.getElementById("themeBackground").files[0];

    const musicFile =
      document.getElementById("themeMusic").files[0];

    const theme = {
      eventName: eventName,
      openingText: openingText || "Capture Beautiful Moments",
      buttonColor: buttonColor,
      logo: null,
      background: null,
      music: null
    };

    async function uploadThemeFile(file, name) {
      if (!file) return null;

      const ext =
        file.name.split(".").pop().toLowerCase();

      const path =
        "themes/" +
        clientId +
        "/" +
        name +
        "." +
        ext;

      const { error } = await client()
        .storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type
        });

      if (error) throw error;

      const { data } = client()
        .storage
        .from(BUCKET)
        .getPublicUrl(path);

      return data.publicUrl + "?t=" + Date.now();
    }

    if (logoFile) {
      theme.logo =
        await uploadThemeFile(
          logoFile,
          "logo"
        );
    }

    if (backgroundFile) {
      theme.background =
        await uploadThemeFile(
          backgroundFile,
          "background"
        );
    }

    if (musicFile) {
      theme.music =
        await uploadThemeFile(
          musicFile,
          "music"
        );
    }

    const themeBlob = new Blob(
      [JSON.stringify(theme)],
      { type: "application/json" }
    );

    const themePath =
      "themes/" +
      clientId +
      "/theme.json";

    const { error: themeError } =
      await client()
        .storage
        .from(BUCKET)
        .upload(
          themePath,
          themeBlob,
          {
            upsert: true,
            contentType: "application/json"
          }
        );

    if (themeError) throw themeError;

    alert("THEME BERHASIL DISIMPAN");

    document
      .getElementById("themeManagerPopup")
      ?.remove();

  } catch (error) {

    alert(
      "Gagal menyimpan theme: " +
      error.message
    );

  } finally {

    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent =
        "💾 SIMPAN THEME";
    }
  }
}
async function loadClientTheme() {
  if (!eventId || eventId === "default") return;

  try {
    const themePath =
      "themes/" +
      eventId +
      "/theme.json";

    const { data, error } =
      await client()
        .storage
        .from(BUCKET)
        .download(themePath);

    if (error || !data) return;

    const theme =
      JSON.parse(await data.text());

    // NAMA EVENT
    if (theme.eventName) {
      document.title = theme.eventName;
    }

    // TULISAN OPENING
    if (theme.openingText) {
      const opening =
        document.querySelector("#home h1");

      if (opening) {
        opening.textContent =
          theme.openingText;
      }
    }

    // WARNA TOMBOL
    if (theme.buttonColor) {
      document.documentElement.style
        .setProperty(
          "--client-button-color",
          theme.buttonColor
        );

      document
        .querySelectorAll("button")
        .forEach(button => {
          button.style.backgroundColor =
            theme.buttonColor;
        });
    }

    // BACKGROUND
    

      // BACKGROUND FULLSCREEN HOME
if (theme.background) {
  const home = document.getElementById("home");

  if (home) {
    home.style.backgroundImage = `url("${theme.background}")`;
    home.style.backgroundSize = "cover";
    home.style.backgroundPosition = "center";
    home.style.backgroundRepeat = "no-repeat";
    home.style.minHeight = "100dvh";
    home.style.backgroundAttachment = "scroll";
  }
}
        if (theme.background) {
  const home = document.getElementById("home");

  if (home) {
    home.style.backgroundImage = `url("${theme.background}")`;
    home.style.backgroundSize = "cover";
    home.style.backgroundPosition = "center";
    home.style.backgroundRepeat = "no-repeat";
    home.style.minHeight = "100dvh";
  }
}


// LOGO
if (theme.logo) {
  let logo =
    document.getElementById(
      "clientThemeLogo"
    );

  
    
          

      if (!logo) {
        logo =
          document.createElement("img");

        logo.id = "clientThemeLogo";

        logo.style.cssText = `
          display:block;
          max-width:180px;
          max-height:100px;
          object-fit:contain;
          margin:20px auto;
        `;

        const home =
          document.getElementById("home");

        if (home) {
          home.prepend(logo);
        }
      }

      logo.src = theme.logo;
    }

    // MUSIK
    if (theme.music) {
      let audio =
        document.getElementById(
          "clientThemeMusic"
        );

      if (!audio) {
        audio =
          document.createElement("audio");

        audio.id = "clientThemeMusic";
        audio.loop = true;
        audio.preload = "auto";

        document.body.appendChild(audio);
      }

      audio.src = theme.music;
    }

  } catch (error) {
    console.error(
      "Theme gagal dimuat:",
      error
    );
  }
}