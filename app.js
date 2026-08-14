(() => {
  "use strict";

  /*
   * ==========================================================
   * THUMBNAIL MAKER — MASTER APP ENGINE
   * ==========================================================
   *
   * app.js is the main controller.
   *
   * It:
   * - loads the stylesheet automatically
   * - builds the application shell
   * - creates editor controls
   * - handles image editing
   * - handles crop / move / resize
   * - handles text
   * - handles effects
   * - handles layers
   * - handles undo / redo
   * - handles exporting
   * - handles pages
   * - prepares account/subscription architecture
   * - prepares PWA installation
   *
   * IMPORTANT:
   * Real Google authentication and real recurring payments
   * require a secure backend/provider. This file never stores
   * secret keys.
   * ==========================================================
   */

  const APP = {
    name: "Thumbnail Maker",
    version: "8.0",

    canvasWidth: 1280,
    canvasHeight: 720,

    image: null,

    mode: "move",

    imageX: 640,
    imageY: 360,

    imageWidth: 600,
    imageHeight: 600,

    rotation: 0,
    zoom: 1,
    opacity: 1,

    background: "#151a22",

    crop: null,

    layers: [],

    selectedLayer: -1,

    effects: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0
    },

    history: [],
    historyPosition: -1,

    dragging: false,

    dragStart: {
      x: 0,
      y: 0
    },

    objectStart: {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    },

    currentPage: "editor",

    installPrompt: null
  };


  /* ==========================================================
     LOAD CSS AUTOMATICALLY
     ========================================================== */

  function loadStylesheet() {

    if (
      document.querySelector(
        'link[data-thumbnail-maker-style]'
      )
    ) {
      return;
    }

    const link =
      document.createElement("link");

    link.rel = "stylesheet";

    link.href = "style.css";

    link.dataset.thumbnailMakerStyle =
      "true";

    document.head.appendChild(link);
  }


  /* ==========================================================
     BASIC HTML HELPERS
     ========================================================== */

  function createElement(
    tag,
    options = {}
  ) {

    const element =
      document.createElement(tag);

    if (options.id) {
      element.id = options.id;
    }

    if (options.className) {
      element.className =
        options.className;
    }

    if (options.text) {
      element.textContent =
        options.text;
    }

    if (options.html) {
      element.innerHTML =
        options.html;
    }

    return element;
  }


  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* ==========================================================
     BUILD COMPLETE APPLICATION
     ========================================================== */

  function buildApplication() {

    const existing =
      document.getElementById(
        "thumbnailMakerRoot"
      );

    if (existing) {
      existing.remove();
    }

    const root =
      createElement(
        "div",
        {
          id: "thumbnailMakerRoot"
        }
      );

    root.innerHTML = `

      <header class="tm-header">

        <div class="tm-brand">

          <div class="tm-logo">
            TM
          </div>

          <div>
            <strong>
              Thumbnail Maker
            </strong>

            <small>
              Professional Editor
            </small>
          </div>

        </div>

        <nav class="tm-navigation">

          <button
            data-page="editor"
            class="tm-nav active">
            Editor
          </button>

          <button
            data-page="ai"
            class="tm-nav">
            ✨ AI Studio
          </button>

          <button
            data-page="pricing"
            class="tm-nav">
            Plans
          </button>

          <button
            data-page="account"
            class="tm-nav">
            Account
          </button>

        </nav>

        <div class="tm-header-actions">

          <button
            id="tmInstall"
            class="tm-button hidden">
            Install
          </button>

          <button
            id="tmExportTop"
            class="tm-button primary">
            Export
          </button>

        </div>

      </header>


      <main>

        <!-- ==============================================
             EDITOR PAGE
        =============================================== -->

        <section
          id="tm-editorPage"
          class="tm-page active">

          <div class="tm-editor">

            <aside class="tm-toolbar">

              <button
                data-tool="upload"
                class="tm-tool">
                📤
                <span>Upload</span>
              </button>

              <button
                data-tool="move"
                class="tm-tool active">
                🖱️
                <span>Move</span>
              </button>

              <button
                data-tool="resize"
                class="tm-tool">
                ↔️
                <span>Resize</span>
              </button>

              <button
                data-tool="crop"
                class="tm-tool">
                ✂️
                <span>Crop</span>
              </button>

              <button
                data-tool="text"
                class="tm-tool">
                T
                <span>Text</span>
              </button>

              <button
                data-tool="effects"
                class="tm-tool">
                🎨
                <span>Effects</span>
              </button>

              <button
                data-tool="green"
                class="tm-tool">
                🟢
                <span>Green</span>
              </button>

              <button
                data-tool="background"
                class="tm-tool">
                🪄
                <span>BG</span>
              </button>

              <button
                data-tool="layers"
                class="tm-tool">
                📚
                <span>Layers</span>
              </button>

            </aside>


            <section class="tm-workspace">

              <div class="tm-canvas-wrap">

                <canvas
                  id="tmCanvas"
                  width="1280"
                  height="720">
                </canvas>

                <div
                  id="tmEmpty"
                  class="tm-empty">

                  <strong>
                    Start creating
                  </strong>

                  <span>
                    Upload an image to begin
                  </span>

                  <button
                    id="tmUploadEmpty"
                    class="tm-button primary">
                    Upload Image
                  </button>

                </div>

              </div>


              <div class="tm-history">

                <button
                  id="tmUndo"
                  class="tm-small-button">
                  ↶ Undo
                </button>

                <button
                  id="tmRedo"
                  class="tm-small-button">
                  ↷ Redo
                </button>

                <button
                  id="tmReset"
                  class="tm-small-button">
                  Reset
                </button>

                <button
                  id="tmDownload"
                  class="tm-small-button primary">
                  Download PNG
                </button>

              </div>

            </section>


            <aside class="tm-properties">

              <div
                id="tmToolPanel">

                <div class="tm-panel-card">

                  <h3>
                    Image Controls
                  </h3>

                  <label>
                    Opacity
                    <output id="tmOpacityValue">
                      100%
                    </output>
                  </label>

                  <input
                    id="tmOpacity"
                    type="range"
                    min="0"
                    max="100"
                    value="100">

                  <label>
                    Zoom
                    <output id="tmZoomValue">
                      100%
                    </output>
                  </label>

                  <input
                    id="tmZoom"
                    type="range"
                    min="10"
                    max="300"
                    value="100">

                  <label>
                    Rotation
                    <output id="tmRotationValue">
                      0°
                    </output>
                  </label>

                  <input
                    id="tmRotation"
                    type="range"
                    min="-180"
                    max="180"
                    value="0">

                </div>

              </div>

            </aside>

          </div>

        </section>


        <!-- ==============================================
             AI STUDIO PAGE
        =============================================== -->

        <section
          id="tm-aiPage"
          class="tm-page">

          <div class="tm-page-container">

            <div class="tm-page-heading">

              <span class="tm-page-icon">
                ✨
              </span>

              <div>

                <h1>
                  AI Studio
                </h1>

                <p>
                  Advanced character and image editing.
                </p>

              </div>

            </div>


            <div class="tm-ai-grid">

              <div class="tm-panel-card">

                <h3>
                  Character Editor
                </h3>

                <textarea
                  id="tmAIPrompt"
                  placeholder="Describe the change you want...">
                </textarea>

                <div class="tm-ai-options">

                  <button
                    class="tm-option"
                    data-ai-action="pose">
                    🕺 Change Pose
                  </button>

                  <button
                    class="tm-option"
                    data-ai-action="expression">
                    😀 Change Expression
                  </button>

                  <button
                    class="tm-option"
                    data-ai-action="background">
                    🌄 Change Background
                  </button>

                  <button
                    class="tm-option"
                    data-ai-action="lighting">
                    💡 Change Lighting
                  </button>

                  <button
                    class="tm-option"
                    data-ai-action="style">
                    🎨 Change Style
                  </button>

                  <button
                    class="tm-option"
                    data-ai-action="character">
                    👤 Edit Character
                  </button>

                </div>

                <button
                  id="tmAIGenerate"
                  class="tm-button primary full">
                  Generate / Edit
                </button>

                <div
                  id="tmAIStatus"
                  class="tm-status">
                  AI connection ready for provider setup.
                </div>

              </div>


              <div class="tm-panel-card">

                <h3>
                  AI Controls
                </h3>

                <label>
                  Pose
                  <select id="tmAIPose">
                    <option>Natural</option>
                    <option>Confident</option>
                    <option>Cheering</option>
                    <option>Pointing</option>
                    <option>Waving</option>
                    <option>Surprised</option>
                  </select>
                </label>

                <label>
                  Expression
                  <select id="tmAIExpression">
                    <option>Natural</option>
                    <option>Happy</option>
                    <option>Smiling</option>
                    <option>Excited</option>
                    <option>Surprised</option>
                    <option>Serious</option>
                  </select>
                </label>

                <label>
                  Composition
                  <select id="tmAIComposition">
                    <option>Original</option>
                    <option>Close-up</option>
                    <option>Portrait</option>
                    <option>Full Body</option>
                    <option>Thumbnail</option>
                  </select>
                </label>

              </div>

            </div>

          </div>

        </section>


        <!-- ==============================================
             PRICING PAGE
        =============================================== -->

        <section
          id="tm-pricingPage"
          class="tm-page">

          <div class="tm-page-container">

            <div class="tm-page-heading">

              <span class="tm-page-icon">
                ⭐
              </span>

              <div>

                <h1>
                  Choose your plan
                </h1>

                <p>
                  Start free and upgrade when you need more.
                </p>

              </div>

            </div>


            <div class="tm-pricing-grid">

              <article class="tm-plan">

                <h2>
                  Free
                </h2>

                <div class="tm-price">
                  $0
                  <small>/month</small>
                </div>

                <ul>
                  <li>✓ Upload images</li>
                  <li>✓ Move</li>
                  <li>✓ Resize</li>
                  <li>✓ Crop</li>
                  <li>✓ Text</li>
                  <li>✓ Basic effects</li>
                  <li>✓ PNG export</li>
                </ul>

                <button
                  class="tm-button full">
                  Current Plan
                </button>

              </article>


              <article class="tm-plan featured">

                <div class="tm-plan-badge">
                  Popular
                </div>

                <h2>
                  Creator
                </h2>

                <div class="tm-price">
                  $4.99
                  <small>/month</small>
                </div>

                <ul>
                  <li>✓ Everything in Free</li>
                  <li>✓ Advanced effects</li>
                  <li>✓ Green screen</li>
                  <li>✓ Layers</li>
                  <li>✓ JPG export</li>
                  <li>✓ More projects</li>
                </ul>

                <button
                  class="tm-button primary full"
                  data-plan="Creator">
                  Upgrade
                </button>

              </article>


              <article class="tm-plan">

                <h2>
                  Pro
                </h2>

                <div class="tm-price">
                  $9.99
                  <small>/month</small>
                </div>

                <ul>
                  <li>✓ Everything in Creator</li>
                  <li>✓ Advanced crop</li>
                  <li>✓ Premium effects</li>
                  <li>✓ Unlimited projects</li>
                  <li>✓ High quality export</li>
                </ul>

                <button
                  class="tm-button primary full"
                  data-plan="Pro">
                  Upgrade
                </button>

              </article>


              <article class="tm-plan ultimate">

                <div class="tm-plan-badge">
                  Ultimate
                </div>

                <h2>
                  Ultimate
                </h2>

                <div class="tm-price">
                  $19.99
                  <small>/month</small>
                </div>

                <ul>
                  <li>✓ Everything in Pro</li>
                  <li>✓ AI Studio</li>
                  <li>✓ AI character editing</li>
                  <li>✓ Pose controls</li>
                  <li>✓ Expression controls</li>
                  <li>✓ Advanced AI editing</li>
                </ul>

                <button
                  class="tm-button primary full"
                  data-plan="Ultimate">
                  Upgrade
                </button>

              </article>

            </div>

          </div>

        </section>


        <!-- ==============================================
             ACCOUNT PAGE
        =============================================== -->

        <section
          id="tm-accountPage"
          class="tm-page">

          <div class="tm-account">

            <div class="tm-account-card">

              <div class="tm-account-icon">
                👤
              </div>

              <h1>
                Your Account
              </h1>

              <p>
                Sign in to sync your projects and manage your plan.
              </p>

              <button
                id="tmGoogleLogin"
                class="tm-google-button">
                <strong>G</strong>
                Continue with Google
              </button>

              <div class="tm-divider">
                <span>or</span>
              </div>

              <input
                id="tmEmail"
                type="email"
                placeholder="Email address">

              <input
                id="tmPassword"
                type="password"
                placeholder="Password">

              <button
                id="tmCreateAccount"
                class="tm-button primary full">
                Create Account
              </button>

              <button
                id="tmSignIn"
                class="tm-button full">
                Sign In
              </button>

              <div
                id="tmAccountStatus"
                class="tm-status">
                Not signed in
              </div>

            </div>


            <div class="tm-account-card">

              <h2>
                Subscription
              </h2>

              <div
                id="tmCurrentPlan">
                Free Plan
              </div>

              <button
                data-page="pricing"
                class="tm-button primary full">
                View Plans
              </button>

            </div>

          </div>

        </section>

      </main>


      <input
        id="tmFileInput"
        type="file"
        accept="image/*"
        hidden>

    `;

    document.body.prepend(root);

    connectNavigation();

    connectEditor();

    connectAccount();

    connectPricing();

    connectAI();

    connectInstall();

    initializeCanvas();

    draw();

    saveHistory();

  }


  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function connectNavigation() {

    document
      .querySelectorAll(
        "[data-page]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            showPage(
              button.dataset.page
            );

          }
        );

      });

  }


  function showPage(page) {

    APP.currentPage =
      page;

    document
      .querySelectorAll(
        ".tm-page"
      )
      .forEach(section => {

        section.classList.remove(
          "active"
        );

      });

    const target =
      document.getElementById(
        `tm-${page}Page`
      );

    if (target) {
      target.classList.add(
        "active"
      );
    }

    document
      .querySelectorAll(
        ".tm-nav"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.page === page
        );

      });

  }


  /* ==========================================================
     CANVAS
     ========================================================== */

  let canvas;
  let ctx;

  function initializeCanvas() {

    canvas =
      document.getElementById(
        "tmCanvas"
      );

    ctx =
      canvas.getContext(
        "2d"
      );

    canvas.addEventListener(
      "pointerdown",
      pointerDown
    );

    canvas.addEventListener(
      "pointermove",
      pointerMove
    );

    canvas.addEventListener(
      "pointerup",
      pointerUp
    );

    canvas.addEventListener(
      "pointercancel",
      pointerUp
    );

  }


  function pointerPosition(event) {

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX -
          rect.left) *
        (canvas.width /
          rect.width),

      y:
        (event.clientY -
          rect.top) *
        (canvas.height /
          rect.height)
    };

  }


  function pointerDown(event) {

    if (
      !APP.image ||
      (
        APP.mode !== "move" &&
        APP.mode !== "resize"
      )
    ) {
      return;
    }

    const point =
      pointerPosition(event);

    APP.dragging = true;

    APP.dragStart =
      point;

    APP.objectStart = {
      x: APP.imageX,
      y: APP.imageY,
      width: APP.imageWidth,
      height: APP.imageHeight
    };

    canvas.setPointerCapture(
      event.pointerId
    );

  }


  function pointerMove(event) {

    if (!APP.dragging) {
      return;
    }

    const point =
      pointerPosition(event);

    const dx =
      point.x -
      APP.dragStart.x;

    const dy =
      point.y -
      APP.dragStart.y;

    if (
      APP.mode === "move"
    ) {

      APP.imageX =
        APP.objectStart.x +
        dx;

      APP.imageY =
        APP.objectStart.y +
        dy;

    }

    if (
      APP.mode === "resize"
    ) {

      const amount =
        (dx + dy) / 2;

      APP.imageWidth =
        Math.max(
          30,
          APP.objectStart.width +
          amount
        );

      APP.imageHeight =
        Math.max(
          30,
          APP.objectStart.height +
          amount
        );

    }

    draw();

  }


  function pointerUp() {

    if (!APP.dragging) {
      return;
    }

    APP.dragging = false;

    saveHistory();

  }


  /* ==========================================================
     DRAW
     ========================================================== */

  function draw() {

    if (!ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle =
      APP.background;

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    if (APP.image) {

      ctx.save();

      ctx.translate(
        APP.imageX,
        APP.imageY
      );

      ctx.rotate(
        APP.rotation *
        Math.PI /
        180
      );

      ctx.globalAlpha =
        APP.opacity;

      ctx.filter =
        `
        brightness(${APP.effects.brightness}%)
        contrast(${APP.effects.contrast}%)
        saturate(${APP.effects.saturation}%)
        grayscale(${APP.effects.grayscale}%)
        sepia(${APP.effects.sepia}%)
        blur(${APP.effects.blur}px)
        `;

      const width =
        APP.imageWidth *
        APP.zoom;

      const height =
        APP.imageHeight *
        APP.zoom;

      ctx.drawImage(
        APP.image,
        -width / 2,
        -height / 2,
        width,
        height
      );

      ctx.restore();

    }


    APP.layers
      .filter(
        layer =>
          layer.type === "text"
      )
      .forEach(layer => {

        ctx.save();

        ctx.translate(
          layer.x,
          layer.y
        );

        ctx.rotate(
          layer.rotation *
          Math.PI /
          180
        );

        ctx.globalAlpha =
          layer.opacity;

        ctx.font =
          `${layer.weight} ${layer.size}px ${layer.font}`;

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        if (layer.shadow) {

          ctx.shadowColor =
            "rgba(0,0,0,.8)";

          ctx.shadowBlur = 8;

          ctx.shadowOffsetX = 3;

          ctx.shadowOffsetY = 3;

        }

        ctx.fillStyle =
          layer.color;

        ctx.fillText(
          layer.text,
          0,
          0
        );

        ctx.restore();

      });

  }


  /* ==========================================================
     EDITOR CONNECTIONS
     ========================================================== */

  function connectEditor() {

    const fileInput =
      document.getElementById(
        "tmFileInput"
      );

    document
      .querySelectorAll(
        ".tm-tool"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const tool =
              button.dataset.tool;

            if (
              tool === "upload"
            ) {

              fileInput.click();

              return;

            }

            setTool(
              tool
            );

          }
        );

      });


    fileInput.addEventListener(
      "change",
      event => {

        const file =
          event.target.files[0];

        if (file) {
          loadImage(file);
        }

        event.target.value = "";

      }
    );


    document
      .getElementById(
        "tmUploadEmpty"
      )
      .onclick = () =>
        fileInput.click();


    document
      .getElementById(
        "tmUndo"
      )
      .onclick = undo;


    document
      .getElementById(
        "tmRedo"
      )
      .onclick = redo;


    document
      .getElementById(
        "tmReset"
      )
      .onclick = reset;


    document
      .getElementById(
        "tmDownload"
      )
      .onclick = exportPNG;


    document
      .getElementById(
        "tmExportTop"
      )
      .onclick = exportPNG;


    connectSliders();

  }


  function setTool(tool) {

    APP.mode =
      tool;

    document
      .querySelectorAll(
        ".tm-tool"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.tool ===
          tool
        );

      });


    if (tool === "crop") {
      showCropPanel();
    }

    else if (tool === "text") {
      showTextPanel();
    }

    else if (tool === "effects") {
      showEffectsPanel();
    }

    else if (tool === "green") {
      showGreenPanel();
    }

    else if (tool === "background") {
      showBackgroundPanel();
    }

    else if (tool === "layers") {
      showLayersPanel();
    }

    else {
      showBasicPanel();
    }

  }


  /* ==========================================================
     IMAGE
     ========================================================== */

  function loadImage(file) {

    const reader =
      new FileReader();

    reader.onload = event => {

      const image =
        new Image();

      image.onload = () => {

        APP.image =
          image;

        APP.imageX =
          canvas.width / 2;

        APP.imageY =
          canvas.height / 2;

        const scale =
          Math.min(
            (canvas.width * .75) /
              image.width,

            (canvas.height * .75) /
              image.height
          );

        APP.imageWidth =
          image.width *
          scale;

        APP.imageHeight =
          image.height *
          scale;

        APP.zoom = 1;

        APP.rotation = 0;

        APP.opacity = 1;

        document
          .getElementById(
            "tmEmpty"
          )
          .classList.add(
            "hidden"
          );

        saveHistory();

        draw();

      };

      image.src =
        event.target.result;

    };

    reader.readAsDataURL(file);

  }


  /* ==========================================================
     BASIC PANEL
     ========================================================== */

  function showBasicPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            Image Controls
          </h3>

          <p>
            Use Move to position your image
            or Resize to change its size.
          </p>

          <label>
            Opacity
            <output id="tmOpacityValue">
              ${Math.round(
                APP.opacity * 100
              )}%
            </output>
          </label>

          <input
            id="tmOpacity"
            type="range"
            min="0"
            max="100"
            value="${APP.opacity * 100}">

          <label>
            Zoom
            <output id="tmZoomValue">
              ${Math.round(
                APP.zoom * 100
              )}%
            </output>
          </label>

          <input
            id="tmZoom"
            type="range"
            min="10"
            max="300"
            value="${APP.zoom * 100}">

          <label>
            Rotation
            <output id="tmRotationValue">
              ${APP.rotation}°
            </output>
          </label>

          <input
            id="tmRotation"
            type="range"
            min="-180"
            max="180"
            value="${APP.rotation}">

        </div>
      `;

    connectSliders();

  }


  function connectSliders() {

    const opacity =
      document.getElementById(
        "tmOpacity"
      );

    const zoom =
      document.getElementById(
        "tmZoom"
      );

    const rotation =
      document.getElementById(
        "tmRotation"
      );


    opacity?.addEventListener(
      "input",
      event => {

        APP.opacity =
          Number(
            event.target.value
          ) / 100;

        const output =
          document.getElementById(
            "tmOpacityValue"
          );

        if (output) {
          output.textContent =
            `${event.target.value}%`;
        }

        draw();

      }
    );


    opacity?.addEventListener(
      "change",
      saveHistory
    );


    zoom?.addEventListener(
      "input",
      event => {

        APP.zoom =
          Number(
            event.target.value
          ) / 100;

        const output =
          document.getElementById(
            "tmZoomValue"
          );

        if (output) {
          output.textContent =
            `${event.target.value}%`;
        }

        draw();

      }
    );


    zoom?.addEventListener(
      "change",
      saveHistory
    );


    rotation?.addEventListener(
      "input",
      event => {

        APP.rotation =
          Number(
            event.target.value
          );

        const output =
          document.getElementById(
            "tmRotationValue"
          );

        if (output) {
          output.textContent =
            `${event.target.value}°`;
        }

        draw();

      }
    );


    rotation?.addEventListener(
      "change",
      saveHistory
    );

  }


  /* ==========================================================
     CROP
     ========================================================== */

  function showCropPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            ✂️ Crop
          </h3>

          <p>
            Choose a canvas ratio.
          </p>

          <div class="tm-crop-grid">

            <button data-ratio="16:9">
              16:9
            </button>

            <button data-ratio="1:1">
              1:1
            </button>

            <button data-ratio="4:5">
              4:5
            </button>

            <button data-ratio="9:16">
              9:16
            </button>

            <button data-ratio="4:3">
              4:3
            </button>

            <button data-ratio="free">
              Free
            </button>

          </div>

          <button
            id="tmApplyCrop"
            class="tm-button primary full">
            Apply Crop
          </button>

        </div>
      `;


    document
      .querySelectorAll(
        "[data-ratio]"
      )
      .forEach(button => {

        button.onclick = () => {

          applyCropRatio(
            button.dataset.ratio
          );

        };

      });


    document
      .getElementById(
        "tmApplyCrop"
      )
      .onclick =
      applyCrop;

  }


  function applyCropRatio(ratio) {

    if (
      ratio === "free"
    ) {
      return;
    }

    const parts =
      ratio.split(":");

    const ratioValue =
      Number(parts[0]) /
      Number(parts[1]);

    let width =
      APP.canvasWidth ||
      canvas.width;

    let height =
      width /
      ratioValue;

    if (
      height >
      canvas.height
    ) {

      height =
        canvas.height;

      width =
        height *
        ratioValue;

    }

    APP.crop = {
      x:
        (canvas.width -
          width) / 2,

      y:
        (canvas.height -
          height) / 2,

      width,
      height
    };

    drawCropOverlay();

  }


  function drawCropOverlay() {

    draw();

    if (!APP.crop) {
      return;
    }

    ctx.save();

    ctx.fillStyle =
      "rgba(0,0,0,.55)";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.clearRect(
      APP.crop.x,
      APP.crop.y,
      APP.crop.width,
      APP.crop.height
    );

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth = 4;

    ctx.strokeRect(
      APP.crop.x,
      APP.crop.y,
      APP.crop.width,
      APP.crop.height
    );

    ctx.restore();

  }


  function applyCrop() {

    if (
      !APP.image ||
      !APP.crop
    ) {

      alert(
        "Choose a crop ratio first."
      );

      return;

    }


    const source =
      document.createElement(
        "canvas"
      );

    source.width =
      canvas.width;

    source.height =
      canvas.height;

    const sourceCtx =
      source.getContext("2d");

    drawToContext(
      sourceCtx,
      source
    );


    const result =
      document.createElement(
        "canvas"
      );

    result.width =
      Math.round(
        APP.crop.width
      );

    result.height =
      Math.round(
        APP.crop.height
      );


    const resultCtx =
      result.getContext("2d");

    resultCtx.drawImage(
      source,
      APP.crop.x,
      APP.crop.y,
      APP.crop.width,
      APP.crop.height,
      0,
      0,
      result.width,
      result.height
    );


    const image =
      new Image();

    image.onload = () => {

      APP.image =
        image;

      APP.imageWidth =
        result.width;

      APP.imageHeight =
        result.height;

      APP.imageX =
        canvas.width / 2;

      APP.imageY =
        canvas.height / 2;

      APP.zoom = 1;

      APP.crop = null;

      saveHistory();

      draw();

    };

    image.src =
      result.toDataURL(
        "image/png"
      );

  }


  /* ==========================================================
     TEXT
     ========================================================== */

  function showTextPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            📝 Text
          </h3>

          <input
            id="tmTextInput"
            placeholder="Enter text">

          <input
            id="tmTextSize"
            type="number"
            value="72"
            min="10"
            max="300">

          <input
            id="tmTextColor"
            type="color"
            value="#ffffff">

          <button
            id="tmAddText"
            class="tm-button primary full">
            Add Text
          </button>

        </div>
      `;


    document
      .getElementById(
        "tmAddText"
      )
      .onclick = () => {

        const value =
          document
            .getElementById(
              "tmTextInput"
            )
            .value
            .trim();

        if (!value) {
          return;
        }

        APP.layers.push({

          type: "text",

          text: value,

          x:
            canvas.width / 2,

          y:
            canvas.height / 2,

          size:
            Number(
              document
                .getElementById(
                  "tmTextSize"
                )
                .value
            ),

          color:
            document
              .getElementById(
                "tmTextColor"
              )
              .value,

          weight:
            "700",

          font:
            "Arial",

          opacity: 1,

          rotation: 0,

          shadow: true

        });

        saveHistory();

        draw();

        showLayersPanel();

      };

  }


  /* ==========================================================
     EFFECTS
     ========================================================== */

  function showEffectsPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            🎨 Effects
          </h3>

          ${effectSlider(
            "brightness",
            "Brightness",
            0,
            200,
            APP.effects.brightness
          )}

          ${effectSlider(
            "contrast",
            "Contrast",
            0,
            200,
            APP.effects.contrast
          )}

          ${effectSlider(
            "saturation",
            "Saturation",
            0,
            200,
            APP.effects.saturation
          )}

          ${effectSlider(
            "grayscale",
            "Grayscale",
            0,
            100,
            APP.effects.grayscale
          )}

          ${effectSlider(
            "sepia",
            "Sepia",
            0,
            100,
            APP.effects.sepia
          )}

          ${effectSlider(
            "blur",
            "Blur",
            0,
            20,
            APP.effects.blur
          )}

          <button
            id="tmResetEffects"
            class="tm-button full">
            Reset Effects
          </button>

        </div>
      `;


    [
      "brightness",
      "contrast",
      "saturation",
      "grayscale",
      "sepia",
      "blur"
    ].forEach(property => {

      const input =
        document.getElementById(
          `tm-effect-${property}`
        );

      input?.addEventListener(
        "input",
        event => {

          APP.effects[property] =
            Number(
              event.target.value
            );

          draw();

        }
      );

      input?.addEventListener(
        "change",
        saveHistory
      );

    });


    document
      .getElementById(
        "tmResetEffects"
      )
      .onclick = () => {

        APP.effects = {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          sepia: 0,
          blur: 0
        };

        saveHistory();

        showEffectsPanel();

        draw();

      };

  }


  function effectSlider(
    property,
    label,
    min,
    max,
    value
  ) {

    return `

      <label>

        ${label}

        <output>
          ${value}
        </output>

      </label>

      <input
        id="tm-effect-${property}"
        type="range"
        min="${min}"
        max="${max}"
        value="${value}">

    `;

  }


  /* ==========================================================
     GREEN SCREEN
     ========================================================== */

  function showGreenPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            🟢 Green Screen
          </h3>

          <p>
            Remove green pixels from the image.
          </p>

          <input
            id="tmGreenTolerance"
            type="range"
            min="20"
            max="180"
            value="80">

          <button
            id="tmRemoveGreen"
            class="tm-button primary full">
            Remove Green
          </button>

        </div>
      `;


    document
      .getElementById(
        "tmRemoveGreen"
      )
      .onclick =
      removeGreen;

  }


  function removeGreen() {

    if (!APP.image) {

      alert(
        "Upload an image first."
      );

      return;

    }


    const temp =
      document.createElement(
        "canvas"
      );

    temp.width =
      APP.image.naturalWidth ||
      APP.image.width;

    temp.height =
      APP.image.naturalHeight ||
      APP.image.height;

    const tempCtx =
      temp.getContext(
        "2d",
        {
          willReadFrequently: true
        }
      );

    tempCtx.drawImage(
      APP.image,
      0,
      0
    );


    const imageData =
      tempCtx.getImageData(
        0,
        0,
        temp.width,
        temp.height
      );

    const data =
      imageData.data;


    const tolerance =
      Number(
        document
          .getElementById(
            "tmGreenTolerance"
          )
          .value
      );


    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      const r =
        data[i];

      const g =
        data[i + 1];

      const b =
        data[i + 2];


      if (
        g > r * 1.25 &&
        g > b * 1.15 &&
        g > tolerance
      ) {

        data[i + 3] = 0;

      }

    }


    tempCtx.putImageData(
      imageData,
      0,
      0
    );


    const image =
      new Image();

    image.onload = () => {

      APP.image =
        image;

      saveHistory();

      draw();

    };

    image.src =
      temp.toDataURL(
        "image/png"
      );

  }


  /* ==========================================================
     BACKGROUND
     ========================================================== */

  function showBackgroundPanel() {

    document
      .getElementById(
        "tmToolPanel"
      )
      .innerHTML = `

        <div class="tm-panel-card">

          <h3>
            Background
          </h3>

          <label>
            Color
          </label>

          <input
            id="tmBackgroundColor"
            type="color"
            value="${APP.background}">

          <button
            id="tmTransparent"
            class="tm-button full">
            Transparent
          </button>

        </div>
      `;


    document
      .getElementById(
        "tmBackgroundColor"
      )
      .oninput = event => {

        APP.background =
          event.target.value;

        draw();

      };


    document
      .getElementById(
        "tmTransparent"
      )
      .onclick = () => {

        APP.background =
          "transparent";

        draw();

      };

  }


  /* ==========================================================
     LAYERS
     ========================================================== */

  function showLayersPanel() {

    const panel =
      document.getElementById(
        "tmToolPanel"
      );

    panel.innerHTML = `

      <div class="tm-panel-card">

        <h3>
          📚 Layers
        </h3>

        <div
          id="tmLayerList"
          class="tm-layer-list">
        </div>

      </div>
    `;


    const list =
      document.getElementById(
        "tmLayerList"
      );


    APP.layers.forEach(
      (layer, index) => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "tm-layer-item";

        item.innerHTML = `

          <span>
            ${layer.type === "text"
              ? "📝"
              : "🖼️"}

            ${layer.type === "text"
              ? escapeHTML(
                  layer.text
                )
              : "Image"}
          </span>

          <button>
            Delete
          </button>
        `;


        item
          .querySelector(
            "button"
          )
          .onclick = () => {

            APP.layers.splice(
              index,
              1
            );

            saveHistory();

            showLayersPanel();

            draw();

          };


        list.appendChild(
          item
        );

      }
    );

  }


  /* ==========================================================
     HISTORY
     ========================================================== */

  function makeSnapshot() {

    return JSON.stringify({

      imageX:
        APP.imageX,

      imageY:
        APP.imageY,

      imageWidth:
        APP.imageWidth,

      imageHeight:
        APP.imageHeight,

      rotation:
        APP.rotation,

      zoom:
        APP.zoom,

      opacity:
        APP.opacity,

      background:
        APP.background,

      effects:
        APP.effects,

      layers:
        APP.layers

    });

  }


  function saveHistory() {

    const snapshot =
      makeSnapshot();

    APP.history =
      APP.history.slice(
        0,
        APP.historyPosition + 1
      );

    APP.history.push(
      snapshot
    );

    if (
      APP.history.length > 50
    ) {

      APP.history.shift();

    }

    APP.historyPosition =
      APP.history.length - 1;

  }


  function restoreSnapshot(
    snapshot
  ) {

    const data =
      JSON.parse(snapshot);

    APP.imageX =
      data.imageX;

    APP.imageY =
      data.imageY;

    APP.imageWidth =
      data.imageWidth;

    APP.imageHeight =
      data.imageHeight;

    APP.rotation =
      data.rotation;

    APP.zoom =
      data.zoom;

    APP.opacity =
      data.opacity;

    APP.background =
      data.background;

    APP.effects =
      data.effects;

    APP.layers =
      data.layers || [];

    draw();

  }


  function undo() {

    if (
      APP.historyPosition <= 0
    ) {
      return;
    }

    APP.historyPosition--;

    restoreSnapshot(
      APP.history[
        APP.historyPosition
      ]
    );

  }


  function redo() {

    if (
      APP.historyPosition >=
      APP.history.length - 1
    ) {
      return;
    }

    APP.historyPosition++;

    restoreSnapshot(
      APP.history[
        APP.historyPosition
      ]
    );

  }


  /* ==========================================================
     RESET
     ========================================================== */

  function reset() {

    APP.image = null;

    APP.imageX = 640;
    APP.imageY = 360;

    APP.imageWidth = 600;
    APP.imageHeight = 600;

    APP.rotation = 0;

    APP.zoom = 1;

    APP.opacity = 1;

    APP.layers = [];

    APP.effects = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0
    };

    document
      .getElementById(
        "tmEmpty"
      )
      .classList.remove(
        "hidden"
      );

    saveHistory();

    draw();

  }


  /* ==========================================================
     DRAW FOR EXPORT / CROP
     ========================================================== */

  function drawToContext(
    targetCtx,
    targetCanvas
  ) {

    targetCtx.clearRect(
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );

    if (
      APP.background !==
      "transparent"
    ) {

      targetCtx.fillStyle =
        APP.background;

      targetCtx.fillRect(
        0,
        0,
        targetCanvas.width,
        targetCanvas.height
      );

    }


    if (APP.image) {

      targetCtx.save();

      targetCtx.translate(
        APP.imageX,
        APP.imageY
      );

      targetCtx.rotate(
        APP.rotation *
        Math.PI /
        180
      );

      targetCtx.globalAlpha =
        APP.opacity;

      targetCtx.filter =
        `
        brightness(${APP.effects.brightness}%)
        contrast(${APP.effects.contrast}%)
        saturate(${APP.effects.saturation}%)
        grayscale(${APP.effects.grayscale}%)
        sepia(${APP.effects.sepia}%)
        blur(${APP.effects.blur}px)
        `;

      const width =
        APP.imageWidth *
        APP.zoom;

      const height =
        APP.imageHeight *
        APP.zoom;

      targetCtx.drawImage(
        APP.image,
        -width / 2,
        -height / 2,
        width,
        height
      );

      targetCtx.restore();

    }


    APP.layers
      .filter(
        layer =>
          layer.type === "text"
      )
      .forEach(layer => {

        targetCtx.save();

        targetCtx.translate(
          layer.x,
          layer.y
        );

        targetCtx.rotate(
          layer.rotation *
          Math.PI /
          180
        );

        targetCtx.globalAlpha =
          layer.opacity;

        targetCtx.font =
          `${layer.weight} ${layer.size}px ${layer.font}`;

        targetCtx.textAlign =
          "center";

        targetCtx.textBaseline =
          "middle";

        targetCtx.fillStyle =
          layer.color;

        targetCtx.fillText(
          layer.text,
          0,
          0
        );

        targetCtx.restore();

      });

  }


  /* ==========================================================
     EXPORT
     ========================================================== */

  function exportPNG() {

    const output =
      document.createElement(
        "canvas"
      );

    output.width =
      canvas.width;

    output.height =
      canvas.height;

    const outputCtx =
      output.getContext(
        "2d"
      );

    drawToContext(
      outputCtx,
      output
    );


    const link =
      document.createElement(
        "a"
      );

    link.download =
      "thumbnail-maker.png";

    link.href =
      output.toDataURL(
        "image/png"
      );

    link.click();

  }


  /* ==========================================================
     AI STUDIO
     ========================================================== */

  function connectAI() {

    document
      .querySelectorAll(
        "[data-ai-action]"
      )
      .forEach(button => {

        button.onclick = () => {

          const action =
            button.dataset.aiAction;

          const prompt =
            document.getElementById(
              "tmAIPrompt"
            );

          const additions = {

            pose:
              " Change the character's pose naturally.",

            expression:
              " Change the character's facial expression.",

            background:
              " Replace the background.",

            lighting:
              " Improve the lighting.",

            style:
              " Apply the requested visual style.",

            character:
              " Edit the character while preserving identity."

          };

          prompt.value +=
            additions[action] ||
            "";

        };

      });


    document
      .getElementById(
        "tmAIGenerate"
      )
      .onclick = () => {

        const status =
          document.getElementById(
            "tmAIStatus"
          );

        status.textContent =
          "AI provider connection is required for generation.";

      };

  }


  /* ==========================================================
     ACCOUNT
     ========================================================== */

  function connectAccount() {

    document
      .getElementById(
        "tmGoogleLogin"
      )
      .onclick = () => {

        setAccountStatus(
          "Google authentication is ready for secure provider connection."
        );

      };


    document
      .getElementById(
        "tmCreateAccount"
      )
      .onclick = () => {

        setAccountStatus(
          "Account creation requires the secure authentication backend."
        );

      };


    document
      .getElementById(
        "tmSignIn"
      )
      .onclick = () => {

        setAccountStatus(
          "Sign-in requires the secure authentication backend."
        );

      };

  }


  function setAccountStatus(
    message
  ) {

    const status =
      document.getElementById(
        "tmAccountStatus"
      );

    if (status) {
      status.textContent =
        message;
    }

  }


  /* ==========================================================
     PRICING
     ========================================================== */

  function connectPricing() {

    document
      .querySelectorAll(
        "[data-plan]"
      )
      .forEach(button => {

        button.onclick = () => {

          const plan =
            button.dataset.plan;

          showPage(
            "account"
          );

          setAccountStatus(
            `${plan} selected. Secure payment connection is required to activate the subscription.`
          );

        };

      });

  }


  /* ==========================================================
     PWA INSTALL
     ========================================================== */

  function connectInstall() {

    window.addEventListener(
      "beforeinstallprompt",
      event => {

        event.preventDefault();

        APP.installPrompt =
          event;

        const button =
          document.getElementById(
            "tmInstall"
          );

        button.classList.remove(
          "hidden"
        );

      }
    );


    document
      .getElementById(
        "tmInstall"
      )
      .onclick = async () => {

        if (
          !APP.installPrompt
        ) {

          alert(
            "Install is available when this site is served as a supported PWA."
          );

          return;

        }

        APP.installPrompt.prompt();

        await APP.installPrompt.userChoice;

        APP.installPrompt =
          null;

      };


    /*
     * Automatically register sw.js if it exists.
     */

    if (
      "serviceWorker" in navigator
    ) {

      window.addEventListener(
        "load",
        () => {

          navigator.serviceWorker
            .register("sw.js")
            .catch(
              () => {
                /*
                 * Offline support is optional.
                 */
              }
            );

        }
      );

    }

  }


  /* ==========================================================
     KEYBOARD SHORTCUTS
     ========================================================== */

  function connectKeyboard() {

    document.addEventListener(
      "keydown",
      event => {

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() === "z"
        ) {

          event.preventDefault();

          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }

        }


        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() === "y"
        ) {

          event.preventDefault();

          redo();

        }


        if (
          event.key === "Delete"
        ) {

          /*
           * Delete selected text layer.
           */

          if (
            APP.selectedLayer >= 0
          ) {

            APP.layers.splice(
              APP.selectedLayer,
              1
            );

            APP.selectedLayer =
              -1;

            saveHistory();

            draw();

          }

        }

      }
    );

  }


  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  function initialize() {

    loadStylesheet();

    buildApplication();

    connectKeyboard();

    console.log(
      `Thumbnail Maker ${APP.version} loaded.`
    );

  }


  /*
   * Start after DOM is ready.
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }

})();
