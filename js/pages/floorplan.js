/**
 * 智家清单 - 户型图上传与标注
 */
const FloorPlanPage = {
  handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      store.saveFloorplanImage(imageData);

      const userAnswers = store.getQuizResult() || {};
      const recommendation = store.getRecommendation();
      if (userAnswers.rooms && recommendation && recommendation.bundles) {
        this.renderCanvas(imageData, userAnswers.rooms, recommendation.bundles);
      } else {
        this.renderCanvas(imageData, { bedrooms: 3, livingRooms: 1, kitchens: 1, bathrooms: 1 }, []);
      }
    };
    reader.readAsDataURL(file);
  },

  renderCanvas(imageData, rooms, bundles) {
    const container = document.getElementById('floorplan-body');
    const legend = document.getElementById('floorplan-legend');
    if (!container) return;

    container.innerHTML = `<canvas id="floorplan-canvas" class="floorplan-canvas"></canvas>`;
    if (legend) legend.style.display = 'flex';

    const canvas = document.getElementById('floorplan-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxW = container.clientWidth || 360;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw annotations
      this._drawAnnotations(ctx, canvas.width, canvas.height, rooms, bundles);
    };
    img.src = imageData;
  },

  _drawAnnotations(ctx, w, h, rooms, bundles) {
    const annotations = this._calculateAnnotations(w, h, rooms, bundles);

    annotations.forEach(ann => {
      // Draw circle
      ctx.beginPath();
      ctx.arc(ann.x, ann.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = ann.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ann.label, ann.x, ann.y);

      // Draw tooltip on hover handled via canvas event
    });

    // Add click handler
    const canvas = document.getElementById('floorplan-canvas');
    if (canvas) {
      canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        for (const ann of annotations) {
          const dx = x - ann.x;
          const dy = y - ann.y;
          if (dx * dx + dy * dy <= 144) {
            App.showToast(`${ann.productName}: ${ann.desc}`);
            break;
          }
        }
      };
    }
  },

  _calculateAnnotations(w, h, rooms, bundles) {
    const anns = [];
    const r = {
      bedrooms: rooms.bedrooms || 3,
      livingRooms: rooms.livingRooms || 1,
      kitchens: rooms.kitchens || 1,
      bathrooms: rooms.bathrooms || 1
    };

    // Layout regions
    const regions = {
      living: { x: w * 0.5, y: h * 0.5, label: '客厅' },
      bedroom1: { x: w * 0.2, y: h * 0.25, label: '卧室1' },
      bedroom2: { x: w * 0.8, y: h * 0.25, label: '卧室2' },
      bedroom3: { x: w * 0.2, y: h * 0.75, label: '卧室3' },
      kitchen: { x: w * 0.8, y: h * 0.75, label: '厨房' },
      bathroom1: { x: w * 0.1, y: h * 0.5, label: '卫生间' },
      entrance: { x: w * 0.5, y: h * 0.85, label: '玄关' }
    };

    // Gateway - living room center (red)
    anns.push({
      x: regions.living.x,
      y: regions.living.y,
      color: '#ef4444',
      label: 'G',
      productName: '网关',
      desc: '放在客厅中央高处，远离金属遮挡'
    });

    // Lights/Switches - each room (yellow)
    const roomList = [];
    for (let i = 0; i < r.livingRooms; i++) roomList.push({ ...regions.living, name: '客厅' });
    for (let i = 0; i < r.bedrooms; i++) {
      const key = `bedroom${Math.min(i + 1, 3)}`;
      if (regions[key]) roomList.push({ ...regions[key], name: `卧室${i + 1}` });
    }
    for (let i = 0; i < r.kitchens; i++) roomList.push({ ...regions.kitchen, name: '厨房' });

    roomList.forEach((room, idx) => {
      anns.push({
        x: room.x + 20 + (idx % 2) * 15,
        y: room.y - 10 + (idx % 3) * 10,
        color: '#f59e0b',
        label: 'L',
        productName: '智能灯/开关',
        desc: `${room.name} - 智能灯光控制`
      });
    });

    // Sensors - door/window positions (blue)
    const sensorRooms = [];
    for (let i = 0; i < r.bedrooms; i++) {
      const key = `bedroom${Math.min(i + 1, 3)}`;
      if (regions[key]) sensorRooms.push({ ...regions[key], name: `卧室${i + 1}` });
    }
    for (let i = 0; i < r.livingRooms; i++) sensorRooms.push({ ...regions.living, name: '客厅' });
    for (let i = 0; i < r.bathrooms; i++) {
      if (regions.bathroom1) sensorRooms.push({ ...regions.bathroom1, name: `卫生间${i + 1}` });
    }

    sensorRooms.forEach((room, idx) => {
      anns.push({
        x: room.x - 20 - (idx % 2) * 10,
        y: room.y + 10 + (idx % 3) * 8,
        color: '#3b82f6',
        label: 'S',
        productName: '传感器',
        desc: `${room.name} - 人体/门窗传感器`
      });
    });

    // Cameras - living/entrance (green)
    if (r.livingRooms > 0) {
      anns.push({
        x: regions.entrance.x,
        y: regions.entrance.y,
        color: '#10b981',
        label: 'C',
        productName: '摄像头',
        desc: '玄关/客厅 - 安装高度2-3米，俯视角度30-60度'
      });
    }

    return anns;
  }
};
