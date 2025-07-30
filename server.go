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

type GradeData struct {
	Name       string        `json:"name"`
	Sliders    []interface{} `json:"sliders"`
	Checkboxes []interface{} `json:"checkboxes"`
	Feedback   string        `json:"feedback"`
	Total      int           `json:"total"`
}

func saveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed",
			http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad Request",
			http.StatusBadRequest)
		return
	}

	var data GradeData
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Invalid JSON",
			http.StatusBadRequest)
		return
	}

	filename := filepath.Base(data.Name)
	if filename == "" {
		filename = "untitled"
	}

	outputDir := "output"
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		http.Error(w, "Server Error",
			http.StatusInternalServerError)
		return
	}

	outPath := filepath.Join(outputDir,
		filename+".json")
	if err := os.WriteFile(outPath, body, 0o644); err != nil {
		http.Error(w, "Could not save file",
			http.StatusInternalServerError)
		return
	}

	resp := map[string]string{
		"status": "ok",
		"path":   outPath,
	}
	w.Header().Set("Content-Type",
		"application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/save", saveHandler)

	fs := http.FileServer(http.Dir("./"))
	mux.Handle("/", fs)

	srv := &http.Server{
		Addr:         ":8765",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Listening on http://localhost%s\n",
		srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

