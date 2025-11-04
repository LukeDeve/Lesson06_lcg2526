let droneAlfa, droneBravo, droneCharlie;
let menuVisualizzazione;
let selectedTime = null; // istante selezionato cliccando
let visualizzazioni = ["Posizione generale", "Asse X", "Asse Y", "Asse Z", "Velocità XY"];

function preload() {
  droneAlfa = loadTable('drone_alfa_data.csv', 'csv', 'header');
  droneBravo = loadTable('drone_bravo_data.csv', 'csv', 'header');
  droneCharlie = loadTable('drone_charlie_data.csv', 'csv', 'header');
}

function setup() {
  createCanvas(900, 600);
  textSize(14);

  // menu a discesa per cambiare visualizzazione
  menuVisualizzazione = createSelect();
  menuVisualizzazione.position(20, 20);
  visualizzazioni.forEach(v => menuVisualizzazione.option(v));
  menuVisualizzazione.selected("Posizione generale");
}

function draw() {
  background(245);
  let tipo = menuVisualizzazione.value();

  // Margini e assi
  let marginLeft = 60;
  let marginRight = 40;
  let top = 80;
  let bottom = height - 60;

  stroke(0);
  line(marginLeft, top, marginLeft, bottom);
  line(marginLeft, bottom, width - marginRight, bottom);
  noStroke();
  textAlign(CENTER);
  text("Tempo", width / 2, height - 30);

  // Estremi temporali
  let allTimes = [].concat(
    droneAlfa.getColumn('timestamp'),
    droneBravo.getColumn('timestamp'),
    droneCharlie.getColumn('timestamp')
  ).map(Number);
  let minTime = min(allTimes);
  let maxTime = max(allTimes);

  // Funzione per ottenere il valore giusto in base alla visualizzazione
  function getValue(drone, i) {
    if (tipo === "Asse X") return drone.getNum(i, 'x_pos');
    if (tipo === "Asse Y") return drone.getNum(i, 'y_pos');
    if (tipo === "Asse Z") return drone.getNum(i, 'z_pos');
    if (tipo === "Velocità XY") {
      let vx = drone.getNum(i, 'x_vel');
      let vy = drone.getNum(i, 'y_vel');
      return Math.sqrt(vx ** 2 + vy ** 2);
    }
    // Posizione generale = distanza dal punto di origine
    let x = drone.getNum(i, 'x_pos');
    let y = drone.getNum(i, 'y_pos');
    let z = drone.getNum(i, 'z_pos');
    return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  }

  // Disegna traiettorie
  let drones = [
    { data: droneAlfa, col: color(255, 0, 0), name: "Alfa" },
    { data: droneBravo, col: color(0, 0, 255), name: "Bravo" },
    { data: droneCharlie, col: color(0, 200, 0), name: "Charlie" }
  ];

  // calcolo min/max valori
  let allVals = [];
  drones.forEach(d => {
    for (let i = 0; i < d.data.getRowCount(); i++) allVals.push(getValue(d.data, i));
  });
  let minVal = min(allVals);
  let maxVal = max(allVals);

  // Disegno linee
  for (let d of drones) {
    stroke(d.col);
    noFill();
    beginShape();
    for (let i = 0; i < d.data.getRowCount(); i++) {
      let t = d.data.getNum(i, 'timestamp');
      let val = getValue(d.data, i);
      let px = map(t, minTime, maxTime, marginLeft, width - marginRight);
      let py = map(val, minVal, maxVal, bottom, top);
      vertex(px, py);
    }
    endShape();

    // Punto iniziale verde
    fill(0, 255, 0);
    ellipse(
      map(d.data.getNum(0, 'timestamp'), minTime, maxTime, marginLeft, width - marginRight),
      map(getValue(d.data, 0), minVal, maxVal, bottom, top),
      8, 8
    );
    // Punto finale blu
    fill(0, 0, 255);
    let last = d.data.getRowCount() - 1;
    ellipse(
      map(d.data.getNum(last, 'timestamp'), minTime, maxTime, marginLeft, width - marginRight),
      map(getValue(d.data, last), minVal, maxVal, bottom, top),
      8, 8
    );
  }

  // Linea di selezione temporale
  if (selectedTime !== null) {
    let xSel = map(selectedTime, minTime, maxTime, marginLeft, width - marginRight);
    stroke(0, 150);
    line(xSel, top, xSel, bottom);
    noStroke();
    fill(0);
    textAlign(LEFT);
    text(`Tempo: ${selectedTime.toFixed(2)}`, xSel + 10, top + 10);

    // Mostra valori dei droni a quell’istante
    let yLabel = top + 30;
    drones.forEach(d => {
      let tCol = d.data.getColumn('timestamp').map(Number);
      let idx = tCol.findIndex(t => t >= selectedTime);
      if (idx >= 0) {
        let val = getValue(d.data, idx).toFixed(2);
        fill(d.col);
        text(`${d.name}: ${val}`, xSel + 10, yLabel);
        yLabel += 18;
      }
    });
  }
}

function mouseOverUI() {
  let elements = [mySelect, applyButton, clearButton, checkbox_alfa, checkbox_bravo];
  for (let el of elements) {
    if (!el || !el.elt) continue;
    let rect = el.elt.getBoundingClientRect();
    // Controlla se il mouse è sopra l'elemento
    if (
      mouseX >= rect.left - canvas.elt.getBoundingClientRect().left &&
      mouseX <= rect.right - canvas.elt.getBoundingClientRect().left &&
      mouseY >= rect.top - canvas.elt.getBoundingClientRect().top &&
      mouseY <= rect.bottom - canvas.elt.getBoundingClientRect().top
    ) {
      return true;
    }
  }
  return false;
}