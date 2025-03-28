import { Model } from "./model.js";
import { View } from "./view.js";

export const appModel = new Model();
export const appView = new View();

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.init();
    this.loadData();
  }

  init() {
    // Cache the table element to avoid multiple DOM queries.
    const table = document.querySelector("table");

    // Event delegation for slider inputs.
    table.addEventListener("input", (evt) => {
      if (evt.target.matches(".slider-input")) {
        this.handleSliderChange(evt);
      }
    });

    // Event delegation for checkbox changes.
    table.addEventListener("change", (evt) => {
      if (evt.target.matches(".box-checkbox")) {
        this.handleBoxChange(evt);
      }
    });

    // Bind save button.
    document
      .getElementById("saveButton")
      .addEventListener("click", () => this.handleSave());

    // Bind load button to trigger file input.
    const loadButton = document.getElementById("loadButton");
    const loadInput = document.getElementById("loadState");
    loadButton.addEventListener("click", () => loadInput.click());
    loadInput.addEventListener("change", (evt) => this.handleLoadState(evt));
  }

  async loadData() {
    try {
      const response = await fetch("./data/descriptions.json");
      if (!response.ok) {
        throw new Error("Network response was not ok: " + 
                         response.statusText);
      }
      const data = await response.json();
      this.model.setData(data);
      this.view.renderTable(this.model.data);
    } catch (error) {
      this.view.showError("Error loading data: " + error.message);
    }
  }

  handleSliderChange(evt) {
    const slider = evt.target;
    const value = slider.value;
    this.view.updateSliderLabel(slider, value);
    this.view.updateAverage();
  }

  handleBoxChange(evt) {
    const checkbox = evt.target;
    const boxGroupID = checkbox.dataset.boxgroup;
    const boxValue = parseInt(checkbox.dataset.boxvalue, 10);
    if (checkbox.checked) {
      this.view.updateBoxGroup(boxGroupID, boxValue);
    } else {
      this.view.updateBoxGroup(boxGroupID, -boxValue);
    }
    this.view.updateAverage();
  }

  async handleSave() {
    // Gather current slider data including comments.
    const sliderData = [];
    document.querySelectorAll(".slider-input").forEach((slider) => {
      const tr = slider.closest("tr");
      const commentInput = tr.querySelector(".comment-input");
      sliderData.push({
        id: slider.id,
        value: slider.value,
        comment: commentInput ? commentInput.value : ""
      });
    });

    // Gather current checkbox data.
    const checkboxData = [];
    document.querySelectorAll(".box-checkbox").forEach((checkbox) => {
      checkboxData.push({
        id: checkbox.id,
        checked: checkbox.checked
      });
    });

    // Retrieve the name from the name input.
    const nameInput = document.querySelector('input[aria-label="Name"]');
    const nameValue = nameInput ? nameInput.value.trim() : "savedData";

    // Build the saved data object.
    const savedData = {
      name: nameValue,
      sliders: sliderData,
      checkboxes: checkboxData
    };

    const jsonStr = JSON.stringify(savedData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nameValue + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  handleLoadState(evt) {
    const file = evt.target.files[0];
    if (!file) {
      this.view.showError("No file selected for loading.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const savedState = JSON.parse(e.target.result);
        this.applySavedState(savedState);
      } catch (error) {
        this.view.showError("Error parsing saved state: " + error.message);
      }
    };
    reader.onerror = () => {
      this.view.showError("Error reading saved state file.");
    };
    reader.readAsText(file);
    
    // Reset the file input to allow loading the same file again.
    evt.target.value = "";
  }

  applySavedState(savedState) {
    if (savedState.name) {
      const nameInput = document.querySelector('input[aria-label="Name"]');
      if (nameInput) {
        nameInput.value = savedState.name;
      }
    }

    // Apply slider states.
    if (savedState.sliders) {
      savedState.sliders.forEach((sliderData) => {
        const slider = document.getElementById(sliderData.id);
        if (slider) {
          slider.value = sliderData.value;
          this.view.updateSliderLabel(slider, sliderData.value);
          // Also update the associated comment.
          const tr = slider.closest("tr");
          const commentInput = tr.querySelector(".comment-input");
          if (commentInput) {
            commentInput.value = sliderData.comment;
          }
        }
      });
    }

    // Apply checkbox states.
    if (savedState.checkboxes) {
      savedState.checkboxes.forEach((cbData) => {
        const checkbox = document.getElementById(cbData.id);
        if (checkbox) {
          checkbox.checked = cbData.checked;
          // Trigger change event to update the box group label.
          const event = new Event("change");
          checkbox.dispatchEvent(event);
        }
      });
    }

    this.view.updateAverage();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.appModel = appModel;
  new Controller(appModel, appView);
});
