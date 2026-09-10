/**
 * Digital Signature Pad Component
 * Allows drawing signature with mouse or touch, or uploading an image
 */

export class SignaturePad {
  constructor(containerId, onSaveCallback) {
    this.container = document.getElementById(containerId);
    this.onSave = onSaveCallback;
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.hasDrawn = false;
  }

  init() {
    if (!this.container) return;
    this.render();
    this.setupCanvas();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 hidden" id="sigModal">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Add Digital Signature</h3>
              <p class="text-xs text-gray-500">Draw with your mouse/touchscreen or upload a signature image</p>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors" id="sigCloseBtn">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <!-- Tabs -->
            <div class="flex border-b border-gray-200">
              <button type="button" class="py-2 px-4 text-xs font-semibold border-b-2 border-indigo-600 text-indigo-600 transition-all" id="sigTabDraw">
                Draw Signature
              </button>
              <button type="button" class="py-2 px-4 text-xs font-medium text-gray-500 hover:text-gray-700 transition-all" id="sigTabUpload">
                Upload Image
              </button>
            </div>

            <!-- Draw Panel -->
            <div id="sigDrawPanel" class="space-y-3">
              <div class="border-2 border-dashed border-gray-300 rounded-xl bg-slate-50 relative overflow-hidden flex items-center justify-center">
                <canvas id="sigCanvas" width="460" height="180" class="cursor-crosshair touch-none w-full h-44 bg-white"></canvas>
                <div class="absolute bottom-2 left-3 text-[11px] text-gray-400 pointer-events-none select-none">
                  Sign above this line
                </div>
              </div>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>Use mouse or finger to draw your signature</span>
                <button type="button" class="text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors" id="sigClearBtn">
                  Clear Pad
                </button>
              </div>
            </div>

            <!-- Upload Panel -->
            <div id="sigUploadPanel" class="space-y-3 hidden">
              <div class="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50 transition-colors cursor-pointer" id="sigDropZone">
                <i data-lucide="upload-cloud" class="w-10 h-10 text-gray-400 mx-auto mb-2"></i>
                <div class="text-sm font-medium text-gray-700">Click to upload signature</div>
                <div class="text-xs text-gray-400 mt-1">PNG, JPG, or SVG (Transparent PNG recommended)</div>
                <input type="file" id="sigFileInput" accept="image/*" class="hidden" />
              </div>
              <div id="sigUploadPreview" class="hidden text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <img id="sigPreviewImg" src="" alt="Preview" class="max-h-20 max-w-full mx-auto object-contain" />
              </div>
            </div>

            <!-- Signatory Name Input -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Signatory Name / Designation</label>
              <input type="text" id="sigNameInput" placeholder="e.g. John Doe, Managing Director" class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" class="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" id="sigCancelBtn">
              Cancel
            </button>
            <button type="button" class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors" id="sigApplyBtn">
              Apply Signature
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  setupCanvas() {
    this.canvas = document.getElementById('sigCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.strokeStyle = '#1E293B';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  bindEvents() {
    const modal = document.getElementById('sigModal');
    const closeBtn = document.getElementById('sigCloseBtn');
    const cancelBtn = document.getElementById('sigCancelBtn');
    const clearBtn = document.getElementById('sigClearBtn');
    const applyBtn = document.getElementById('sigApplyBtn');
    const tabDraw = document.getElementById('sigTabDraw');
    const tabUpload = document.getElementById('sigTabUpload');
    const drawPanel = document.getElementById('sigDrawPanel');
    const uploadPanel = document.getElementById('sigUploadPanel');
    const dropZone = document.getElementById('sigDropZone');
    const fileInput = document.getElementById('sigFileInput');
    const previewImg = document.getElementById('sigPreviewImg');
    const uploadPreview = document.getElementById('sigUploadPreview');
    const nameInput = document.getElementById('sigNameInput');

    let uploadedDataUrl = '';

    const closeModal = () => modal.classList.add('hidden');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    // Tabs switch
    if (tabDraw && tabUpload) {
      tabDraw.onclick = () => {
        tabDraw.className = 'py-2 px-4 text-xs font-semibold border-b-2 border-indigo-600 text-indigo-600 transition-all';
        tabUpload.className = 'py-2 px-4 text-xs font-medium text-gray-500 hover:text-gray-700 transition-all';
        drawPanel.classList.remove('hidden');
        uploadPanel.classList.add('hidden');
      };
      tabUpload.onclick = () => {
        tabUpload.className = 'py-2 px-4 text-xs font-semibold border-b-2 border-indigo-600 text-indigo-600 transition-all';
        tabDraw.className = 'py-2 px-4 text-xs font-medium text-gray-500 hover:text-gray-700 transition-all';
        drawPanel.classList.add('hidden');
        uploadPanel.classList.remove('hidden');
      };
    }

    // Clear Canvas
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
      };
    }

    // Canvas drawing coordinates
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      this.isDrawing = true;
      const pos = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.hasDrawn = true;
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', startDraw);
      this.canvas.addEventListener('mousemove', draw);
      this.canvas.addEventListener('mouseup', stopDraw);
      this.canvas.addEventListener('mouseleave', stopDraw);

      this.canvas.addEventListener('touchstart', startDraw, { passive: false });
      this.canvas.addEventListener('touchmove', draw, { passive: false });
      this.canvas.addEventListener('touchend', stopDraw);
    }

    // File upload
    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            uploadedDataUrl = re.target.result;
            previewImg.src = uploadedDataUrl;
            uploadPreview.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // Apply
    if (applyBtn) {
      applyBtn.onclick = () => {
        let finalSig = '';
        if (!drawPanel.classList.contains('hidden')) {
          if (this.hasDrawn) {
            finalSig = this.canvas.toDataURL('image/png');
          }
        } else {
          finalSig = uploadedDataUrl;
        }

        const sigName = nameInput ? nameInput.value.trim() : '';
        if (this.onSave) {
          this.onSave(finalSig, sigName);
        }
        closeModal();
      };
    }
  }

  open(currentSig = '', currentName = '') {
    const modal = document.getElementById('sigModal');
    const nameInput = document.getElementById('sigNameInput');
    if (nameInput) nameInput.value = currentName;
    if (modal) modal.classList.remove('hidden');
  }
}
