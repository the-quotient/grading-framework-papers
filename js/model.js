export class Model {
  constructor() {
    this.data = [];
  }

  setData(rows) {
    this.data = rows.filter((row) => Object.keys(row).length > 0);
  }

  computeAverage() {
    let sum = 0, count = 0;
    // Gather values from slider inputs.
    const sliderInputs = document.querySelectorAll(".slider-input");
    sliderInputs.forEach((input) => {
      const value = Number(input.value);
      if (!isNaN(value)) {
        sum += value;
        count++;
      }
    });
    // Gather values from box group labels.
    const boxgroupLabels = document.querySelectorAll(".boxgroup-label");
    boxgroupLabels.forEach((label) => {
      const value = Number(label.textContent);
      if (!isNaN(value)) {
        sum += value;
        count++;
      }
    });
    return count ? Math.round(sum / count) : 0;
  }
}
