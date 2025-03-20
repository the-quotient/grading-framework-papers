export class Model {
  constructor() {
    this.data = [];
  }

  setData(rows) {
    this.data = rows.filter((row) => Object.keys(row).length > 0);
  }

  computeAverage() {
    let sum = 0,
      count = 0;
    // Gather values from slider inputs
    const sliderInputs = document.querySelectorAll(".slider-input");
    sliderInputs.forEach((input) => {
      sum += parseInt(input.value, 10);
      count++;
    });
    // Gather values from box group labels
    const boxgroupLabels = document.querySelectorAll(".boxgroup-label");
    boxgroupLabels.forEach((label) => {
      sum += parseInt(label.textContent, 10);
      count++;
    });
    return count ? Math.round(sum / count) : 0;
  }
}
