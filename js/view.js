export class View {
  constructor() {
    this.tableBody = document.querySelector("table tbody");
    this.averageDisplay = document.getElementById("average");
  }

  renderTable(rows) {
    this.tableBody.innerHTML = "";
    let previousCategory = "";
    let currentBoxGroupID = "";
    let boxValue = 10;

    rows.forEach((row, i) => {
      // Render category header if the category has changed.
      if (row["category"] !== previousCategory) {
        const headerTr = document.createElement("tr");
        headerTr.innerHTML = `<td colspan="4"><h2>${row["category"]}</h2></td>`;
        this.tableBody.appendChild(headerTr);
        previousCategory = row["category"];
      }

      // Check if this row is for a box (checkbox group).
      if (row["maxcomm"] === "box") {
        if (!isNaN(row["mincomm"])) {
          // Start a new box group container.
          currentBoxGroupID = "boxgroup" + i;
          boxValue = row["mincomm"];
          const groupTr = document.createElement("tr");
          groupTr.innerHTML = `<td colspan="4" class="boxgroup">
              <label id="${currentBoxGroupID}label" class="boxgroup-label">0</label><br>
              <fieldset id="${currentBoxGroupID}"></fieldset>
            </td>`;
          this.tableBody.appendChild(groupTr);
        } else {
          // Append a new checkbox to the current box group.
          const fieldset = document.getElementById(currentBoxGroupID);
          const div = document.createElement("div");
          div.classList.add("boxes");
          div.innerHTML = `<input id="checkbox${i}" type="checkbox" 
            class="box-checkbox" data-boxgroup="${currentBoxGroupID}" data-boxvalue="${boxValue}">
            <label for="checkbox${i}">${row["mincomm"]}</label>`;
          fieldset.appendChild(div);
        }
      } else {
        // Render slider row with an extra column for comment.
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="l">${row["mincomm"]}</td>
          <td class="slider">
            <input id="slider${i}" type="range" min="0" max="100" step="10" 
              value="50" class="slider-input" aria-valuenow="50" 
              aria-valuemin="0" aria-valuemax="100">
            <br>
            <label for="slider${i}" class="slider-label" id="slider${i}label">50</label>
          </td>
          <td class="r">${row["maxcomm"]}</td>
          <td class="comment-cell">
            <input type="text" class="comment-input" placeholder="Comment" />
          </td>`;
        this.tableBody.appendChild(tr);
      }
    });
    this.updateAverage();
  }

  updateSliderLabel(sliderElem, value) {
    const numericValue = Number(value);
    const label = document.getElementById(sliderElem.id + "label");
    if (label) {
      label.textContent = numericValue;
      label.style.left = ((numericValue - 50) * 0.8) + "%";
    }
    sliderElem.setAttribute("aria-valuenow", numericValue);
  }

  updateBoxGroup(boxGroupID, delta) {
    const label = document.getElementById(boxGroupID + "label");
    if (label) {
      const current = Number(label.textContent);
      label.textContent = current + delta;
    }
  }

  updateAverage() {
    const avg = window.appModel.computeAverage();
    this.averageDisplay.textContent = avg;
  }

  showError(message) {
    alert(message);
  }
}
