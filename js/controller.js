import { Model } from "./model.js";
import { View } from "./view.js";

export class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.init();
  }

  init() {
    this.view.renderTable(this.model.data);
    this.view.updateAverage();

    document
      .getElementById("saveButton")
      .addEventListener("click", () => this.handleSave());

    document
      .getElementById("loadButton")
      .addEventListener("click", () =>
        document.getElementById("loadState").click()
      );

    document
      .getElementById("loadState")
      .addEventListener("change", (evt) => this.handleLoad(evt));

    document
      .querySelector("table tbody")
      .addEventListener("input", (evt) => {
        if (evt.target.matches(".slider-input")) {
          this.view.updateAverage();
        }
      });

    document
      .querySelector("table tbody")
      .addEventListener("click", (evt) => {
        if (evt.target.matches(".plus-btn") ||
            evt.target.matches(".minus-btn")) {
          const delta = evt.target.matches(".plus-btn") ? 1 : -1;
          this.view.adjustBoxValue(evt.target.closest("tr"), delta);
          this.view.updateAverage();
        }
      });
  }

  collectState() {
    const name =
      document.querySelector(".name-input")?.value.trim() || "";

    const sliders = Array.from(
      document.querySelectorAll(".slider-input")
    ).map(input => {
      const tr = input.closest("tr");
      return {
        id:      input.id,
        value:   Number(input.value),
        comment: tr
          .querySelector(".comment-input")
          ?.value.trim() || ""
      };
    });

    const feedback = document
      .querySelector(".feedback-container textarea")
      ?.value.trim() || "";

    const total = sliders.reduce((sum, s) => sum + s.value, 0);

    return { name, sliders, feedback, total };
  }

  async handleSave() {
    const data = this.collectState();

    const out = document.getElementById("output");
    if (out) {
      out.value = JSON.stringify(data, null, 2);
    }

    try {
      const resp = await fetch("/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const result = await resp.json();
      if (result.status === "ok") {
        this.view.showMessage(`Saved to ${result.path}`);
      } else {
        this.view.showError(`Save failed: ${result.path}`);
      }
    } catch (err) {
      this.view.showError(err.message);
    }
  }
}

const app = new Controller(new Model(), new View());

