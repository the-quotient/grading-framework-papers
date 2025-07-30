package main

import (
  "encoding/json"
  "io"
  "log"
  "net/http"
  "os"
  "path/filepath"
  "time"
)

// GradeData matches the JSON sent by controller.js
type GradeData struct {
  Name     string        `json:"name"`
  Sliders  []interface{} `json:"sliders"`
  Feedback string        `json:"feedback"`
  Total    int           `json:"total"`
}

func saveHandler(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodPost {
    http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
    return
  }

  body, err := io.ReadAll(r.Body)
  if err != nil {
    http.Error(w, "Bad Request", http.StatusBadRequest)
    return
  }

  var data GradeData
  if err := json.Unmarshal(body, &data); err != nil {
    http.Error(w, "Invalid JSON", http.StatusBadRequest)
    return
  }

  filename := filepath.Base(data.Name)
  if filename == "" {
    filename = "untitled"
  }

  outputDir := "output"
  if err := os.MkdirAll(outputDir, 0755); err != nil {
    http.Error(w, "Server Error", http.StatusInternalServerError)
    return
  }

  outPath := filepath.Join(outputDir, filename+".json")
  if err := os.WriteFile(outPath, body, 0644); err != nil {
    http.Error(w, "Could not save file", http.StatusInternalServerError)
    return
  }

  resp := map[string]string{
    "status": "ok",
    "path":   outPath,
  }
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(resp)
}

func main() {
  mux := http.NewServeMux()

  // 1️⃣ JSON save endpoint
  mux.HandleFunc("/save", saveHandler)

  // 2️⃣ Serve JS (and any other) assets explicitly
  mux.Handle(
    "/js/",
    http.StripPrefix(
      "/js/",
      http.FileServer(http.Dir("js")),
    ),
  )
  // (Repeat for other dirs if needed: /css/, /img/, etc.)

  // 3️⃣ Serve index.html at root
  mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    // Only serve index.html on exact "/" path
    if r.URL.Path != "/" {
      http.NotFound(w, r)
      return
    }
    http.ServeFile(w, r, "./index.html")
  })

  srv := &http.Server{
    Addr:         ":8765",
    Handler:      mux,
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
  }

  log.Printf("Listening on http://localhost%v\n", srv.Addr)
  if err := srv.ListenAndServe(); err != nil {
    log.Fatal(err)
  }
}

