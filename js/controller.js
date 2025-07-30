import { Model } from "./model.js";
import { View } from "./view.js";

export class Controller {
  constructor(model, view) {
    this.model = model;
    window.appModel = model;
    this.view = view;
    this.init();
  }

  async init() {
    // 1) load descriptions that drive sliders/boxes
    try {
      const resp = await fetch("data/descriptions.json");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const rows = await resp.json();
      this.model.setData(rows);
    } catch (err) {
      this.view.showError("Error loading data: " + err.message);
      return;
    }

    // 2) render table and compute average
    this.view.renderTable(this.model.data);
    this.resetForm();
    this.view.updateAverage();

    // save button
    document.getElementById("saveButton").addEventListener(
      "click",
      () => this.handleSave()
    );

    // load button opens file input
    document.getElementById("loadButton").addEventListener(
      "click",
      () => document.getElementById("loadState").click()
    );

    // file input change triggers load
    document.getElementById("loadState").addEventListener(
      "change",
      (evt) => this.handleLoad(evt)
    );

    // slider input updates label and average
    document.querySelector("table tbody").addEventListener(
      "input",
      (evt) => {
        if (evt.target.matches(".slider-input")) {
          this.view.updateSliderLabel(evt.target, evt.target.value);
          this.view.updateAverage();
        }
      }
    );

    // checkbox change updates box groups and average
    document.querySelector("table tbody").addEventListener(
      "change",
      (evt) => {
        if (evt.target.matches(".box-checkbox")) {
          const groupID = evt.target.getAttribute("data-boxgroup");
          const boxValue = Number(
            evt.target.getAttribute("data-boxvalue")
          );
          const delta = evt.target.checked ? boxValue : -boxValue;
          this.view.updateBoxGroup(groupID, delta);
          this.view.updateAverage();
        }
      }
    );
  }

  // clear name, feedback, output, and reset sliders/boxes before load or on init
  resetForm() {
    // clear name
    const nameEl = document.querySelector(".name-input");
    if (nameEl) nameEl.value = "";

    // clear feedback
    const fb = document.querySelector(
      ".feedback-container textarea"
    );
    if (fb) fb.value = "";

    // clear save output
    const out = document.getElementById("output");
    if (out) out.value = "";

    // clear file input
    const fileIn = document.getElementById("loadState");
    if (fileIn) fileIn.value = "";
  }

  handleLoad(evt) {
    const file = evt.target.files[0];
    if (!file) return;

    // reset UI before applying new state
    this.view.renderTable(this.model.data);
    this.resetForm();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result);
        // restore name
        const nameEl = document.querySelector(".name-input");
        if (nameEl) nameEl.value = state.name || "";

        // restore sliders and comments
        (state.sliders || []).forEach((s) => {
          const input = document.getElementById(s.id);
          if (!input) return;
          input.value = s.value;
          this.view.updateSliderLabel(input, s.value);
          const tr = input.closest("tr");
          const commentEl = tr?.querySelector(
            ".comment-input"
          );
          if (commentEl) commentEl.value = s.comment || "";
        });

        // restore checkboxes
        (state.boxes || []).forEach((b) => {
          const cb = document.getElementById(b.id);
          if (!cb) return;
          const wasChecked = cb.checked;
          cb.checked = b.checked;
          if (b.checked && !wasChecked) {
            const groupID = cb.getAttribute("data-boxgroup");
            const boxValue = Number(
              cb.getAttribute("data-boxvalue")
            );
            this.view.updateBoxGroup(groupID, boxValue);
          }
        });

        // restore feedback
        const fb = document.querySelector(
          ".feedback-container textarea"
        );
        if (fb) fb.value = state.feedback || "";

        // recompute average
        this.view.updateAverage();
      } catch (err) {
        this.view.showError("Load error: " + err.message);
      } finally {
        evt.target.value = ""; // reset file input
      }
    };
    reader.readAsText(file);
  }

  collectState() {
    const name =
      document.querySelector(".name-input")?.value.trim() || "";

    const sliders = Array.from(
      document.querySelectorAll(".slider-input")
    ).map((input) => {
      const tr = input.closest("tr");
      return {
        id: input.id,
        value: Number(input.value),
        comment:
          tr.querySelector(
            ".comment-input"
          )?.value.trim() || "",
      };
    });

    const boxes = Array.from(
      document.querySelectorAll(".box-checkbox")
    ).map((cb) => ({ id: cb.id, checked: cb.checked }));

    const feedback =
      document
        .querySelector(
          ".feedback-container textarea"
        )
        ?.value.trim() ||
      "";

    const total = sliders.reduce(
      (sum, s) => sum + s.value,
      0
    );

    return { name, sliders, boxes, feedback, total };
  }

  async handleSave() {
    const data = this.collectState();
    const out = document.getElementById("output");
    if (out) out.value = JSON.stringify(data, null, 2);

    try {
      const resp = await fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      if (result.status === "ok") {
        this.view.showError(`Saved to ${result.path}`);
      } else {
        this.view.showError(`Save failed: ${result.path}`);
      }
    } catch (err) {
      this.view.showError(err.message);
    }
  }
}

const app = new Controller(new Model(), new View());

